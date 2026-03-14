/**
 * Enrich raw leads that have a website by fetching email, phone, LinkedIn from Hunter.io.
 * Used for Gemini leads that don't include contact details.
 */

import type { RawLead } from '../scrapers/types.js';
import { getCompanyLeadByDomain } from '../../server/services/enrichmentService.js';
import { delay } from '../scrapers/types.js';

const ENRICH_DELAY_MS = 1800;

function extractDomain(website: string): string | null {
  if (!website || typeof website !== 'string') return null;
  const u = website.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, '');
  return u || null;
}

/**
 * Enrich a single raw lead using Hunter.io Company API. Fills email, phone, linkedIn when found.
 */
export async function enrichOneLead(raw: RawLead): Promise<RawLead> {
  const domain = extractDomain(raw.website ?? '');
  if (!domain) return raw;
  const apiKey = process.env.ENRICHMENT_API_KEY;
  if (!apiKey || apiKey === 'YOUR_ENRICHMENT_API_KEY') return raw;

  await delay(ENRICH_DELAY_MS);
  try {
    const company = await getCompanyLeadByDomain(domain);
    if (!company) return raw;
    return {
      ...raw,
      email: raw.email?.trim() || company.email?.trim() || undefined,
      phone: raw.phone?.trim() || company.phone?.trim() || undefined,
      linkedIn: raw.linkedIn?.trim() || company.enrichmentData?.socialProfiles?.linkedin || undefined,
      decisionMakerContactFound: Boolean(raw.email || company.email || raw.phone || company.phone),
    };
  } catch (err) {
    console.warn(`[Enrich] ${raw.companyName} (${domain}):`, (err as Error).message);
    return raw;
  }
}

/**
 * Enrich all leads that have a website and are missing email or phone. Rate-limited.
 */
export async function enrichLeadsWithContactData(leads: RawLead[]): Promise<RawLead[]> {
  const needsEnrichment = (r: RawLead) => {
    const hasWebsite = !!(r.website && r.website.trim());
    const missingContact = !r.email?.trim() || !r.phone?.trim();
    return hasWebsite && missingContact;
  };
  const toEnrich = leads.filter(needsEnrichment);
  if (toEnrich.length === 0) return leads;

  console.log(`[Enrich] Fetching email/phone for ${toEnrich.length} leads via Hunter...`);
  const result = [...leads];
  for (let i = 0; i < result.length; i++) {
    if (needsEnrichment(result[i])) {
      result[i] = await enrichOneLead(result[i]);
    }
  }
  return result;
}


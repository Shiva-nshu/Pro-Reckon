/**
 * Fetch leads from Hunter.io (Discover or LEAD_SOURCE_DOMAINS).
 * Returns real companies with working websites, emails, and LinkedIn when available.
 */

import type { RawLead } from '../scrapers/types.js';
import { discoverCompaniesByICP, getCompanyLeadByDomain } from '../../server/services/enrichmentService.js';
import { delay } from '../scrapers/types.js';

const HUNTER_SOURCE = 'Hunter.io';
const HUNTER_BATCH_DELAY_MS = 1500;
const MAX_HUNTER_LEADS = Number(process.env.HUNTER_LEADS_PER_RUN) || 25;

export async function fetchHunterLeads(): Promise<RawLead[]> {
  const apiKey = process.env.ENRICHMENT_API_KEY;
  if (!apiKey || apiKey === 'YOUR_ENRICHMENT_API_KEY') return [];

  const domains: { domain: string; organization: string }[] = [];
  const discoverCountry = process.env.LEAD_DISCOVER_COUNTRY?.trim();
  const discoverIndustriesRaw = process.env.LEAD_DISCOVER_INDUSTRIES?.trim();
  const discoverIndustries = discoverIndustriesRaw ? discoverIndustriesRaw.split(',').map((s) => s.trim()).filter(Boolean) : [];

  if (discoverCountry) {
    const discovered = await discoverCompaniesByICP({
      apiKey,
      country: discoverCountry,
      industries: discoverIndustries.length ? discoverIndustries : undefined,
      headcount: ['1-10', '11-50', '51-200'],
      limit: MAX_HUNTER_LEADS,
    });
    domains.push(...discovered);
  }

  if (domains.length === 0) {
    const domainsRaw = process.env.LEAD_SOURCE_DOMAINS?.trim();
    if (domainsRaw) {
      const list = domainsRaw.split(',').map((d) => d.trim().toLowerCase()).filter(Boolean).slice(0, MAX_HUNTER_LEADS);
      list.forEach((domain) => domains.push({ domain, organization: domain }));
    }
  }

  if (domains.length === 0) return [];

  const leads: RawLead[] = [];
  for (const { domain, organization } of domains.slice(0, MAX_HUNTER_LEADS)) {
    await delay(HUNTER_BATCH_DELAY_MS);
    try {
      const company = await getCompanyLeadByDomain(domain);
      if (!company) continue;
      const linkedIn = company.enrichmentData?.socialProfiles?.linkedin;
      const email = company.email ?? company.enrichmentData?.verifiedContacts?.[0]?.email;
      leads.push({
        companyName: company.companyName,
        industry: company.industry,
        location: company.location,
        website: company.website,
        email,
        linkedIn,
        source: HUNTER_SOURCE,
        decisionMakerContactFound: Boolean(email),
      });
    } catch (err) {
      console.warn(`[Hunter] Skip ${domain}:`, (err as Error).message);
    }
  }
  console.log(`[Hunter] Fetched ${leads.length} leads`);
  return leads;
}

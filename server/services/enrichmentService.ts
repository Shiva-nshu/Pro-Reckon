import axios from 'axios';

interface EnrichedData {
  employeeCount?: number;
  foundedYear?: number;
  techStack?: string[];
  verifiedContacts?: Array< { name: string; email: string; role: string }>;
  socialProfiles?: { linkedin?: string; twitter?: string; facebook?: string };
}

/**
 * Extract bare domain from URL (e.g. https://www.stripe.com/path -> stripe.com)
 */
function extractDomain(websiteUrl: string): string | null {
  if (!websiteUrl || typeof websiteUrl !== 'string') return null;
  try {
    const u = websiteUrl.trim().toLowerCase();
    const withoutProtocol = u.replace(/^https?:\/\//, '').split('/')[0];
    const withoutWww = withoutProtocol.replace(/^www\./, '');
    return withoutWww || null;
  } catch {
    return null;
  }
}

/**
 * Enrich lead data using Hunter.io Company Enrichment API.
 * Requires ENRICHMENT_API_KEY. Returns null if key missing or API fails (no mock).
 */
export async function enrichLead(websiteUrl: string): Promise<EnrichedData | null> {
  const domain = extractDomain(websiteUrl);
  if (!domain) return null;

  const apiKey = process.env.ENRICHMENT_API_KEY;
  if (!apiKey || apiKey === 'YOUR_ENRICHMENT_API_KEY') {
    console.warn('⚠️ Enrichment: ENRICHMENT_API_KEY not set. Skipping enrichment.');
    return null;
  }

  try {
    const { data } = await axios.get<{
      data?: {
        name?: string;
        domain?: string;
        category?: { industry?: string; sector?: string };
        location?: string;
        foundedYear?: number;
        metrics?: { employees?: string };
        tech?: string[];
        facebook?: { handle?: string };
        linkedin?: { handle?: string };
        twitter?: { handle?: string };
        site?: { emailAddresses?: string[]; phoneNumbers?: string[] };
      };
      errors?: unknown;
    }>('https://api.hunter.io/v2/companies/find', {
      params: { domain, api_key: apiKey },
      timeout: 15000,
    });

    if (data.errors || !data.data) return null;

    const d = data.data;
    const verifiedContacts: EnrichedData['verifiedContacts'] = [];
    const emails = d.site?.emailAddresses ?? [];
    if (emails.length) {
      verifiedContacts.push({ name: 'Contact', email: emails[0], role: 'Contact' });
    }

    // metrics.employees can be "10K-50K" etc. - parse to number if possible
    let employeeCount: number | undefined;
    if (d.metrics?.employees) {
      const m = String(d.metrics.employees).replace(/[^0-9]/g, '');
      if (m) employeeCount = parseInt(m, 10) || undefined;
    }

    const linkedinUrl = d.linkedin?.handle
      ? `https://linkedin.com/${d.linkedin.handle.startsWith('company/') ? '' : 'company/'}${d.linkedin.handle}`
      : undefined;
    const twitterUrl = d.twitter?.handle ? `https://twitter.com/${d.twitter.handle}` : undefined;
    const facebookUrl = d.facebook?.handle ? `https://facebook.com/${d.facebook.handle}` : undefined;

    return {
      employeeCount,
      foundedYear: d.foundedYear ?? undefined,
      techStack: Array.isArray(d.tech) ? d.tech : undefined,
      verifiedContacts: verifiedContacts.length ? verifiedContacts : undefined,
      socialProfiles:
        linkedinUrl || twitterUrl || facebookUrl
          ? { linkedin: linkedinUrl, twitter: twitterUrl, facebook: facebookUrl }
          : undefined,
    };
  } catch (error) {
    console.error(`❌ Enrichment failed for ${domain}:`, axios.isAxiosError(error) ? error.response?.data ?? error.message : error);
    return null;
  }
}

/** Lead + enrichment from Hunter.io (for scraper). No mock - returns null if API key missing or request fails. */
export interface CompanyLeadInput {
  companyName: string;
  website: string;
  industry?: string;
  location?: string;
  email?: string;
  founderName?: string;
  enrichmentData: EnrichedData | null;
}

export async function getCompanyLeadByDomain(domain: string): Promise<CompanyLeadInput | null> {
  const apiKey = process.env.ENRICHMENT_API_KEY;
  if (!apiKey || apiKey === 'YOUR_ENRICHMENT_API_KEY') return null;

  const normalizedDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  if (!normalizedDomain) return null;

  try {
    const { data } = await axios.get<{
      data?: {
        name?: string;
        domain?: string;
        category?: { industry?: string; sector?: string };
        location?: string;
        foundedYear?: number;
        metrics?: { employees?: string };
        tech?: string[];
        facebook?: { handle?: string };
        linkedin?: { handle?: string };
        twitter?: { handle?: string };
        site?: { emailAddresses?: string[]; phoneNumbers?: string[] };
      };
      errors?: unknown;
    }>('https://api.hunter.io/v2/companies/find', {
      params: { domain: normalizedDomain, api_key: apiKey },
      timeout: 15000,
    });

    if (data.errors || !data.data) return null;

    const d = data.data;
    const website = `https://${d.domain ?? normalizedDomain}`;
    const verifiedContacts: EnrichedData['verifiedContacts'] = [];
    const emails = d.site?.emailAddresses ?? [];
    if (emails.length) {
      verifiedContacts.push({ name: 'Contact', email: emails[0], role: 'Contact' });
    }

    let employeeCount: number | undefined;
    if (d.metrics?.employees) {
      const m = String(d.metrics.employees).replace(/[^0-9]/g, '');
      if (m) employeeCount = parseInt(m, 10) || undefined;
    }

    const linkedinUrl = d.linkedin?.handle
      ? `https://linkedin.com/${d.linkedin.handle.startsWith('company/') ? '' : 'company/'}${d.linkedin.handle}`
      : undefined;
    const twitterUrl = d.twitter?.handle ? `https://twitter.com/${d.twitter.handle}` : undefined;
    const facebookUrl = d.facebook?.handle ? `https://facebook.com/${d.facebook.handle}` : undefined;

    const enrichmentData: EnrichedData = {
      employeeCount,
      foundedYear: d.foundedYear ?? undefined,
      techStack: Array.isArray(d.tech) ? d.tech : undefined,
      verifiedContacts: verifiedContacts.length ? verifiedContacts : undefined,
      socialProfiles:
        linkedinUrl || twitterUrl || facebookUrl
          ? { linkedin: linkedinUrl, twitter: twitterUrl, facebook: facebookUrl }
          : undefined,
    };

    return {
      companyName: d.name ?? normalizedDomain,
      website,
      industry: d.category?.industry ?? d.category?.sector,
      location: d.location,
      email: emails[0],
      founderName: undefined,
      enrichmentData,
    };
  } catch (error) {
    console.error(`❌ getCompanyLeadByDomain failed for ${normalizedDomain}:`, axios.isAxiosError(error) ? error.response?.data ?? error.message : error);
    return null;
  }
}

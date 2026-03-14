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

/** One contact person at a company (from Domain Search) — the person to pitch to. */
export interface ContactPerson {
  firstName: string;
  lastName: string;
  position: string;
  email: string;
  seniority?: string;
}

/** Lead + enrichment from Hunter.io (for scraper). Includes who to contact (people to pitch to). */
export interface CompanyLeadInput {
  companyName: string;
  website: string;
  industry?: string;
  location?: string;
  email?: string;
  phone?: string;
  founderName?: string;
  contactRole?: string;
  enrichmentData: EnrichedData | null;
  /** All discovered contacts at this company (decision makers to reach). */
  contacts?: ContactPerson[];
}

/**
 * Fetch people (contacts) at a company via Hunter Domain Search — the set of people to pitch to.
 * Prefers executive/senior and personal emails. Uses 1 credit per 1–10 emails returned.
 */
export async function getContactsByDomain(domain: string, apiKey: string): Promise<ContactPerson[]> {
  try {
    const { data } = await axios.get<{
      data?: { emails?: Array<{ value: string; first_name?: string; last_name?: string; position?: string; seniority?: string; type?: string }> };
      errors?: unknown;
    }>('https://api.hunter.io/v2/domain-search', {
      params: { domain, api_key: apiKey, limit: 10, type: 'personal' },
      timeout: 15000,
    });
    if (data.errors || !data.data?.emails?.length) return [];
    const contacts: ContactPerson[] = data.data.emails
      .filter((e) => e.value)
      .map((e) => ({
        firstName: e.first_name ?? '',
        lastName: e.last_name ?? '',
        position: e.position ?? 'Contact',
        email: e.value,
        seniority: e.seniority,
      }));
    return contacts;
  } catch (err) {
    console.warn(`Domain Search failed for ${domain}:`, axios.isAxiosError(err) ? err.message : err);
    return [];
  }
}

/**
 * Discover companies matching ICP (industry + location) via Hunter Discover API.
 * Returns list of { domain, organization } to then enrich and get contacts.
 */
export async function discoverCompaniesByICP(options: {
  apiKey: string;
  country?: string;
  industries?: string[];
  headcount?: string[];
  limit?: number;
}): Promise<{ domain: string; organization: string }[]> {
  const { apiKey, country = 'IN', industries = [], headcount = ['1-10', '11-50', '51-200'], limit = 50 } = options;
  try {
    const body: Record<string, unknown> = {
      limit: Math.min(limit, 100),
      headcount,
    };
    if (country) {
      body.headquarters_location = { include: [{ country }] };
    }
    if (industries.length) {
      body.industry = { include: industries };
    }
    const { data } = await axios.post<{
      data?: Array<{ domain: string; organization: string }>;
      errors?: unknown;
    }>('https://api.hunter.io/v2/discover', body, {
      params: { api_key: apiKey },
      headers: { 'Content-Type': 'application/json' },
      timeout: 20000,
    });
    if (data.errors || !Array.isArray(data.data)) return [];
    return data.data.map((d) => ({ domain: d.domain, organization: d.organization || d.domain }));
  } catch (err) {
    console.error('Discover API failed:', axios.isAxiosError(err) ? err.response?.data ?? err.message : err);
    return [];
  }
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

    // Get people to pitch to (Domain Search — uses credits)
    const contacts = await getContactsByDomain(normalizedDomain, apiKey);
    const bestContact = contacts.find((c) => c.seniority === 'executive') || contacts.find((c) => (c.firstName || c.lastName)) || contacts[0];
    const founderName = bestContact ? [bestContact.firstName, bestContact.lastName].filter(Boolean).join(' ') || undefined : undefined;
    const contactRole = bestContact?.position;
    const contactEmail = bestContact?.email ?? emails[0];

    const phone = d.site?.phoneNumbers?.[0] ?? undefined;
    return {
      companyName: d.name ?? normalizedDomain,
      website,
      industry: d.category?.industry ?? d.category?.sector,
      location: d.location,
      email: contactEmail,
      phone,
      founderName,
      contactRole,
      enrichmentData,
      contacts: contacts.length ? contacts : undefined,
    };
  } catch (error) {
    console.error(`❌ getCompanyLeadByDomain failed for ${normalizedDomain}:`, axios.isAxiosError(error) ? error.response?.data ?? error.message : error);
    return null;
  }
}

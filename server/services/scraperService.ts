import { isFirebaseConnected } from '../config/firebase.js';
import { findLeadByCompanyName, createLead } from '../models/leadFirestore.js';
import { getCompanyLeadByDomain, discoverCompaniesByICP } from './enrichmentService.js';

/**
 * Run lead discovery: find companies (and people to contact) that ProReckon can pitch to.
 * - If LEAD_DISCOVER_COUNTRY is set: use Hunter Discover to find companies by ICP (industry + location), then enrich and get contacts.
 * - Else use LEAD_SOURCE_DOMAINS (manual list of domains). Each lead = company + contact person(s) to reach.
 */
export async function runDailyScrape() {
  console.log('🕷️ Starting lead discovery (finding people to pitch to)...');

  const apiKey = process.env.ENRICHMENT_API_KEY;
  if (!apiKey || apiKey === 'YOUR_ENRICHMENT_API_KEY') {
    console.warn('⚠️ ENRICHMENT_API_KEY not set. Lead discovery requires Hunter.io API key.');
    return;
  }

  if (!isFirebaseConnected()) {
    console.warn('⚠️ Database not connected. Skipping lead discovery.');
    return;
  }

  const discoverCountry = process.env.LEAD_DISCOVER_COUNTRY?.trim();
  const discoverIndustriesRaw = process.env.LEAD_DISCOVER_INDUSTRIES?.trim();
  const discoverIndustries = discoverIndustriesRaw ? discoverIndustriesRaw.split(',').map((s) => s.trim()).filter(Boolean) : [];

  let domainsToProcess: { domain: string; organization: string }[] = [];

  if (discoverCountry) {
    console.log(`🔍 Discovering companies via Hunter (country=${discoverCountry}, industries=${discoverIndustries.length ? discoverIndustries.join(',') : 'any'})...`);
    const discovered = await discoverCompaniesByICP({
      apiKey,
      country: discoverCountry,
      industries: discoverIndustries.length ? discoverIndustries : undefined,
      headcount: ['1-10', '11-50', '51-200'],
      limit: 30,
    });
    domainsToProcess = discovered;
    console.log(`   Found ${domainsToProcess.length} companies matching ICP.`);
  }

  if (domainsToProcess.length === 0) {
    const domainsRaw = process.env.LEAD_SOURCE_DOMAINS?.trim();
    if (!domainsRaw) {
      console.log('⚠️ Set LEAD_DISCOVER_COUNTRY (e.g. IN for India) to find leads by ICP, or LEAD_SOURCE_DOMAINS for a manual domain list.');
      return;
    }
    const list = domainsRaw.split(',').map((d) => d.trim().toLowerCase()).filter(Boolean);
    domainsToProcess = list.map((domain) => ({ domain, organization: domain }));
  }

  if (domainsToProcess.length === 0) {
    console.log('⚠️ No domains to process.');
    return;
  }

  console.log(`📋 Enriching ${domainsToProcess.length} company/domain(s) and fetching contact people...`);

  for (const { domain } of domainsToProcess) {
    try {
      const leadInput = await getCompanyLeadByDomain(domain);
      if (!leadInput) {
        console.warn(`⚠️ No data for domain: ${domain}`);
        continue;
      }

      const exists = await findLeadByCompanyName(leadInput.companyName);
      if (exists) {
        console.log(`⏭️ Lead already exists: ${leadInput.companyName}`);
        continue;
      }

      await createLead({
        companyName: leadInput.companyName,
        founderName: leadInput.founderName,
        contactRole: leadInput.contactRole,
        email: leadInput.email,
        website: leadInput.website,
        industry: leadInput.industry,
        location: leadInput.location,
        enrichmentData: leadInput.enrichmentData ?? undefined,
        source: discoverCountry ? 'Hunter Discover (ICP)' : 'Hunter.io',
        status: 'New',
      });
      const who = leadInput.founderName ? `${leadInput.founderName} (${leadInput.contactRole || 'Contact'})` : leadInput.email || 'Company';
      console.log(`💾 Saved lead: ${leadInput.companyName} — contact: ${who}`);
    } catch (error) {
      console.error(`❌ Failed for domain ${domain}:`, error);
    }
  }

  console.log('✅ Lead discovery finished.');
}

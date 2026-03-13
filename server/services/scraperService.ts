import { isFirebaseConnected } from '../config/firebase.js';
import { findLeadByCompanyName, createLead } from '../models/leadFirestore.js';
import { getCompanyLeadByDomain } from './enrichmentService.js';

/**
 * Run lead discovery using Hunter.io Company API.
 * Domains are read from env LEAD_SOURCE_DOMAINS (comma-separated, e.g. "stripe.com,github.com").
 * No mock data - if no domains or API key, the job exits without adding leads.
 */
export async function runDailyScrape() {
  console.log('🕷️ Starting lead discovery...');

  const domainsRaw = process.env.LEAD_SOURCE_DOMAINS;
  if (!domainsRaw || !domainsRaw.trim()) {
    console.log('⚠️ LEAD_SOURCE_DOMAINS not set. Add comma-separated domains in .env (e.g. LEAD_SOURCE_DOMAINS=stripe.com,github.com).');
    return;
  }

  const apiKey = process.env.ENRICHMENT_API_KEY;
  if (!apiKey || apiKey === 'YOUR_ENRICHMENT_API_KEY') {
    console.warn('⚠️ ENRICHMENT_API_KEY not set. Lead discovery requires Hunter.io API key.');
    return;
  }

  if (!isFirebaseConnected()) {
    console.warn('⚠️ Database not connected. Skipping lead discovery.');
    return;
  }

  const domains = domainsRaw.split(',').map((d) => d.trim().toLowerCase()).filter(Boolean);
  if (domains.length === 0) {
    console.log('⚠️ No valid domains in LEAD_SOURCE_DOMAINS.');
    return;
  }

  console.log(`🔍 Fetching company data for ${domains.length} domain(s) via Hunter.io...`);

  for (const domain of domains) {
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
        email: leadInput.email,
        website: leadInput.website,
        industry: leadInput.industry,
        location: leadInput.location,
        enrichmentData: leadInput.enrichmentData ?? undefined,
        source: 'Hunter.io',
        status: 'New',
      });
      console.log(`💾 Saved lead: ${leadInput.companyName}`);
    } catch (error) {
      console.error(`❌ Failed for domain ${domain}:`, error);
    }
  }

  console.log('✅ Lead discovery finished.');
}

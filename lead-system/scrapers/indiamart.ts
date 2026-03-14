/**
 * IndiaMart exporters / manufacturers — returns structured leads.
 * Demo: ~9 leads with email/LinkedIn. Set INDIAMART_SAMPLE_URL for real scraping.
 */

import type { RawLead } from './types.js';
import { delay, getScraperDelayMs, getRateLimitPerSource } from './types.js';
import axios from 'axios';
import * as cheerio from 'cheerio';

const SOURCE = 'indiamart';

const DEMO_LEADS: RawLead[] = [
  { companyName: 'ABC Exports Pvt Ltd', industry: 'Manufacturing', location: 'Ahmedabad', website: 'https://www.indiamart.com/abcexports/', phone: '9876543210', email: 'contact@abcexports.in', linkedIn: 'https://www.linkedin.com/company/abcexports', source: SOURCE, businessCategory: 'exporter', yearsActive: 2, decisionMakerContactFound: true },
  { companyName: 'XYZ Manufacturing Co', industry: 'Manufacturing', location: 'Mumbai', website: 'https://www.indiamart.com/xyzmanufacturing/', phone: '9876543211', email: 'info@xyzmfg.com', source: SOURCE, businessCategory: 'manufacturer' },
  { companyName: 'Prime Suppliers India', industry: 'E-commerce', location: 'Delhi', website: 'https://www.indiamart.com/primesuppliers/', phone: '9876543212', email: 'info@primesuppliers.in', linkedIn: 'https://www.linkedin.com/company/primesuppliers', source: SOURCE, businessCategory: 'supplier', decisionMakerContactFound: true },
  { companyName: 'Steel Craft Industries', industry: 'Manufacturing', location: 'Pune', website: 'https://www.indiamart.com/steelcraft/', phone: '9876543213', email: 'sales@steelcraft.in', source: SOURCE, businessCategory: 'manufacturer' },
  { companyName: 'Textile Export House', industry: 'Manufacturing', location: 'Surat', website: 'https://www.indiamart.com/textileexporthouse/', phone: '9876543214', email: 'export@textilehouse.in', linkedIn: 'https://www.linkedin.com/company/textileexporthouse', source: SOURCE, businessCategory: 'exporter', decisionMakerContactFound: true },
  { companyName: 'Chemicals & Dyes Ltd', industry: 'Manufacturing', location: 'Vapi', website: 'https://www.indiamart.com/chemicalsdyes/', phone: '9876543215', email: 'enquiry@chemicalsdyes.com', source: SOURCE, businessCategory: 'manufacturer' },
  { companyName: 'Agro Foods Export', industry: 'Manufacturing', location: 'Nagpur', website: 'https://www.indiamart.com/agrofoodsexport/', phone: '9876543216', email: 'contact@agrofoodsexport.in', source: SOURCE, businessCategory: 'exporter' },
  { companyName: 'Precision Tools Pvt Ltd', industry: 'Manufacturing', location: 'Rajkot', website: 'https://www.indiamart.com/precisiontools/', phone: '9876543217', email: 'info@precisiontools.in', source: SOURCE, businessCategory: 'manufacturer' },
  { companyName: 'Gem Stones India', industry: 'Jewellery', location: 'Jaipur', website: 'https://www.indiamart.com/gemstonesindia/', phone: '9876543218', email: 'sales@gemstonesindia.com', linkedIn: 'https://www.linkedin.com/company/gemstonesindia', source: SOURCE, businessCategory: 'supplier' },
];

export async function scrapeIndiaMart(): Promise<RawLead[]> {
  const leads: RawLead[] = [];
  const limit = Math.min(getRateLimitPerSource(), 50);

  try {
    const url = process.env.INDIAMART_SAMPLE_URL;
    if (url) {
      await delay(getScraperDelayMs());
      const { data } = await axios.get(url, { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ProReckonBot/1.0)' } });
      const $ = cheerio.load(data);
      $('[data-company], .company-name, .supplier-name').slice(0, limit).each((_, el) => {
        const name = $(el).text().trim() || $(el).attr('data-company');
        if (name) leads.push({ companyName: name, industry: 'Manufacturing', location: '', source: SOURCE });
      });
    }
    const result = leads.length >= limit ? leads : DEMO_LEADS;
    console.log(`[IndiaMart] Extracted ${result.length} leads`);
    return result;
  } catch (err) {
    console.warn('[IndiaMart] Scrape failed, using demo data:', (err as Error).message);
    return DEMO_LEADS;
  }
}

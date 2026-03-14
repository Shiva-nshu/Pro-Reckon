/**
 * TradeIndia suppliers — returns structured leads. ~9 demo leads with email/LinkedIn.
 */

import type { RawLead } from './types.js';
import { delay, getScraperDelayMs, getRateLimitPerSource } from './types.js';
import axios from 'axios';
import * as cheerio from 'cheerio';

const SOURCE = 'tradeindia';

const DEMO_LEADS: RawLead[] = [
  { companyName: 'Global Trade Solutions', industry: 'Construction', location: 'Pune', website: 'https://www.tradeindia.com/global-trade-solutions/', phone: '9876543220', email: 'info@globaltradesolutions.in', source: SOURCE, businessCategory: 'supplier' },
  { companyName: 'Metro Builders Ltd', industry: 'Real Estate', location: 'Bangalore', website: 'https://www.tradeindia.com/metro-builders/', phone: '9876543221', email: 'sales@metrobuilders.com', linkedIn: 'https://www.linkedin.com/company/metrobuilders', source: SOURCE, decisionMakerContactFound: true },
  { companyName: 'Jewel Craft India', industry: 'Jewellery', location: 'Mumbai', website: 'https://www.tradeindia.com/jewelcraft/', phone: '9876543222', email: 'contact@jewelcraft.in', source: SOURCE, businessCategory: 'manufacturer' },
  { companyName: 'Fashion Garments Export', industry: 'Manufacturing', location: 'Tiruppur', website: 'https://www.tradeindia.com/fashiongarments/', phone: '9876543223', email: 'export@fashiongarments.in', source: SOURCE, businessCategory: 'exporter' },
  { companyName: 'Auto Parts Distributors', industry: 'Manufacturing', location: 'Chennai', website: 'https://www.tradeindia.com/autoparts/', phone: '9876543224', email: 'sales@autopartsdist.com', source: SOURCE, businessCategory: 'supplier' },
  { companyName: 'Green Energy Solutions', industry: 'IT', location: 'Hyderabad', website: 'https://www.tradeindia.com/greenenergy/', phone: '9876543225', email: 'hello@greenenergy.in', linkedIn: 'https://www.linkedin.com/company/greenenergy', source: SOURCE },
  { companyName: 'Packaging Materials Co', industry: 'Manufacturing', location: 'Faridabad', website: 'https://www.tradeindia.com/packagingmaterials/', phone: '9876543226', email: 'info@packagingmaterials.co', source: SOURCE, businessCategory: 'manufacturer' },
  { companyName: 'Pharma Ingredients Ltd', industry: 'Manufacturing', location: 'Mumbai', website: 'https://www.tradeindia.com/pharmaingredients/', phone: '9876543227', email: 'enquiry@pharmaingredients.com', source: SOURCE, businessCategory: 'supplier' },
  { companyName: 'Construction Equipments India', industry: 'Construction', location: 'Noida', website: 'https://www.tradeindia.com/constructionequipments/', phone: '9876543228', email: 'sales@constructionequip.in', source: SOURCE },
];

export async function scrapeTradeIndia(): Promise<RawLead[]> {
  const limit = Math.min(getRateLimitPerSource(), 50);
  try {
    const url = process.env.TRADEINDIA_SAMPLE_URL;
    if (url) {
      await delay(getScraperDelayMs());
      const { data } = await axios.get(url, { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ProReckonBot/1.0)' } });
      const $ = cheerio.load(data);
      const leads: RawLead[] = [];
      $('.company-name, .supplier-name, [itemprop="name"]').slice(0, limit).each((_, el) => {
        const name = $(el).text().trim();
        if (name) leads.push({ companyName: name, industry: 'Trading', location: '', source: SOURCE });
      });
      if (leads.length > 0) return leads;
    }
    return DEMO_LEADS;
  } catch (err) {
    console.warn('[TradeIndia] Scrape failed, using demo data:', (err as Error).message);
    return DEMO_LEADS;
  }
}

/**
 * JustDial businesses — ~9 demo leads with email/phone/LinkedIn.
 */

import type { RawLead } from './types.js';
import { delay, getScraperDelayMs, getRateLimitPerSource } from './types.js';
import axios from 'axios';
import * as cheerio from 'cheerio';

const SOURCE = 'justdial';

const DEMO_LEADS: RawLead[] = [
  { companyName: 'City Real Estate Agency', industry: 'Real Estate', location: 'Gurgaon', phone: '9876543230', email: 'info@cityrealestate.in', source: SOURCE },
  { companyName: 'Tech Solutions IT Pvt Ltd', industry: 'IT', location: 'Noida', website: 'https://www.justdial.com/techsolutionsit', phone: '9876543231', email: 'info@techsolutionsit.in', linkedIn: 'https://www.linkedin.com/company/techsolutionsit', source: SOURCE, decisionMakerContactFound: true },
  { companyName: 'Small Scale Manufacturing Unit', industry: 'Manufacturing', location: 'Surat', phone: '9876543232', email: 'contact@ssmfg.in', source: SOURCE, businessCategory: 'msme' },
  { companyName: 'Best Builders & Developers', industry: 'Real Estate', location: 'Mumbai', phone: '9876543233', email: 'sales@bestbuilders.in', source: SOURCE },
  { companyName: 'Digital Marketing Agency', industry: 'IT', location: 'Bangalore', website: 'https://www.justdial.com/digitalagency', phone: '9876543234', email: 'hello@digitalagency.co', source: SOURCE },
  { companyName: 'Jewellery Showroom', industry: 'Jewellery', location: 'Delhi', phone: '9876543235', email: 'enquiry@jewelleryshowroom.com', source: SOURCE },
  { companyName: 'Logistics & Transport Co', industry: 'E-commerce', location: 'Pune', phone: '9876543236', email: 'ops@logisticsco.in', source: SOURCE },
  { companyName: 'Healthcare Equipment Suppliers', industry: 'Manufacturing', location: 'Chennai', phone: '9876543237', email: 'sales@healthcareequip.in', source: SOURCE },
  { companyName: 'Restaurant Chain Pvt Ltd', industry: 'E-commerce', location: 'Hyderabad', phone: '9876543238', email: 'franchise@restaurantchain.in', source: SOURCE },
];

export async function scrapeJustDial(): Promise<RawLead[]> {
  const limit = Math.min(getRateLimitPerSource(), 50);
  try {
    const url = process.env.JUSTDIAL_SAMPLE_URL;
    if (url) {
      await delay(getScraperDelayMs());
      const { data } = await axios.get(url, { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ProReckonBot/1.0)' } });
      const $ = cheerio.load(data);
      const leads: RawLead[] = [];
      $('.store-name, .company-name, .listing a').slice(0, limit).each((_, el) => {
        const name = $(el).text().trim();
        if (name) leads.push({ companyName: name, location: '', source: SOURCE });
      });
      if (leads.length > 0) return leads;
    }
    return DEMO_LEADS;
  } catch (err) {
    console.warn('[JustDial] Scrape failed, using demo data:', (err as Error).message);
    return DEMO_LEADS;
  }
}

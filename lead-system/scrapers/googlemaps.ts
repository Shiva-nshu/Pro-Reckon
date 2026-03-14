/**
 * Google Maps businesses — ~8 demo leads with email/phone/website.
 */

import type { RawLead } from './types.js';
import { delay, getScraperDelayMs } from './types.js';

const SOURCE = 'googlemaps';

const DEMO_LEADS: RawLead[] = [
  { companyName: 'Local Construction Co', industry: 'Construction', location: 'Chennai', website: 'https://www.localconstruction.in', phone: '9876543240', email: 'info@localconstruction.in', source: SOURCE },
  { companyName: 'E-commerce Hub India', industry: 'E-commerce', location: 'Hyderabad', website: 'https://www.ecommercehub.in', phone: '9876543241', email: 'hello@ecommercehub.in', linkedIn: 'https://www.linkedin.com/company/ecommercehub', source: SOURCE, decisionMakerContactFound: true },
  { companyName: 'Startup Labs Pvt Ltd', industry: 'IT', location: 'Bangalore', website: 'https://www.startuplabs.io', phone: '9876543242', email: 'contact@startuplabs.io', source: SOURCE, yearsActive: 1, expansionOrFundingSignal: true },
  { companyName: 'Retail Mart Chain', industry: 'E-commerce', location: 'Mumbai', website: 'https://www.retailmart.in', phone: '9876543243', email: 'support@retailmart.in', source: SOURCE },
  { companyName: 'Software Development Hub', industry: 'IT', location: 'Pune', website: 'https://www.softwaredevhub.com', phone: '9876543244', email: 'sales@softwaredevhub.com', linkedIn: 'https://www.linkedin.com/company/softwaredevhub', source: SOURCE },
  { companyName: 'Textile Showroom', industry: 'Manufacturing', location: 'Coimbatore', website: 'https://www.textileshowroom.in', phone: '9876543245', email: 'enquiry@textileshowroom.in', source: SOURCE },
  { companyName: 'Realty Experts', industry: 'Real Estate', location: 'Delhi', website: 'https://www.realtyexperts.in', phone: '9876543246', email: 'info@realtyexperts.in', source: SOURCE },
  { companyName: 'Food Processing Unit', industry: 'Manufacturing', location: 'Indore', website: 'https://www.foodprocessing.in', phone: '9876543247', email: 'contact@foodprocessing.in', source: SOURCE, businessCategory: 'manufacturer' },
];

export async function scrapeGoogleMaps(): Promise<RawLead[]> {
  await delay(getScraperDelayMs());
  console.log(`[Google Maps] Extracted ${DEMO_LEADS.length} leads`);
  return DEMO_LEADS;
}

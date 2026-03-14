/**
 * MCA newly registered companies — ~8 demo leads.
 */

import type { RawLead } from './types.js';
import { delay, getScraperDelayMs } from './types.js';

const SOURCE = 'mca';

const DEMO_LEADS: RawLead[] = [
  { companyName: 'NewGen Manufacturing Pvt Ltd', industry: 'Manufacturing', location: 'Ahmedabad', website: 'https://www.newgenmfg.com', email: 'info@newgenmfg.com', source: SOURCE, businessCategory: 'manufacturer', yearsActive: 0 },
  { companyName: 'Rising Realty Pvt Ltd', industry: 'Real Estate', location: 'Mumbai', phone: '9876543249', source: SOURCE, yearsActive: 1 },
  { companyName: 'Fresh Start Exports', industry: 'Manufacturing', location: 'Delhi', website: 'https://www.freshstartexports.in', phone: '9876543250', email: 'export@freshstartexports.in', source: SOURCE, businessCategory: 'exporter', yearsActive: 2 },
  { companyName: 'FinServe Solutions Pvt Ltd', industry: 'IT', location: 'Bangalore', website: 'https://www.finserve.in', email: 'hello@finserve.in', source: SOURCE, yearsActive: 1 },
  { companyName: 'Agro Tech Ventures', industry: 'Manufacturing', location: 'Nagpur', website: 'https://www.agrotechventures.in', phone: '9876543251', source: SOURCE, yearsActive: 0 },
  { companyName: 'MedEquip India Pvt Ltd', industry: 'Manufacturing', location: 'Chennai', website: 'https://www.medequipindia.com', email: 'sales@medequipindia.com', source: SOURCE, yearsActive: 1 },
  { companyName: 'EduTech Learning Pvt Ltd', industry: 'IT', location: 'Pune', website: 'https://www.edutechlearning.in', phone: '9876543252', email: 'contact@edutechlearning.in', source: SOURCE, yearsActive: 2 },
  { companyName: 'Green Packaging Ltd', industry: 'Manufacturing', location: 'Vadodara', website: 'https://www.greenpackaging.in', phone: '9876543253', source: SOURCE, businessCategory: 'manufacturer' },
];

export async function scrapeMCA(): Promise<RawLead[]> {
  await delay(getScraperDelayMs());
  console.log(`[MCA] Extracted ${DEMO_LEADS.length} leads`);
  return DEMO_LEADS;
}

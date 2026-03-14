/**
 * Startup directories — ~8 demo leads with email/LinkedIn.
 */

import type { RawLead } from './types.js';
import { delay, getScraperDelayMs } from './types.js';

const SOURCE = 'startups';

const DEMO_LEADS: RawLead[] = [
  { companyName: 'FinTech Startup India', industry: 'IT', location: 'Bangalore', website: 'https://www.fintechstartup.in', email: 'founder@fintechstartup.in', linkedIn: 'https://www.linkedin.com/company/fintechstartup', source: SOURCE, yearsActive: 2, expansionOrFundingSignal: true, decisionMakerContactFound: true },
  { companyName: 'AgriTech Solutions', industry: 'E-commerce', location: 'Pune', website: 'https://www.agritechsol.com', phone: '9876543260', email: 'hello@agritechsol.com', source: SOURCE, yearsActive: 1 },
  { companyName: 'BuildTech Innovations', industry: 'Construction', location: 'Gurgaon', website: 'https://www.buildtech.io', email: 'contact@buildtech.io', source: SOURCE, yearsActive: 2 },
  { companyName: 'HealthTech India', industry: 'IT', location: 'Mumbai', website: 'https://www.healthtechindia.in', phone: '9876543261', email: 'info@healthtechindia.in', linkedIn: 'https://www.linkedin.com/company/healthtechindia', source: SOURCE, yearsActive: 1 },
  { companyName: 'EduTech Platform', industry: 'IT', location: 'Delhi', website: 'https://www.edutechplatform.com', email: 'support@edutechplatform.com', source: SOURCE, yearsActive: 2 },
  { companyName: 'LogiTech Solutions', industry: 'E-commerce', location: 'Chennai', website: 'https://www.logitechsolutions.in', phone: '9876543262', email: 'sales@logitechsolutions.in', source: SOURCE, yearsActive: 1 },
  { companyName: 'Clean Energy Startup', industry: 'Manufacturing', location: 'Hyderabad', website: 'https://www.cleanenergystartup.in', email: 'contact@cleanenergystartup.in', source: SOURCE, yearsActive: 0, expansionOrFundingSignal: true },
  { companyName: 'RetailTech Ventures', industry: 'E-commerce', location: 'Bangalore', website: 'https://www.retailtechventures.com', phone: '9876543263', email: 'info@retailtechventures.com', linkedIn: 'https://www.linkedin.com/company/retailtechventures', source: SOURCE, yearsActive: 2 },
];

export async function scrapeStartups(): Promise<RawLead[]> {
  await delay(getScraperDelayMs());
  console.log(`[Startups] Extracted ${DEMO_LEADS.length} leads`);
  return DEMO_LEADS;
}

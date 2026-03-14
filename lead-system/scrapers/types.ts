/**
 * Shared type for raw lead output from any scraper.
 */

export interface RawLead {
  companyName: string;
  industry?: string;
  location?: string;
  website?: string;
  phone?: string;
  email?: string;
  linkedIn?: string;
  source: string;
  businessCategory?: string;
  yearsActive?: number;
  expansionOrFundingSignal?: boolean;
  decisionMakerContactFound?: boolean;
}

const SCRAPE_DELAY_MS = Number(process.env.SCRAPER_DELAY_MS) || 2000;
const RATE_LIMIT_PER_SOURCE = 50;

export function getScraperDelayMs(): number {
  return SCRAPE_DELAY_MS;
}

export function getRateLimitPerSource(): number {
  return RATE_LIMIT_PER_SOURCE;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

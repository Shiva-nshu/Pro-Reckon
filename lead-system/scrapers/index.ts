/**
 * Run all scrapers and return combined raw leads (with rate limiting and delays).
 */

import type { RawLead } from './types.js';
import { scrapeIndiaMart } from './indiamart.js';
import { scrapeTradeIndia } from './tradeindia.js';
import { scrapeJustDial } from './justdial.js';
import { scrapeGoogleMaps } from './googlemaps.js';
import { scrapeMCA } from './mca.js';
import { scrapeStartups } from './startups.js';

const SCRAPERS: Array<() => Promise<RawLead[]>> = [
  scrapeIndiaMart,
  scrapeTradeIndia,
  scrapeJustDial,
  scrapeGoogleMaps,
  scrapeMCA,
  scrapeStartups,
];

export async function runAllScrapers(): Promise<RawLead[]> {
  const all: RawLead[] = [];
  for (const fn of SCRAPERS) {
    try {
      const leads = await fn();
      all.push(...leads);
    } catch (err) {
      console.error(`Scraper ${fn.name} failed:`, err);
    }
  }
  return all;
}

export { scrapeIndiaMart, scrapeTradeIndia, scrapeJustDial, scrapeGoogleMaps, scrapeMCA, scrapeStartups };

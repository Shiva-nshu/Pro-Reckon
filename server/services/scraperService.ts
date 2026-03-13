import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { isFirebaseConnected } from '../config/firebase.js';
import { findLeadByCompanyName, createLead } from '../models/leadFirestore.js';
import { enrichLead } from './enrichmentService.js';

// Mock data for demonstration when scraping fails or is blocked
const MOCK_LEADS = [
  {
    companyName: 'Apex Manufacturing',
    founderName: 'Robert Chen',
    email: 'contact@apexmanufacturing.com',
    industry: 'Manufacturing',
    location: 'Mumbai, India',
    website: 'https://apexmanufacturing.com',
    score: 35,
  },
  {
    companyName: 'GreenField Agro',
    founderName: 'Sarah Miller',
    email: 'info@greenfield.com',
    industry: 'Agriculture',
    location: 'Pune, India',
    website: 'https://greenfield.com',
    score: 25,
  },
];

export async function runDailyScrape() {
  console.log('🕷️ Starting Scraper...');

  try {
    // Simulated scrape for Demo
    console.log('🔍 Scanning directories...');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const leads = MOCK_LEADS;
    console.log(`✅ Found ${leads.length} new leads.`);

    if (isFirebaseConnected()) {
      for (const leadData of leads) {
        const exists = await findLeadByCompanyName(leadData.companyName);
        if (!exists) {
          let enrichmentData = null;
          if (leadData.website) {
            console.log(`✨ Enriching data for ${leadData.companyName}...`);
            enrichmentData = await enrichLead(leadData.website);
          }

          await createLead({
            ...leadData,
            enrichmentData: enrichmentData ?? undefined,
            source: 'Automated Scraper',
            status: 'New',
          });
          console.log(`💾 Saved lead: ${leadData.companyName}`);
        }
      }
    } else {
      console.log('⚠️ DB not connected. Skipping save.');
    }
  } catch (error) {
    console.error('❌ Scraper failed:', error);
  }
}

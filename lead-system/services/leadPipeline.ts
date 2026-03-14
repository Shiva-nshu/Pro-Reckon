/**
 * Lead processing pipeline: Scraper → Normalize → Score → Save to DB.
 * Handles duplicate detection (companyName + website), error handling, retry.
 */

import { normalizeLead, type NormalizedLead } from './leadNormalizer.js';
import { scoreLead, type LeadInputForScoring } from './leadScoring.js';
import { findOneByCompanyAndWebsite, createLead } from '../models/Lead.js';
import { connectDB, isDBConnected } from '../config/db.js';
import { fetchHunterLeads } from './hunterLeads.js';
import { searchLeadsWithGemini } from './geminiLeads.js';
import { enrichLeadsWithContactData } from './enrichLeadsWithHunter.js';
import type { RawLead } from '../scrapers/types.js';

const MAX_RETRIES = 2;

function normalizedToScoringInput(n: NormalizedLead): LeadInputForScoring {
  return {
    companyName: n.companyName,
    industry: n.industry || undefined,
    location: n.location || undefined,
    website: n.website || undefined,
    phone: n.phone || undefined,
    email: n.email || undefined,
    businessCategory: n.businessCategory || undefined,
    yearsActive: n.yearsActive,
    expansionOrFundingSignal: n.expansionOrFundingSignal,
    decisionMakerContactFound: n.decisionMakerContactFound,
  };
}

async function saveLeadWithRetry(doc: {
  companyName: string;
  industry?: string;
  location?: string;
  website?: string;
  phone?: string;
  email?: string;
  linkedIn?: string;
  source: string;
  qualificationScore: number;
  tier: 'Hot Lead' | 'Qualified Lead' | 'Low Priority';
  qualifiedForOutreach: boolean;
}): Promise<{ saved: boolean; duplicate?: boolean }> {
  const website = doc.website ?? '';
  const sortOrder = Date.now();
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const existing = await findOneByCompanyAndWebsite(doc.companyName, website);
      if (existing) return { saved: false, duplicate: true };
      await createLead({ ...doc, website, sortOrder });
      return { saved: true };
    } catch (err: unknown) {
      if (attempt === MAX_RETRIES) throw err;
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  return { saved: false };
}

export interface PipelineResult {
  scraped: number;
  saved: number;
  duplicates: number;
  errors: string[];
}

export async function runLeadPipeline(): Promise<PipelineResult> {
  const result: PipelineResult = { scraped: 0, saved: 0, duplicates: 0, errors: [] };

  if (!isDBConnected()) {
    await connectDB();
  }
  if (!isDBConnected()) {
    result.errors.push('Database not connected');
    return result;
  }

  let rawFromGemini: RawLead[] = [];
  try {
    rawFromGemini = await searchLeadsWithGemini({ limit: 50 });
    rawFromGemini = await enrichLeadsWithContactData(rawFromGemini);
  } catch (err) {
    result.errors.push(`Gemini: ${(err as Error).message}`);
  }

  const rawFromHunter: RawLead[] = [];
  try {
    rawFromHunter.push(...(await fetchHunterLeads()));
  } catch (err) {
    result.errors.push(`Hunter: ${(err as Error).message}`);
  }

  const rawLeads = [...rawFromGemini, ...rawFromHunter];
  result.scraped = rawLeads.length;

  for (const raw of rawLeads) {
    try {
      const normalized = normalizeLead(raw);
      const scoringInput = normalizedToScoringInput(normalized);
      const { qualificationScore, tier, qualifiedForOutreach } = scoreLead(scoringInput);

      const { saved, duplicate } = await saveLeadWithRetry({
        companyName: normalized.companyName,
        industry: normalized.industry || undefined,
        location: normalized.location || undefined,
        website: normalized.website || undefined,
        phone: normalized.phone || undefined,
        email: normalized.email || undefined,
        linkedIn: normalized.linkedIn || undefined,
        source: normalized.source,
        qualificationScore,
        tier,
        qualifiedForOutreach,
      });
      if (saved) result.saved++;
      if (duplicate) result.duplicates++;
    } catch (err) {
      result.errors.push(`${raw.companyName}: ${(err as Error).message}`);
    }
  }

  return result;
}

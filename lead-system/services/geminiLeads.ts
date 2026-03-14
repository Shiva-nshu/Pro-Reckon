/**
 * Use Gemini to search for and find real lead candidates (no demo data).
 * Returns companies that match ICP for ProReckon funding (MSME, manufacturing, etc.).
 */

import { GoogleGenAI } from '@google/genai';
import type { RawLead } from '../scrapers/types.js';

const SOURCE = 'Gemini';
const DEFAULT_LIMIT = 50;

interface GeminiLeadItem {
  companyName: string;
  industry?: string;
  location?: string;
  website?: string;
  phone?: string;
  email?: string;
  linkedIn?: string;
}

function parseJsonFromResponse(text: string): GeminiLeadItem[] {
  let raw = text.trim();
  const jsonMatch = raw.match(/\{[\s\S]*"leads"[\s\S]*\}/) || raw.match(/\[[\s\S]*\]/);
  if (jsonMatch) raw = jsonMatch[0];
  const codeBlock = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) raw = codeBlock[1].trim();
  const parsed = JSON.parse(raw) as { leads?: GeminiLeadItem[] } | GeminiLeadItem[];
  const arr = Array.isArray(parsed) ? parsed : parsed.leads;
  return Array.isArray(arr) ? arr : [];
}

export async function searchLeadsWithGemini(options?: { limit?: number; industries?: string[]; locations?: string[] }): Promise<RawLead[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    console.warn('[Gemini] GEMINI_API_KEY not set. Skipping lead search.');
    return [];
  }

  const limit = options?.limit ?? DEFAULT_LIMIT;
  const industries = options?.industries?.length
    ? options.industries.join(', ')
    : 'Manufacturing, Real Estate, Construction, Jewellery, E-commerce, IT, MSME, Export, Trading';
  const locations = options?.locations?.length
    ? options.locations.join(', ')
    : 'India (e.g. Mumbai, Delhi, Bangalore, Ahmedabad, Pune, Chennai, Hyderabad, Gurgaon)';

  const prompt = `You are a lead researcher for ProReckon Solutions, which offers business loans and MSME funding in India.
List real, findable companies that are likely to need business funding. Use your knowledge of real Indian companies, MSMEs, manufacturers, exporters, and growth-stage businesses.

Return a JSON object with a single key "leads" containing an array of up to ${limit} companies. Each item must have:
- companyName (string, required): exact or commonly known company name
- industry (string, optional): e.g. Manufacturing, Real Estate, IT
- location (string, optional): city and/or state in India
- website (string, optional): company website URL if you know it (must be valid format)
- phone (string, optional): contact number if known
- email (string, optional): general or contact email if known
- linkedIn (string, optional): company LinkedIn URL if known

Focus on: ${industries}. Prefer locations: ${locations}.
Only include real companies you can name. Prefer companies with known websites. Return only valid JSON, no markdown.`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model: process.env.GEMINI_LEADS_MODEL || 'gemini-2.5-flash',
      contents: prompt + '\n\nReply with only a JSON object: {"leads": [ {...}, ... ]}. No other text.',
    });

    const text = (result as { text?: string }).text ?? '';
    const items = parseJsonFromResponse(text);
    const leads: RawLead[] = items.slice(0, limit).map((item) => ({
      companyName: String(item.companyName || '').trim(),
      industry: item.industry?.trim(),
      location: item.location?.trim(),
      website: item.website?.trim(),
      phone: item.phone?.trim(),
      email: item.email?.trim(),
      linkedIn: item.linkedIn?.trim(),
      source: SOURCE,
      decisionMakerContactFound: Boolean(item.email),
    }));
    console.log(`[Gemini] Found ${leads.length} lead candidates`);
    return leads;
  } catch (err) {
    console.error('[Gemini] Lead search failed:', err);
    return [];
  }
}

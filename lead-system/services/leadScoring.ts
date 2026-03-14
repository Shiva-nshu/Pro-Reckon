/**
 * Lead Qualification Engine — score 0–100, tier, qualifiedForOutreach.
 * Scoring model:
 * - Target industry (Manufacturing, Real Estate, Construction, Jewellery, E-commerce, IT) → +25
 * - Website exists → +10
 * - Phone/contact exists → +10
 * - Located in target city/state → +10
 * - Business category MSME / supplier / manufacturer → +20
 * - Startup < 3 years → +20
 * - Expansion or funding signal → +20
 * - Decision maker contact/email found → +20
 * Cap at 100.
 * Tiers: Hot Lead ≥70, Qualified Lead ≥60, Low Priority <60.
 * qualifiedForOutreach = score ≥ 60.
 */

export const TARGET_INDUSTRIES = [
  'Manufacturing',
  'Real Estate',
  'Construction',
  'Jewellery',
  'E-commerce',
  'IT',
];

const MSME_KEYWORDS = ['msme', 'sme', 'supplier', 'manufacturer', 'manufacturing', 'exporter', 'export'];

function getTargetCities(): string[] {
  const env = process.env.TARGET_CITIES?.trim();
  if (env) return env.split(',').map((c) => c.trim().toLowerCase()).filter(Boolean);
  return [
    'ahmedabad', 'mumbai', 'delhi', 'pune', 'bangalore', 'bengaluru', 'chennai', 'hyderabad',
    'kolkata', 'surat', 'gurgaon', 'gurugram', 'noida', 'jaipur', 'lucknow', 'indore',
  ];
}

export interface LeadInputForScoring {
  companyName?: string;
  industry?: string;
  location?: string;
  website?: string;
  phone?: string;
  email?: string;
  /** Business category / type (e.g. supplier, manufacturer). */
  businessCategory?: string;
  /** Years since founded/registered (for startup < 3 years). */
  yearsActive?: number;
  /** Expansion or funding signal. */
  expansionOrFundingSignal?: boolean;
  /** Decision maker contact or email found. */
  decisionMakerContactFound?: boolean;
}

export interface ScoringResult {
  qualificationScore: number;
  tier: 'Hot Lead' | 'Qualified Lead' | 'Low Priority';
  qualifiedForOutreach: boolean;
}

export function scoreLead(data: LeadInputForScoring): ScoringResult {
  let score = 0;
  const industryLower = (data.industry ?? '').toLowerCase();
  const locationLower = (data.location ?? '').toLowerCase();
  const companyLower = (data.companyName ?? '').toLowerCase();
  const categoryLower = (data.businessCategory ?? '').toLowerCase();
  const text = `${companyLower} ${industryLower} ${categoryLower}`;

  // Target industry → +25
  if (TARGET_INDUSTRIES.some((i) => industryLower.includes(i.toLowerCase()))) score += 25;

  // Website exists → +10
  if (data.website && data.website.trim()) score += 10;

  // Phone/contact exists → +10
  if ((data.phone && data.phone.trim()) || (data.email && data.email.trim())) score += 10;

  // Located in target city/state → +10
  const targetCities = getTargetCities();
  if (targetCities.some((city) => locationLower.includes(city))) score += 10;

  // Business category MSME / supplier / manufacturer → +20
  if (MSME_KEYWORDS.some((k) => text.includes(k))) score += 20;

  // Startup < 3 years → +20
  if (data.yearsActive != null && data.yearsActive < 3) score += 20;

  // Expansion or funding signal → +20
  if (data.expansionOrFundingSignal === true) score += 20;

  // Decision maker contact/email found → +20
  if (data.decisionMakerContactFound === true || (data.email && data.email.trim())) score += 20;

  score = Math.min(100, score);

  const tier: ScoringResult['tier'] =
    score >= 70 ? 'Hot Lead' : score >= 60 ? 'Qualified Lead' : 'Low Priority';
  const qualifiedForOutreach = score >= 60;

  return { qualificationScore: score, tier, qualifiedForOutreach };
}

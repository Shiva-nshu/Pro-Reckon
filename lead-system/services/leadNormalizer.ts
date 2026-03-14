/**
 * Normalize raw scraped lead data into a consistent shape for scoring and storage.
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

export interface NormalizedLead {
  companyName: string;
  industry: string;
  location: string;
  website: string;
  phone: string;
  email: string;
  linkedIn: string;
  source: string;
  businessCategory: string;
  yearsActive?: number;
  expansionOrFundingSignal: boolean;
  decisionMakerContactFound: boolean;
}

function trim(s: unknown): string {
  if (s == null || typeof s !== 'string') return '';
  return s.trim();
}

export function normalizeLead(raw: RawLead): NormalizedLead {
  return {
    companyName: trim(raw.companyName) || 'Unknown',
    industry: trim(raw.industry) || '',
    location: trim(raw.location) || '',
    website: trim(raw.website) || '',
    phone: trim(raw.phone) || '',
    email: trim(raw.email) || '',
    linkedIn: trim(raw.linkedIn) || '',
    source: trim(raw.source) || 'unknown',
    businessCategory: trim(raw.businessCategory) || '',
    yearsActive: raw.yearsActive,
    expansionOrFundingSignal: Boolean(raw.expansionOrFundingSignal),
    decisionMakerContactFound: Boolean(raw.decisionMakerContactFound || (raw.email && trim(raw.email))),
  };
}

import type { CollectionReference, Query } from 'firebase-admin/firestore';
import { getFirestore } from '../config/firebase.js';

export const LEADS_COLLECTION = 'leads';

export interface LeadEnrichment {
  employeeCount?: number;
  foundedYear?: number;
  techStack?: string[];
  verifiedContacts?: Array<{ name: string; email: string; role: string }>;
  socialProfiles?: { linkedin?: string; twitter?: string; facebook?: string };
}

export interface EmailHistoryItem {
  type: 'sent' | 'opened' | 'replied';
  date: Date;
  subject?: string;
  content?: string;
}

/** ICP / qualification fields for funding-intent leads (ProReckon flow). */
export type LeadTier = 'Tier1' | 'Tier2' | 'Tier3';

export interface LeadData {
  companyName: string;
  /** Primary contact person to pitch to (from Domain Search). */
  founderName?: string;
  /** Contact's role/title (e.g. Director, Founder). */
  contactRole?: string;
  email?: string;
  phone?: string;
  website?: string;
  industry?: string;
  location?: string;
  linkedinUrl?: string;
  businessSize?: string;
  source?: string;
  enrichmentData?: LeadEnrichment;
  /** Legacy 0–100 score (kept for display). */
  score?: number;
  /** 0–100 qualification score for outreach; only contact if >= QUALIFICATION_THRESHOLD (60). */
  qualificationScore?: number;
  /** Tier1 = best (MSME/manufacturing/etc), Tier2 = growth signals, Tier3 = other. */
  tier?: LeadTier;
  /** Demo tier for dashboard: Hot (70+), Qualified (60–69), Low (<60). */
  scoreTier?: 'Hot' | 'Qualified' | 'Low';
  fundingSignal?: boolean;
  expansionSignal?: boolean;
  yearsActive?: number;
  hiringActivity?: boolean;
  revenueBusiness?: boolean;
  decisionMakerFound?: boolean;
  loanIntentProbability?: 'Low' | 'Medium' | 'High';
  priorityLevel?: 'Cold' | 'Warm' | 'Hot';
  /** True when qualificationScore >= 60 (ready for personalized outreach). */
  isQualified?: boolean;
  status?: 'New' | 'Contacted' | 'Interested' | 'Meeting Scheduled' | 'Proposal Sent' | 'Converted' | 'Rejected';
  emailSequence?: {
    currentStep?: number;
    lastEmailSentAt?: Date;
    nextFollowUp?: Date;
    history?: EmailHistoryItem[];
  };
  createdAt?: Date;
  updatedAt?: Date;
}

/** Only contact leads with qualification score >= this (client requirement). */
export const QUALIFICATION_THRESHOLD = 60;

export interface LeadRecord extends LeadData {
  id: string;
}

/** Target industries for loan/funding (demo scoring: +25). */
const TARGET_INDUSTRIES = ['Manufacturing', 'Real Estate', 'Construction', 'Jewellery', 'E-commerce', 'Trading', 'Export', 'Import', 'Financial', 'Software', 'Internet', 'Technology'];

/** Keywords in company name or industry that suggest export/manufacturing (demo: +25). */
const EXPORT_MANUFACTURING_KEYWORDS = ['export', 'manufacturing', 'manufacturer', 'trader', 'trading', 'msme', 'sme', 'supplier', 'exporters'];

/** Target cities (demo: +10 if location matches). Comma-separated in env TARGET_CITIES, or default. */
function getTargetCities(): string[] {
  const env = process.env.TARGET_CITIES?.trim();
  if (env) return env.split(',').map((c) => c.trim().toLowerCase()).filter(Boolean);
  return ['ahmedabad', 'mumbai', 'delhi', 'pune', 'bangalore', 'chennai', 'hyderabad', 'kolkata', 'surat', 'gurgaon', 'noida'];
}

/**
 * Demo lead scoring (0–100) — aligns with client demo.
 * Signal: Target industry +25, Website +10, Phone +10, MSME +20, Target city +10, Export/manufacturing keyword +25.
 * Tier: 70+ = Hot, 60–69 = Qualified, <60 = Low.
 */
export function computeLeadScore(data: LeadData): {
  score: number;
  qualificationScore: number;
  tier: LeadTier;
  /** Demo tier label: Hot | Qualified | Low for dashboard. */
  scoreTier: 'Hot' | 'Qualified' | 'Low';
  loanIntentProbability: 'Low' | 'Medium' | 'High';
  priorityLevel: 'Cold' | 'Warm' | 'Hot';
  isQualified: boolean;
  yearsActive?: number;
  decisionMakerFound: boolean;
  revenueBusiness: boolean;
} {
  const enrichment = data.enrichmentData;
  const currentYear = new Date().getFullYear();
  const foundedYear = enrichment?.foundedYear ?? data.enrichmentData?.foundedYear;
  const yearsActive = foundedYear != null ? currentYear - foundedYear : undefined;

  let score = 0;

  // Target industry: +25
  const industryLower = (data.industry ?? '').toLowerCase();
  if (TARGET_INDUSTRIES.some((i) => industryLower.includes(i.toLowerCase()))) score += 25;

  // Website exists: +10
  if (data.website) score += 10;

  // Phone exists: +10
  if (data.phone || (enrichment?.verifiedContacts && enrichment.verifiedContacts.length > 0)) score += 10;

  // Business category MSME: +20 (small headcount or SME-like industry)
  const employeeCount = enrichment?.employeeCount;
  const isMSME =
    (employeeCount != null && employeeCount >= 1 && employeeCount <= 200) ||
    industryLower.includes('msme') ||
    industryLower.includes('sme') ||
    industryLower.includes('small');
  if (isMSME) score += 20;

  // Located in target city: +10
  const locationLower = (data.location ?? '').toLowerCase();
  const targetCities = getTargetCities();
  if (targetCities.some((city) => locationLower.includes(city))) score += 10;

  // Export / manufacturing keyword: +25 (company name or industry)
  const companyLower = (data.companyName ?? '').toLowerCase();
  const text = `${companyLower} ${industryLower}`;
  if (EXPORT_MANUFACTURING_KEYWORDS.some((k) => text.includes(k))) score += 25;

  score = Math.min(100, score);

  // Demo tier: 70+ Hot, 60–69 Qualified, <60 Low
  const scoreTier: 'Hot' | 'Qualified' | 'Low' = score >= 70 ? 'Hot' : score >= 60 ? 'Qualified' : 'Low';

  // ICP tier (Tier1/2/3) for internal use
  let tier: LeadTier = 'Tier3';
  if (TARGET_INDUSTRIES.some((i) => industryLower.includes(i.toLowerCase()))) tier = 'Tier1';
  else if (data.email || data.phone) tier = 'Tier2';

  const isQualified = score >= QUALIFICATION_THRESHOLD;
  const loanIntentProbability: 'Low' | 'Medium' | 'High' = score >= 70 ? 'High' : score >= 60 ? 'Medium' : 'Low';
  const priorityLevel = score >= 70 ? 'Hot' : score >= 60 ? 'Warm' : 'Cold';
  const decisionMakerFound = !!(data.email || data.phone || (enrichment?.verifiedContacts && enrichment.verifiedContacts.length > 0));
  const revenueBusiness = TARGET_INDUSTRIES.some((i) => industryLower.includes(i.toLowerCase()));

  return {
    score,
    qualificationScore: score,
    tier,
    scoreTier,
    loanIntentProbability,
    priorityLevel,
    isQualified,
    yearsActive,
    decisionMakerFound,
    revenueBusiness,
  };
}

/** Recursively remove undefined so Firestore accepts the document (it rejects undefined). */
function stripUndefined(value: unknown): unknown {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (Array.isArray(value)) return value.map(stripUndefined).filter((v) => v !== undefined);
  if (typeof value === 'object' && value !== null) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (v === undefined) continue;
      const stripped = stripUndefined(v);
      if (stripped !== undefined) out[k] = stripped;
    }
    return out;
  }
  return value;
}

function toFirestore(data: Partial<LeadData>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined) continue;
    const stripped = stripUndefined(v);
    if (stripped !== undefined) out[k] = stripped;
  }
  return out;
}

function fromFirestore(id: string, data: Record<string, unknown>): LeadRecord {
  const d = data;
  const seq = d.emailSequence as Record<string, unknown> | undefined;
  const toDate = (v: unknown): Date | undefined => {
    if (v && typeof (v as { toDate?: () => Date }).toDate === 'function') return (v as { toDate: () => Date }).toDate();
    return v instanceof Date ? v : undefined;
  };
  const lastEmailSentAt = seq ? toDate(seq.lastEmailSentAt) ?? seq.lastEmailSentAt : undefined;
  const nextFollowUp = seq ? toDate(seq.nextFollowUp) ?? seq.nextFollowUp : undefined;
  const createdAt = toDate(d.createdAt) ?? (d.createdAt as Date);
  const updatedAt = toDate(d.updatedAt) ?? (d.updatedAt as Date);
  return {
    id,
    ...d,
    emailSequence: seq
      ? { ...seq, lastEmailSentAt, nextFollowUp }
      : undefined,
    createdAt,
    updatedAt,
  } as LeadRecord;
}

export async function createLead(data: LeadData): Promise<LeadRecord> {
  const db = getFirestore();
  if (!db) throw new Error('Firestore not connected');
  const computed = computeLeadScore(data);
  const now = new Date();
  const doc = {
    ...data,
    score: computed.score,
    qualificationScore: computed.qualificationScore,
    tier: computed.tier,
    scoreTier: computed.scoreTier,
    yearsActive: computed.yearsActive,
    decisionMakerFound: computed.decisionMakerFound,
    revenueBusiness: computed.revenueBusiness,
    loanIntentProbability: computed.loanIntentProbability,
    priorityLevel: computed.priorityLevel,
    isQualified: computed.isQualified,
    status: data.status ?? 'New',
    emailSequence: data.emailSequence ?? { currentStep: 0, history: [] },
    createdAt: now,
    updatedAt: now,
  };
  const payload = toFirestore(doc);
  const ref = await db.collection(LEADS_COLLECTION).add(payload);
  return { id: ref.id, ...doc } as LeadRecord;
}

export async function findLeadByCompanyName(companyName: string): Promise<LeadRecord | null> {
  const db = getFirestore();
  if (!db) return null;
  const snap = await db.collection(LEADS_COLLECTION).where('companyName', '==', companyName).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return fromFirestore(doc.id, doc.data());
}

export async function findLeads(options: {
  page?: number;
  limit?: number;
  status?: string;
  priorityLevel?: string;
  qualifiedOnly?: boolean;
  tier?: LeadTier;
}): Promise<{ leads: LeadRecord[]; total: number; pages: number }> {
  const db = getFirestore();
  if (!db) return { leads: [], total: 0, pages: 0 };
  const { page = 1, limit = 20, status, priorityLevel, qualifiedOnly, tier } = options;
  const snap = await db.collection(LEADS_COLLECTION).orderBy('createdAt', 'desc').get();
  let list = snap.docs.map(d => fromFirestore(d.id, d.data() as Record<string, unknown>));
  if (status) list = list.filter(l => l.status === status);
  if (priorityLevel) list = list.filter(l => l.priorityLevel === priorityLevel);
  if (qualifiedOnly) list = list.filter(l => l.isQualified === true || (l.qualificationScore ?? l.score ?? 0) >= QUALIFICATION_THRESHOLD);
  if (tier) list = list.filter(l => l.tier === tier);
  const total = list.length;
  const start = (page - 1) * limit;
  const leads = list.slice(start, start + limit);
  return { leads, total, pages: Math.ceil(total / limit) };
}

export async function getLeadById(id: string): Promise<LeadRecord | null> {
  const db = getFirestore();
  if (!db) return null;
  const doc = await db.collection(LEADS_COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return fromFirestore(doc.id, doc.data() as Record<string, unknown>);
}

/** Recompute score/tier from current lead data (so updates to industry/phone/website etc. are reflected). */
export async function updateLead(id: string, updates: Partial<LeadData>): Promise<LeadRecord | null> {
  const db = getFirestore();
  if (!db) return null;
  const existing = await getLeadById(id);
  if (!existing) return null;
  const merged: LeadData = { ...existing, ...updates };
  const computed = computeLeadScore(merged);
  const updatePayload = {
    ...updates,
    score: computed.score,
    qualificationScore: computed.qualificationScore,
    tier: computed.tier,
    scoreTier: computed.scoreTier,
    isQualified: computed.isQualified,
    priorityLevel: computed.priorityLevel,
    loanIntentProbability: computed.loanIntentProbability,
    decisionMakerFound: computed.decisionMakerFound,
    revenueBusiness: computed.revenueBusiness,
    yearsActive: computed.yearsActive,
    updatedAt: new Date(),
  };
  const ref = db.collection(LEADS_COLLECTION).doc(id);
  await ref.update(toFirestore(updatePayload));
  return getLeadById(id);
}

export async function countLeads(where?: { isQualified?: boolean; status?: string; priorityLevel?: string }): Promise<number> {
  const db = getFirestore();
  if (!db) return 0;
  let query: CollectionReference | Query = db.collection(LEADS_COLLECTION);
  if (where?.isQualified !== undefined) query = query.where('isQualified', '==', where.isQualified);
  if (where?.status) query = query.where('status', '==', where.status);
  if (where?.priorityLevel) query = query.where('priorityLevel', '==', where.priorityLevel);
  const snap = await query.get();
  return snap.size;
}

export async function pipelineByStatus(): Promise<{ name: string; value: number }[]> {
  const db = getFirestore();
  if (!db) return [];
  const snap = await db.collection(LEADS_COLLECTION).get();
  const byStatus: Record<string, number> = {};
  snap.docs.forEach(d => {
    const status = (d.data() as LeadData).status || 'New';
    byStatus[status] = (byStatus[status] || 0) + 1;
  });
  return Object.entries(byStatus).map(([name, value]) => ({ name, value }));
}

export async function pipelineByTier(): Promise<{ name: string; value: number }[]> {
  const db = getFirestore();
  if (!db) return [];
  const snap = await db.collection(LEADS_COLLECTION).get();
  const byTier: Record<string, number> = { Tier1: 0, Tier2: 0, Tier3: 0 };
  snap.docs.forEach(d => {
    const tier = (d.data() as LeadData).tier || 'Tier3';
    byTier[tier] = (byTier[tier] || 0) + 1;
  });
  return Object.entries(byTier).map(([name, value]) => ({ name, value }));
}

/** Demo score tier counts: Hot (70+), Qualified (60–69), Low (<60). */
export async function pipelineByScoreTier(): Promise<{ name: string; value: number }[]> {
  const db = getFirestore();
  if (!db) return [];
  const snap = await db.collection(LEADS_COLLECTION).get();
  const by: Record<string, number> = { Hot: 0, Qualified: 0, Low: 0 };
  snap.docs.forEach(d => {
    const data = d.data() as LeadData;
    const score = data.qualificationScore ?? data.score ?? 0;
    const tier = data.scoreTier ?? (score >= 70 ? 'Hot' : score >= 60 ? 'Qualified' : 'Low');
    by[tier] = (by[tier] || 0) + 1;
  });
  return [{ name: 'Hot', value: by.Hot }, { name: 'Qualified', value: by.Qualified }, { name: 'Low', value: by.Low }];
}

/** Find leads for email queue: qualified, New, with email. */
export async function findLeadsToEmail(limit: number): Promise<LeadRecord[]> {
  const db = getFirestore();
  if (!db) return [];
  const snap = await db
    .collection(LEADS_COLLECTION)
    .where('isQualified', '==', true)
    .where('status', '==', 'New')
    .limit(limit)
    .get();
  return snap.docs.map(d => fromFirestore(d.id, d.data() as Record<string, unknown>));
}

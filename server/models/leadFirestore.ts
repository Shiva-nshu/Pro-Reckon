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

export interface LeadData {
  companyName: string;
  founderName?: string;
  email?: string;
  phone?: string;
  website?: string;
  industry?: string;
  location?: string;
  linkedinUrl?: string;
  businessSize?: string;
  source?: string;
  enrichmentData?: LeadEnrichment;
  score?: number;
  loanIntentProbability?: 'Low' | 'Medium' | 'High';
  priorityLevel?: 'Cold' | 'Warm' | 'Hot';
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

export interface LeadRecord extends LeadData {
  id: string;
}

/** Compute lead score and derived fields (mirrors Mongoose pre-save logic). */
export function computeLeadScore(data: LeadData): { score: number; loanIntentProbability: 'Low' | 'Medium' | 'High'; priorityLevel: 'Cold' | 'Warm' | 'Hot'; isQualified: boolean } {
  let score = 0;
  if (data.website) score += 10;
  if (data.industry && ['Manufacturing', 'Real Estate', 'Construction'].includes(data.industry)) score += 20;
  const enrichment = data.enrichmentData;
  if (enrichment) {
    if (enrichment.employeeCount && enrichment.employeeCount > 50) score += 15;
    if (enrichment.techStack?.some(t => ['Shopify', 'Stripe', 'AWS'].includes(t))) score += 10;
    if (enrichment.verifiedContacts && enrichment.verifiedContacts.length > 0) score += 5;
  }
  let loanIntentProbability: 'Low' | 'Medium' | 'High' = 'Low';
  let priorityLevel: 'Cold' | 'Warm' | 'Hot' = 'Cold';
  let isQualified = false;
  if (score > 30) {
    loanIntentProbability = 'High';
    priorityLevel = 'Hot';
    isQualified = true;
  } else if (score > 15) {
    loanIntentProbability = 'Medium';
    priorityLevel = 'Warm';
  }
  return { score, loanIntentProbability, priorityLevel, isQualified };
}

function toFirestore(data: Partial<LeadData>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) out[k] = v;
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
  const { score, loanIntentProbability, priorityLevel, isQualified } = computeLeadScore(data);
  const now = new Date();
  const doc = {
    ...data,
    score,
    loanIntentProbability,
    priorityLevel,
    isQualified,
    status: data.status ?? 'New',
    emailSequence: data.emailSequence ?? { currentStep: 0, history: [] },
    createdAt: now,
    updatedAt: now,
  };
  const ref = await db.collection(LEADS_COLLECTION).add(toFirestore(doc));
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
}): Promise<{ leads: LeadRecord[]; total: number; pages: number }> {
  const db = getFirestore();
  if (!db) return { leads: [], total: 0, pages: 0 };
  const { page = 1, limit = 20, status, priorityLevel } = options;
  const snap = await db.collection(LEADS_COLLECTION).orderBy('createdAt', 'desc').get();
  let list = snap.docs.map(d => fromFirestore(d.id, d.data() as Record<string, unknown>));
  if (status) list = list.filter(l => l.status === status);
  if (priorityLevel) list = list.filter(l => l.priorityLevel === priorityLevel);
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

export async function updateLead(id: string, updates: Partial<LeadData>): Promise<LeadRecord | null> {
  const db = getFirestore();
  if (!db) return null;
  const ref = db.collection(LEADS_COLLECTION).doc(id);
  const withUpdated = { ...updates, updatedAt: new Date() };
  await ref.update(toFirestore(withUpdated));
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

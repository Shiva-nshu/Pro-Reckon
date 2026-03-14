/**
 * Lead model using Firebase Firestore.
 * Duplicate detection: companyName + website.
 */

import { getFirestore } from '../../server/config/firebase.js';
import type { CollectionReference, Query } from 'firebase-admin/firestore';

export interface ILead {
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
  sortOrder: number;
  createdAt: Date;
}

export interface LeadRecord extends ILead {
  id: string;
}

const COLLECTION = 'leads';

function toFirestore(doc: Partial<ILead>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(doc)) {
    if (v === undefined) continue;
    out[k] = v instanceof Date ? v : v;
  }
  return out;
}

function fromFirestore(id: string, data: Record<string, unknown>): LeadRecord {
  const d = data;
  const toDate = (v: unknown): Date => {
    if (v && typeof (v as { toDate?: () => Date }).toDate === 'function') return (v as { toDate: () => Date }).toDate();
    return v instanceof Date ? v : new Date();
  };
  const sortOrder = typeof d.sortOrder === 'number' && !Number.isNaN(d.sortOrder) ? d.sortOrder : 0;
  return {
    id,
    companyName: String(d.companyName ?? ''),
    industry: d.industry != null ? String(d.industry) : undefined,
    location: d.location != null ? String(d.location) : undefined,
    website: d.website != null ? String(d.website) : undefined,
    phone: d.phone != null ? String(d.phone) : undefined,
    email: d.email != null ? String(d.email) : undefined,
    linkedIn: d.linkedIn != null ? String(d.linkedIn) : undefined,
    source: String(d.source ?? ''),
    qualificationScore: Number(d.qualificationScore ?? 0),
    tier: d.tier as LeadRecord['tier'],
    qualifiedForOutreach: Boolean(d.qualifiedForOutreach),
    sortOrder,
    createdAt: toDate(d.createdAt),
  };
}

export async function findOneByCompanyAndWebsite(companyName: string, website: string): Promise<LeadRecord | null> {
  const db = getFirestore();
  if (!db) return null;
  const snap = await db
    .collection(COLLECTION)
    .where('companyName', '==', companyName)
    .where('website', '==', website)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return fromFirestore(doc.id, (doc.data() ?? {}) as Record<string, unknown>);
}

export async function createLead(doc: Omit<ILead, 'sortOrder'> & { sortOrder?: number }): Promise<LeadRecord> {
  const db = getFirestore();
  if (!db) throw new Error('Firestore not connected');
  const now = new Date();
  const sortOrder = doc.sortOrder ?? now.getTime();
  const payload = toFirestore({ ...doc, sortOrder, createdAt: now });
  const ref = await db.collection(COLLECTION).add(payload);
  return { ...doc, sortOrder, id: ref.id, createdAt: now } as LeadRecord;
}

export async function getLeadById(id: string): Promise<LeadRecord | null> {
  const db = getFirestore();
  if (!db) return null;
  const doc = await db.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return fromFirestore(doc.id, (doc.data() ?? {}) as Record<string, unknown>);
}

export async function updateLead(id: string, updates: Partial<Omit<ILead, 'companyName'>>): Promise<LeadRecord | null> {
  const db = getFirestore();
  if (!db) return null;
  const ref = db.collection(COLLECTION).doc(id);
  const docSnap = await ref.get();
  if (!docSnap.exists) return null;
  const payload = toFirestore(updates);
  await ref.update(payload);
  return getLeadById(id);
}

export async function deleteLead(id: string): Promise<boolean> {
  const db = getFirestore();
  if (!db) return false;
  await db.collection(COLLECTION).doc(id).delete();
  return true;
}

export async function reorderLeads(orderedIds: string[]): Promise<void> {
  const db = getFirestore();
  if (!db) return;
  const batch = db.batch();
  orderedIds.forEach((id, index) => {
    const ref = db.collection(COLLECTION).doc(id);
    batch.update(ref, { sortOrder: index });
  });
  await batch.commit();
}

export interface FindLeadsFilter {
  minScore?: number;
  source?: string;
  search?: string;
  page?: number;
  limit?: number;
}

function matchesSearch(lead: LeadRecord, q: string): boolean {
  const lower = q.toLowerCase();
  const fields = [lead.companyName, lead.industry, lead.location, lead.email].filter(Boolean);
  return fields.some((f) => String(f).toLowerCase().includes(lower));
}

export async function findLeads(filter: FindLeadsFilter): Promise<{ leads: LeadRecord[]; total: number; pages: number }> {
  const db = getFirestore();
  if (!db) return { leads: [], total: 0, pages: 0 };
  const { page = 1, limit = 20, minScore, source, search } = filter;
  const capLimit = Math.min(100, Math.max(1, limit));

  const snap = await db.collection(COLLECTION).orderBy('createdAt', 'desc').get();
  let list = snap.docs.map((d) => fromFirestore(d.id, (d.data() ?? {}) as Record<string, unknown>));
  list.sort((a, b) => (a.sortOrder ?? 999999) - (b.sortOrder ?? 999999));

  if (minScore != null && !Number.isNaN(minScore)) {
    list = list.filter((l) => l.qualificationScore >= minScore);
  }
  if (source) {
    list = list.filter((l) => l.source === source);
  }
  const searchTrim = typeof search === 'string' ? search.trim() : '';
  if (searchTrim) {
    list = list.filter((l) => matchesSearch(l, searchTrim));
  }

  const total = list.length;
  const start = (page - 1) * capLimit;
  const leads = list.slice(start, start + capLimit);
  return { leads, total, pages: Math.ceil(total / capLimit) || 1 };
}

export async function countDocuments(filter?: { tier?: string; qualifiedForOutreach?: boolean }): Promise<number> {
  const db = getFirestore();
  if (!db) return 0;
  let ref: CollectionReference | Query = db.collection(COLLECTION);
  if (filter?.tier) ref = ref.where('tier', '==', filter.tier);
  if (filter?.qualifiedForOutreach !== undefined) ref = ref.where('qualifiedForOutreach', '==', filter.qualifiedForOutreach);
  const snap = await ref.get();
  return snap.size;
}

/** Get all leads (for enrichment). Limit 300. */
export async function getAllLeads(limit = 300): Promise<LeadRecord[]> {
  const { leads } = await findLeads({ page: 1, limit });
  return leads;
}

/** Lead API used by pipeline and controller (Mongoose-style). */
export const Lead = {
  findOne: async (filter: { companyName: string; website: string }) =>
    findOneByCompanyAndWebsite(filter.companyName, filter.website),
  create: (doc: ILead) => createLead(doc),
  find: async (filter: Record<string, unknown>) => {
    const minScore = typeof (filter.qualificationScore as { $gte?: number })?.$gte === 'number' ? (filter.qualificationScore as { $gte: number }).$gte : undefined;
    const source = typeof filter.source === 'string' ? filter.source : undefined;
    const { leads } = await findLeads({ minScore, source, page: 1, limit: 100 });
    return leads;
  },
  findPaginated: findLeads,
  countDocuments: async (filter?: { tier?: string; qualifiedForOutreach?: boolean }) => countDocuments(filter),
};

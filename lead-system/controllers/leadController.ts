import type { Request, Response } from 'express';
import { Lead, updateLead, deleteLead, reorderLeads, getAllLeads } from '../models/Lead.js';
import { runLeadPipeline } from '../services/leadPipeline.js';
import { enrichOneLead } from '../services/enrichLeadsWithHunter.js';
import { isDBConnected } from '../config/db.js';
import type { RawLead } from '../scrapers/types.js';

export async function getLeads(req: Request, res: Response): Promise<void> {
  try {
    if (!isDBConnected()) {
      res.status(503).json({ error: 'Database not connected', leads: [], total: 0, pages: 0 });
      return;
    }
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const minScore = req.query.minScore != null ? Number(req.query.minScore) : undefined;
    const source = typeof req.query.source === 'string' ? req.query.source.trim() : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;

    const { leads, total, pages } = await Lead.findPaginated({ page, limit, minScore, source, search });
    res.json({
      leads: leads.map((l) => ({ ...l, id: l.id, _id: l.id })),
      total,
      pages,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leads', leads: [], total: 0, pages: 0 });
  }
}

export async function triggerScrape(req: Request, res: Response): Promise<void> {
  try {
    runLeadPipeline()
      .then((result) => {
        console.log('Pipeline result:', result);
      })
      .catch((err) => {
        console.error('Pipeline error:', err);
      });
    res.json({ message: 'Lead search started in background (Gemini + Hunter)' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to start lead search' });
  }
}

export async function removeLead(req: Request, res: Response): Promise<void> {
  try {
    if (!isDBConnected()) {
      res.status(503).json({ error: 'Database not connected' });
      return;
    }
    const id = req.params.id;
    if (!id) {
      res.status(400).json({ error: 'Lead id required' });
      return;
    }
    const ok = await deleteLead(id);
    if (!ok) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }
    res.json({ success: true, message: 'Lead removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove lead' });
  }
}

export async function patchLead(req: Request, res: Response): Promise<void> {
  try {
    if (!isDBConnected()) {
      res.status(503).json({ error: 'Database not connected' });
      return;
    }
    const id = req.params.id;
    if (!id) {
      res.status(400).json({ error: 'Lead id required' });
      return;
    }
    const updates = req.body as Record<string, unknown>;
    const allowed = ['sortOrder', 'industry', 'location', 'website', 'phone', 'email', 'linkedIn'];
    const filtered: Record<string, unknown> = {};
    for (const k of allowed) {
      if (updates[k] !== undefined) filtered[k] = updates[k];
    }
    const updated = await updateLead(id, filtered as Parameters<typeof updateLead>[1]);
    if (!updated) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update lead' });
  }
}

export async function reorderLeadsRoute(req: Request, res: Response): Promise<void> {
  try {
    if (!isDBConnected()) {
      res.status(503).json({ error: 'Database not connected' });
      return;
    }
    const order = req.body?.order as string[] | undefined;
    if (!Array.isArray(order) || order.length === 0) {
      res.status(400).json({ error: 'Body must include order: string[] of lead ids' });
      return;
    }
    await reorderLeads(order);
    res.json({ success: true, message: 'Order updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reorder leads' });
  }
}

export async function deleteLeadsBulk(req: Request, res: Response): Promise<void> {
  try {
    if (!isDBConnected()) {
      res.status(503).json({ error: 'Database not connected' });
      return;
    }
    const ids = req.body?.ids as string[] | undefined;
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: 'Body must include ids: string[] of lead ids' });
      return;
    }
    let deleted = 0;
    for (const id of ids) {
      const ok = await deleteLead(id);
      if (ok) deleted++;
    }
    res.json({ success: true, deleted, message: `Removed ${deleted} lead(s)` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete leads' });
  }
}

/** Enrich existing leads in DB: fetch email/phone/LinkedIn from Hunter for leads that have website but missing contact. Runs in background. */
export async function enrichExistingLeads(req: Request, res: Response): Promise<void> {
  try {
    if (!isDBConnected()) {
      res.status(503).json({ error: 'Database not connected' });
      return;
    }
    res.json({ success: true, message: 'Enrichment started in background. Refresh the leads list in a few minutes to see email/phone.' });
    (async () => {
      try {
        const all = await getAllLeads(300);
        const needsEnrichment = all.filter(
          (l) => l.website?.trim() && (!l.email?.trim() || !l.phone?.trim())
        );
        if (needsEnrichment.length === 0) {
          console.log('[Enrich] No leads need enrichment');
          return;
        }
        console.log(`[Enrich] Enriching ${needsEnrichment.length} existing leads...`);
        let enriched = 0;
        for (const lead of needsEnrichment) {
          const raw: RawLead = {
            companyName: lead.companyName,
            website: lead.website,
            industry: lead.industry,
            location: lead.location,
            email: lead.email,
            phone: lead.phone,
            linkedIn: lead.linkedIn,
            source: lead.source,
          };
          const updated = await enrichOneLead(raw);
          const hasNew = (updated.email && updated.email !== lead.email) || (updated.phone && updated.phone !== lead.phone) || (updated.linkedIn && updated.linkedIn !== lead.linkedIn);
          if (hasNew) {
            await updateLead(lead.id, {
              email: updated.email || lead.email,
              phone: updated.phone || lead.phone,
              linkedIn: updated.linkedIn || lead.linkedIn,
            });
            enriched++;
          }
        }
        console.log(`[Enrich] Done. Updated ${enriched} lead(s) with contact data.`);
      } catch (err) {
        console.error('[Enrich] Error:', err);
      }
    })();
  } catch (err) {
    res.status(500).json({ error: 'Failed to start enrichment' });
  }
}

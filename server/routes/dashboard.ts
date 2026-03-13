import express from 'express';
import { isFirebaseConnected } from '../config/firebase.js';
import * as leadFirestore from '../models/leadFirestore.js';

const router = express.Router();

router.get('/stats', async (req, res) => {
  try {
    if (!isFirebaseConnected()) {
      return res.status(503).json({
        error: 'Database not connected',
        totalLeads: 0,
        qualifiedLeads: 0,
        hotLeads: 0,
        conversionRate: '0',
        pipeline: [],
      });
    }

    const totalLeads = await leadFirestore.countLeads();
    const converted = await leadFirestore.countLeads({ status: 'Converted' });
    const pipeline = await leadFirestore.pipelineByStatus();
    const tierBreakdown = await leadFirestore.pipelineByTier();
    const scoreTierBreakdown = await leadFirestore.pipelineByScoreTier();
    // Derive hot/qualified from score tier so counts match chart (dynamic for legacy leads)
    const hotLeads = scoreTierBreakdown.find((t) => t.name === 'Hot')?.value ?? 0;
    const qualifiedLeads = (scoreTierBreakdown.find((t) => t.name === 'Hot')?.value ?? 0) + (scoreTierBreakdown.find((t) => t.name === 'Qualified')?.value ?? 0);

    res.json({
      totalLeads,
      qualifiedLeads,
      qualifiedForOutreach: qualifiedLeads,
      hotLeads,
      conversionRate: totalLeads > 0 ? ((converted / totalLeads) * 100).toFixed(1) : 0,
      pipeline,
      tierBreakdown,
      scoreTierBreakdown,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

export default router;

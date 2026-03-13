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
    const qualifiedLeads = await leadFirestore.countLeads({ isQualified: true });
    const hotLeads = await leadFirestore.countLeads({ priorityLevel: 'Hot' });
    const converted = await leadFirestore.countLeads({ status: 'Converted' });
    const pipeline = await leadFirestore.pipelineByStatus();

    res.json({
      totalLeads,
      qualifiedLeads,
      hotLeads,
      conversionRate: totalLeads > 0 ? ((converted / totalLeads) * 100).toFixed(1) : 0,
      pipeline,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

export default router;

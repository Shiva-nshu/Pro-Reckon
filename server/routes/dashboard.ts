import express from 'express';
import { isFirebaseConnected } from '../config/firebase.js';
import * as leadFirestore from '../models/leadFirestore.js';

const router = express.Router();

router.get('/stats', async (req, res) => {
  try {
    if (!isFirebaseConnected()) {
      return res.json({
        totalLeads: 1250,
        qualifiedLeads: 450,
        hotLeads: 120,
        conversionRate: 3.2,
        pipeline: [
          { name: 'New', value: 400 },
          { name: 'Contacted', value: 300 },
          { name: 'Interested', value: 100 },
          { name: 'Meeting', value: 40 },
          { name: 'Converted', value: 10 },
        ],
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

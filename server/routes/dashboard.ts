import express from 'express';
import { Lead } from '../models/Lead.js';
import mongoose from 'mongoose';

const router = express.Router();

router.get('/stats', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      // Return mock stats
      return res.json({
        totalLeads: 1250,
        qualifiedLeads: 450,
        emailsSent: 890,
        conversionRate: 3.2,
        pipeline: [
          { name: 'New', value: 400 },
          { name: 'Contacted', value: 300 },
          { name: 'Interested', value: 100 },
          { name: 'Meeting', value: 40 },
          { name: 'Converted', value: 10 }
        ]
      });
    }

    const totalLeads = await Lead.countDocuments();
    const qualifiedLeads = await Lead.countDocuments({ isQualified: true });
    const converted = await Lead.countDocuments({ status: 'Converted' });
    
    // Pipeline aggregation
    const pipeline = await Lead.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      totalLeads,
      qualifiedLeads,
      emailsSent: 0, // Implement email tracking
      conversionRate: totalLeads > 0 ? ((converted / totalLeads) * 100).toFixed(1) : 0,
      pipeline: pipeline.map(p => ({ name: p._id, value: p.count }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

export default router;

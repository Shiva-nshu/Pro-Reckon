import type { Request, Response } from 'express';
import { Lead } from '../models/Lead.js';
import { isDBConnected } from '../config/db.js';

export async function getDashboardStats(req: Request, res: Response): Promise<void> {
  try {
    if (!isDBConnected()) {
      res.status(503).json({
        error: 'Database not connected',
        totalLeads: 0,
        qualifiedLeads: 0,
        hotLeads: 0,
        qualifiedForOutreach: 0,
        conversionRate: '0',
        pipeline: [],
        tierBreakdown: [],
        scoreTierBreakdown: [],
      });
      return;
    }
    const totalLeads = await Lead.countDocuments();
    const hotLeads = await Lead.countDocuments({ tier: 'Hot Lead' });
    const qualifiedForOutreach = await Lead.countDocuments({ qualifiedForOutreach: true });
    const qualifiedLeads = qualifiedForOutreach;

    const scoreTierBreakdown = [
      { name: 'Hot Lead', value: await Lead.countDocuments({ tier: 'Hot Lead' }) },
      { name: 'Qualified Lead', value: await Lead.countDocuments({ tier: 'Qualified Lead' }) },
      { name: 'Low Priority', value: await Lead.countDocuments({ tier: 'Low Priority' }) },
    ];
    const pipeline = [{ name: 'New', value: totalLeads }];

    res.json({
      totalLeads,
      qualifiedLeads,
      qualifiedForOutreach,
      hotLeads,
      conversionRate: '0',
      pipeline,
      tierBreakdown: scoreTierBreakdown,
      scoreTierBreakdown,
    });
  } catch (err) {
    res.status(500).json({
      error: 'Failed to fetch dashboard stats',
      totalLeads: 0,
      qualifiedLeads: 0,
      hotLeads: 0,
      qualifiedForOutreach: 0,
      conversionRate: '0',
      pipeline: [],
      tierBreakdown: [],
      scoreTierBreakdown: [],
    });
  }
}

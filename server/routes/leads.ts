import express from 'express';
import { Lead } from '../models/Lead.js';
import { runDailyScrape } from '../services/scraperService.js';

const router = express.Router();

// GET all leads with pagination & filtering
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, priority } = req.query;
    const query: any = {};
    if (status) query.status = status;
    if (priority) query.priorityLevel = priority;

    // Mock data if DB not connected
    if (mongoose.connection.readyState !== 1) {
       return res.json({
         leads: [
           { _id: '1', companyName: 'TechCorp', founderName: 'John Doe', score: 45, status: 'New', priorityLevel: 'Hot', email: 'john@techcorp.com' },
           { _id: '2', companyName: 'BuildIt Inc', founderName: 'Jane Smith', score: 20, status: 'Contacted', priorityLevel: 'Warm', email: 'jane@buildit.com' }
         ],
         total: 2,
         pages: 1
       });
    }

    const leads = await Lead.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Lead.countDocuments(query);

    res.json({
      leads,
      total,
      pages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// POST create manual lead
router.post('/', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return res.status(503).json({error: 'Database not connected'});
    const lead = new Lead(req.body);
    await lead.save();
    res.status(201).json(lead);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create lead' });
  }
});

// POST trigger scraper manually
router.post('/scrape', async (req, res) => {
  try {
    // Run in background
    runDailyScrape().catch(console.error);
    res.json({ message: 'Scraping started in background' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start scraper' });
  }
});

import mongoose from 'mongoose';
export default router;

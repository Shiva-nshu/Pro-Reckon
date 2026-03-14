import express from 'express';
import { getLeads, triggerScrape, removeLead, patchLead, reorderLeadsRoute, deleteLeadsBulk, enrichExistingLeads } from '../controllers/leadController.js';

const router = express.Router();

router.get('/', getLeads);
router.post('/scrape/run', triggerScrape);
router.post('/scrape', triggerScrape);
router.post('/enrich', enrichExistingLeads);
router.delete('/:id', removeLead);
router.patch('/:id', patchLead);
router.post('/reorder', reorderLeadsRoute);
router.post('/bulk-delete', deleteLeadsBulk);

export default router;

import cron from 'node-cron';
import { runLeadPipeline } from '../services/leadPipeline.js';

const CRON_SCHEDULE = process.env.SCRAPER_CRON || '0 */12 * * *'; // every 12 hours

export function startScraperScheduler(): void {
  cron.schedule(CRON_SCHEDULE, () => {
    console.log('⏰ [Scheduler] Running lead pipeline...');
    runLeadPipeline()
      .then((r) => console.log('✅ [Scheduler] Pipeline done:', r))
      .catch((err) => console.error('❌ [Scheduler] Pipeline failed:', err));
  });
  console.log(`✅ Scraper scheduler started (cron: ${CRON_SCHEDULE})`);
}

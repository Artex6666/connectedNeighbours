import 'dotenv/config';
import app from './app';
import { connectMongo } from './config/db.mongo';
import { connectNeo4j } from './config/db.neo4j';
import { ensureDevSeedData } from './dev/seed-dev-data';
import { processDueNewsletters } from './controllers/newsletter.controller';

const PORT = process.env.PORT ?? 3000;
const NEWSLETTER_TICK_MS = 60 * 1000; // vérifie les newsletters planifiées chaque minute

async function start() {
  try {
    await connectMongo();
    await connectNeo4j();
    // Idempotent — only seeds collections that are still empty. Runs in prod too
    // so the public showcase has real content on a fresh database.
    await ensureDevSeedData();

    app.listen(PORT, () => {
      console.log(`[server] Running on http://localhost:${PORT}`);
      console.log(`[server] Swagger docs at http://localhost:${PORT}/api/docs`);
    });

    // Scheduler des newsletters planifiées.
    setInterval(() => {
      processDueNewsletters().catch((err) =>
        console.error('[newsletter] scheduler error:', err?.message),
      );
    }, NEWSLETTER_TICK_MS);
  } catch (err) {
    console.error('[server] Failed to start:', err);
    process.exit(1);
  }
}

start();

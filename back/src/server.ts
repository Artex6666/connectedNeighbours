import 'dotenv/config';
import app from './app';
import { connectMongo } from './config/db.mongo';
import { connectNeo4j } from './config/db.neo4j';
import { isInMemoryMode } from './config/runtime';
import { ensureDevSeedData } from './dev/seed-dev-data';

const PORT = process.env.PORT ?? 3000;

async function start() {
  try {
    if (isInMemoryMode()) {
      console.log('[server] Running in in-memory mode');
    } else {
      await connectMongo();
      await connectNeo4j();
      if (process.env.NODE_ENV !== 'production') {
        await ensureDevSeedData();
      }
    }

    app.listen(PORT, () => {
      console.log(`[server] Running on http://localhost:${PORT}`);
      console.log(`[server] Swagger docs at http://localhost:${PORT}/api/docs`);
    });
  } catch (err) {
    console.error('[server] Failed to start:', err);
    process.exit(1);
  }
}

start();

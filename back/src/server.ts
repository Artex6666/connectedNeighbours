import 'dotenv/config';
import app from './app';
import { connectMongo } from './config/db.mongo';
import { connectNeo4j } from './config/db.neo4j';

const PORT = process.env.PORT ?? 3000;

async function start() {
  try {
    await connectMongo();
    await connectNeo4j();
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

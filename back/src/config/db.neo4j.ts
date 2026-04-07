import neo4j, { Driver } from 'neo4j-driver';

let driver: Driver;

export async function connectNeo4j(retries = 10, delayMs = 5000): Promise<void> {
  const uri = process.env.NEO4J_URI;
  const user = process.env.NEO4J_USER ?? 'neo4j';
  const password = process.env.NEO4J_PASSWORD ?? '';

  if (!uri) throw new Error('NEO4J_URI is not defined');

  driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await driver.verifyConnectivity();
      console.log('[neo4j] Connected to Neo4j');
      return;
    } catch (err) {
      console.warn(`[neo4j] Attempt ${attempt}/${retries} failed, retrying in ${delayMs / 1000}s...`);
      if (attempt === retries) throw err;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

export function getNeo4jDriver(): Driver {
  if (!driver) throw new Error('Neo4j driver not initialized');
  return driver;
}

export function getNeo4jSession() {
  return getNeo4jDriver().session();
}

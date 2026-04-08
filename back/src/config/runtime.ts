export function isInMemoryMode() {
  return process.env.USE_IN_MEMORY_DB === 'true';
}

export function isNeo4jEnabled() {
  return process.env.NEO4J_ENABLED === 'true';
}

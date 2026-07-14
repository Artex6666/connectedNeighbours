export type MongoDslAst = {
  action: 'FIND'
  collection: string
  filter: Record<string, string>
}

const ALLOWED_COLLECTIONS = new Set([
  'users',
  'events',
  'services',
  'votes',
  'messages',
  'incidents',
  'alertes',
  'documents',
])

export function parseMongoDsl(query: string): MongoDslAst {
  const trimmed = query.trim()

  const regex = /^FIND\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+WHERE\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*"([^"]*)"$/i
  const match = trimmed.match(regex)

  if (!match) {
    throw new Error('Syntaxe invalide. Exemple : FIND users WHERE email = "sso@test.fr"')
  }

  const collection = match[1]
  const field = match[2]
  const value = match[3]

  if (!ALLOWED_COLLECTIONS.has(collection)) {
    throw new Error(`Collection non autorisée : ${collection}`)
  }

  return {
    action: 'FIND',
    collection,
    filter: {
      [field]: value,
    },
  }
}
import { FormEvent, useState } from 'react'

type MongoDslAst = {
  action: string
  collection: string
  filter: Record<string, unknown>
}

type MongoDslResult = {
  success: boolean
  data?: {
    ast: MongoDslAst
    count: number
    results: Record<string, unknown>[]
  }
  message?: string
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  'http://localhost:3000/api/v1'

const examples = [
  'FIND users WHERE email = "admin@bobconnect.fr"',
  'FIND users WHERE role = "resident"',
  'FIND services WHERE category = "jardinage"',
  'FIND events WHERE title = "Repas de quartier — Place Léon Blum"',
]

export function MongoDslPage() {
  const [query, setQuery] = useState(examples[0])
  const [response, setResponse] = useState<MongoDslResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function executeQuery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedQuery = query.trim()

    if (!normalizedQuery) {
      setResponse({
        success: false,
        message: 'La requête ne peut pas être vide.',
      })
      return
    }

    setIsLoading(true)
    setResponse(null)

    try {
      const apiResponse = await fetch(`${API_BASE_URL}/dsl/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: normalizedQuery,
        }),
      })

      const json = (await apiResponse.json()) as MongoDslResult

      if (!apiResponse.ok) {
        setResponse({
          success: false,
          message: json.message ?? `Erreur HTTP ${apiResponse.status}`,
        })
        return
      }

      setResponse(json)
    } catch (error) {
      setResponse({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Impossible de contacter le serveur.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main
      className="min-h-screen px-6 py-10"
      style={{
        background: 'var(--color-bg)',
        color: 'var(--color-text)',
      }}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <p
              className="mb-2 text-xs font-bold uppercase tracking-[0.18em]"
              style={{ color: 'var(--color-primary)' }}
            >
              Outil développeur
            </p>

            <h1 className="text-3xl font-bold">
              Langage Mongo DSL
            </h1>

            <p
              className="mt-3 max-w-3xl leading-7"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Cette interface permet d’exécuter le langage
              d’interrogation maison de Connected Neighbours et de
              visualiser l’AST ainsi que les documents MongoDB retournés.
            </p>
          </div>

          <span
            className="w-fit rounded-full px-4 py-2 text-xs font-bold"
            style={{
              background: 'var(--color-primary-soft)',
              color: 'var(--color-primary)',
            }}
          >
            MongoDB DSL
          </span>
        </header>

        <section
          className="rounded-2xl p-6"
          style={{
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
          }}
        >
          <h2 className="text-lg font-bold">
            Syntaxe du langage
          </h2>

          <pre
            className="mt-4 overflow-x-auto rounded-xl p-4 text-sm"
            style={{
              background: '#111827',
              color: '#e5e7eb',
            }}
          >
            {'FIND <collection> WHERE <champ> = "<valeur>"'}
          </pre>

          <p
            className="mt-3 text-sm"
            style={{ color: 'var(--color-text-muted)' }}
          >
            La requête est analysée, transformée en AST, puis convertie
            en requête MongoDB.
          </p>
        </section>

        <section
          className="rounded-2xl p-6"
          style={{
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
          }}
        >
          <form onSubmit={executeQuery}>
            <label
              htmlFor="mongo-dsl-query"
              className="mb-3 block text-sm font-bold"
            >
              Requête DSL
            </label>

            <textarea
              id="mongo-dsl-query"
              rows={5}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              spellCheck={false}
              className="w-full resize-y rounded-xl p-4 font-mono text-sm outline-none"
              style={{
                background: '#111827',
                border: '1px solid #374151',
                color: '#f9fafb',
              }}
            />

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className="button"
              >
                {isLoading
                  ? 'Exécution en cours…'
                  : 'Exécuter la requête'}
              </button>

              <button
                type="button"
                className="button button--secondary"
                onClick={() => {
                  setQuery('')
                  setResponse(null)
                }}
              >
                Effacer
              </button>
            </div>
          </form>
        </section>

        <section
          className="rounded-2xl p-6"
          style={{
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
          }}
        >
          <h2 className="text-lg font-bold">
            Exemples
          </h2>

          <div className="mt-4 flex flex-col gap-3">
            {examples.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setQuery(example)}
                className="rounded-xl p-4 text-left font-mono text-sm transition-opacity hover:opacity-80"
                style={{
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                }}
              >
                {example}
              </button>
            ))}
          </div>
        </section>

        {response && (
          <section
            className="rounded-2xl p-6"
            style={{
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-bold">
                Résultat
              </h2>

              <span
                className="rounded-full px-3 py-1 text-xs font-bold"
                style={{
                  background: response.success
                    ? 'rgba(34,197,94,0.14)'
                    : 'rgba(239,68,68,0.14)',
                  color: response.success
                    ? '#15803d'
                    : '#b91c1c',
                }}
              >
                {response.success ? 'Succès' : 'Erreur'}
              </span>
            </div>

            {!response.success && (
              <div
                className="mt-5 rounded-xl p-4 text-sm"
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  color: '#b91c1c',
                }}
              >
                {response.message ?? 'Une erreur est survenue.'}
              </div>
            )}

            {response.success && response.data && (
              <>
                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  <StatCard
                    label="Action"
                    value={response.data.ast.action}
                  />

                  <StatCard
                    label="Collection"
                    value={response.data.ast.collection}
                  />

                  <StatCard
                    label="Documents"
                    value={String(response.data.count)}
                  />
                </div>

                <h3 className="mb-3 mt-7 font-bold">
                  AST généré
                </h3>

                <JsonBlock value={response.data.ast} />

                <h3 className="mb-3 mt-7 font-bold">
                  Documents MongoDB
                </h3>

                {response.data.results.length === 0 ? (
                  <p
                    className="rounded-xl p-4 text-sm"
                    style={{
                      background: 'var(--color-bg)',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    Aucun document trouvé.
                  </p>
                ) : (
                  <JsonBlock value={response.data.results} />
                )}
              </>
            )}
          </section>
        )}
      </div>
    </main>
  )
}

function StatCard({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
      }}
    >
      <span
        className="block text-xs font-bold uppercase tracking-wide"
        style={{ color: 'var(--color-text-muted)' }}
      >
        {label}
      </span>

      <strong className="mt-2 block">
        {value}
      </strong>
    </div>
  )
}

function JsonBlock({
  value,
}: {
  value: unknown
}) {
  return (
    <pre
      className="max-h-[520px] overflow-auto rounded-xl p-5 text-sm leading-6"
      style={{
        background: '#111827',
        color: '#dbeafe',
      }}
    >
      {JSON.stringify(value, null, 2)}
    </pre>
  )
}
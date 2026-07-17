import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/shared/context/AuthContext'
import { AppLayout } from '@/shared/layout/AppLayout'
import {
  documentsApi,
  usersApi,
  resolveMediaUrl,
  type AppDocument,
  type DocSignatory,
  type DocPerson,
  type NeighborSummary,
  type DocumentVerification,
} from '@/shared/lib/api'

const STATUS_LABEL: Record<AppDocument['status'], string> = {
  draft: 'Brouillon',
  pending_signatures: 'En attente de signatures',
  signed: 'Signé',
  archived: 'Archivé',
}

function personName(p: DocPerson | string): string {
  return typeof p === 'string' ? p : `${p.firstName} ${p.lastName}`
}
function personId(p: DocPerson | string): string {
  return typeof p === 'string' ? p : p._id
}

const cardStyle = { background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-strong)' }
const inputStyle = { background: 'rgba(0,0,0,0.05)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }

export function DocumentsPage() {
  const { accessToken, user } = useAuth()
  const [docs, setDocs] = useState<AppDocument[]>([])
  const [neighbors, setNeighbors] = useState<NeighborSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const [sendFor, setSendFor] = useState<string | null>(null)
  const [selectedSigners, setSelectedSigners] = useState<string[]>([])

  const [signFor, setSignFor] = useState<string | null>(null)
  const [signName, setSignName] = useState('')
  const [signCode, setSignCode] = useState('')

  const [verifications, setVerifications] = useState<Record<string, DocumentVerification>>({})

  const reload = useCallback(async () => {
    if (!accessToken) return
    setLoading(true)
    setErrorMsg(null)
    try {
      const [d, n] = await Promise.all([
        documentsApi.list(accessToken),
        usersApi.listNeighbors(accessToken),
      ])
      setDocs(d)
      setNeighbors(n)
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    void reload()
  }, [reload])

  const handleUpload = async () => {
    if (!accessToken || !uploadFile) return
    setUploading(true)
    try {
      await documentsApi.upload(accessToken, uploadFile, uploadTitle || uploadFile.name)
      setUploadFile(null)
      setUploadTitle('')
      await reload()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setUploading(false)
    }
  }

  const handleSend = async (docId: string) => {
    if (!accessToken || selectedSigners.length === 0) return
    try {
      // Zones auto-placées (une par signataire, empilées) pour le tamponnage.
      const zones = selectedSigners.map((id, i) => ({
        signerId: id,
        page: 0,
        x: 0.1,
        y: 0.68 + i * 0.08,
        width: 0.35,
        height: 0.06,
        type: 'signature',
      }))
      await documentsApi.setZones(accessToken, docId, zones)
      await documentsApi.send(
        accessToken,
        docId,
        selectedSigners.map((id, i) => ({ userId: id, order: i + 1 })),
      )
      setSendFor(null)
      setSelectedSigners([])
      await reload()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erreur')
    }
  }

  const handleSign = async (docId: string) => {
    if (!accessToken) return
    try {
      await documentsApi.sign(accessToken, docId, signName, signCode)
      setSignFor(null)
      setSignName('')
      setSignCode('')
      await reload()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erreur')
    }
  }

  const handleVerify = async (docId: string) => {
    if (!accessToken) return
    try {
      const v = await documentsApi.verify(accessToken, docId)
      setVerifications((p) => ({ ...p, [docId]: v }))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erreur')
    }
  }

  const isImporter = (doc: AppDocument) => personId(doc.importerId) === user?._id
  const isMyTurn = (doc: AppDocument) => {
    const next = [...doc.signatories].filter((s) => !s.signedAt).sort((a, b) => a.order - b.order)[0]
    return next ? personId(next.userId) === user?._id : false
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>📄 Documents & signatures</h1>

        {/* Upload */}
        <div className="rounded-3xl p-6 flex flex-col gap-3" style={cardStyle}>
          <span className="eyebrow">Importer un PDF</span>
          <input
            type="text"
            placeholder="Titre du document"
            value={uploadTitle}
            onChange={(e) => setUploadTitle(e.target.value)}
            className="h-11 px-4 rounded-xl outline-none"
            style={inputStyle}
          />
          <label
            className="flex flex-col items-center justify-center gap-1 rounded-2xl cursor-pointer text-center transition-colors"
            style={{
              border: '2px dashed var(--color-primary)',
              background: 'var(--color-primary-soft)',
              padding: '24px 16px',
            }}
          >
            <span style={{ fontSize: 30 }}>📄</span>
            <span style={{ fontWeight: 700, color: 'var(--color-primary-strong)' }}>
              {uploadFile ? uploadFile.name : 'Cliquez pour choisir un fichier PDF'}
            </span>
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {uploadFile ? 'Cliquez pour changer' : 'Format PDF · 20 Mo max'}
            </span>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
              style={{ display: 'none' }}
            />
          </label>
          <button className="button self-start" disabled={!uploadFile || uploading} onClick={() => void handleUpload()}>
            {uploading ? 'Import…' : '⬆️ Importer le document'}
          </button>
        </div>

        {errorMsg && <p style={{ color: '#c0392b' }}>{errorMsg}</p>}

        {loading ? (
          <p style={{ color: 'var(--color-text-muted)' }}>Chargement…</p>
        ) : docs.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>Aucun document pour le moment.</p>
        ) : (
          docs.map((doc) => {
            const v = verifications[doc._id]
            return (
              <div key={doc._id} className="rounded-3xl p-6 flex flex-col gap-3" style={cardStyle}>
                <div className="flex items-center justify-between gap-3">
                  <strong style={{ color: 'var(--color-text)' }}>{doc.title}</strong>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'var(--color-secondary-soft)', color: '#6d28d9' }}>
                    {STATUS_LABEL[doc.status]}
                  </span>
                </div>

                {/* Signataires */}
                {doc.signatories.length > 0 && (
                  <ul className="m-0 p-0 flex flex-col gap-1" style={{ listStyle: 'none' }}>
                    {[...doc.signatories].sort((a, b) => a.order - b.order).map((s: DocSignatory, i) => (
                      <li key={i} className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                        {s.signedAt ? '✅' : '⏳'} {personName(s.userId)}
                        {s.signedAt ? ` — signé le ${new Date(s.signedAt).toLocaleDateString()}` : ''}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Liens fichiers */}
                <div className="flex flex-wrap gap-3 text-sm">
                  <a href={resolveMediaUrl(doc.fileUrl)} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)' }}>
                    👁️ Voir le document
                  </a>
                  {doc.signedFileUrl && (
                    <a href={resolveMediaUrl(doc.signedFileUrl)} target="_blank" rel="noreferrer" style={{ color: '#15803d' }}>
                      ⬇️ PDF signé
                    </a>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {doc.status === 'draft' && isImporter(doc) && (
                    <button className="button button--secondary" onClick={() => { setSendFor(sendFor === doc._id ? null : doc._id); setSelectedSigners([]) }}>
                      Envoyer pour signature
                    </button>
                  )}
                  {doc.status === 'pending_signatures' && isMyTurn(doc) && (
                    <button className="button" onClick={() => { setSignFor(signFor === doc._id ? null : doc._id); setSignName(''); setSignCode('') }}>
                      ✍️ Signer
                    </button>
                  )}
                  <button className="button button--ghost" onClick={() => void handleVerify(doc._id)}>
                    🔒 Vérifier l'intégrité
                  </button>
                </div>

                {/* Verification result */}
                {v && (
                  <p className="text-sm m-0" style={{ color: v.integrity === 'ok' ? '#15803d' : '#c0392b' }}>
                    {v.integrity === 'ok' ? '✅ Intègre (hash vérifié)' : v.integrity === 'altered' ? '⚠️ Document altéré !' : '❓ Fichier introuvable'}
                  </p>
                )}

                {/* Send form */}
                {sendFor === doc._id && (
                  <div className="rounded-2xl p-4 flex flex-col gap-2" style={{ background: 'rgba(0,0,0,0.04)' }}>
                    <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Sélectionnez les signataires (dans l'ordre) :</span>
                    {neighbors.map((n) => {
                      const checked = selectedSigners.includes(n._id)
                      return (
                        <label key={n._id} className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setSelectedSigners((prev) => (checked ? prev.filter((id) => id !== n._id) : [...prev, n._id]))
                            }
                          />
                          {checked ? `${selectedSigners.indexOf(n._id) + 1}. ` : ''}{n.firstName} {n.lastName}
                        </label>
                      )
                    })}
                    <button className="button self-start" disabled={selectedSigners.length === 0} onClick={() => void handleSend(doc._id)}>
                      Envoyer
                    </button>
                  </div>
                )}

                {/* Sign form */}
                {signFor === doc._id && (
                  <div className="rounded-2xl p-4 flex flex-col gap-2" style={{ background: 'rgba(0,0,0,0.04)' }}>
                    <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      Signez en tapant votre nom complet, puis le code de votre application d'authentification (2FA requise).
                    </span>
                    <input className="h-11 px-4 rounded-xl outline-none" style={inputStyle} placeholder="Votre nom complet" value={signName} onChange={(e) => setSignName(e.target.value)} />
                    <input className="h-11 px-4 rounded-xl outline-none tracking-[0.3em]" style={inputStyle} placeholder="Code 2FA" inputMode="numeric" value={signCode} onChange={(e) => setSignCode(e.target.value)} />
                    <button className="button self-start" disabled={!signName || !signCode} onClick={() => void handleSign(doc._id)}>
                      Confirmer la signature
                    </button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </AppLayout>
  )
}

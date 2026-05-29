import { useState, useEffect } from 'react'
import { MapContainer, Polygon, TileLayer } from 'react-leaflet'
import { useAuth } from '@/shared/context/AuthContext'
import { usersApi, type UserProfile, type UpdateProfilePayload } from '@/shared/lib/api'
import { AppLayout } from '@/shared/layout/AppLayout'

const ROLE_LABELS: Record<string, string> = {
  resident: '🏠 Résident',
  moderator: '🛡️ Modérateur',
  admin: '⚙️ Administrateur',
}

export function ProfilePage() {
  const { accessToken } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState<UpdateProfilePayload>({})
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    if (!accessToken) return
    usersApi.getMe(accessToken)
      .then((data) => {
        setProfile(data)
        setForm({ firstName: data.firstName, lastName: data.lastName, phone: data.phone, address: data.address })
      })
      .catch((err) => setFetchError(err instanceof Error ? err.message : 'Erreur lors du chargement'))
      .finally(() => setIsLoading(false))
  }, [accessToken])

  const handleSave = async () => {
    if (!accessToken) return
    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(false)
    try {
      const updated = await usersApi.updateMe(accessToken, form)
      setProfile(updated)
      setIsEditing(false)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  const inputStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text)',
  }

  if (isLoading) return (
    <AppLayout>
      <div className="text-center py-20" style={{ color: 'var(--color-text-muted)' }}>Chargement...</div>
    </AppLayout>
  )

  if (fetchError) return (
    <AppLayout>
      <div className="text-center py-20" style={{ color: '#ffb4b4' }}>{fetchError}</div>
    </AppLayout>
  )

  if (!profile) return null

  const neighborhood = profile.neighborhoodId
  const polygonCoords = neighborhood?.polygon?.coordinates?.[0]?.map(
    ([lng, lat]) => [lat, lng] as [number, number]
  )
  const mapCenter: [number, number] = polygonCoords
    ? [
        polygonCoords.reduce((s, [lat]) => s + lat, 0) / polygonCoords.length,
        polygonCoords.reduce((s, [, lng]) => s + lng, 0) / polygonCoords.length,
      ]
    : [48.8578, 2.3812]

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Mon profil</h1>

        {/* Profile card */}
        <div className="rounded-3xl p-8 flex flex-col gap-6" style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-strong)' }}>

          {/* Avatar + name + role */}
          <div className="flex items-center gap-5">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--color-primary), #8f95ff)', color: '#05111e' }}
            >
              {profile.firstName[0]}{profile.lastName[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold m-0" style={{ color: 'var(--color-text)' }}>
                {profile.firstName} {profile.lastName}
              </h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  {ROLE_LABELS[profile.role] ?? profile.role}
                </span>
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ background: 'var(--color-secondary-soft)', color: '#c8b7ff' }}
                >
                  {profile.points} pts
                </span>
              </div>
            </div>
            <button
              className={`button ml-auto ${isEditing ? 'button--secondary' : ''}`}
              style={{ minHeight: '38px' }}
              onClick={() => { setIsEditing(!isEditing); setSaveError(null) }}
            >
              {isEditing ? 'Annuler' : '✏️ Modifier'}
            </button>
          </div>

          {saveSuccess && (
            <div className="px-4 py-3 rounded-xl text-sm" style={{ background: 'var(--color-success-soft)', color: '#93f0c0' }}>
              Profil mis à jour avec succès !
            </div>
          )}
          {saveError && (
            <div className="px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(255,80,80,0.1)', color: '#ffb4b4' }}>
              {saveError}
            </div>
          )}

          {/* Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: 'firstName', label: 'Prénom', value: profile.firstName },
              { key: 'lastName', label: 'Nom', value: profile.lastName },
              { key: 'email', label: 'Email', value: profile.email, readonly: true },
              { key: 'phone', label: 'Téléphone', value: profile.phone },
            ].map(({ key, label, value, readonly }) => (
              <div key={key} className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
                  {label}
                </label>
                {isEditing && !readonly ? (
                  <input
                    type="text"
                    value={form[key as keyof UpdateProfilePayload] ?? value}
                    onChange={(e) => setForm(p => ({ ...p, [key]: e.target.value }))}
                    className="h-11 px-4 rounded-xl outline-none"
                    style={inputStyle}
                  />
                ) : (
                  <p className="m-0 font-medium" style={{ color: readonly ? 'var(--color-text-muted)' : 'var(--color-text)' }}>
                    {value}
                  </p>
                )}
              </div>
            ))}

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
                Adresse
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={form.address ?? profile.address}
                  onChange={(e) => setForm(p => ({ ...p, address: e.target.value }))}
                  className="h-11 px-4 rounded-xl outline-none"
                  style={inputStyle}
                />
              ) : (
                <p className="m-0 font-medium" style={{ color: 'var(--color-text)' }}>{profile.address}</p>
              )}
            </div>
          </div>

          {isEditing && (
            <button className="button" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Enregistrement...' : '💾 Enregistrer'}
            </button>
          )}
        </div>

        {/* Neighborhood card */}
        {neighborhood && (
          <div className="rounded-3xl p-6 flex flex-col gap-4" style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-strong)' }}>
            <div className="flex items-center gap-3">
              <span className="eyebrow">Mon quartier</span>
              <h2 className="text-lg font-bold m-0 ml-1" style={{ color: 'var(--color-text)' }}>
                {neighborhood.name}
              </h2>
            </div>
            {neighborhood.description && (
              <p className="m-0 text-sm" style={{ color: 'var(--color-text-muted)' }}>{neighborhood.description}</p>
            )}
            {polygonCoords && (
              <MapContainer
                center={mapCenter}
                zoom={14}
                scrollWheelZoom={false}
                dragging={false}
                doubleClickZoom={false}
                touchZoom={false}
                zoomControl={false}
                attributionControl={false}
                style={{ height: 240, borderRadius: 16, border: '1px solid var(--color-border)' }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Polygon
                  positions={polygonCoords}
                  pathOptions={{ color: '#7eb0ff', weight: 3, fillColor: '#4e89ff', fillOpacity: 0.25 }}
                />
              </MapContainer>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

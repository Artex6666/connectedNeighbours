import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/shared/context/AuthContext'
import {
  neighborhoodsApi,
  usersApi,
  type AdminUser,
  type AuthUser,
  type Neighborhood,
} from '@/shared/lib/api'

type RoleFilter = 'all' | AuthUser['role']

export function UsersPage() {
  const { t } = useTranslation()
  const { accessToken, user: currentUser } = useAuth()

  const [users, setUsers] = useState<AdminUser[]>([])
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [search, setSearch] = useState('')

  const reload = useCallback(async () => {
    if (!accessToken) return
    setLoading(true)
    setErrorMsg(null)
    try {
      const [u, n] = await Promise.all([
        usersApi.adminList(accessToken),
        neighborhoodsApi.list(accessToken),
      ])
      setUsers(u)
      setNeighborhoods(n)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    void reload()
  }, [reload])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false
      if (!q) return true
      const hay = `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase()
      return hay.includes(q)
    })
  }, [users, roleFilter, search])

  const neighborhoodName = (id?: string | { _id: string; name: string }) => {
    if (!id) return '—'
    if (typeof id !== 'string') return id.name ?? '—'
    return neighborhoods.find((n) => n._id === id)?.name ?? id
  }

  const handleRoleChange = async (id: string, role: AuthUser['role']) => {
    if (!accessToken) return
    try {
      await usersApi.adminUpdateRole(accessToken, id, role)
      await reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur')
    }
  }

  const handleNeighborhoodChange = async (id: string, neighborhoodId: string) => {
    if (!accessToken) return
    try {
      await usersApi.adminUpdateNeighborhood(accessToken, id, neighborhoodId || null)
      await reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur')
    }
  }

  const handleDelete = async (id: string) => {
    if (!accessToken) return
    if (!confirm(t('admin.users.confirmDelete'))) return
    try {
      await usersApi.adminDelete(accessToken, id)
      await reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur')
    }
  }

  const handleToggleBlock = async (u: AdminUser) => {
    if (!accessToken) return
    const next = !u.isBlocked
    if (next && !confirm(t('admin.users.confirmBlock', 'Bloquer ce compte ? Ses sessions seront révoquées.'))) return
    try {
      await usersApi.adminSetBlocked(accessToken, u._id, next)
      await reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur')
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <h1>{t('admin.users.title')}</h1>
        <p>{t('admin.users.subtitle')}</p>
      </header>

      <div className="admin-filters">
        <input
          type="search"
          placeholder={t('admin.users.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="admin-filter-input"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
          className="admin-filter-input"
        >
          <option value="all">{t('admin.users.filterAllRoles')}</option>
          <option value="resident">{t('profile.roles.resident')}</option>
          <option value="moderator">{t('profile.roles.moderator')}</option>
          <option value="admin">{t('profile.roles.admin')}</option>
        </select>
        <span className="admin-count">
          {t('admin.users.count', { count: filtered.length })}
        </span>
      </div>

      {errorMsg ? <p className="admin-error">{errorMsg}</p> : null}

      {loading ? (
        <p className="admin-empty">{t('common.loading')}</p>
      ) : filtered.length === 0 ? (
        <p className="admin-empty">{t('admin.users.empty')}</p>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('admin.users.col.name')}</th>
                <th>{t('admin.users.col.email')}</th>
                <th>{t('admin.users.col.role')}</th>
                <th>{t('admin.users.col.neighborhood')}</th>
                <th>{t('admin.users.col.points')}</th>
                <th>{t('admin.users.col.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const isSelf = currentUser?._id === u._id
                const currentNeighborhood =
                  typeof u.neighborhoodId === 'string'
                    ? u.neighborhoodId
                    : u.neighborhoodId?._id ?? ''
                return (
                  <tr key={u._id}>
                    <td>
                      <strong>
                        {u.firstName} {u.lastName}
                      </strong>
                      {u.isVerified ? (
                        <span className="admin-badge admin-badge--ok">✓</span>
                      ) : null}
                      {u.isBlocked ? (
                        <span className="admin-badge" style={{ background: 'rgba(255,80,80,0.18)', color: '#ffb4b4' }}>
                          {t('admin.users.blocked', 'Bloqué')}
                        </span>
                      ) : null}
                    </td>
                    <td className="admin-cell-muted">{u.email}</td>
                    <td>
                      <select
                        value={u.role}
                        onChange={(e) =>
                          void handleRoleChange(u._id, e.target.value as AuthUser['role'])
                        }
                        disabled={isSelf}
                        title={isSelf ? t('admin.users.cannotEditSelf') : ''}
                      >
                        <option value="resident">{t('profile.roles.resident')}</option>
                        <option value="moderator">{t('profile.roles.moderator')}</option>
                        <option value="admin">{t('profile.roles.admin')}</option>
                      </select>
                    </td>
                    <td>
                      <select
                        value={currentNeighborhood}
                        onChange={(e) => void handleNeighborhoodChange(u._id, e.target.value)}
                      >
                        <option value="">{t('admin.users.noNeighborhood')}</option>
                        {neighborhoods.map((n) => (
                          <option key={n._id} value={n._id}>
                            {n.name}
                          </option>
                        ))}
                        {currentNeighborhood &&
                        !neighborhoods.find((n) => n._id === currentNeighborhood) ? (
                          <option value={currentNeighborhood}>
                            {neighborhoodName(u.neighborhoodId)}
                          </option>
                        ) : null}
                      </select>
                    </td>
                    <td>{u.points}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          className="button button--ghost admin-row-action"
                          onClick={() => void handleToggleBlock(u)}
                          disabled={isSelf}
                          title={isSelf ? t('admin.users.cannotEditSelf') : t('admin.users.block', 'Bloquer / débloquer')}
                        >
                          {u.isBlocked ? '🔓' : '🚫'}
                        </button>
                        <button
                          type="button"
                          className="button button--ghost admin-row-action"
                          onClick={() => void handleDelete(u._id)}
                          disabled={isSelf}
                          title={isSelf ? t('admin.users.cannotEditSelf') : ''}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

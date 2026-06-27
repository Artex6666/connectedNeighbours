type RoleConfig = { label: string; color: string; bg: string }

const ROLE_CONFIG: Record<string, RoleConfig> = {
  resident: { label: 'Membre', color: '#15803d', bg: 'rgba(34,197,94,0.16)' },
  moderator: { label: 'Modérateur', color: '#b45309', bg: 'rgba(234,179,8,0.20)' },
  admin: { label: 'Admin', color: '#dc2626', bg: 'rgba(239,68,68,0.16)' },
}

/** Coloured role tag shown next to a username (Membre/Modérateur/Admin). */
export function RoleBadge({ role, className }: { role?: string; className?: string }) {
  const cfg = ROLE_CONFIG[role ?? 'resident'] ?? ROLE_CONFIG.resident
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: 10.5,
        fontWeight: 800,
        lineHeight: 1,
        padding: '3px 7px',
        borderRadius: 999,
        color: cfg.color,
        background: cfg.bg,
        whiteSpace: 'nowrap',
      }}
    >
      {cfg.label}
    </span>
  )
}

/** Username followed by its coloured role tag. */
export function UserName({ name, role }: { name: string; role?: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span>{name}</span>
      <RoleBadge role={role} />
    </span>
  )
}

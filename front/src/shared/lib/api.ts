import { apiBaseUrl } from '@/shared/config/env'

// Static uploaded files (chat attachments) live outside the /api/v1 prefix.
// Strip it to get the bare server origin used to resolve media URLs.
const serverBaseUrl = apiBaseUrl.replace(/\/api\/v\d+\/?$/, '')

export function resolveMediaUrl(content: string): string {
  if (/^(https?:|data:|blob:)/.test(content)) return content
  if (content.startsWith('/')) return `${serverBaseUrl}${content}`
  return content
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type AuthUser = {
  _id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  address?: string
  role: 'resident' | 'moderator' | 'admin'
}

export type AuthSession = {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

export type AuthFormPayload = {
  fullName: string
  email: string
  password: string
  phone: string
  address: string
}

export type ConversationSummary = {
  userId: string
  name: string
  role: string
  avatar: string
  isOnline?: boolean
  lastMessage: string
  lastTimestamp: string
}

export type ConversationMessage = {
  _id: string
  senderId: string
  receiverId: string
  content: string
  type: 'text' | 'audio' | 'photo'
  createdAt: string
  updatedAt: string
}

export type ConversationDetails = {
  participant: {
    userId: string
    name: string
    role: string
    avatar: string
    isOnline?: boolean
  }
  messages: ConversationMessage[]
}

type ApiSuccessResponse<T> = { success: true; data: T }
type ApiErrorResponse = { success: false; message?: string }

// ─── Core request ─────────────────────────────────────────────────────────────

async function apiRequest<T>(path: string, init?: RequestInit, token?: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  })

  const payload = (await response.json()) as ApiSuccessResponse<T> | ApiErrorResponse

  if (!response.ok || !('success' in payload) || !payload.success) {
    throw new Error(
      'message' in payload && payload.message ? payload.message : 'An API error occurred.',
    )
  }

  return payload.data
}

// For legacy endpoints (incidents/alertes/stats) that return raw JSON without
// the `{success, data}` envelope.
async function apiRaw<T>(path: string, init?: RequestInit, token?: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'message' in payload
        ? String((payload as { message?: unknown }).message ?? 'An API error occurred.')
        : 'An API error occurred.'
    throw new Error(message)
  }

  return payload as T
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function splitFullName(fullName: string) {
  const trimmed = fullName.trim()
  if (!trimmed) return { firstName: '', lastName: '' }
  const parts = trimmed.split(/\s+/)
  const [firstName, ...rest] = parts
  return { firstName, lastName: rest.join(' ') || firstName }
}

// ─── Auth API ─────────────────────────────────────────────────────────────────

export type LoginResult = AuthSession | { mfaRequired: true }

export const authApi = {
  async login(email: string, password: string, totpCode?: string): Promise<LoginResult> {
    return apiRequest<LoginResult>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, totpCode }),
    })
  },

  async register(payload: AuthFormPayload): Promise<AuthUser> {
    const { firstName, lastName } = splitFullName(payload.fullName)
    return apiRequest<AuthUser>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        firstName,
        lastName,
        email: payload.email,
        password: payload.password,
        phone: payload.phone,
        address: payload.address,
      }),
    })
  },

  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    return apiRequest<{ accessToken: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    })
  },

  async logout(refreshToken: string): Promise<void> {
    return apiRequest('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    })
  },

  async verifyEmail(email: string, code: string): Promise<{ message: string }> {
    return apiRequest('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    })
  },

  async resendVerification(email: string): Promise<{ message: string }> {
    return apiRequest('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  },

  async setupMfa(token: string): Promise<{ qrCode: string; secret: string }> {
    return apiRequest('/auth/mfa/setup', { method: 'POST' }, token)
  },
  async confirmMfa(token: string, totpCode: string): Promise<{ message: string; isMfaEnabled: boolean }> {
    return apiRequest('/auth/mfa/verify', { method: 'POST', body: JSON.stringify({ totpCode }) }, token)
  },
  async disableMfa(token: string, totpCode: string): Promise<{ message: string; isMfaEnabled: boolean }> {
    return apiRequest('/auth/mfa/disable', { method: 'POST', body: JSON.stringify({ totpCode }) }, token)
  },
}

// ─── Public showcase API (no auth) ──────────────────────────────────────────────

export type PublicStats = { neighborhoods: number; residents: number; services: number; events: number; votes: number }
export type PublicNeighborhood = {
  _id: string
  name: string
  description: string
  polygon: { type: 'Polygon'; coordinates: number[][][] }
}
export type PublicService = {
  _id: string
  title: string
  description: string
  category: string
  isPaid: boolean
  points: number
  status: string
  authorFirstName: string | null
  authorRole: string | null
  neighborhoodName: string | null
  createdAt: string
}
export type PublicVote = {
  _id: string
  question: string
  type: string
  options: { label: string; votes: number }[]
  totalVoters: number
  closed: boolean
  authorFirstName: string | null
  authorRole: string | null
  neighborhoodName: string | null
}
export type PublicEvent = {
  _id: string
  title: string
  description: string
  date: string
  location: string
  participantCount: number
  maxParticipants: number
  neighborhoodName: string | null
}

export const publicApi = {
  async stats() {
    return apiRequest<PublicStats>('/public/stats')
  },
  async neighborhoods() {
    return apiRequest<PublicNeighborhood[]>('/public/neighborhoods')
  },
  async services() {
    return apiRequest<PublicService[]>('/public/services')
  },
  async votes() {
    return apiRequest<PublicVote[]>('/public/votes')
  },
  async events() {
    return apiRequest<PublicEvent[]>('/public/events')
  },
}

// ─── Users API ───────────────────────────────────────────────────────────────

export type EmailPreferences = {
  messages: boolean
  annonces: boolean
  events: boolean
  newsletter: boolean
}

export type UserProfile = AuthUser & {
  phone: string
  address: string
  points: number
  isVerified: boolean
  isBlocked?: boolean
  isMfaEnabled?: boolean
  emailPreferences?: EmailPreferences
  neighborhoodId?: {
    _id: string
    name: string
    description: string
    polygon: { type: 'Polygon'; coordinates: number[][][] }
  }
}

export type UpdateProfilePayload = {
  firstName?: string
  lastName?: string
  phone?: string
  address?: string
  password?: string
}

export type AdminUser = UserProfile

export const usersApi = {
  async getMe(token: string) {
    return apiRequest<UserProfile>('/users/me', undefined, token)
  },
  async updateMe(token: string, payload: UpdateProfilePayload) {
    return apiRequest<UserProfile>('/users/me', { method: 'PUT', body: JSON.stringify(payload) }, token)
  },
  async adminList(token: string) {
    return apiRequest<AdminUser[]>('/users', undefined, token)
  },
  async adminUpdateRole(token: string, id: string, role: AuthUser['role']) {
    return apiRequest<AdminUser>(
      `/users/${id}/role`,
      { method: 'PUT', body: JSON.stringify({ role }) },
      token,
    )
  },
  async adminUpdateNeighborhood(token: string, id: string, neighborhoodId: string | null) {
    return apiRequest<AdminUser>(
      `/users/${id}/neighborhood`,
      { method: 'PUT', body: JSON.stringify({ neighborhoodId }) },
      token,
    )
  },
  async adminDelete(token: string, id: string) {
    return apiRequest<{ message: string }>(`/users/${id}`, { method: 'DELETE' }, token)
  },
  async adminSetBlocked(token: string, id: string, blocked: boolean) {
    return apiRequest<AdminUser>(
      `/users/${id}/block`,
      { method: 'PUT', body: JSON.stringify({ blocked }) },
      token,
    )
  },
  async listNeighbors(token: string) {
    return apiRequest<NeighborSummary[]>('/users/neighbors', undefined, token)
  },
  async updatePreferences(token: string, prefs: Partial<EmailPreferences>) {
    return apiRequest<EmailPreferences>(
      '/users/me/preferences',
      { method: 'PUT', body: JSON.stringify(prefs) },
      token,
    )
  },
  async heartbeat(token: string) {
    return apiRequest<{ ok: boolean }>('/users/heartbeat', { method: 'POST' }, token)
  },
  async exportMyData(token: string, format: 'json' | 'csv'): Promise<Blob> {
    const response = await fetch(`${apiBaseUrl}/users/me/export?format=${format}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) throw new Error("L'export a échoué.")
    return response.blob()
  },
  async deleteMyAccount(token: string) {
    return apiRequest<{ message: string }>('/users/me', { method: 'DELETE' }, token)
  },
}

export type NeighborSummary = {
  _id: string
  firstName: string
  lastName: string
  role: AuthUser['role']
  neighborhoodId?: string
  isOnline?: boolean
  lastSeenAt?: string
}

// ─── Services API ────────────────────────────────────────────────────────────

export type ServiceCategory = 'bricolage' | 'jardinage' | 'garde_animaux' | 'cours_particuliers' | 'demenagement' | 'autre'
export type ServiceStatus = 'open' | 'pending' | 'in_progress' | 'done' | 'cancelled'

export type Service = {
  _id: string
  title: string
  description: string
  category: ServiceCategory
  isPaid: boolean
  points: number
  authorId: { _id: string; firstName: string; lastName: string; role: string; points: number }
  neighborhoodId: string
  status: ServiceStatus
  photos: string[]
  createdAt: string
  updatedAt: string
}

export type CreateServicePayload = {
  title: string
  description: string
  category: ServiceCategory
  isPaid: boolean
  points?: number
}

export const servicesApi = {
  async list(
    token: string,
    filters?: {
      category?: ServiceCategory
      status?: ServiceStatus
      isPaid?: boolean
      all?: boolean
    },
  ) {
    const params = new URLSearchParams()
    if (filters?.category) params.set('category', filters.category)
    if (filters?.status) params.set('status', filters.status)
    if (filters?.isPaid !== undefined) params.set('isPaid', String(filters.isPaid))
    if (filters?.all) params.set('all', 'true')
    const query = params.toString() ? `?${params.toString()}` : ''
    return apiRequest<Service[]>(`/services${query}`, undefined, token)
  },

  async get(token: string, id: string) {
    return apiRequest<Service>(`/services/${id}`, undefined, token)
  },

  async create(token: string, payload: CreateServicePayload) {
    return apiRequest<Service>('/services', { method: 'POST', body: JSON.stringify(payload) }, token)
  },

  async update(token: string, id: string, payload: Partial<CreateServicePayload>) {
    return apiRequest<Service>(`/services/${id}`, { method: 'PUT', body: JSON.stringify(payload) }, token)
  },

  async delete(token: string, id: string) {
    return apiRequest(`/services/${id}`, { method: 'DELETE' }, token)
  },

  async accept(token: string, id: string) {
    return apiRequest<Service>(`/services/${id}/accept`, { method: 'POST' }, token)
  },

  async complete(token: string, id: string) {
    return apiRequest<Service>(`/services/${id}/complete`, { method: 'POST' }, token)
  },

  async mine(token: string) {
    return apiRequest<{ posted: Service[]; accepted: Service[] }>('/services/mine', undefined, token)
  },
}

// ─── Events API ───────────────────────────────────────────────────────────────

export type EventParticipant = {
  _id: string
  firstName: string
  lastName: string
  role: string
}

export type Event = {
  _id: string
  title: string
  description: string
  date: string
  location: string
  maxParticipants: number
  organizerId: EventParticipant
  neighborhoodId: string
  participants: EventParticipant[]
  waitingList: EventParticipant[]
  isCancelled: boolean
  createdAt: string
  updatedAt: string
}

export type CreateEventPayload = {
  title: string
  description: string
  date: string
  location: string
  maxParticipants: number
}

export const eventsApi = {
  async list(token: string, filters?: { all?: boolean; includeCancelled?: boolean }) {
    const params = new URLSearchParams()
    if (filters?.all) params.set('all', 'true')
    if (filters?.includeCancelled) params.set('includeCancelled', 'true')
    const query = params.toString() ? `?${params.toString()}` : ''
    return apiRequest<Event[]>(`/events${query}`, undefined, token)
  },

  async get(token: string, id: string) {
    return apiRequest<Event>(`/events/${id}`, undefined, token)
  },

  async create(token: string, payload: CreateEventPayload) {
    return apiRequest<Event>('/events', { method: 'POST', body: JSON.stringify(payload) }, token)
  },

  async update(token: string, id: string, payload: Partial<CreateEventPayload>) {
    return apiRequest<Event>(`/events/${id}`, { method: 'PUT', body: JSON.stringify(payload) }, token)
  },

  async cancel(token: string, id: string) {
    return apiRequest(`/events/${id}`, { method: 'DELETE' }, token)
  },

  async register(token: string, id: string) {
    return apiRequest<Event>(`/events/${id}/register`, { method: 'POST' }, token)
  },

  async unregister(token: string, id: string) {
    return apiRequest<Event>(`/events/${id}/register`, { method: 'DELETE' }, token)
  },
}

// ─── Incidents API (raw response) ────────────────────────────────────────────

export type IncidentStatus = 'open' | 'in_progress' | 'resolved'
export type IncidentPriority = 'low' | 'medium' | 'high'

export type Incident = {
  _id: string
  title: string
  description: string
  status: IncidentStatus
  priority: IncidentPriority
  createdBy?: string
  createdAt: string
  updatedAt: string
}

export type CreateIncidentPayload = {
  title: string
  description: string
  priority?: IncidentPriority
}

export type UpdateIncidentPayload = Partial<CreateIncidentPayload> & {
  status?: IncidentStatus
}

export const incidentsApi = {
  async list(token: string) {
    return apiRaw<Incident[]>('/incidents', undefined, token)
  },
  async get(token: string, id: string) {
    return apiRaw<Incident>(`/incidents/${id}`, undefined, token)
  },
  async create(token: string, payload: CreateIncidentPayload) {
    return apiRaw<Incident>(
      '/incidents',
      { method: 'POST', body: JSON.stringify(payload) },
      token,
    )
  },
  async update(token: string, id: string, payload: UpdateIncidentPayload) {
    return apiRaw<Incident>(
      `/incidents/${id}`,
      { method: 'PUT', body: JSON.stringify(payload) },
      token,
    )
  },
  async delete(token: string, id: string) {
    return apiRaw<{ message: string }>(`/incidents/${id}`, { method: 'DELETE' }, token)
  },
}

// ─── Alertes API (raw response) ──────────────────────────────────────────────

export type AlerteLevel = 'info' | 'warning' | 'danger'

export type Alerte = {
  _id: string
  title: string
  message: string
  level: AlerteLevel
  active: boolean
  createdAt: string
  updatedAt: string
}

export type CreateAlertePayload = {
  title: string
  message: string
  level?: AlerteLevel
  active?: boolean
}

export type UpdateAlertePayload = Partial<CreateAlertePayload>

export const alertesApi = {
  async list(token: string) {
    return apiRaw<Alerte[]>('/alertes', undefined, token)
  },
  async get(token: string, id: string) {
    return apiRaw<Alerte>(`/alertes/${id}`, undefined, token)
  },
  async create(token: string, payload: CreateAlertePayload) {
    return apiRaw<Alerte>(
      '/alertes',
      { method: 'POST', body: JSON.stringify(payload) },
      token,
    )
  },
  async update(token: string, id: string, payload: UpdateAlertePayload) {
    return apiRaw<Alerte>(
      `/alertes/${id}`,
      { method: 'PUT', body: JSON.stringify(payload) },
      token,
    )
  },
  async delete(token: string, id: string) {
    return apiRaw<{ message: string }>(`/alertes/${id}`, { method: 'DELETE' }, token)
  },
}

// ─── Neighborhoods API ───────────────────────────────────────────────────────

export type NeighborhoodPolygon = {
  type: 'Polygon'
  coordinates: number[][][]
}

export type Neighborhood = {
  _id: string
  name: string
  description: string
  polygon: NeighborhoodPolygon
  adminId:
    | string
    | { _id: string; firstName: string; lastName: string; email: string }
  createdAt: string
  updatedAt: string
}

export type CreateNeighborhoodPayload = {
  name: string
  description?: string
  polygon: NeighborhoodPolygon
}

export type UpdateNeighborhoodPayload = Partial<CreateNeighborhoodPayload>

export const neighborhoodsApi = {
  async list(token: string) {
    return apiRequest<Neighborhood[]>('/neighborhoods', undefined, token)
  },
  async get(token: string, id: string) {
    return apiRequest<Neighborhood>(`/neighborhoods/${id}`, undefined, token)
  },
  async create(token: string, payload: CreateNeighborhoodPayload) {
    return apiRequest<Neighborhood>(
      '/neighborhoods',
      { method: 'POST', body: JSON.stringify(payload) },
      token,
    )
  },
  async update(token: string, id: string, payload: UpdateNeighborhoodPayload) {
    return apiRequest<Neighborhood>(
      `/neighborhoods/${id}`,
      { method: 'PUT', body: JSON.stringify(payload) },
      token,
    )
  },
  async delete(token: string, id: string) {
    return apiRequest<{ message: string }>(
      `/neighborhoods/${id}`,
      { method: 'DELETE' },
      token,
    )
  },
}

// ─── Messages API ─────────────────────────────────────────────────────────────

async function apiUpload<T>(path: string, formData: FormData, token: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: 'POST',
    body: formData,
    headers: { Authorization: `Bearer ${token}` },
  })

  const payload = (await response.json()) as ApiSuccessResponse<T> | ApiErrorResponse

  if (!response.ok || !('success' in payload) || !payload.success) {
    throw new Error(
      'message' in payload && payload.message ? payload.message : 'Upload failed.',
    )
  }

  return payload.data
}

// ─── Groupes de discussion API ──────────────────────────────────────────────────

export type GroupPerson = { _id: string; name: string; role: string }
export type GroupSummary = {
  _id: string
  name: string
  description: string
  memberCount: number
  isMember: boolean
  createdBy: GroupPerson | null
  createdAt: string
}
export type GroupMessage = { _id: string; content: string; createdAt: string; sender: GroupPerson | null }
export type GroupDetail = {
  _id: string
  name: string
  description: string
  createdBy: GroupPerson | null
  members: GroupPerson[]
  messages: GroupMessage[]
}

export const groupsApi = {
  async list(token: string) {
    return apiRequest<GroupSummary[]>('/groups', undefined, token)
  },
  async create(token: string, payload: { name: string; description?: string; memberIds?: string[] }) {
    return apiRequest<{ _id: string }>('/groups', { method: 'POST', body: JSON.stringify(payload) }, token)
  },
  async get(token: string, id: string) {
    return apiRequest<GroupDetail>(`/groups/${id}`, undefined, token)
  },
  async sendMessage(token: string, id: string, content: string) {
    return apiRequest<GroupMessage>(`/groups/${id}/messages`, { method: 'POST', body: JSON.stringify({ content }) }, token)
  },
  async join(token: string, id: string) {
    return apiRequest<{ message: string }>(`/groups/${id}/join`, { method: 'POST' }, token)
  },
  async leave(token: string, id: string) {
    return apiRequest<{ message: string }>(`/groups/${id}/leave`, { method: 'POST' }, token)
  },
  async remove(token: string, id: string) {
    return apiRequest<{ message: string }>(`/groups/${id}`, { method: 'DELETE' }, token)
  },
  async deleteMessage(token: string, messageId: string) {
    return apiRequest<{ message: string }>(`/groups/messages/${messageId}`, { method: 'DELETE' }, token)
  },
}

// ─── Votes API ────────────────────────────────────────────────────────────────

export type VoteType = 'yesno' | 'single' | 'multiple' | 'weighted'
export type VoteOption = { label: string; votes: number | null }
export type VoteAuthor = { _id: string; name: string; role: string }

export type Vote = {
  _id: string
  question: string
  type: VoteType
  isAnonymous: boolean
  openAt: string
  closeAt: string
  quorum?: number
  showResultsLive: boolean
  author: VoteAuthor | null
  options: VoteOption[]
  totalVoters: number
  quorumMet: boolean
  isOpen: boolean
  closed: boolean
  resultsVisible: boolean
  hasVoted: boolean
  myChoices: number[]
  myWeights: number[]
  commentsCount: number
  createdAt: string
}

export type VoteComment = { _id: string; content: string; createdAt: string; author: VoteAuthor | null }

export type CreateVotePayload = {
  question: string
  type: VoteType
  options?: string[]
  isAnonymous?: boolean
  openAt?: string
  closeAt?: string
  quorum?: number
  showResultsLive?: boolean
}

export type CastVotePayload = { choice?: number; choices?: number[]; weights?: number[] }

export const votesApi = {
  async list(token: string) {
    return apiRequest<Vote[]>('/votes', undefined, token)
  },
  async get(token: string, id: string) {
    return apiRequest<Vote>(`/votes/${id}`, undefined, token)
  },
  async create(token: string, payload: CreateVotePayload) {
    return apiRequest<Vote>('/votes', { method: 'POST', body: JSON.stringify(payload) }, token)
  },
  async cast(token: string, id: string, payload: CastVotePayload) {
    return apiRequest<Vote>(`/votes/${id}/cast`, { method: 'POST', body: JSON.stringify(payload) }, token)
  },
  async remove(token: string, id: string) {
    return apiRequest<{ message: string }>(`/votes/${id}`, { method: 'DELETE' }, token)
  },
  async listComments(token: string, id: string) {
    return apiRequest<VoteComment[]>(`/votes/${id}/comments`, undefined, token)
  },
  async addComment(token: string, id: string, content: string) {
    return apiRequest<VoteComment>(`/votes/${id}/comments`, { method: 'POST', body: JSON.stringify({ content }) }, token)
  },
  async deleteComment(token: string, commentId: string) {
    return apiRequest<{ message: string }>(`/votes/comments/${commentId}`, { method: 'DELETE' }, token)
  },
}

// ─── Documents & signatures API ─────────────────────────────────────────────────

export type DocumentStatus = 'draft' | 'pending_signatures' | 'signed' | 'archived'

export type DocPerson = { _id: string; firstName: string; lastName: string }

export type DocSignatory = {
  userId: DocPerson | string
  order: number
  signedAt?: string
  signature?: string
}

export type AppDocument = {
  _id: string
  title: string
  fileUrl: string
  signedFileUrl?: string
  status: DocumentStatus
  hash?: string
  locked: boolean
  importerId: DocPerson | string
  signatureZones: { signerId: string; page: number; x: number; y: number; width: number; height: number; type: string }[]
  signatories: DocSignatory[]
  createdAt: string
}

export type DocumentVerification = {
  integrity: 'ok' | 'altered' | 'missing'
  hash?: string
  status: DocumentStatus
  locked: boolean
  signatories: { userId: string; order: number; signedAt?: string; signatureHash?: string }[]
}

export const documentsApi = {
  async list(token: string) {
    return apiRequest<AppDocument[]>('/documents', undefined, token)
  },
  async get(token: string, id: string) {
    return apiRequest<AppDocument>(`/documents/${id}`, undefined, token)
  },
  async upload(token: string, file: File, title: string) {
    const form = new FormData()
    form.append('title', title)
    form.append('file', file, file.name)
    return apiUpload<AppDocument>('/documents', form, token)
  },
  async setZones(
    token: string,
    id: string,
    zones: { signerId: string; page: number; x: number; y: number; width: number; height: number; type?: string }[],
  ) {
    return apiRequest<AppDocument>(
      `/documents/${id}/zones`,
      { method: 'PUT', body: JSON.stringify({ zones }) },
      token,
    )
  },
  async send(token: string, id: string, signatories: { userId: string; order: number }[]) {
    return apiRequest<AppDocument>(
      `/documents/${id}/send`,
      { method: 'POST', body: JSON.stringify({ signatories }) },
      token,
    )
  },
  async sign(token: string, id: string, signature: string, totpCode: string) {
    return apiRequest<AppDocument>(
      `/documents/${id}/sign`,
      { method: 'POST', body: JSON.stringify({ signature, totpCode }) },
      token,
    )
  },
  async verify(token: string, id: string) {
    return apiRequest<DocumentVerification>(`/documents/${id}/verify`, undefined, token)
  },
}

export const messagesApi = {
  async list(token: string) {
    return apiRequest<ConversationSummary[]>('/messages', undefined, token)
  },
  async getConversation(token: string, userId: string) {
    return apiRequest<ConversationDetails>(`/messages/${userId}`, undefined, token)
  },
  async sendMessage(
    token: string,
    userId: string,
    payload: { content: string; type?: 'text' },
  ) {
    return apiRequest<ConversationMessage>(
      `/messages/${userId}`,
      { method: 'POST', body: JSON.stringify({ ...payload, type: 'text' }) },
      token,
    )
  },
  async sendAttachment(
    token: string,
    userId: string,
    file: Blob,
    type: 'photo' | 'audio',
    filename?: string,
  ) {
    const form = new FormData()
    form.append('type', type)
    form.append(
      'file',
      file,
      filename ?? (type === 'audio' ? 'voice-message' : 'image'),
    )
    return apiUpload<ConversationMessage>(`/messages/${userId}/upload`, form, token)
  },
  async reportMessage(token: string, messageId: string, reason?: string) {
    return apiRequest<{ message: string; reportId: string }>(
      `/messages/${messageId}/report`,
      { method: 'POST', body: JSON.stringify({ reason: reason ?? '' }) },
      token,
    )
  },
  async listReports(token: string) {
    return apiRequest<MessageReport[]>('/messages/reports', undefined, token)
  },
  async resolveReport(token: string, reportId: string, status: 'reviewed' | 'dismissed') {
    return apiRequest<MessageReport>(
      `/messages/reports/${reportId}`,
      { method: 'PUT', body: JSON.stringify({ status }) },
      token,
    )
  },
}

export type MessageReport = {
  _id: string
  reason: string
  status: 'pending' | 'reviewed' | 'dismissed'
  reportedBy: { _id: string; firstName: string; lastName: string } | null
  messageId: {
    _id: string
    content: string
    type: 'text' | 'photo' | 'audio'
    senderId: string
    receiverId: string
    createdAt: string
  } | null
  createdAt: string
}

// ─── Newsletter API (back-office) ───────────────────────────────────────────────

export type NewsletterStatus = 'draft' | 'scheduled' | 'sent'

export type Newsletter = {
  _id: string
  subject: string
  contentHtml: string
  status: NewsletterStatus
  scheduledAt?: string
  sentAt?: string
  sentCount: number
  authorId: { _id: string; firstName: string; lastName: string } | string
  createdAt: string
  updatedAt: string
}

export type NewsletterPayload = {
  subject: string
  contentHtml?: string
  scheduledAt?: string | null
}

export const newsletterApi = {
  async list(token: string) {
    return apiRequest<Newsletter[]>('/newsletter', undefined, token)
  },
  async get(token: string, id: string) {
    return apiRequest<Newsletter>(`/newsletter/${id}`, undefined, token)
  },
  async create(token: string, payload: NewsletterPayload) {
    return apiRequest<Newsletter>(
      '/newsletter',
      { method: 'POST', body: JSON.stringify(payload) },
      token,
    )
  },
  async update(token: string, id: string, payload: Partial<NewsletterPayload>) {
    return apiRequest<Newsletter>(
      `/newsletter/${id}`,
      { method: 'PUT', body: JSON.stringify(payload) },
      token,
    )
  },
  async remove(token: string, id: string) {
    return apiRequest<{ message: string }>(`/newsletter/${id}`, { method: 'DELETE' }, token)
  },
  async send(token: string, id: string) {
    return apiRequest<{ message: string; sentCount: number; newsletter: Newsletter }>(
      `/newsletter/${id}/send`,
      { method: 'POST' },
      token,
    )
  },
}

import { apiBaseUrl } from '@/shared/config/env'

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

export const authApi = {
  async login(email: string, password: string): Promise<AuthSession> {
    return apiRequest<AuthSession>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
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
}

// ─── Users API ───────────────────────────────────────────────────────────────

export type UserProfile = AuthUser & {
  phone: string
  address: string
  points: number
  isVerified: boolean
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
    payload: { content: string; type: 'text' | 'audio' },
  ) {
    return apiRequest<ConversationMessage>(
      `/messages/${userId}`,
      { method: 'POST', body: JSON.stringify(payload) },
      token,
    )
  },
}

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

export const usersApi = {
  async getMe(token: string) {
    return apiRequest<UserProfile>('/users/me', undefined, token)
  },
  async updateMe(token: string, payload: UpdateProfilePayload) {
    return apiRequest<UserProfile>('/users/me', { method: 'PUT', body: JSON.stringify(payload) }, token)
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
  async list(token: string, filters?: { category?: ServiceCategory; status?: ServiceStatus; isPaid?: boolean }) {
    const params = new URLSearchParams()
    if (filters?.category) params.set('category', filters.category)
    if (filters?.status) params.set('status', filters.status)
    if (filters?.isPaid !== undefined) params.set('isPaid', String(filters.isPaid))
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

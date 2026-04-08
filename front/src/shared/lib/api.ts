import { apiBaseUrl } from '@/shared/config/env'

export type AuthUser = {
  _id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  address?: string
  role: string
}

export type AuthSession = {
  token: string
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

type ApiSuccessResponse<T> = {
  success: true
  data: T
}

type ApiErrorResponse = {
  success: false
  message?: string
}

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
      'message' in payload && payload.message ? payload.message : 'Une erreur API est survenue.',
    )
  }

  return payload.data
}

function splitFullName(fullName: string) {
  const trimmed = fullName.trim()
  if (!trimmed) {
    return { firstName: '', lastName: '' }
  }

  const parts = trimmed.split(/\s+/)
  const [firstName, ...rest] = parts

  return {
    firstName,
    lastName: rest.join(' ') || firstName,
  }
}

export const authApi = {
  async login(email: string, password: string) {
    return apiRequest<AuthSession>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },
  async register(payload: AuthFormPayload) {
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
    payload: { content: string; type: 'text' | 'audio' },
  ) {
    return apiRequest<ConversationMessage>(
      `/messages/${userId}`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      token,
    )
  },
}

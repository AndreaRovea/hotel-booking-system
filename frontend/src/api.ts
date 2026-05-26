const TOKEN_KEY = 'hotel.token'

export function storeToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function loadToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export interface Room {
  id: number
  number: string
  type: string
  capacity: number
  dailyRate: number
}

export interface Guest {
  id: number
  fullName: string
  email: string | null
  phone: string | null
}

export interface Booking {
  id: number
  roomId: number
  guestId: number
  checkIn: string
  checkOut: string
  status: string
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = loadToken()
  const headers = new Headers(init.headers)
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(path, { ...init, headers })
  if (response.status === 401) {
    clearToken()
    throw new Error('Authentication required')
  }
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`HTTP ${response.status}: ${text}`)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export async function register(email: string, password: string): Promise<void> {
  await request('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) })
}

export async function login(email: string, password: string): Promise<string> {
  const result = await request<{ token: string }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  storeToken(result.token)
  return result.token
}

export const rooms = {
  list: () => request<Room[]>('/api/rooms'),
  create: (input: Omit<Room, 'id'>) =>
    request<Room>('/api/rooms', { method: 'POST', body: JSON.stringify(input) }),
  delete: (id: number) => request<void>(`/api/rooms/${id}`, { method: 'DELETE' }),
}

export const guests = {
  list: () => request<Guest[]>('/api/guests'),
  create: (input: Omit<Guest, 'id'>) =>
    request<Guest>('/api/guests', { method: 'POST', body: JSON.stringify(input) }),
}

export const bookings = {
  list: () => request<Booking[]>('/api/bookings'),
  create: (input: Omit<Booking, 'id' | 'status'>) =>
    request<Booking>('/api/bookings', { method: 'POST', body: JSON.stringify(input) }),
  delete: (id: number) => request<void>(`/api/bookings/${id}`, { method: 'DELETE' }),
}

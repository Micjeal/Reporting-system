import { apiGet, apiPatch } from '@/services/api-client'

export type UsersListItem = {
  id: string
  email: string
  role: 'admin' | 'manager' | 'agent'
  status: 'pending' | 'active' | 'rejected' | 'suspended'
  created_at: string
  updated_at: string
  name: string | null
  phone: string | null
  region: string | null
}

export function listUsers(params?: { status?: string; role?: string; q?: string }) {
  const sp = new URLSearchParams()
  if (params?.status) sp.set('status', params.status)
  if (params?.role) sp.set('role', params.role)
  if (params?.q) sp.set('q', params.q)
  const qs = sp.toString()
  return apiGet<UsersListItem[]>(`/api/users${qs ? `?${qs}` : ''}`)
}

export function approveUser(id: string) {
  return apiPatch<{ id: string; status: string }, {}>(`/api/users/${id}/approve`, {})
}
export function rejectUser(id: string) {
  return apiPatch<{ id: string; status: string }, {}>(`/api/users/${id}/reject`, {})
}
export function suspendUser(id: string) {
  return apiPatch<{ id: string; status: string }, {}>(`/api/users/${id}/suspend`, {})
}
export function setUserRole(id: string, role: 'admin' | 'manager' | 'agent') {
  return apiPatch<{ id: string; role: string }, { role: string }>(`/api/users/${id}/role`, { role })
}


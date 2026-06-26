import { apiGet, apiPatch, apiPost, apiDelete } from '@/services/api-client'
import type { Expense } from '@/types'

export function listExpenses(params?: { category?: string; date_from?: string; date_to?: string; agent_id?: string }) {
  const sp = new URLSearchParams()
  if (params?.category) sp.set('category', params.category)
  if (params?.date_from) sp.set('date_from', params.date_from)
  if (params?.date_to) sp.set('date_to', params.date_to)
  if (params?.agent_id) sp.set('agent_id', params.agent_id)
  const qs = sp.toString()
  return apiGet<Expense[]>(`/api/expenses${qs ? `?${qs}` : ''}`)
}

export function createExpense(payload: {
  category: Expense['category']
  description: string
  amount: number
  receipt_url?: string | null
  date: string
}) {
  return apiPost<Expense, typeof payload>('/api/expenses', payload)
}

export function updateExpense(id: string, payload: Partial<Omit<Expense, 'id' | 'agent_id' | 'created_at' | 'updated_at'>>) {
  return apiPatch<Expense, typeof payload>(`/api/expenses/${id}`, payload)
}

export function deleteExpense(id: string) {
  return apiDelete<{ success: true }>(`/api/expenses/${id}`)
}


import { apiDelete, apiGet, apiPatch, apiPost } from '@/services/api-client'
import type { Sale } from '@/types'

export function listSales(params?: { date_from?: string; date_to?: string; agent_id?: string }) {
  const sp = new URLSearchParams()
  if (params?.date_from) sp.set('date_from', params.date_from)
  if (params?.date_to) sp.set('date_to', params.date_to)
  if (params?.agent_id) sp.set('agent_id', params.agent_id)
  const qs = sp.toString()
  return apiGet<Sale[]>(`/api/sales${qs ? `?${qs}` : ''}`)
}

export interface CreateSaleItem {
  product_id: string
  quantity: number
  unit_price: number
}

export interface CreateSalePayload {
  customer_name?: string
  payment_method?: string
  sale_date?: string
  items: CreateSaleItem[]
  customer_phone?: string
  location?: string
  route?: string
  bank_details?: string
  expenses_total?: number
  tokens_deducted?: number
  returns_amount?: number
  notes?: string
}

export function createSale(payload: CreateSalePayload) {
  return apiPost<Sale, CreateSalePayload>('/api/sales', payload)
}

export function updateSale(id: string, payload: Partial<{ quantity: number; amount: number; date: string }>) {
  return apiPatch<Sale, typeof payload>(`/api/sales/${id}`, payload)
}

export function deleteSale(id: string) {
  return apiDelete<{ success: true }>(`/api/sales/${id}`)
}


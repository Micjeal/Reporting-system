import { apiDelete, apiGet, apiPatch, apiPost } from '@/services/api-client'
import type { Product } from '@/types'

export function listProducts(q?: string) {
  const qs = q ? `?q=${encodeURIComponent(q)}` : ''
  return apiGet<Product[]>(`/api/products${qs}`)
}

export function createProduct(payload: { name: string; unit_price: number; quantity?: number; description?: string | null; status?: string }) {
  return apiPost<Product, typeof payload>('/api/products', { description: null, quantity: 0, status: 'active', ...payload })
}

export function updateProduct(id: string, payload: Partial<{ name: string; unit_price: number; quantity: number; description: string | null; status: string }>) {
  return apiPatch<Product, typeof payload>(`/api/products/${id}`, payload)
}

export function deleteProduct(id: string) {
  return apiDelete<{ success: true }>(`/api/products/${id}`)
}


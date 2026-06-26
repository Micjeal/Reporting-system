import { apiGet, apiPost, apiPatch, apiDelete } from '@/services/api-client';
import type { InventoryItem } from '@/lib/domain/inventory';

// Transform Supabase response to match our type
function transformInventoryData(data: any): InventoryItem {
  return {
    ...data,
    agent: data.agents || data.agent,
    product: data.products || data.product,
  };
}

export function listInventory(params?: { agent_id?: string }) {
  const qs = params?.agent_id
    ? `?agent_id=${encodeURIComponent(params.agent_id)}`
    : '';

  return apiGet<InventoryItem[]>(`/api/inventory${qs}`).then((items) =>
    items.map(transformInventoryData)
  );
}

export function createInventory(payload: {
  agent_id: string;
  product_id: string;
  quantity_issued: number;
  date_issued: string;
}) {
  return apiPost<InventoryItem, typeof payload>(
    '/api/inventory',
    payload
  ).then(transformInventoryData);
}

export function issueInventory(payload: {
  agent_id: string;
  product_id: string;
  quantity_issued: number;
  date_issued: string;
}) {
  return apiPost<InventoryItem, typeof payload>(
    '/api/inventory/issue',
    payload
  ).then(transformInventoryData);
}

export function updateInventory(id: string, payload: Partial<{
  agent_id: string;
  product_id: string;
  quantity_issued: number;
  date_issued: string;
}>) {
  return apiPatch<InventoryItem, typeof payload>(
    `/api/inventory/${id}`,
    payload
  ).then(transformInventoryData);
}

export function deleteInventory(id: string) {
  return apiDelete<{ success: true }>(`/api/inventory/${id}`);
}

export interface InventoryRequest {
  id: string
  agent_id: string
  product_id: string
  quantity_requested: number
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
  products?: {
    id: string
    name: string
  }
}

export function createInventoryRequest(payload: {
  product_id: string
  quantity_requested: number
  reason: string
}) {
  return apiPost<InventoryRequest, typeof payload>(
    '/api/inventory-requests',
    payload
  );
}

export function listInventoryRequests() {
  return apiGet<InventoryRequest[]>('/api/inventory-requests');
}

export function updateInventoryRequest(id: string, status: 'approved' | 'rejected') {
  return apiPatch<InventoryRequest, { id: string; status: string }>(
    '/api/inventory-requests',
    { id, status }
  );
}

export function approveInventoryRequest(id: string, quantity: number) {
  return apiPatch<InventoryRequest, { id: string; status: string; quantity: number }>(
    '/api/inventory-requests/approve',
    { id, status: 'approved', quantity }
  );
}
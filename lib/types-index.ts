// Comprehensive TypeScript types for RSMS

// User types
export type UserRole = 'admin' | 'manager' | 'agent'
export type UserStatus = 'pending' | 'active' | 'rejected' | 'suspended'

export interface User {
  id: string
  email: string
  role: UserRole
  status: UserStatus
  created_at: string
  updated_at: string
}

// Agent profile
export interface Agent {
  id: string
  user_id: string
  name: string
  phone: string
  region: string
  created_at: string
  updated_at: string
}

// Product catalog
export interface Product {
  id: string
  name: string
  unit_price: number
  description: string | null
  created_at: string
  updated_at: string
}

// Sale line item
export interface SaleItem {
  id?: string | number
  sale_id?: string | number
  product_id: string | number
  product_name?: string | null
  quantity: number
  unit_price: number
  line_total?: number
  product?: Product
}

// Sales transaction
export interface Sale {
  id: string
  agent_id: string
  customer_name?: string | null
  customer_phone?: string | null
  payment_method?: string | null
  sale_date?: string | null
  location?: string | null
  route?: string | null
  bank_details?: string | null
  expenses_total?: number | null
  tokens_deducted?: number | null
  returns_amount?: number | null
  notes?: string | null
  // Legacy single-product fields (kept for backward compatibility)
  product_id?: string
  quantity?: number
  amount?: number
  date?: string
  total_amount?: number
  status?: string
  created_at: string
  updated_at?: string
  // Joined fields from relationships
  agent?: Agent
  product?: Product
  items?: SaleItem[]
}

// Expenses claim
export interface Expense {
  id: string
  agent_id: string
  category: 'fuel' | 'food' | 'accommodation' | 'airtime' | 'other'
  description: string
  amount: number
  receipt_url: string | null
  date: string
  created_at: string
  updated_at: string
  agent?: Agent
}

// Inventory issuance
export interface Inventory {
  id: string
  agent_id: string
  product_id: string
  quantity_issued: number
  date_issued: string
  created_at: string
  updated_at: string
  agent?: Agent
  product?: Product
}

// Audit trail
export interface AuditLog {
  id: string
  actor_id: string
  action: string
  target_table: string
  target_id: string
  details: Record<string, unknown>
  created_at: string
}

// KPI summary
export interface KPIs {
  total_sales_today: number
  total_expenses_today: number
  active_agents: number
  pending_approvals: number
  inventory_issued: number
  net_revenue_estimate: number
}

// API response wrapper
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  count?: number
  page?: number
  limit?: number
}

// Top agent summary
export interface TopAgent {
  agent_id: string
  agent_name: string
  region: string
  total_sales: number
  sale_count: number
}

// Daily sales trend
export interface SalesTrend {
  sale_date: string
  daily_total: number
  sale_count: number
}

import { apiGet } from '@/services/api-client'
import type { KPIs, SalesTrend, TopAgent } from '@/types'

export function getKPIs() {
  return apiGet<KPIs>('/api/analytics/kpis')
}

export function getTopAgents(days = 30) {
  return apiGet<TopAgent[]>(`/api/analytics/top-agents?days=${days}`)
}

export function getSalesTrends(days = 30) {
  return apiGet<SalesTrend[]>(`/api/analytics/sales-trends?days=${days}`)
}

export function getRevenueExpenses() {
  return apiGet<{ month: string, revenue: number, expenses: number }[]>('/api/analytics/revenue-expenses')
}

export function getExpenseCategories() {
  return apiGet<{ category: string, value: number, percentage: number }[]>('/api/analytics/expense-categories')
}

export function getInventoryUtilization() {
  return apiGet<{ product: string, issued: number, sold: number }[]>('/api/analytics/inventory-utilization')
}


'use client'

import { useCallback, useEffect, useState } from 'react'
import * as analyticsService from '@/services/analytics.service'
import type { KPIs, SalesTrend, TopAgent } from '@/types'
import { createClient } from '@/lib/supabase-client'

export function useAnalytics() {
  const [kpis, setKpis] = useState<KPIs | null>(null)
  const [topAgents, setTopAgents] = useState<TopAgent[] | null>(null)
  const [trends, setTrends] = useState<SalesTrend[] | null>(null)
  
  // New state variables for the additional charts
  const [revenueExpenses, setRevenueExpenses] = useState<{ month: string, revenue: number, expenses: number }[] | null>(null)
  const [expenseCategories, setExpenseCategories] = useState<{ category: string, value: number, percentage: number }[] | null>(null)
  const [inventoryUtilization, setInventoryUtilization] = useState<{ product: string, issued: number, sold: number }[] | null>(null)
  
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async (days = 30) => {
    setLoading(true)
    setError(null)
    try {
      const [k, t, tr, re, ec, iu] = await Promise.all([
        analyticsService.getKPIs(),
        analyticsService.getTopAgents(days),
        analyticsService.getSalesTrends(days),
        analyticsService.getRevenueExpenses(),
        analyticsService.getExpenseCategories(),
        analyticsService.getInventoryUtilization(),
      ])
      setKpis(k)
      setTopAgents(t)
      setTrends(tr)
      setRevenueExpenses(re)
      setExpenseCategories(ec)
      setInventoryUtilization(iu)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()

    const supabase = createClient()

    // Subscribe to changes in critical tables
    const channel = supabase.channel('analytics-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, () => refresh())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [refresh])

  return { kpis, topAgents, trends, revenueExpenses, expenseCategories, inventoryUtilization, error, loading, refresh }
}

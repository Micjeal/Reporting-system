'use client'

import { useCallback, useEffect, useState } from 'react'
import * as expensesService from '@/services/expenses.service'
import type { Expense } from '@/types'

export function useExpenses(params?: { category?: string; date_from?: string; date_to?: string; agent_id?: string }) {
  const [data, setData] = useState<Expense[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await expensesService.listExpenses(params)
      setData(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load expenses')
    } finally {
      setLoading(false)
    }
  }, [params])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const create = useCallback(
    async (payload: { category: Expense['category']; description: string; amount: number; receipt_url?: string | null; date: string }) => {
      const created = await expensesService.createExpense(payload)
      await refresh()
      return created
    },
    [refresh]
  )

  const update = useCallback(async (id: string, payload: Partial<Omit<Expense, 'id' | 'agent_id' | 'created_at' | 'updated_at'>>) => {
    const updated = await expensesService.updateExpense(id, payload)
    await refresh()
    return updated
  }, [refresh])

  return { data, error, loading, refresh, create, update }
}


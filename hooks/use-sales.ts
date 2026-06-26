'use client'

import { useCallback, useEffect, useState } from 'react'
import * as salesService from '@/services/sales.service'
import type { Sale } from '@/types'

export function useSales(params?: { date_from?: string; date_to?: string; agent_id?: string }) {
  const [data, setData] = useState<Sale[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await salesService.listSales(params)
      setData(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load sales')
    } finally {
      setLoading(false)
    }
  }, [params])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const create = useCallback(
    async (payload: salesService.CreateSalePayload) => {
      const created = await salesService.createSale(payload)
      await refresh()
      return created
    },
    [refresh]
  )

  const update = useCallback(async (id: string, payload: Partial<{ quantity: number; amount: number; date: string }>) => {
    const updated = await salesService.updateSale(id, payload)
    await refresh()
    return updated
  }, [refresh])

  const remove = useCallback(async (id: string) => {
    await salesService.deleteSale(id)
    await refresh()
  }, [refresh])

  return { data, error, loading, refresh, create, update, remove }
}


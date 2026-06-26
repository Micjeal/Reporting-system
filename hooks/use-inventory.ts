'use client'

import { useCallback, useEffect, useState } from 'react'
import * as inventoryService from '@/services/inventory.service'
import type { InventoryItem } from '@/lib/domain/inventory'

export function useInventory(params?: { agent_id?: string }) {
  const [data, setData] = useState<InventoryItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await inventoryService.listInventory(params)
      setData(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }, [params])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const issue = useCallback(
    async (payload: { agent_id: string; product_id: string; quantity_issued: number; date_issued: string }) => {
      const created = await inventoryService.issueInventory(payload)
      await refresh()
      return created
    },
    [refresh]
  )

  return { data, error, loading, refresh, issue }
}


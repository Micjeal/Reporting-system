'use client'

import { useCallback, useEffect, useState } from 'react'
import * as productsService from '@/services/products.service'
import type { Product } from '@/types'

export function useProducts(q?: string) {
  const [data, setData] = useState<Product[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await productsService.listProducts(q)
      setData(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }, [q])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const create = useCallback(async (payload: { name: string; unit_price: number; description?: string | null }) => {
    const created = await productsService.createProduct(payload)
    await refresh()
    return created
  }, [refresh])

  const update = useCallback(async (id: string, payload: Partial<{ name: string; unit_price: number; description: string | null }>) => {
    const updated = await productsService.updateProduct(id, payload)
    await refresh()
    return updated
  }, [refresh])

  const remove = useCallback(async (id: string) => {
    await productsService.deleteProduct(id)
    await refresh()
  }, [refresh])

  return { data, error, loading, refresh, create, update, remove }
}


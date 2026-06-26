'use client'

import { useCallback, useEffect, useState, useRef } from 'react'
import * as usersService from '@/services/users.service'
import type { UsersListItem } from '@/services/users.service'

export function useUsers(params?: { status?: string; role?: string; q?: string }) {
  const [data, setData] = useState<UsersListItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const refreshingRef = useRef(false)
  const initializedRef = useRef(false)

  const refresh = useCallback(async () => {
    if (refreshingRef.current) return
    refreshingRef.current = true
    setLoading(true)
    setError(null)
    try {
      const res = await usersService.listUsers(params)
      setData(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load users')
    } finally {
      setLoading(false)
      refreshingRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      void refresh()
    }
  }, [refresh])

  const approve = useCallback(async (id: string) => {
    await usersService.approveUser(id)
  }, [])

  const reject = useCallback(async (id: string) => {
    await usersService.rejectUser(id)
  }, [])

  const suspend = useCallback(async (id: string) => {
    await usersService.suspendUser(id)
  }, [])

  const setRole = useCallback(async (id: string, role: 'admin' | 'manager' | 'agent') => {
    await usersService.setUserRole(id, role)
  }, [])

  return { data, error, loading, refresh, approve, reject, suspend, setRole }
}


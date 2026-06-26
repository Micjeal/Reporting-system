'use client'

import { useCallback, useMemo, useState } from 'react'
import * as authService from '@/services/auth.service'

type AuthState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'authenticated'; userId: string; role: string }
  | { status: 'pending' }
  | { status: 'error'; message: string }

export function useAuth() {
  const [state, setState] = useState<AuthState>({ status: 'idle' })

  const login = useCallback(async (email: string, password: string) => {
    setState({ status: 'loading' })
    try {
      const result = await authService.login({ email, password })
      setState({ status: 'authenticated', userId: result.userId, role: result.role })
      return result
    } catch (e) {
      setState({ status: 'error', message: e instanceof Error ? e.message : 'Login failed' })
      throw e
    }
  }, [])

  const signup = useCallback(
    async (payload: { email: string; password: string; fullName: string; phone: string; region?: string }) => {
      setState({ status: 'loading' })
      try {
        const result = await authService.signup(payload)
        setState({ status: 'pending' })
        return result
      } catch (e) {
        setState({ status: 'error', message: e instanceof Error ? e.message : 'Signup failed' })
        throw e
      }
    },
    []
  )

  const logout = useCallback(async () => {
    setState({ status: 'loading' })
    try {
      await authService.logout()
      setState({ status: 'idle' })
    } catch (e) {
      setState({ status: 'error', message: e instanceof Error ? e.message : 'Logout failed' })
      throw e
    }
  }, [])

  return useMemo(() => ({ state, login, signup, logout }), [state, login, signup, logout])
}


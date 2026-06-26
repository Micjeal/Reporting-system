import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/types'

export function ok<T>(data: T, init?: ResponseInit) {
  const body: ApiResponse<T> = { data, error: null }
  return NextResponse.json(body, { status: init?.status ?? 200, headers: init?.headers })
}

export function fail(message: string, status = 400, extra?: Partial<ApiResponse<null>>) {
  const body: ApiResponse<null> = { data: null, error: message, ...extra }
  return NextResponse.json(body, { status })
}


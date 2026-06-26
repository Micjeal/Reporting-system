import type { ApiResponse } from '@/types'

async function parseJson<T>(res: Response): Promise<ApiResponse<T>> {
  const text = await res.text()
  if (!text) return { data: null, error: res.ok ? null : res.statusText }
  try {
    return JSON.parse(text) as ApiResponse<T>
  } catch (err) {
    console.error('Failed to parse JSON response:', {
      status: res.status,
      statusText: res.statusText,
      text: text.slice(0, 500), // Log first 500 chars to avoid huge logs
      error: err instanceof Error ? err.message : String(err),
    })
    return { data: null, error: res.ok ? null : `Failed to parse response: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export async function apiGet<T>(path: string) {
  console.log('[apiGet] Request:', path)
  const res = await fetch(path, { method: 'GET', credentials: 'include' })
  console.log('[apiGet] Response status:', res.status, res.statusText)
  const body = await parseJson<T>(res)
  console.log('[apiGet] Parsed body:', body)
  if (!res.ok) {
    console.error('[apiGet] Request failed:', { path, body })
    throw new Error(body.error ?? `Request failed (${res.status})`)
  }
  console.log('[apiGet] Returning data:', body.data)
  return body.data as T
}

export async function apiPost<T, B>(path: string, body: B) {
  console.log('[apiPost] Request:', { path, body: JSON.stringify(body).slice(0, 200) })
  const res = await fetch(path, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  console.log('[apiPost] Response status:', res.status, res.statusText)
  const parsed = await parseJson<T>(res)
  if (!res.ok) {
    console.error('[apiPost] Request failed:', { path, body, parsed })
    throw new Error(parsed.error ?? `Request failed (${res.status})`)
  }
  return parsed.data as T
}

export async function apiPatch<T, B>(path: string, body: B) {
  console.log('[apiPatch] Request:', { path, body: JSON.stringify(body).slice(0, 200) })
  const res = await fetch(path, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  console.log('[apiPatch] Response status:', res.status, res.statusText)
  const parsed = await parseJson<T>(res)
  if (!res.ok) {
    console.error('[apiPatch] Request failed:', { path, body, parsed })
    throw new Error(parsed.error ?? `Request failed (${res.status})`)
  }
  return parsed.data as T
}

export async function apiDelete<T>(path: string) {
  console.log('[apiDelete] Request:', path)
  const res = await fetch(path, { method: 'DELETE', credentials: 'include' })
  console.log('[apiDelete] Response status:', res.status, res.statusText)
  const parsed = await parseJson<T>(res)
  if (!res.ok) {
    console.error('[apiDelete] Request failed:', { path, parsed })
    throw new Error(parsed.error ?? `Request failed (${res.status})`)
  }
  return parsed.data as T
}


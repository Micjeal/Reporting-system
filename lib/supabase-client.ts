import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

type BrowserSupabase = ReturnType<typeof createBrowserClient<Database>>

export const createClient = (): BrowserSupabase =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

import { ok, fail } from '@/lib/api-response'
import { createServerSupabase } from '@/lib/supabase-server'

export async function POST() {
  const supabase = await createServerSupabase()
  const { error } = await supabase.auth.signOut()
  if (error) return fail(error.message, 400)
  return ok({ success: true })
}


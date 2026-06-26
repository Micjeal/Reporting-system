import { createServerSupabase } from '@/lib/supabase-server'
import { adminClient } from '@/lib/supabase-admin'
import { ok, fail } from '@/lib/api-response'

/**
 * DEBUG ENDPOINT - Check authentication status
 * GET /api/debug/auth-status
 * 
 * This endpoint helps diagnose login issues by checking:
 * 1. Current Supabase session
 * 2. User profile in database
 * 3. Agent profile in database
 */
export async function GET(req: Request) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return ok({
        authenticated: false,
        message: 'No active session',
        user: null,
        profile: null,
        agent: null,
      })
    }

    // Get user profile
    const { data: profile, error: profileErr } = await adminClient
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    // Get agent profile
    const { data: agent, error: agentErr } = await adminClient
      .from('agents')
      .select('*')
      .eq('user_id', user.id)
      .single()

    return ok({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      },
      profile: profile || null,
      profileError: profileErr ? { code: profileErr.code, message: profileErr.message } : null,
      agent: agent || null,
      agentError: agentErr ? { code: agentErr.code, message: agentErr.message } : null,
    })
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'Unknown error', 500)
  }
}

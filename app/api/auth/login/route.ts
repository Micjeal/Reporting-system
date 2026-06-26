import { z } from 'zod'
import { ok, fail } from '@/lib/api-response'
import { zodErrorMessage } from '@/lib/zod'
import { createServerSupabase } from '@/lib/supabase-server'
import { adminClient } from '@/lib/supabase-admin'
import { createAuditLog } from '@/lib/audit'

const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(req: Request) {
  try {
    const body = loginBodySchema.parse(await req.json())
    const supabase = await createServerSupabase()

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    })

    if (error || !authData.user) return fail(error?.message ?? 'Invalid credentials', 401)

    // Use admin client for profile lookup to avoid RLS blocking login checks.
    const { data: profile, error: profileErr } = await adminClient
      .from('users')
      .select('role,status')
      .eq('id', authData.user.id)
      .single()

    // PGRST116 = no rows returned (profile doesn't exist)
    if (profileErr && profileErr.code !== 'PGRST116') {
      console.error('[Login] Profile lookup error:', profileErr)
      await supabase.auth.signOut()
      return fail('Failed to verify account status', 403)
    }

    if (!profile) {
      // Profile missing: create a pending agent profile so admin can approve.
      console.log('[Login] Creating missing profile for user:', authData.user.id)
      
      const { error: userInsertErr } = await adminClient.from('users').insert({
        id: authData.user.id,
        email: body.email,
        role: 'agent',
        status: 'pending',
      } as any)

      if (userInsertErr) {
        console.error('[Login] Failed to create user profile:', userInsertErr)
        await supabase.auth.signOut()
        return fail('Failed to create account profile', 403)
      }

      const { error: agentInsertErr } = await adminClient.from('agents').insert({
        user_id: authData.user.id,
        name: '',
        phone: '',
        region: '',
      } as any)

      if (agentInsertErr) {
        console.error('[Login] Failed to create agent profile:', agentInsertErr)
        await supabase.auth.signOut()
        return fail('Failed to create agent profile', 403)
      }

      await createAuditLog({
        actorId: authData.user.id,
        action: 'auth.login_profile_autocreate',
        targetTable: 'users',
        targetId: authData.user.id,
        details: { email: body.email, role: 'agent', status: 'pending' },
      })

      await supabase.auth.signOut()
      return fail('Account pending approval', 403)
    }

    if (profile.status === 'pending') {
      await supabase.auth.signOut()
      return fail('Account pending approval', 403)
    }

    if (profile.status === 'rejected' || profile.status === 'suspended') {
      await supabase.auth.signOut()
      return fail('Account not active', 403)
    }

    return ok({ userId: authData.user.id, role: profile.role, status: profile.status })
  } catch (err) {
    const message = zodErrorMessage(err) ?? (err instanceof Error ? err.message : 'Unknown error')
    console.error('[Login] Error:', message)
    return fail(message, 400)
  }
}

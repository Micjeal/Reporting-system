import { z } from 'zod'
import { ok, fail } from '@/lib/api-response'
import { zodErrorMessage } from '@/lib/zod'
import { createServerSupabase } from '@/lib/supabase-server'
import { adminClient } from '@/lib/supabase-admin'
import { createAuditLog } from '@/lib/audit'

const signupBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1),
  phone: z.string().min(3),
  region: z.string().optional().default(''),
})

export async function POST(req: Request) {
  try {
    const body = signupBodySchema.parse(await req.json())
    console.log('[Signup] Starting signup for:', body.email)

    // Try using the regular Supabase client first (more reliable)
    const supabase = await createServerSupabase()
    
    console.log('[Signup] Calling supabase.auth.signUp...')
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
    })

    console.log('[Signup] Auth response:', { 
      hasUser: !!authData?.user, 
      userId: authData?.user?.id,
      error: authError?.message || authError?.code || 'null',
      errorStatus: authError?.status,
    })

    if (authError) {
      console.error('[Signup] Auth error details:', {
        message: authError.message,
        code: authError.code,
        status: authError.status,
        name: authError.name,
      })
      return fail(authError.message || 'Failed to create user account', 400)
    }

    // If no user is returned, it means email confirmation is required
    // This is expected behavior when Supabase email confirmation is enabled
    if (!authData?.user) {
      console.log('[Signup] No user returned - email confirmation required')
      return ok({ 
        userId: null, 
        status: 'email_confirmation_required' as const,
        message: 'Please check your email to confirm your account, then wait for admin approval.'
      })
    }

    // User was created successfully (email already confirmed or auto-confirm is enabled)
    const userId = authData.user.id
    console.log('[Signup] Created auth user:', userId)

    // Confirm email automatically (skip email verification)
    console.log('[Signup] Confirming email...')
    const { error: confirmError } = await adminClient.auth.admin.updateUserById(userId, {
      email_confirm: true,
    })

    if (confirmError) {
      console.warn('[Signup] Email confirm warning:', confirmError)
      // Don't fail on this, continue anyway
    } else {
      console.log('[Signup] Email confirmed successfully')
    }

    // Create user profile
    console.log('[Signup] Creating user profile...')
    const { error: userInsertError } = await adminClient.from('users').insert({
      id: userId,
      email: body.email,
      role: 'agent',
      status: 'pending',
    })
    
    if (userInsertError) {
      console.error('[Signup] User insert error:', userInsertError)
      return fail(userInsertError.message || 'Failed to create user profile', 400)
    }

    // Create agent profile
    console.log('[Signup] Creating agent profile...')
    const { error: agentInsertError } = await adminClient.from('agents').insert({
      user_id: userId,
      name: body.fullName,
      phone: body.phone,
      region: body.region || 'Unassigned',
    })
    
    if (agentInsertError) {
      console.error('[Signup] Agent insert error:', agentInsertError)
      return fail(agentInsertError.message || 'Failed to create agent profile', 400)
    }

    console.log('[Signup] Creating audit log...')
    await createAuditLog({
      actorId: userId,
      action: 'auth.signup',
      targetTable: 'users',
      targetId: userId,
      details: { email: body.email, role: 'agent', status: 'pending' },
    })

    console.log('[Signup] Signup successful for:', body.email)
    return ok({ userId, status: 'pending' as const })
  } catch (err) {
    const message = zodErrorMessage(err) ?? (err instanceof Error ? err.message : 'Unknown error')
    console.error('[Signup] Caught error:', {
      message,
      type: err instanceof Error ? err.constructor.name : typeof err,
      stack: err instanceof Error ? err.stack : 'no stack',
    })
    return fail(message, 400)
  }
}


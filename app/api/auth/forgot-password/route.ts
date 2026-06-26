import { z } from 'zod'
import { ok, fail } from '@/lib/api-response'
import { zodErrorMessage } from '@/lib/zod'
import { createServerSupabase } from '@/lib/supabase-server'
import { createAuditLog } from '@/lib/audit'

const forgotPasswordBodySchema = z.object({
  email: z.string().email(),
})

export async function POST(req: Request) {
  try {
    const body = forgotPasswordBodySchema.parse(await req.json())
    const supabase = await createServerSupabase()

    let actorId: string | null = null
    try {
      const { data: { user } } = await supabase.auth.getUser()
      actorId = user?.id ?? null
    } catch {
      // Public endpoint, no authenticated user
    }

    const { error } = await supabase.auth.resetPasswordForEmail(body.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    })

    if (error) {
      console.error('[ForgotPassword] Supabase error:', error)
    } else {
      console.log('[ForgotPassword] Reset email sent successfully to:', body.email)
    }

    await createAuditLog({
      actorId: actorId || null,
      action: 'auth.password_reset_requested',
      targetTable: 'users',
      targetId: 'unknown',
      details: { email: body.email, ...(error && { error: error.message }) },
    })

    return ok(
      { message: 'If an account exists, a password reset link has been sent to your email.', success: true },
      { status: 201 }
    )
  } catch (err) {
    const message = zodErrorMessage(err) ?? (err instanceof Error ? err.message : 'Unknown error')
    return fail(message, 400)
  }
}
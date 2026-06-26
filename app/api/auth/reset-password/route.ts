import { z } from 'zod'
import { ok, fail } from '@/lib/api-response'
import { zodErrorMessage } from '@/lib/zod'
import { createServerSupabase } from '@/lib/supabase-server'
import { adminClient } from '@/lib/supabase-admin'
import { createAuditLog } from '@/lib/audit'

const resetPasswordSchema = z.object({
  access_token: z.string().min(1, 'Access token is required'),
  password: z.string().min(8).regex(/[A-Z]/, 'Password must contain an uppercase letter').regex(/[0-9]/, 'Password must contain a number'),
  confirm_password: z.string(),
}).refine(data => data.password === data.confirm_password, { message: 'Passwords do not match', path: ['confirm_password'] })

export async function POST(req: Request) {
  try {
    const body = resetPasswordSchema.parse(await req.json())

    const supabase = await createServerSupabase()

    await supabase.auth.setSession({
      access_token: body.access_token,
      refresh_token: '',
    })

    const { data, error } = await supabase.auth.updateUser({
      password: body.password,
    })

    if (error || !data.user) return fail(error?.message ?? 'Failed to reset password', 400)

    const decodedToken = await adminClient.auth.getUser(body.access_token)
    const actorId = decodedToken.data.user?.id ?? data.user.id

    await createAuditLog({
      actorId,
      action: 'auth.password_reset_completed',
      targetTable: 'users',
      targetId: data.user.id,
    })

    return ok({ message: 'Password reset successfully', success: true })
  } catch (err) {
    const message = zodErrorMessage(err) ?? (err instanceof Error ? err.message : 'Unknown error')
    return fail(message, 400)
  }
}

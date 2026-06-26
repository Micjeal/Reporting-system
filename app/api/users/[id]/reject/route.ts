import { ok, fail } from '@/lib/api-response'
import { withRole } from '@/lib/middleware-guards'
import { adminClient } from '@/lib/supabase-admin'
import { createAuditLog } from '@/lib/audit'
import type { NextRequest } from 'next/server'

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await withRole(req, ['admin'])
  if (!auth.isValid) return auth.response!

  const { id } = await ctx.params
  const { data, error } = await adminClient
    .from('users')
    .update({ status: 'rejected' })
    .eq('id', id)
    .select('id,status')
    .single()

  if (error || !data) return fail(error?.message ?? 'User not found', 400)

  await createAuditLog({
    actorId: auth.user!.id,
    action: 'users.reject',
    targetTable: 'users',
    targetId: id,
    details: { status: 'rejected' },
  })

  return ok(data)
}

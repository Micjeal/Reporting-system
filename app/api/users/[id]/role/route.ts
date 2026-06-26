import { z } from 'zod'
import { ok, fail } from '@/lib/api-response'
import { zodErrorMessage } from '@/lib/zod'
import { withRole } from '@/lib/middleware-guards'
import { adminClient } from '@/lib/supabase-admin'
import { createAuditLog } from '@/lib/audit'
import type { NextRequest } from 'next/server'

const bodySchema = z.object({
  role: z.enum(['admin', 'manager', 'agent']),
})

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await withRole(req, ['admin'])
  if (!auth.isValid) return auth.response!

  try {
    const body = bodySchema.parse(await req.json())
    const { id } = await ctx.params

    const { data, error } = await adminClient
      .from('users')
      .update({ role: body.role })
      .eq('id', id)
      .select('id,role')
      .single()

    if (error || !data) return fail(error?.message ?? 'User not found', 400)

    await createAuditLog({
      actorId: auth.user!.id,
      action: 'users.role',
      targetTable: 'users',
      targetId: id,
      details: { role: body.role },
    })

    return ok(data)
  } catch (err) {
    const message = zodErrorMessage(err) ?? (err instanceof Error ? err.message : 'Unknown error')
    return fail(message, 400)
  }
}

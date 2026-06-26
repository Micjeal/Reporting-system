import { z } from 'zod'
import { ok, fail } from '@/lib/api-response'
import { zodErrorMessage } from '@/lib/zod'
import { withAuth } from '@/lib/middleware-guards'
import { adminClient } from '@/lib/supabase-admin'
import { createAuditLog } from '@/lib/audit'
import type { NextRequest } from 'next/server'

const updateSaleSchema = z.object({
  quantity: z.number().int().positive().optional(),
  amount: z.number().positive().optional(),
  date: z.string().min(10).optional(),
})

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await withAuth(req)
  if (!auth.isValid) return auth.response!

  try {
    const body = updateSaleSchema.parse(await req.json())
    const { id } = await ctx.params

    const { data, error } = await adminClient
      .from('sales')
      .update(body as unknown as never)
      .eq('id', id)
      .select('*')
      .single()

    if (error || !data) return fail(error?.message ?? 'Sale not found', 400)

    await createAuditLog({
      actorId: auth.user!.id,
      action: 'sales.update',
      targetTable: 'sales',
      targetId: id,
      details: body,
    })

    return ok(data)
  } catch (err) {
    const message = zodErrorMessage(err) ?? (err instanceof Error ? err.message : 'Unknown error')
    return fail(message, 400)
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await withAuth(req)
  if (!auth.isValid) return auth.response!

  const { id } = await ctx.params
  const { error } = await adminClient.from('sales').delete().eq('id', id)
  if (error) return fail(error.message, 400)

  await createAuditLog({
    actorId: auth.user!.id,
    action: 'sales.delete',
    targetTable: 'sales',
    targetId: id,
  })

  return ok({ success: true })
}

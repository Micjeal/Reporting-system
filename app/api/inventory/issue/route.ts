import { z } from 'zod'
import { ok, fail } from '@/lib/api-response'
import { zodErrorMessage } from '@/lib/zod'
import { withRole } from '@/lib/middleware-guards'
import { adminClient } from '@/lib/supabase-admin'
import { createAuditLog } from '@/lib/audit'

const issueSchema = z.object({
  agent_id: z.string().min(1),
  product_id: z.string().min(1),
  quantity_issued: z.number().int().positive(),
  date_issued: z.string().min(10),
})

export async function POST(req: Request) {
  const auth = await withRole(req, ['admin', 'manager'])
  if (!auth.isValid) return auth.response!

  try {
    const body = issueSchema.parse(await req.json())

    const { data, error } = await adminClient
      .from('inventory')
      .insert(body)
      .select('*')
      .single()

    if (error || !data) return fail(error?.message ?? 'Failed to issue inventory', 400)

    await createAuditLog({
      actorId: auth.user!.id,
      action: 'inventory.issue',
      targetTable: 'inventory',
      targetId: data.id,
      details: body,
    })

    return ok(data, { status: 201 })
  } catch (err) {
    const message = zodErrorMessage(err) ?? (err instanceof Error ? err.message : 'Unknown error')
    return fail(message, 400)
  }
}

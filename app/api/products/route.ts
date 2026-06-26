import { z } from 'zod'
import { ok, fail } from '@/lib/api-response'
import { zodErrorMessage } from '@/lib/zod'
import { withRole } from '@/lib/middleware-guards'
import { adminClient } from '@/lib/supabase-admin'
import { createAuditLog } from '@/lib/audit'
import type { Database } from '@/types/database'

type ProductRow = Database['public']['Tables']['products']['Row']

const productCreateSchema = z.object({
  name: z.string().min(1),
  unit_price: z.number().positive(),
  quantity: z.number().int().nonnegative().optional().default(0),
  description: z.string().nullable().optional().default(null),
})

export async function GET(req: Request) {
  const url = new URL(req.url)
  const q = url.searchParams.get('q')

  let query = adminClient
    .from('products')
    .select('id,name,unit_price,quantity,description,status,created_at')
    .order('name', { ascending: true })

  if (q) query = query.ilike('name', `%${q}%`)

  const { data, error } = await query
  if (error) return fail(error.message, 400)
  return ok(data ?? [])
}

export async function POST(req: Request) {
  const auth = await withRole(req, ['admin'])
  if (!auth.isValid) return auth.response!

  try {
    const body = productCreateSchema.parse(await req.json())

    const { data, error } = await adminClient
      .from('products')
      .insert(body as unknown as never)
      .select('*')
      .single()

    const product = data as ProductRow | null
    if (error || !product) return fail(error?.message ?? 'Failed to create product', 400)

    await createAuditLog({
      actorId: auth.user!.id,
      action: 'products.create',
      targetTable: 'products',
      targetId: product.id,
      details: body,
    })

    return ok(product, { status: 201 })
  } catch (err) {
    const message = zodErrorMessage(err) ?? (err instanceof Error ? err.message : 'Unknown error')
    return fail(message, 400)
  }
}

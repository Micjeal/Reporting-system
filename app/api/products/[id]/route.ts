import { z } from 'zod'
import { ok, fail } from '@/lib/api-response'
import { zodErrorMessage } from '@/lib/zod'
import { withRole } from '@/lib/middleware-guards'
import { adminClient } from '@/lib/supabase-admin'
import { createAuditLog } from '@/lib/audit'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/database'

type ProductRow = Database['public']['Tables']['products']['Row']

const productUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  unit_price: z.number().positive().optional(),
  quantity: z.number().int().nonnegative().optional(),
  description: z.string().nullable().optional(),
  status: z.enum(['active', 'inactive']).optional(),
})

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await withRole(req, ['admin'])
  if (!auth.isValid) return auth.response!

  try {
    const body = productUpdateSchema.parse(await req.json())
    const { id } = await ctx.params

    const { data, error } = await adminClient
      .from('products')
      .update(body as unknown as never)
      .eq('id', id)
      .select('*')
      .single()

    const product = data as ProductRow | null
    if (error || !product) return fail(error?.message ?? 'Product not found', 400)

    await createAuditLog({
      actorId: auth.user!.id,
      action: 'products.update',
      targetTable: 'products',
      targetId: id,
      details: body,
    })

    return ok(product)
  } catch (err) {
    const message = zodErrorMessage(err) ?? (err instanceof Error ? err.message : 'Unknown error')
    return fail(message, 400)
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await withRole(req, ['admin'])
  if (!auth.isValid) return auth.response!

  const { id } = await ctx.params
  const productIdNum = Number(id)

  // Check for force delete flag (only for development/testing)
  const { searchParams } = new URL(req.url)
  const force = searchParams.get('force') === 'true'

  if (!force) {
    // Check if product is referenced in sale_items
    const { data: saleItems, error: checkError } = await adminClient
      .from('sale_items')
      .select('id')
      .eq('product_id', productIdNum)
      .limit(1)

    if (checkError) {
      return fail('Failed to check product references', 500)
    }

    if (saleItems && saleItems.length > 0) {
      return fail(
        'Cannot delete product that has been used in sales. Consider marking it as inactive instead.',
        400
      )
    }
  } else {
    // Force delete: remove related sale_items first
    const { error: deleteItemsError } = await adminClient
      .from('sale_items')
      .delete()
      .eq('product_id', productIdNum)
    
    if (deleteItemsError) {
      return fail('Failed to delete related sale items', 500)
    }
  }

  // Proceed with deletion
  const { error } = await adminClient.from('products').delete().eq('id', id)
  if (error) return fail(error.message, 400)

  await createAuditLog({
    actorId: auth.user!.id,
    action: force ? 'products.force_delete' : 'products.delete',
    targetTable: 'products',
    targetId: id,
  })

  return ok({ success: true })
}

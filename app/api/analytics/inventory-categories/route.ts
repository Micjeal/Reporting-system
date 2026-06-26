import { ok, fail } from '@/lib/api-response'
import { withRole } from '@/lib/middleware-guards'
import { adminClient } from '@/lib/supabase-admin'

type InventoryItem = {
  product_id: string
  quantity_issued: number
}

type ProductItem = {
  id: string
  name: string
}

export async function GET(req: Request) {
  const auth = await withRole(req, ['admin', 'manager'])
  if (!auth.isValid) return auth.response!

  const [{ data: inventory, error: invErr }, { data: products, error: prodErr }] = await Promise.all([
    adminClient
      .from('inventory')
      .select('product_id, quantity_issued'),
    adminClient
      .from('products')
      .select('id, name'),
  ])

  if (invErr) return fail(invErr.message, 400)
  if (prodErr) return fail(prodErr.message, 400)

  const productNames = new Map(
    ((products ?? []) as ProductItem[]).map(product => [product.id, product.name])
  )

  const productStats = new Map<string, { product: string; total_units: number }>()

  for (const item of (inventory ?? []) as InventoryItem[]) {
    const productName = productNames.get(item.product_id) || 'Unknown Product'
    const cur = productStats.get(item.product_id) ?? { product: productName, total_units: 0 }
    cur.total_units += item.quantity_issued ?? 0
    productStats.set(item.product_id, cur)
  }

  const result = Array.from(productStats.values())
    .sort((a, b) => b.total_units - a.total_units)

  return ok(result)
}

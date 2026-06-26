import { ok, fail } from '@/lib/api-response'
import { withRole } from '@/lib/middleware-guards'
import { adminClient } from '@/lib/supabase-admin'

type InventoryItem = { product_id: string; quantity_issued: number }
type SalesItem = { product_id: string; quantity: number }
type ProductItem = { id: string; name: string }

export async function GET(req: Request) {
  const auth = await withRole(req, ['admin', 'manager'])
  if (!auth.isValid) return auth.response!

  const [{ data: inventory, error: invErr }, { data: sales, error: salesErr }, { data: products, error: prodErr }] = await Promise.all([
    adminClient.from('inventory').select('product_id, quantity_issued'),
    adminClient.from('sales').select('product_id, quantity'),
    adminClient.from('products').select('id, name')
  ])

  if (invErr) return fail(invErr.message, 400)
  if (salesErr) return fail(salesErr.message, 400)
  if (prodErr) return fail(prodErr.message, 400)

  const productStats = new Map<string, { product: string; issued: number; sold: number }>()

  for (const p of (products ?? []) as ProductItem[]) {
    productStats.set(p.id, { product: p.name, issued: 0, sold: 0 })
  }

  for (const i of (inventory ?? []) as InventoryItem[]) {
    if (productStats.has(i.product_id) && i.quantity_issued !== null) {
      productStats.get(i.product_id)!.issued += i.quantity_issued
    }
  }

  for (const s of (sales ?? []) as SalesItem[]) {
    if (productStats.has(s.product_id) && s.quantity !== null) {
      productStats.get(s.product_id)!.sold += s.quantity
    }
  }

  const result = Array.from(productStats.values())
    .filter(p => p.issued > 0 || p.sold > 0)
    .sort((a, b) => b.issued - a.issued)
    .slice(0, 10)

  return ok(result)
}

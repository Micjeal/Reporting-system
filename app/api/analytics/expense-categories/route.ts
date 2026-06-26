import { ok, fail } from '@/lib/api-response'
import { withRole } from '@/lib/middleware-guards'
import { adminClient } from '@/lib/supabase-admin'

export async function GET(req: Request) {
  const auth = await withRole(req, ['admin', 'manager'])
  if (!auth.isValid) return auth.response!

  const { data: expenses, error } = await adminClient.from('expenses').select('category, amount')

  if (error) return fail(error.message, 400)

  const catMap = new Map<string, number>()
  let total = 0

  for (const e of expenses || []) {
    const current = catMap.get(e.category) || 0
    catMap.set(e.category, current + e.amount)
    total += e.amount
  }

  const result = Array.from(catMap.entries()).map(([category, value]) => {
    const capitalized = category.charAt(0).toUpperCase() + category.slice(1)
    return {
      category: capitalized,
      value: Number(value.toFixed(2)),
      percentage: total > 0 ? Math.round((value / total) * 100) : 0
    }
  }).sort((a, b) => b.value - a.value)

  return ok(result)
}

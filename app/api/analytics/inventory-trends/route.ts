import { z } from 'zod'
import { ok, fail } from '@/lib/api-response'
import { withRole } from '@/lib/middleware-guards'
import { adminClient } from '@/lib/supabase-admin'

const querySchema = z.object({
  days: z.coerce.number().int().positive().max(365).optional().default(30),
})

function isoDateUTC(d = new Date()) {
  return d.toISOString().slice(0, 10)
}

export async function GET(req: Request) {
  const auth = await withRole(req, ['admin', 'manager'])
  if (!auth.isValid) return auth.response!

  const url = new URL(req.url)
  const query = querySchema.parse({
    days: url.searchParams.get('days') ?? undefined,
  })

  const end = isoDateUTC()
  const startDate = new Date()
  startDate.setUTCDate(startDate.getUTCDate() - query.days)
  const start = isoDateUTC(startDate)

  const { data: inventory, error } = await adminClient
    .from('inventory')
    .select('date_issued, quantity_issued')
    .gte('date_issued', start)
    .lte('date_issued', end)

  if (error) return fail(error.message, 400)

  const byDay = new Map<string, { total_units: number; item_count: number }>()
  for (const row of inventory ?? []) {
    const cur = byDay.get(row.date_issued) ?? { total_units: 0, item_count: 0 }
    cur.total_units += row.quantity_issued ?? 0
    cur.item_count += 1
    byDay.set(row.date_issued, cur)
  }

  const trends = [...byDay.entries()]
    .map(([date, v]) => ({
      date,
      total_units: v.total_units,
      item_count: v.item_count,
    }))
    .sort((a, b) => (a.date < b.date ? -1 : 1))

  return ok(trends)
}

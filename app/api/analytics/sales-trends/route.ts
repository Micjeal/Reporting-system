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
  const query = querySchema.parse({ days: url.searchParams.get('days') ?? undefined })

  const end = isoDateUTC()
  const startDate = new Date()
  startDate.setUTCDate(startDate.getUTCDate() - query.days)
  const start = isoDateUTC(startDate)

  const { data: sales, error } = await adminClient
    .from('sales')
    .select('date,amount')
    .gte('date', start)
    .lte('date', end)

  if (error) return fail(error.message, 400)

  const byDay = new Map<string, { daily_total: number; sale_count: number }>()
  for (const row of sales ?? []) {
    if (!row.date) continue // Skip rows without date
    const cur = byDay.get(row.date) ?? { daily_total: 0, sale_count: 0 }
    cur.daily_total += row.amount ?? 0
    cur.sale_count += 1
    byDay.set(row.date, cur)
  }

  const trends = [...byDay.entries()]
    .map(([sale_date, v]) => ({
      sale_date,
      daily_total: Number(v.daily_total.toFixed(2)),
      sale_count: v.sale_count,
    }))
    .sort((a, b) => (a.sale_date < b.sale_date ? -1 : 1))

  return ok(trends)
}

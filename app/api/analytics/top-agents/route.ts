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
    .select('agent_id,amount')
    .gte('date', start)
    .lte('date', end)

  if (error) return fail(error.message, 400)

  const agg = new Map<string, { total_sales: number; sale_count: number }>()
  for (const row of sales ?? []) {
    const cur = agg.get(row.agent_id) ?? { total_sales: 0, sale_count: 0 }
    cur.total_sales += row.amount ?? 0
    cur.sale_count += 1
    agg.set(row.agent_id, cur)
  }

  const agentIds = [...agg.keys()]
  const { data: agents } = await adminClient.from('agents').select('id,name,region,phone').in('id', agentIds)
  const agentById = new Map((agents ?? []).map((a) => [a.id, a]))

  const ranked = agentIds
    .map((id) => {
      const agent = agentById.get(id)
      const a = agg.get(id)!
      return {
        agent_id: id,
        agent_name: agent?.name ?? 'Unknown',
        region: agent?.region ?? '',
        phone: agent?.phone ?? '',
        total_sales: Number(a.total_sales.toFixed(2)),
        sale_count: a.sale_count,
      }
    })
    .sort((a, b) => b.total_sales - a.total_sales)

  return ok(ranked)
}

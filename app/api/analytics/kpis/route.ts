import { ok, fail } from '@/lib/api-response'
import { withRole } from '@/lib/middleware-guards'
import { adminClient } from '@/lib/supabase-admin'

function isoDateUTC(d = new Date()) {
  return d.toISOString().slice(0, 10)
}

export async function GET(req: Request) {
  const auth = await withRole(req, ['admin', 'manager'])
  if (!auth.isValid) return auth.response!

  const today = isoDateUTC()

  const [{ data: salesRows, error: salesErr }, { data: expenseRows, error: expenseErr }] =
    await Promise.all([
      adminClient.from('sales').select('amount').eq('date', today),
      adminClient.from('expenses').select('amount').eq('date', today),
    ])

  if (salesErr) return fail(salesErr.message, 400)
  if (expenseErr) return fail(expenseErr.message, 400)

  const totalSalesToday = (salesRows ?? []).reduce((sum, r) => sum + (r.amount ?? 0), 0)
  const totalExpensesToday = (expenseRows ?? []).reduce((sum, r) => sum + (r.amount ?? 0), 0)

  const [{ count: activeAgents, error: activeErr }, { count: pendingApprovals, error: pendingErr }] =
    await Promise.all([
      adminClient.from('users').select('*', { count: 'exact', head: true }).eq('role', 'agent').eq('status', 'active'),
      adminClient.from('users').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ])

  if (activeErr) return fail(activeErr.message, 400)
  if (pendingErr) return fail(pendingErr.message, 400)

  const { data: invRows, error: invErr } = await adminClient
    .from('inventory')
    .select('quantity_issued')
    .eq('date_issued', today)

  if (invErr) return fail(invErr.message, 400)
  const inventoryIssuedToday = (invRows ?? []).reduce((sum, r) => sum + (r.quantity_issued ?? 0), 0)

  return ok({
    total_sales_today: totalSalesToday,
    total_expenses_today: totalExpensesToday,
    active_agents: activeAgents ?? 0,
    pending_approvals: pendingApprovals ?? 0,
    inventory_issued: inventoryIssuedToday,
    net_revenue_estimate: totalSalesToday - totalExpensesToday,
  })
}

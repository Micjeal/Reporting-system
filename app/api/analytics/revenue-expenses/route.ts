import { ok, fail } from '@/lib/api-response'
import { withRole } from '@/lib/middleware-guards'
import { adminClient } from '@/lib/supabase-admin'

function isoDateUTC(d = new Date()) {
  return d.toISOString().slice(0, 10)
}

export async function GET(req: Request) {
  const auth = await withRole(req, ['admin', 'manager'])
  if (!auth.isValid) return auth.response!

  const now = new Date()
  const endDate = isoDateUTC(now)
  
  const startDateObj = new Date(now.getFullYear(), now.getMonth() - 11, 1)
  const startDate = isoDateUTC(startDateObj)

  const [{ data: sales, error: salesErr }, { data: expenses, error: expErr }] = await Promise.all([
    adminClient.from('sales').select('date, amount').gte('date', startDate).lte('date', endDate),
    adminClient.from('expenses').select('date, amount').gte('date', startDate).lte('date', endDate),
  ])

  if (salesErr) return fail(salesErr.message, 400)
  if (expErr) return fail(expErr.message, 400)

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthsData = new Map<string, { month: string, revenue: number, expenses: number }>()

  // Initialize the last 12 months in order
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthsData.set(key, { month: monthNames[d.getMonth()], revenue: 0, expenses: 0 })
  }

  for (const s of sales || []) {
    if (!s.date || s.amount == null) continue
    const key = s.date.slice(0, 7) // YYYY-MM
    if (monthsData.has(key)) {
      monthsData.get(key)!.revenue += s.amount
    }
  }

  for (const e of expenses || []) {
    if (!e.date || e.amount == null) continue
    const key = e.date.slice(0, 7) // YYYY-MM
    if (monthsData.has(key)) {
      monthsData.get(key)!.expenses += e.amount
    }
  }

  return ok(Array.from(monthsData.values()))
}

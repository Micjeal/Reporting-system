import { ok, fail } from '@/lib/api-response'
import { withRole } from '@/lib/middleware-guards'
import { adminClient } from '@/lib/supabase-admin'

export async function GET(req: Request) {
  const auth = await withRole(req, ['admin', 'manager'])
  if (!auth.isValid) return auth.response!

  const url = new URL(req.url)
  const page = parseInt(url.searchParams.get('page') || '1', 10)
  const limit = parseInt(url.searchParams.get('limit') || '20', 10)
  const search = url.searchParams.get('search')
  const action = url.searchParams.get('action')
  const actorId = url.searchParams.get('actor_id')
  const dateFrom = url.searchParams.get('date_from')
  const dateTo = url.searchParams.get('date_to')

  // Calculate offset
  const offset = (page - 1) * limit

  // Build query for count
  let countQuery = adminClient
    .from('audit_logs')
    .select('id', { count: 'exact', head: true })

  // Build query for data
  let dataQuery = adminClient
    .from('audit_logs')
    .select('id,actor_id,action,target_table,target_id,details,created_at')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  // Apply filters to both queries
  if (action && action !== 'All') {
    countQuery = countQuery.eq('action', action)
    dataQuery = dataQuery.eq('action', action)
  }
  if (actorId) {
    countQuery = countQuery.eq('actor_id', actorId)
    dataQuery = dataQuery.eq('actor_id', actorId)
  }
  if (dateFrom) {
    countQuery = countQuery.gte('created_at', dateFrom)
    dataQuery = dataQuery.gte('created_at', dateFrom)
  }
  if (dateTo) {
    countQuery = countQuery.lte('created_at', dateTo)
    dataQuery = dataQuery.lte('created_at', dateTo)
  }
  if (search) {
    // Search in action or actor_id
    countQuery = countQuery.or(`action.ilike.%${search}%,actor_id.ilike.%${search}%`)
    dataQuery = dataQuery.or(`action.ilike.%${search}%,actor_id.ilike.%${search}%`)
  }

  // Execute both queries
  const [{ count }, { data, error }] = await Promise.all([
    countQuery,
    dataQuery
  ])

  if (error) return fail(error.message, 400)

  return ok({
    logs: data ?? [],
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit)
  })
}

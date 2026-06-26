import { z } from 'zod'
import { ok, fail } from '@/lib/api-response'
import { zodErrorMessage } from '@/lib/zod'
import { withAuth, getUserProfile } from '@/lib/middleware-guards'
import { adminClient } from '@/lib/supabase-admin'
import { getAgentIdForUser } from '@/lib/server/agents'
import { createAuditLog } from '@/lib/audit'

const createExpenseSchema = z.object({
  category: z.enum(['fuel', 'food', 'accommodation', 'airtime', 'other']),
  description: z.string().min(1),
  amount: z.number().positive(),
  receipt_url: z.string().url().nullable().optional().default(null).or(z.literal('')).transform(v => v === '' ? null : v),
  date: z.string().min(10),
})

export async function GET(req: Request) {
  const auth = await withAuth(req)
  if (!auth.isValid) return auth.response!

  const url = new URL(req.url)
  const category = url.searchParams.get('category')
  // Support both 'from_date' (frontend) and 'date_from' (legacy) query params
  const dateFrom = url.searchParams.get('from_date') || url.searchParams.get('date_from')
  // Support both 'to_date' (frontend) and 'date_to' (legacy) query params
  const dateTo = url.searchParams.get('to_date') || url.searchParams.get('date_to')
  const agentId = url.searchParams.get('agent_id')

  const profile = await getUserProfile(auth.user!.id)
  if (!profile) return fail('User profile not found', 403)

  let query = adminClient
    .from('expenses')
    .select('id,agent_id,category,description,amount,receipt_url,date,created_at')
    .order('date', { ascending: false })

  if (category) query = query.eq('category', category as any)
  if (dateFrom) query = query.gte('date', dateFrom)
  if (dateTo) query = query.lte('date', dateTo)

  if (profile.role === 'agent') {
    const myAgentId = await getAgentIdForUser(auth.user!.id)
    if (!myAgentId) {
      console.warn('Agent profile not found for user', auth.user!.id)
      // No agent record; return empty result set
      return ok([])
    }
    query = query.eq('agent_id', myAgentId)
  } else if (agentId) {
    query = query.eq('agent_id', agentId)
  }

  const { data, error } = await query
  
  console.log('[EXPENSES API GET] Query result:', { 
    dataCount: data?.length ?? 0, 
    error: error?.message,
    profile: { role: profile.role, userId: auth.user!.id }
  })
  
  if (error) return fail(error.message, 400)
  return ok(data ?? [])
}

export async function POST(req: Request) {
  const auth = await withAuth(req)
  if (!auth.isValid) return auth.response!

  try {
    const body = createExpenseSchema.parse(await req.json())

    const myAgentId = await getAgentIdForUser(auth.user!.id)
    if (!myAgentId) {
      console.warn('Agent profile not found for user', auth.user!.id)
      return fail('Agent profile not found', 404)
    }

    const { data, error } = await adminClient
      .from('expenses')
      .insert({ ...body, agent_id: myAgentId })
      .select('*')
      .single()

    if (error || !data) return fail(error?.message ?? 'Failed to create expense', 400)

    await createAuditLog({
      actorId: auth.user!.id,
      action: 'expenses.create',
      targetTable: 'expenses',
      targetId: data.id,
      details: body,
    })

    return ok(data, { status: 201 })
  } catch (err) {
    const message = zodErrorMessage(err) ?? (err instanceof Error ? err.message : 'Unknown error')
    return fail(message, 400)
  }
}

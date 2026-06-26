import { z } from 'zod'
import { ok, fail } from '@/lib/api-response'
import { withRole } from '@/lib/middleware-guards'
import { adminClient } from '@/lib/supabase-admin'

const querySchema = z.object({
  status: z.string().optional(),
  role: z.string().optional(),
  q: z.string().optional(),
})

export async function GET(req: Request) {
  const auth = await withRole(req, ['admin', 'manager'])
  if (!auth.isValid) return auth.response!

  const url = new URL(req.url)
  const query = querySchema.parse({
    status: url.searchParams.get('status') ?? undefined,
    role: url.searchParams.get('role') ?? undefined,
    q: url.searchParams.get('q') ?? undefined,
  })

  let usersQuery = adminClient
    .from('users')
    .select('id,email,role,status,created_at')
    .order('created_at', { ascending: false })

  if (query.status) usersQuery = usersQuery.eq('status', query.status as any)
  if (query.role) usersQuery = usersQuery.eq('role', query.role as any)
  if (query.q) usersQuery = usersQuery.ilike('email', `%${query.q}%`)

  const { data: users, error } = await usersQuery
  if (error) return fail(error.message, 400)

  const userIds = (users ?? []).map((u) => u.id)
  const { data: agents } = await adminClient
    .from('agents')
    .select('user_id,name,phone,region')
    .in('user_id', userIds)

  const agentByUserId = new Map((agents ?? []).map((a) => [a.user_id, a]))

  const shaped = (users ?? []).map((u) => {
    const agent = agentByUserId.get(u.id)
    return {
      id: u.id,
      email: u.email,
      role: u.role,
      status: u.status,
      created_at: u.created_at,
      updated_at: u.created_at, // Use created_at as fallback since updated_at doesn't exist
      name: agent?.name ?? null,
      phone: agent?.phone ?? null,
      region: agent?.region ?? null,
    }
  })

  return ok(shaped)
}

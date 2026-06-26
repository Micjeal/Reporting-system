import { ok, fail } from '@/lib/api-response'
import { withAuth } from '@/lib/middleware-guards'
import { adminClient } from '@/lib/supabase-admin'
import { getAgentIdForUser } from '@/lib/server/agents'

/**
 * GET /api/agents/me
 * Returns the current user's agent profile
 */
export async function GET(req: Request) {
  const auth = await withAuth(req)
  if (!auth.isValid) return auth.response!

  try {
    const userId = auth.user!.id

    // Get the agent ID for this user
    const agentId = await getAgentIdForUser(userId)
    if (!agentId) {
      return fail('No agent profile found for this user', 404)
    }

    // Fetch the agent details
    const { data, error } = await adminClient
      .from('agents')
      .select(`
        id,
        user_id,
        name,
        phone,
        region,
        monthly_target,
        created_at
      `)
      .eq('id', String(agentId))
      .single()

    if (error) return fail(error.message, 400)
    if (!data) return fail('Agent not found', 404)

    return ok(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return fail(message, 400)
  }
}

/**
 * PATCH /api/agents/me
 * Updates the current user's agent profile
 */
export async function PATCH(req: Request) {
  const auth = await withAuth(req)
  if (!auth.isValid) return auth.response!

  try {
    const userId = auth.user!.id
    const body = await req.json()

    console.log('PATCH /api/agents/me - userId:', userId)
    console.log('PATCH /api/agents/me - body:', body)

    // Get the agent ID for this user
    const agentId = await getAgentIdForUser(userId)
    if (!agentId) {
      console.error('No agent profile found for user:', userId)
      return fail('No agent profile found for this user', 404)
    }

    console.log('PATCH /api/agents/me - agentId:', agentId)

    // Validate and extract allowed fields
    const allowedFields = ['name', 'phone', 'region', 'monthly_target']
    const updates: { name?: string; phone?: string; region?: string; monthly_target?: number } = {}
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field as keyof typeof updates] = body[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      console.error('No valid fields to update')
      return fail('No valid fields to update', 400)
    }

    console.log('PATCH /api/agents/me - updates:', updates)

    // Update the agent profile
    const { data, error } = await adminClient
      .from('agents')
      .update(updates)
      .eq('id', String(agentId))
      .select(`
        id,
        user_id,
        name,
        phone,
        region,
        monthly_target,
        created_at
      `)
      .single()

    if (error) {
      console.error('Supabase update error:', error)
      return fail(error.message, 400)
    }
    if (!data) {
      console.error('No data returned from update')
      return fail('Failed to update agent profile', 400)
    }

    console.log('PATCH /api/agents/me - success:', data)
    return ok(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('PATCH /api/agents/me - exception:', err)
    return fail(message, 400)
  }
}

import { z } from 'zod'
import { ok, fail } from '@/lib/api-response'
import { zodErrorMessage } from '@/lib/zod'
import { withAuth, getUserProfile } from '@/lib/middleware-guards'
import { adminClient } from '@/lib/supabase-admin'
import { getAgentIdForUser } from '@/lib/server/agents'
import { createAuditLog } from '@/lib/audit'

const createInventoryRequestSchema = z.object({
  product_id: z.union([z.string(), z.number()])
    .transform((v) => String(v))
    .refine((v) => v !== '' && v !== '0', { message: 'Product ID is required' }),
  quantity_requested: z.number().int().positive('Quantity must be at least 1'),
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500, 'Reason must be less than 500 characters'),
})

export async function POST(req: Request) {
  const auth = await withAuth(req)
  if (!auth.isValid) return auth.response!

  try {
    const body = createInventoryRequestSchema.parse(await req.json())

    const myAgentId = await getAgentIdForUser(auth.user!.id)
    if (!myAgentId) return fail('Agent profile not found', 403)

    // Check if product exists
    const { data: product, error: productError } = await adminClient
      .from('products')
      .select('id, name')
      .eq('id', parseInt(body.product_id, 10).toString())
      .single()

    if (productError || !product) {
      return fail('Product not found', 404)
    }

    // Insert inventory request
    const { data: requestData, error: requestError } = await adminClient
      .from('inventory_requests')
      .insert({
        agent_id: myAgentId,
        product_id: parseInt(body.product_id, 10),
        quantity_requested: body.quantity_requested,
        reason: body.reason,
        status: 'pending',
      } as any)
      .select('*')
      .single() as { data: any; error: any }

    if (requestError || !requestData) {
      return fail(requestError?.message ?? 'Failed to create inventory request', 400)
    }

    // Create audit log
    await createAuditLog({
      actorId: auth.user!.id,
      action: 'inventory_requests.create',
      targetTable: 'inventory_requests',
      targetId: String(requestData.data?.id),
      details: { ...body, product_name: product.name },
    })

    return ok(requestData.data, { status: 201 })
  } catch (err) {
    const message = zodErrorMessage(err) ?? (err instanceof Error ? err.message : 'Unknown error')
    return fail(message, 400)
  }
}

export async function GET(req: Request) {
  const auth = await withAuth(req)
  if (!auth.isValid) return auth.response!

  const profile = await getUserProfile(auth.user!.id)
  if (!profile) return fail('User profile not found', 403)

  // Admins can see all requests, agents only see their own
  let query = adminClient
    .from('inventory_requests' as any)
    .select('id, agent_id, product_id, quantity_requested, reason, status, created_at, updated_at, products(id, name)')

  if (profile.role === 'agent') {
    const myAgentId = await getAgentIdForUser(auth.user!.id)
    if (!myAgentId) return fail('Agent profile not found', 403)
    query = query.eq('agent_id', myAgentId)
  }

  const { data: requests, error } = await query
    .order('created_at', { ascending: false }) as { data: any; error: any }

  console.log('Inventory requests API - data:', requests)
  console.log('Inventory requests API - error:', error)
  console.log('Inventory requests API - requests.data:', requests?.data)

  if (error) return fail(error.message, 400)

  return ok(requests || [])
}

export async function PATCH(req: Request) {
  const auth = await withAuth(req)
  if (!auth.isValid) return auth.response!

  const profile = await getUserProfile(auth.user!.id)
  if (!profile) return fail('User profile not found', 403)

  if (profile.role !== 'admin' && profile.role !== 'manager') {
    return fail('Only admins and managers can approve/reject requests', 403)
  }

  try {
    const body = await req.json()
    const { id, status } = body

    if (!id || !status) {
      return fail('Request ID and status are required', 400)
    }

    if (!['approved', 'rejected'].includes(status)) {
      return fail('Invalid status', 400)
    }

    // Update inventory request status
    const { data: request, error } = await (adminClient
      .from('inventory_requests' as any)
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select('*')
      .single()) as { data: any; error: any }

    if (error || !request) {
      return fail(error?.message ?? 'Failed to update request', 400)
    }

    // Create audit log
    await createAuditLog({
      actorId: auth.user!.id,
      action: `inventory_requests.${status}`,
      targetTable: 'inventory_requests',
      targetId: String(request.data?.id),
      details: { status },
    })

    return ok(request.data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return fail(message, 400)
  }
}

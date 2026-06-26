import { z } from 'zod';
import { ok, fail } from '@/lib/api-response';
import { zodErrorMessage } from '@/lib/zod';
import { withAuth, getUserProfile } from '@/lib/middleware-guards';
import { adminClient } from '@/lib/supabase-admin';
import { getAgentIdForUser } from '@/lib/server/agents';
import { createAuditLog } from '@/lib/audit';

/**
 * VALIDATION
 */
const createInventorySchema = z.object({
  agent_id: z.string().min(1),
  product_id: z.string().min(1),
  quantity_issued: z.number().int().positive(),
  date_issued: z.string().min(10),
});

/**
 * GET INVENTORY
 */
export async function GET(req: Request) {
  const auth = await withAuth(req);
  if (!auth.isValid) return auth.response!;

  const url = new URL(req.url);
  const agentId = url.searchParams.get('agent_id');

  const profile = await getUserProfile(auth.user!.id);
  if (!profile) return fail('User profile not found', 403);

  let query = adminClient
    .from('inventory')
    .select(`
      id,
      agent_id,
      product_id,
      quantity_issued,
      date_issued,
      created_at,
      agents!inner(id, name, region),
      products!inner(id, name, unit_price)
    `)
    .order('date_issued', { ascending: false });

  /**
   * ROLE FILTERING (FIXED)
   */
  if (profile.role === 'agent') {
    const myAgentId = await getAgentIdForUser(auth.user!.id);

    if (!myAgentId) {
      return fail(
        'Agent profile missing. Contact admin.',
        403
      );
    }

    // ✅ FIX: use myAgentId, NOT request agentId
    query = query.eq('agent_id', myAgentId.toString());

  } else if (agentId) {
    query = query.eq('agent_id', parseInt(agentId, 10).toString());
  }

  const { data, error } = await query as { data: any; error: any };

  if (error) return fail(error.message, 400);

  return ok(data ?? []);
}

/**
 * CREATE INVENTORY
 */
export async function POST(req: Request) {
  const auth = await withAuth(req);
  if (!auth.isValid) return auth.response!;

  try {
    const body = createInventorySchema.parse(await req.json());

    const profile = await getUserProfile(auth.user!.id);
    if (!profile) return fail('User profile not found', 403);

    // Only admins and managers can assign inventory to other agents
    if (profile.role === 'agent') {
      return fail('Agents cannot assign inventory', 403);
    }

    /**
     * CHECK PRODUCT STOCK AND REDUCE IT
     */
    const { data: product, error: productError } = await adminClient
      .from('products')
      .select('id, name, quantity')
      .eq('id', parseInt(body.product_id, 10).toString())
      .single() as { data: any; error: any };

    if (productError || !product) {
      return fail('Product not found', 404);
    }

    if ((product.quantity || 0) < body.quantity_issued) {
      return fail(
        `Insufficient stock. Only ${product.quantity} units available for ${product.name}`,
        400
      );
    }

    /**
     * REDUCE PRODUCT STOCK
     */
    const { error: updateError } = await adminClient
      .from('products')
      .update({ quantity: (product.quantity || 0) - body.quantity_issued })
      .eq('id', parseInt(body.product_id, 10).toString());

    if (updateError) {
      return fail('Failed to update product stock', 500);
    }

    /**
     * INSERT INVENTORY RECORD
     */
    const { data, error } = await adminClient
      .from('inventory')
      .insert({
        agent_id: parseInt(body.agent_id, 10).toString(),
        product_id: parseInt(body.product_id, 10).toString(),
        quantity_issued: body.quantity_issued,
        date_issued: body.date_issued,
      })
      .select(`
        id,
        agent_id,
        product_id,
        quantity_issued,
        date_issued,
        created_at,
        agents!inner(id, name, region),
        products!inner(id, name, unit_price)
      `)
      .single() as { data: any; error: any };

    if (error || !data) {
      // Rollback product stock update if inventory insert fails
      await adminClient
        .from('products')
        .update({ quantity: product.quantity })
        .eq('id', parseInt(body.product_id, 10).toString());
      return fail(
        error?.message || 'Failed to create inventory record',
        400
      );
    }

    /**
     * AUDIT LOG (ENTERPRISE TRACKING)
     */
    await createAuditLog({
      actorId: auth.user!.id,
      action: 'inventory.create',
      targetTable: 'inventory',
      targetId: data.id,
      details: body,
    });

    return ok(data, { status: 201 });

  } catch (err) {
    const message =
      zodErrorMessage(err) ??
      (err instanceof Error ? err.message : 'Unknown error');

    return fail(message, 400);
  }
}


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
const updateInventorySchema = z.object({
  product_id: z.string().min(1).optional(),
  quantity_issued: z.number().int().positive().optional(),
  date_issued: z.string().min(10).optional(),
});

/**
 * UPDATE INVENTORY (PATCH)
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await withAuth(req);
  if (!auth.isValid) return auth.response!;

  try {
    const id = params.id;

    if (!id) return fail('Inventory ID is required', 400);

    const body = updateInventorySchema.parse(await req.json());

    const profile = await getUserProfile(auth.user!.id);
    if (!profile) return fail('User profile not found', 403);

    // Check ownership if agent
    if (profile.role === 'agent') {
      const myAgentId = await getAgentIdForUser(auth.user!.id);
      const { data: existing } = await adminClient
        .from('inventory')
        .select('agent_id')
        .eq('id', id)
        .single();

      if (!existing || existing.agent_id !== myAgentId?.toString()) {
        return fail('Unauthorized', 403);
      }
    }

    const { data, error } = await adminClient
      .from('inventory')
      .update(body)
      .eq('id', id)
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
      .single();

    if (error || !data) {
      return fail(error?.message || 'Failed to update inventory record', 400);
    }

    await createAuditLog({
      actorId: auth.user!.id,
      action: 'inventory.update',
      targetTable: 'inventory',
      targetId: data.id,
      details: body,
    });

    return ok(data);

  } catch (err) {
    const message =
      zodErrorMessage(err) ??
      (err instanceof Error ? err.message : 'Unknown error');

    return fail(message, 400);
  }
}

/**
 * DELETE INVENTORY
 */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await withAuth(req);
  if (!auth.isValid) return auth.response!;

  try {
    const id = params.id;

    if (!id) return fail('Inventory ID is required', 400);

    const profile = await getUserProfile(auth.user!.id);
    if (!profile) return fail('User profile not found', 403);

    // Check ownership if agent
    if (profile.role === 'agent') {
      const myAgentId = await getAgentIdForUser(auth.user!.id);
      const { data: existing } = await adminClient
        .from('inventory')
        .select('agent_id')
        .eq('id', id)
        .single();

      if (!existing || existing.agent_id !== myAgentId?.toString()) {
        return fail('Unauthorized', 403);
      }
    }

    const { error } = await adminClient
      .from('inventory')
      .delete()
      .eq('id', id);

    if (error) {
      return fail(error.message, 400);
    }

    await createAuditLog({
      actorId: auth.user!.id,
      action: 'inventory.delete',
      targetTable: 'inventory',
      targetId: id,
      details: { id },
    });

    return ok({ success: true });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return fail(message, 400);
  }
}

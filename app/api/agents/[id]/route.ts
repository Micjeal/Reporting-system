import { ok, fail } from '@/lib/api-response';
import { withAuth, getUserProfile } from '@/lib/middleware-guards';
import { adminClient } from '@/lib/supabase-admin';

/**
 * PATCH /api/agents/[id]
 * Updates a specific agent's profile (admin only)
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withAuth(req);
  if (!auth.isValid) return auth.response!;

  // Only admins can update other agents
  const userProfile = await getUserProfile(auth.user!.id);
  if (!userProfile || userProfile.role !== 'admin') {
    return fail('Only admins can update agent profiles', 403);
  }

  try {
    const { id: agentId } = await params;
    const body = await req.json();

    console.log(`PATCH /api/agents/${agentId} - body:`, body);

    // Validate and extract allowed fields
    const allowedFields = ['name', 'phone', 'region', 'monthly_target'];
    const updates: { name?: string; phone?: string; region?: string; monthly_target?: number } = {};
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field as keyof typeof updates] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return fail('No valid fields to update', 400);
    }

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
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      return fail(error.message, 400);
    }
    if (!data) {
      return fail('Agent not found', 404);
    }

    console.log(`PATCH /api/agents/${agentId} - success:`, data);
    return ok(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`PATCH /api/agents/[id] - exception:`, err);
    return fail(message, 400);
  }
}

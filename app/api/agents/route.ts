import { ok, fail } from '@/lib/api-response';
import { withAuth } from '@/lib/middleware-guards';
import { adminClient } from '@/lib/supabase-admin';

/**
 * GET AGENTS
 */
export async function GET(req: Request) {
  const auth = await withAuth(req);
  if (!auth.isValid) return auth.response!;

  try {
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
      .order('name', { ascending: true });

    if (error) return fail(error.message, 400);

    return ok(data ?? []);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return fail(message, 400);
  }
}

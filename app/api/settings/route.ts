import { ok, fail } from '@/lib/api-response';
import { withAuth } from '@/lib/middleware-guards';
import { adminClient } from '@/lib/supabase-admin';

/**
 * GET USER SETTINGS
 * Fetches user settings from database, creates default settings if none exist
 */
export async function GET(req: Request) {
  const auth = await withAuth(req);
  if (!auth.isValid) return auth.response!;

  try {
    // Fetch user settings from database
    const { data: settings, error } = await adminClient
      .from('user_settings')
      .select('*')
      .eq('user_id', auth.user!.id)
      .single();

    // If settings don't exist, create default settings
    if (error && error.code === 'PGRST116') {
      // PGRST116 is the error code for "no rows returned"
      const { data: newSettings, error: insertError } = await adminClient
        .from('user_settings')
        .insert({
          user_id: auth.user!.id,
          theme: 'system',
          notification_preferences: {
            email: {
              salesAlerts: true,
              inventoryAlerts: true,
              userApprovals: true,
              systemUpdates: true,
            },
            push: {
              salesAlerts: true,
              inventoryAlerts: true,
              userApprovals: true,
            },
            inApp: {
              salesAlerts: true,
              inventoryAlerts: true,
              userApprovals: true,
              systemUpdates: true,
            },
          },
        })
        .select('*')
        .single();

      if (insertError || !newSettings) {
        return fail(
          insertError?.message || 'Failed to create default settings',
          500
        );
      }

      return ok(newSettings);
    }

    // If there was a different error, return it
    if (error) {
      return fail(error.message, 500);
    }

    // Return existing settings
    return ok(settings);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return fail(message, 500);
  }
}

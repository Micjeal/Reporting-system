import { z } from 'zod';
import { ok, fail } from '@/lib/api-response';
import { zodErrorMessage } from '@/lib/zod';
import { withAuth } from '@/lib/middleware-guards';
import { createServerSupabase } from '@/lib/supabase-server';
import { createAuditLog } from '@/lib/audit';

/**
 * Password change validation schema
 * Requirements: 5.5, 5.6, 5.7, 5.8
 */
const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

/**
 * POST /api/settings/password
 * Changes the authenticated user's password
 * 
 * Requirements:
 * - 5.5: Verify current password is correct
 * - 5.6: Display error if current password is incorrect
 * - 5.7: Validate new password strength (min 8 chars, uppercase, lowercase, number)
 * - 5.8: Update password and display success notification
 */
export async function POST(req: Request) {
  // Verify user authentication
  const auth = await withAuth(req);
  if (!auth.isValid) return auth.response!;

  try {
    // Validate request body
    const body = passwordChangeSchema.parse(await req.json());

    // Create Supabase client for the authenticated user
    const supabase = await createServerSupabase();

    // Verify current password by attempting to sign in with it
    // This is the recommended way to verify the current password
    const { data: { user }, error: signInError } = await supabase.auth.getUser();
    
    if (signInError || !user) {
      return fail('Failed to verify user session', 401);
    }

    // Attempt to sign in with current password to verify it
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: body.currentPassword,
    });

    // If sign in fails, current password is incorrect
    if (verifyError) {
      return fail('Current password is incorrect', 403);
    }

    // Update password using Supabase Auth API
    const { data: updateData, error: updateError } = await supabase.auth.updateUser({
      password: body.newPassword,
    });

    if (updateError || !updateData.user) {
      return fail(
        updateError?.message || 'Failed to update password',
        500
      );
    }

    // Create audit log for security tracking
    await createAuditLog({
      actorId: auth.user!.id,
      action: 'auth.password_changed',
      targetTable: 'users',
      targetId: auth.user!.id,
      details: { timestamp: new Date().toISOString() },
    });

    return ok({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (err) {
    const message =
      zodErrorMessage(err) ??
      (err instanceof Error ? err.message : 'Unknown error');

    return fail(message, 400);
  }
}

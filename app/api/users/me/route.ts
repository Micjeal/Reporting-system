import { ok, fail } from '@/lib/api-response'
import { withAuth } from '@/lib/middleware-guards'
import { adminClient } from '@/lib/supabase-admin'
import { z } from 'zod'

/**
 * GET /api/users/me
 * Returns the current user's information
 */
export async function GET(req: Request) {
  const auth = await withAuth(req)
  if (!auth.isValid) return auth.response!

  try {
    const userId = auth.user!.id

    // Fetch the user details
    // Try to select name and phone, but handle if columns don't exist
    const { data, error } = await adminClient
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) return fail(error.message, 400)
    if (!data) return fail('User not found', 404)

    // Return only the fields we want to expose
    const userData = {
      id: data.id,
      email: data.email,
      role: data.role,
      status: data.status,
      name: data.name || null,
      phone: data.phone || null,
      created_at: data.created_at,
      updated_at: data.updated_at,
    }

    return ok(userData)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return fail(message, 400)
  }
}

/**
 * PATCH /api/users/me
 * Updates the current user's profile information
 * Only allows updating name and phone fields
 */
export async function PATCH(req: Request) {
  const auth = await withAuth(req)
  if (!auth.isValid) return auth.response!

  try {
    const userId = auth.user!.id

    // Parse and validate request body
    const body = await req.json()
    
    const updateSchema = z.object({
      name: z.string().min(2, 'Name must be at least 2 characters').optional(),
      phone: z.string().optional(),
    })

    const validation = updateSchema.safeParse(body)
    if (!validation.success) {
      const errors = validation.error.errors.map(e => e.message).join(', ')
      return fail(`Validation failed: ${errors}`, 400)
    }

    const updates = validation.data

    // Only update if there are fields to update
    if (Object.keys(updates).length === 0) {
      return fail('No fields to update', 400)
    }

    // Update the user record (don't update updated_at if column doesn't exist)
    const { data, error } = await adminClient
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select('*')
      .single()

    if (error) {
      console.error('Supabase update error:', error)
      return fail(`Database error: ${error.message}`, 400)
    }
    if (!data) return fail('User not found', 404)

    // Return only the fields we want to expose
    const userData = {
      id: data.id,
      email: data.email,
      role: data.role,
      status: data.status,
      name: data.name || null,
      phone: data.phone || null,
      created_at: data.created_at,
      updated_at: data.updated_at,
    }

    return ok(userData)
  } catch (err) {
    console.error('PATCH /api/users/me error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return fail(message, 400)
  }
}

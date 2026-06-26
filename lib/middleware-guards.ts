import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { adminClient } from '@/lib/supabase-admin'

/**
 * withAuth middleware
 * Verifies that the request has a valid Supabase session
 * Returns 401 if no authenticated user found
 */
export async function withAuth(_req?: Request) {
  const supabase = await createServerSupabase()
  let user = null
  try {
    const { data: { user: fetchedUser } } = await supabase.auth.getUser()
    user = fetchedUser
  } catch (error) {
    console.error('[withAuth] Error fetching user:', error)
    // If we fail to get the user, treat as unauthenticated
    user = null
  }

  if (!user) {
    return {
      isValid: false,
      user: null,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  return {
    isValid: true,
    user,
    response: null,
  }
}

/**
 * getRoleFromUser
 * Fetches the user's role from the database using admin client to bypass RLS
 */
export async function getUserProfile(userId: string) {
  const { data, error } = await adminClient
    .from('users')
    .select('role, status')
    .eq('id', userId)
    .single()

  if (error) return null
  return data
}

/**
 * withRole middleware
 * Checks if the authenticated user has one of the required roles
 * Returns 403 if role doesn't match
 */
export async function withRole(
  _req: Request,
  requiredRoles: string[]
) {
  const auth = await withAuth(_req)
  if (!auth.isValid) return auth

  const user = auth.user
  if (!user) return auth

  const profile = await getUserProfile(user.id)
  if (!profile || !requiredRoles.includes(profile.role)) {
    return {
      isValid: false,
      user: null,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    }
  }

  return {
    isValid: true,
    user,
    response: null,
  }
}

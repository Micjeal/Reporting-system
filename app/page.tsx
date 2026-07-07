import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase-server'
import type { Database } from '@/types/database'
import { adminClient } from '@/lib/supabase-admin'

type UserProfile = Pick<Database['public']['Tables']['users']['Row'], 'role' | 'status'>

export default async function Page() {
  try {
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    // No authenticated user - redirect to login
    if (!user || authError) {
      redirect('/login')
    }

    // Use admin client so this works even when `users` table has strict RLS.
    const { data, error } = await adminClient
      .from('users')
      .select('role,status')
      .eq('id', user.id)
      .single()

    // If user profile doesn't exist or error, send to pending approval
    if (error || !data) {
      redirect('/pending-approval')
    }

    const profile = data as UserProfile | null

    // Check profile status
    if (!profile || profile.status === 'pending') redirect('/pending-approval')
    if (profile.status === 'rejected' || profile.status === 'suspended') redirect('/unauthorized')

    // Route based on role
    if (profile.role === 'admin') redirect('/admin/dashboard')
    if (profile.role === 'manager') redirect('/manager/dashboard')
    redirect('/agent/dashboard')
  } catch (error) {
    // Log error for debugging but don't expose details
    console.error('Root page error:', error)
    // Fallback to login on unexpected errors
    redirect('/login')
  }
}

import { redirect } from 'next/navigation'

export default async function Page() {
  try {
    // Lazy import to avoid build errors
    const { createServerSupabase } = await import('@/lib/supabase-server')
    const { adminClient } = await import('@/lib/supabase-admin')
    
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    // No authenticated user - redirect to login
    if (!user || authError) {
      redirect('/login')
    }

    // Use admin client so this works even when `users` table has strict RLS
    const { data, error } = await adminClient
      .from('users')
      .select('role,status')
      .eq('id', user.id)
      .single()

    // If user profile doesn't exist or error, send to pending approval
    if (error || !data) {
      redirect('/pending-approval')
    }

    const profile = data as any

    // Check profile status
    if (!profile || profile.status === 'pending') {
      redirect('/pending-approval')
    }
    if (profile.status === 'rejected' || profile.status === 'suspended') {
      redirect('/unauthorized')
    }

    // Route based on role
    if (profile.role === 'admin') {
      redirect('/admin/dashboard')
    }
    if (profile.role === 'manager') {
      redirect('/manager/dashboard')
    }
    
    redirect('/agent/dashboard')
  } catch (error) {
    console.error('Root page error:', error)
    redirect('/login')
  }
}

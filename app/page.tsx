import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase-server'
import type { Database } from '@/types/database'
import { adminClient } from '@/lib/supabase-admin'

type UserProfile = Pick<Database['public']['Tables']['users']['Row'], 'role' | 'status'>

export default async function Page() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Use admin client so this works even when `users` table has strict RLS.
  const { data, error } = await adminClient
    .from('users')
    .select('role,status')
    .eq('id', user.id)
    .single()

  if (error) redirect('/pending-approval')
  const profile = data as UserProfile | null

  if (!profile || profile.status === 'pending') redirect('/pending-approval')
  if (profile.status === 'rejected' || profile.status === 'suspended') redirect('/unauthorized')

  if (profile.role === 'admin') redirect('/admin/dashboard')
  if (profile.role === 'manager') redirect('/manager/dashboard')
  redirect('/agent/dashboard')
}

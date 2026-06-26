import { adminClient } from '@/lib/supabase-admin'

export async function getAgentIdForUser(userId: string): Promise<string | null> {
  // 1. Try to find an existing agent record
  const { data, error } = await adminClient
    .from('agents')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (!error && data?.id) {
    return data.id
  }

  // 2. No agent row – auto-create one so the user can start working immediately
  console.warn('No agent record found for user', userId, '— creating one automatically')

  // Look up the user's email / info from the users table
  const { data: userRow } = await adminClient
    .from('users')
    .select('email')
    .eq('id', userId)
    .single()

  const { data: newAgent, error: insertErr } = await adminClient
    .from('agents')
    .insert({
      user_id: userId,
      name: userRow?.email?.split('@')[0] ?? '',
      phone: '',
      region: '',
    } as any)
    .select('id')
    .single()

  if (insertErr || !newAgent?.id) {
    console.error('Failed to auto-create agent record', insertErr?.message)
    return null
  }

  console.log('Auto-created agent record', newAgent.id, 'for user', userId)
  return newAgent.id
}

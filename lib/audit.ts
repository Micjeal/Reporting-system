import 'server-only'
import { adminClient } from '@/lib/supabase-admin'

interface AuditLogParams {
  actorId: string | null
  action: string
  targetTable: string
  targetId: string
  details?: Record<string, unknown>
}

/**
 * createAuditLog
 * Creates an entry in the audit_logs table
 * Should be called after every data mutation (POST, PATCH, DELETE)
 */
export async function createAuditLog({
  actorId,
  action,
  targetTable,
  targetId,
  details = {},
}: AuditLogParams) {
  try {
    const { error } = await adminClient.from('audit_logs').insert({
      actor_id: actorId ?? 'anonymous',
      action,
      target_table: targetTable,
      target_id: targetId,
      details,
    })

    if (error) {
      console.error('Audit log creation failed:', error)
      // Don't throw — audit failures shouldn't block main operations
    }
  } catch (err) {
    console.error('Unexpected error creating audit log:', err)
  }
}

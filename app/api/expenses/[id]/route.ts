import { z } from 'zod'
import { ok, fail } from '@/lib/api-response'
import { zodErrorMessage } from '@/lib/zod'
import { withAuth, getUserProfile } from '@/lib/middleware-guards'
import { adminClient } from '@/lib/supabase-admin'
import { getAgentIdForUser } from '@/lib/server/agents'
import { createAuditLog } from '@/lib/audit'

const updateExpenseSchema = z.object({
  category: z.enum(['fuel', 'food', 'accommodation', 'airtime', 'other']).optional(),
  description: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  date: z.string().min(10).optional(),
  receipt_url: z.string().url().nullable().optional().default(null).or(z.literal('')).transform(v => v === '' ? null : v),
})

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await withAuth(req)
  if (!auth.isValid) return auth.response!

  const profile = await getUserProfile(auth.user!.id)
  if (!profile) return fail('User profile not found', 403)

  const { id: expenseId } = await params

  let query = adminClient
    .from('expenses')
    .select('id, agent_id, category, description, amount, receipt_url, date, created_at')
    .eq('id', expenseId)
    .single()

  if (profile.role === 'agent') {
    const myAgentId = await getAgentIdForUser(auth.user!.id)
    if (!myAgentId) {
      console.warn('Agent profile not found for user', auth.user!.id)
      return fail('Agent profile not found', 404)
    }
    query = query.eq('agent_id', myAgentId) as typeof query
  }

  const { data, error } = await query

  if (error || !data) {
    if (error?.code === 'PGRST116') {
      return fail('Expense not found', 404)
    }
    return fail(error?.message ?? 'Failed to fetch expense', 400)
  }

  return ok(data)
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await withAuth(req)
  if (!auth.isValid) return auth.response!

  try {
    const body = updateExpenseSchema.parse(await req.json())
    const { id: expenseId } = await params

    // First, get the existing expense to verify ownership
    const existingExpense = await adminClient
      .from('expenses')
      .select('agent_id, receipt_url')
      .eq('id', expenseId)
      .single()

    if (existingExpense.error || !existingExpense.data) {
      if (existingExpense.error?.code === 'PGRST116') {
        return fail('Expense not found', 404)
      }
      return fail(existingExpense.error?.message ?? 'Failed to fetch expense', 400)
    }

    // Verify the authenticated user has permission
    // Admins can manage all expenses, agents can only manage their own
    const profile = await getUserProfile(auth.user!.id)
    if (!profile) return fail('User profile not found', 403)

    if (profile.role !== 'admin') {
      // Non-admin users must be agents and own the expense
      const myAgentId = await getAgentIdForUser(auth.user!.id)
      if (!myAgentId) {
        console.warn('Agent profile not found for user', auth.user!.id)
        return fail('Agent profile not found', 404)
      }

      if (existingExpense.data.agent_id !== myAgentId) {
        return fail('You do not have permission to update this expense', 403)
      }
    }

    // Prepare update data
    const updateData: Partial<typeof body> = { ...body }

    // Update the expense
    const { data, error } = await adminClient
      .from('expenses')
      .update(updateData)
      .eq('id', expenseId)
      .select('*')
      .single()

    if (error || !data) {
      return fail(error?.message ?? 'Failed to update expense', 400)
    }

    // Create audit log entry
    await createAuditLog({
      actorId: auth.user!.id,
      action: 'EXPENSE_UPDATED',
      targetTable: 'expenses',
      targetId: expenseId,
      details: { updatedFields: body },
    })

    return ok(data)
  } catch (err) {
    const message = zodErrorMessage(err) ?? (err instanceof Error ? err.message : 'Unknown error')
    return fail(message, 400)
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await withAuth(req)
  if (!auth.isValid) return auth.response!

  const { id: expenseId } = await params

  // First, get the existing expense to verify ownership and get receipt_url
  const existingExpense = await adminClient
    .from('expenses')
    .select('agent_id, receipt_url')
    .eq('id', expenseId)
    .single()

  if (existingExpense.error || !existingExpense.data) {
    if (existingExpense.error?.code === 'PGRST116') {
      return fail('Expense not found', 404)
    }
    return fail(existingExpense.error?.message ?? 'Failed to fetch expense', 400)
  }

  // Verify the authenticated user has permission
  // Admins can manage all expenses, agents can only manage their own
  const profile = await getUserProfile(auth.user!.id)
  if (!profile) return fail('User profile not found', 403)

  if (profile.role !== 'admin') {
    // Non-admin users must be agents and own the expense
    const myAgentId = await getAgentIdForUser(auth.user!.id)
    if (!myAgentId) {
      console.warn('Agent profile not found for user', auth.user!.id)
      return fail('Agent profile not found', 404)
    }

    if (existingExpense.data.agent_id !== myAgentId) {
      return fail('You do not have permission to delete this expense', 403)
    }
  }

  // Delete the receipt file from storage if it exists
  if (existingExpense.data.receipt_url) {
    try {
      // Extract the path from the public URL
      const urlParts = existingExpense.data.receipt_url.split('/receipts/')
      if (urlParts.length >= 2) {
        const filePath = urlParts[1]
        // Delete from Supabase Storage using admin client
        await adminClient.storage.from('receipts').remove([filePath])
      }
    } catch (err) {
      console.error('Error deleting receipt from storage:', err)
      // Don't fail the delete if storage deletion fails
    }
  }

  // Delete the expense record
  const { error } = await adminClient
    .from('expenses')
    .delete()
    .eq('id', expenseId)

  if (error) {
    return fail(error.message ?? 'Failed to delete expense', 400)
  }

  // Create audit log entry
  await createAuditLog({
    actorId: auth.user!.id,
    action: 'EXPENSE_DELETED',
    targetTable: 'expenses',
    targetId: expenseId,
    details: {},
  })

  return ok({ success: true })
}

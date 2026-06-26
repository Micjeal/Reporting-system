import { z } from 'zod'
import { ok, fail } from '@/lib/api-response'
import { zodErrorMessage } from '@/lib/zod'
import { withAuth, getUserProfile } from '@/lib/middleware-guards'
import { adminClient } from '@/lib/supabase-admin'
import { getAgentIdForUser } from '@/lib/server/agents'
import { createAuditLog } from '@/lib/audit'

const saleItemSchema = z.object({
  product_id: z.union([z.string(), z.number()])
    .transform((v) => String(v))
    .refine((v) => v !== '' && v !== '0', { message: 'Product ID is required' }),
  quantity: z.number().int().positive(),
  unit_price: z.number().min(0), // Allow zero for free samples, promotions, or returns
})

const createSaleSchema = z.object({
  customer_name: z.string().max(100).optional().default(''),
  payment_method: z.enum(['cash', 'mobile_money', 'bank']).optional().default('cash'),
  sale_date: z.string().min(10).optional(), // YYYY-MM-DD
  items: z.array(saleItemSchema).min(1, 'At least one item is required'),
  customer_phone: z.string().max(20).optional().default(''),
  location: z.string().max(200).optional().default(''),
  route: z.string().max(100).optional().default(''),
  bank_details: z.string().max(200).optional().default(''),
  expenses_total: z.number().min(0).optional().default(0),
  tokens_deducted: z.number().min(0).optional().default(0),
  returns_amount: z.number().min(0).optional().default(0),
  notes: z.string().max(500).optional().default(''),
})

export async function GET(req: Request) {
  const auth = await withAuth(req)
  if (!auth.isValid) return auth.response!

  const url = new URL(req.url)
  const dateFrom = url.searchParams.get('date_from')
  const dateTo = url.searchParams.get('date_to')
  const agentId = url.searchParams.get('agent_id')

  const profile = await getUserProfile(auth.user!.id)
  if (!profile) return fail('User profile not found', 403)

  let query = adminClient
    .from('sales')
    .select('id,agent_id,customer_name,customer_phone,payment_method,sale_date,total_amount,location,route,bank_details,expenses_total,tokens_deducted,returns_amount,notes,created_at,agents(id,name,region)')
    .order('sale_date', { ascending: false })

  if (dateFrom) query = query.gte('sale_date', dateFrom)
  if (dateTo) query = query.lte('sale_date', dateTo)

  if (profile.role === 'agent') {
    const myAgentId = await getAgentIdForUser(auth.user!.id)
    if (!myAgentId) {
      console.warn('Agent profile not found for user', auth.user!.id)
      return ok([])
    }
    query = query.eq('agent_id', myAgentId)
  } else if (agentId) {
    query = query.eq('agent_id', agentId)
  }

  const { data: sales, error } = await query
  if (error) return fail(error.message, 400)
  if (!sales || sales.length === 0) return ok([])

  // Fetch all sale_items for these sales in one query
  const saleIds = (sales as any[]).map((s) => Number(s.id))
  const { data: allItems, error: itemsErr } = await adminClient
    .from('sale_items')
    .select('id,sale_id,product_id,quantity,unit_price,line_total')
    .in('sale_id', saleIds)

  if (itemsErr) return fail(itemsErr.message, 400)

  // Fetch product names for display
  const productIds = [...new Set((allItems ?? []).map((i) => String(i.product_id)))]
  const productMap: Record<string, string> = {}
  if (productIds.length > 0) {
    const { data: products } = await adminClient
      .from('products')
      .select('id,name')
      .in('id', productIds)
    for (const p of products ?? []) {
      productMap[String(p.id)] = p.name
    }
  }

  // Merge items into their parent sale
  const itemsBySaleId = (allItems ?? []).reduce<Record<string, Array<typeof allItems[number] & { product_name: string | null }>>>((acc, item) => {
    const key = String(item.sale_id)
    if (!acc[key]) acc[key] = []
    acc[key].push({ ...item, product_name: productMap[String(item.product_id)] ?? null })
    return acc
  }, {})

  const result = (sales as any[]).map((sale) => ({
    ...sale,
    items: itemsBySaleId[String(sale.id)] ?? [],
  }))

  return ok(result)
}

export async function POST(req: Request) {
  const auth = await withAuth(req)
  if (!auth.isValid) return auth.response!

  try {
    const body = createSaleSchema.parse(await req.json())
    console.log('[sales POST] parsed body:', JSON.stringify({ expenses_total: body.expenses_total, tokens_deducted: body.tokens_deducted, returns_amount: body.returns_amount, bank_details: body.bank_details }))

    const myAgentId = await getAgentIdForUser(auth.user!.id)
    if (!myAgentId) return fail('Agent profile not found', 403)

    const saleDate = body.sale_date ?? new Date().toISOString().split('T')[0]

    // Validate inventory for each item
    for (const item of body.items) {
      const { data: invRows, error: invErr } = await adminClient
        .from('inventory')
        .select('quantity_issued')
        .eq('agent_id', myAgentId)
        .eq('product_id', item.product_id)

      if (invErr) return fail(invErr.message, 400)
      const totalIssued = (invRows ?? []).reduce((sum, r) => sum + (r.quantity_issued ?? 0), 0)

      const { data: saleRows, error: saleErr } = await adminClient
        .from('sale_items')
        .select('quantity, sales!inner(agent_id)')
        .eq('product_id', Number(item.product_id))
        .eq('sales.agent_id', myAgentId)

      if (saleErr) return fail(saleErr.message, 400)
      const totalSold = (saleRows ?? []).reduce((sum, r) => sum + ((r as { quantity: number }).quantity ?? 0), 0)

      if (totalSold + item.quantity > totalIssued) {
        // Fetch product name for better error message
        const { data: product } = await adminClient
          .from('products')
          .select('name')
          .eq('id', item.product_id)
          .single()
        
        const productName = product?.name || `Product ${item.product_id}`
        const available = totalIssued - totalSold
        return fail(
          `Insufficient inventory for ${productName}. You need ${item.quantity} units but only have ${available} available. Please contact your manager to request more inventory.`,
          400
        )
      }
    }

    // Calculate total amount
    const totalAmount = body.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)

    // Insert the sale transaction
    const { data: sale, error: saleErr } = await adminClient
      .from('sales')
      .insert({
        agent_id: myAgentId,
        customer_name: body.customer_name || null,
        payment_method: body.payment_method,
        sale_date: saleDate,
        total_amount: totalAmount,
        customer_phone: body.customer_phone || null,
        location: body.location || null,
        route: body.route || null,
        bank_details: body.bank_details || null,
        expenses_total: body.expenses_total ?? 0,
        tokens_deducted: body.tokens_deducted ?? 0,
        returns_amount: body.returns_amount ?? 0,
        notes: body.notes || null,
      })
      .select('*')
      .single()

    if (saleErr || !sale) return fail(saleErr?.message ?? 'Failed to create sale', 400)

    // Insert all line items
    const lineItems = body.items.map((item) => ({
      sale_id: Number(sale.id),
      product_id: Number(item.product_id),
      quantity: item.quantity,
      unit_price: item.unit_price,
    }))

    const { error: itemsErr } = await adminClient.from('sale_items').insert(lineItems)

    if (itemsErr) {
      // Roll back the sale if items failed
      await adminClient.from('sales').delete().eq('id', sale.id)
      return fail(itemsErr.message, 400)
    }

    // If expenses were recorded with this sale, create an expense entry for tracking
    if (body.expenses_total && body.expenses_total > 0) {
      const expenseResult = await adminClient.from('expenses').insert({
        agent_id: myAgentId,
        category: 'other',
        description: `Sale expenses - ${body.customer_name || 'Customer'} - ${body.location || 'No location'}`,
        amount: body.expenses_total,
        date: saleDate,
        receipt_url: null,
      })
      
      // Log any errors for debugging, but don't fail the sale
      if (expenseResult.error) {
        console.error('[SALES API] Failed to create expense entry:', expenseResult.error)
      } else {
        console.log('[SALES API] Successfully created expense entry for sale')
      }
    }

    await createAuditLog({
      actorId: auth.user!.id,
      action: 'sales.create',
      targetTable: 'sales',
      targetId: sale.id,
      details: { ...body, total_amount: totalAmount },
    })

    return ok({ ...sale, items: lineItems }, { status: 201 })
  } catch (err) {
    const message = zodErrorMessage(err) ?? (err instanceof Error ? err.message : 'Unknown error')
    return fail(message, 400)
  }
}

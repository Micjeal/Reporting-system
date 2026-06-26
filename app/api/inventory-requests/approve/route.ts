import { ok, fail } from '@/lib/api-response'
import { withAuth, getUserProfile } from '@/lib/middleware-guards'
import { adminClient } from '@/lib/supabase-admin'
import { createAuditLog } from '@/lib/audit'

export async function PATCH(req: Request) {
  const auth = await withAuth(req)
  if (!auth.isValid) return auth.response!

  const profile = await getUserProfile(auth.user!.id)
  if (!profile) return fail('User profile not found', 403)

  if (profile.role !== 'admin' && profile.role !== 'manager') {
    return fail('Only admins and managers can approve requests', 403)
  }

  try {
    const body = await req.json()
    const { id, status, quantity } = body

    if (!id || !status || !quantity) {
      return fail('Request ID, status, and quantity are required', 400)
    }

    if (status !== 'approved') {
      return fail('Invalid status', 400)
    }

    // Get the request details
    const { data: request, error: requestError } = await adminClient
      .from('inventory_requests' as any)
      .select('*')
      .eq('id', id)
      .single() as { data: any; error: any }

    if (requestError || !request) {
      return fail('Request not found', 404)
    }

    // Check product stock
    const { data: product, error: productError } = await adminClient
      .from('products')
      .select('id, name, quantity')
      .eq('id', request.product_id)
      .single() as { data: any; error: any }

    if (productError || !product) {
      return fail('Product not found', 404)
    }

    if (product.quantity < quantity) {
      return fail(`Insufficient stock. Available: ${product.quantity}, Requested: ${quantity}`, 400)
    }

    // Reduce product stock
    console.log('Reducing product stock:', product.id, 'from', product.quantity, 'to', product.quantity - quantity)
    const { error: stockError } = await adminClient
      .from('products' as any)
      .update({ quantity: product.quantity - quantity })
      .eq('id', product.id)

    if (stockError) {
      console.error('Failed to update product stock:', stockError)
      return fail('Failed to update product stock', 400)
    }
    console.log('Product stock updated successfully')

    // Check if agent already has this product in inventory
    const { data: existingInventory, error: checkError } = await adminClient
      .from('inventory' as any)
      .select('*')
      .eq('agent_id', request.agent_id)
      .eq('product_id', request.product_id)
      .single() as { data: any; error: any }

    console.log('Existing inventory check:', existingInventory, checkError)

    let inventoryError
    if (existingInventory) {
      // Update existing inventory
      console.log('Updating existing inventory:', existingInventory.id, 'adding', quantity, 'to current', existingInventory.quantity_issued)
      const result = await adminClient
        .from('inventory' as any)
        .update({ quantity_issued: existingInventory.quantity_issued + quantity })
        .eq('id', existingInventory.id)
      inventoryError = result.error
    } else {
      // Insert new inventory record
      console.log('Inserting new inventory record')
      const result = await adminClient
        .from('inventory' as any)
        .insert({
          agent_id: request.agent_id,
          product_id: request.product_id,
          quantity_issued: quantity,
          date_issued: new Date().toISOString(),
        })
      inventoryError = result.error
    }

    if (inventoryError) {
      console.error('Failed to update agent inventory:', inventoryError)
      // Rollback product stock if inventory operation fails
      await adminClient
        .from('products' as any)
        .update({ quantity: product.quantity })
        .eq('id', product.id)
      return fail('Failed to update agent inventory', 400)
    }
    console.log('Agent inventory updated successfully')

    // Update request status
    const { data: updatedRequest, error: updateError } = await adminClient
      .from('inventory_requests' as any)
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select('*')
      .single() as { data: any; error: any }

    if (updateError || !updatedRequest) {
      return fail('Failed to update request status', 400)
    }

    // Create audit log
    await createAuditLog({
      actorId: auth.user!.id,
      action: 'inventory_requests.approve',
      targetTable: 'inventory_requests',
      targetId: String(id),
      details: { 
        status, 
        quantity,
        product_name: product.name,
        agent_id: request.agent_id 
      },
    })

    return ok(updatedRequest.data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return fail(message, 400)
  }
}

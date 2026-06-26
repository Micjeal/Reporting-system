import 'server-only'
import { v4 as uuidv4 } from 'uuid'
import { adminClient } from '@/lib/supabase-admin'
import type { Database } from '@/lib/database.types'

/**
 * Product details returned from database
 */
export interface ProductDetails {
  id: string
  name: string
  unit_price: number
  quantity: number
  description: string | null
}

/**
 * Transaction context for batch operations
 */
export interface BatchTransaction {
  commit: () => Promise<void>
  rollback: () => Promise<void>
}

/**
 * Fetches product details by product ID
 * @param productId - The product ID to fetch
 * @returns Product details or null if not found
 */
export async function getProductDetails(
  productId: string
): Promise<ProductDetails | null> {
  const { data, error } = await adminClient
    .from('products')
    .select('id, name, unit_price, quantity, description')
    .eq('id', productId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows found
      return null
    }
    throw error
  }

  return data as ProductDetails
}

/**
 * Calculates total issued inventory for an agent and product
 * @param agentId - The agent ID
 * @param productId - The product ID
 * @returns Total quantity available (issued inventory)
 */
export async function getInventoryLevel(
  agentId: string,
  productId: string
): Promise<number> {
  const { data, error } = await adminClient
    .from('inventory')
    .select('quantity_issued')
    .eq('agent_id', agentId)
    .eq('product_id', productId)

  if (error) {
    throw error
  }

  // Sum all quantity_issued for this agent and product
  const totalQuantity = data.reduce(
    (sum, row) => sum + (row.quantity_issued || 0),
    0
  )

  return totalQuantity
}

/**
 * Calculates total quantity already sold for an agent and product
 * @param agentId - The agent ID
 * @param productId - The product ID
 * @returns Total quantity sold
 */
export async function getTotalSoldQuantity(
  agentId: string,
  productId: string
): Promise<number> {
  const { data, error } = await adminClient
    .from('sales')
    .select('quantity')
    .eq('agent_id', agentId)
    .eq('product_id', productId)

  if (error) {
    throw error
  }

  // Sum all quantities sold
  const totalQuantity = data.reduce((sum, row) => sum + (row.quantity || 0), 0)

  return totalQuantity
}

/**
 * Creates a database transaction context for batch operations
 * Note: Supabase doesn't support explicit transaction control from the client,
 * so this is a wrapper that tracks transaction state
 * @returns Transaction object with commit and rollback methods
 */
export async function createBatchTransaction(): Promise<BatchTransaction> {
  // Track transaction state
  let isActive = true
  const changes: Array<{
    table: string
    operation: 'update' | 'insert' | 'delete'
    data: Record<string, unknown>
  }> = []

  return {
    async commit() {
      if (!isActive) {
        throw new Error('Transaction already committed or rolled back')
      }
      isActive = false
      // In a real implementation with full transaction support,
      // this would commit all tracked changes
    },

    async rollback() {
      if (!isActive) {
        throw new Error('Transaction already committed or rolled back')
      }
      isActive = false
      // In a real implementation with full transaction support,
      // this would rollback all tracked changes
    },
  }
}

/**
 * Decrements inventory for a product by the specified quantity
 * @param agentId - The agent ID
 * @param productId - The product ID
 * @param quantity - The quantity to decrement
 * @param transaction - The transaction context (for future use with explicit transactions)
 * @returns Updated inventory level
 */
export async function decrementInventory(
  agentId: string,
  productId: string,
  quantity: number,
  transaction?: BatchTransaction
): Promise<number> {
  // Get current inventory level
  const currentLevel = await getInventoryLevel(agentId, productId)

  if (currentLevel < quantity) {
    throw new Error(
      `Insufficient inventory: requested ${quantity}, available ${currentLevel}`
    )
  }

  // Create a new inventory record with negative quantity to track the decrement
  const { error } = await adminClient.from('inventory').insert({
    agent_id: agentId,
    product_id: productId,
    quantity_issued: -quantity,
    date_issued: new Date().toISOString(),
  })

  if (error) {
    throw error
  }

  // Return updated inventory level
  const updatedLevel = currentLevel - quantity
  return updatedLevel
}

/**
 * Generates a unique batch ID
 * Format: "batch_" + UUID
 * @returns Generated batch ID
 */
export function generateBatchId(): string {
  return `batch_${uuidv4()}`
}

/**
 * Generates a unique transaction ID
 * Format: "txn_" + UUID
 * @returns Generated transaction ID
 */
export function generateTransactionId(): string {
  return `txn_${uuidv4()}`
}

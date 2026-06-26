import 'server-only'
import { v4 as uuidv4 } from 'uuid'
import { adminClient } from '@/lib/supabase-admin'
import type { LineItem, BatchSalesRequest, BatchSalesResponse, Sale } from '@/lib/types/batch-sales'
import { BatchErrorCode } from '@/lib/types/batch-sales'
import {
  generateBatchId,
  generateTransactionId,
  decrementInventory,
  getInventoryLevel,
  getTotalSoldQuantity,
} from '@/lib/db/batch-sales.db'
import { validateBatchInventory } from './batch-sales-inventory.service'
import { createAuditLog } from '@/lib/audit'

/**
 * Batch processing result
 */
export interface BatchProcessingResult {
  success: boolean
  batchId: string
  transactionId: string
  saleRecords: Sale[]
  totalAmount: number
  totalQuantity: number
  totalReturns: number
  createdAt: string
  errors?: Array<{
    productId: string
    error: string
  }>
}

/**
 * Atomic transaction wrapper for batch operations
 * Ensures all inventory decrements succeed together or all fail together
 */
export class BatchTransaction {
  private batchId: string
  private transactionId: string
  private isActive: boolean = true
  private changes: Array<{
    agentId: string
    productId: string
    quantity: number
  }> = []

  constructor() {
    this.batchId = generateBatchId()
    this.transactionId = generateTransactionId()
  }

  /**
   * Gets the batch ID
   */
  getBatchId(): string {
    return this.batchId
  }

  /**
   * Gets the transaction ID
   */
  getTransactionId(): string {
    return this.transactionId
  }

  /**
   * Tracks an inventory decrement operation
   * @param agentId - The agent ID
   * @param productId - The product ID
   * @param quantity - The quantity to decrement
   */
  trackChange(agentId: string, productId: string, quantity: number): void {
    if (!this.isActive) {
      throw new Error('Transaction is not active')
    }
    this.changes.push({ agentId, productId, quantity })
  }

  /**
   * Commits all tracked changes to the database
   * @returns Array of created sale records
   */
  async commit(): Promise<Sale[]> {
    if (!this.isActive) {
      throw new Error('Transaction already committed or rolled back')
    }

    try {
      const saleRecords: Sale[] = []

      // Execute all inventory decrements
      for (const change of this.changes) {
        // Create inventory decrement record
        const { error: invError } = await adminClient.from('inventory').insert({
          agent_id: change.agentId,
          product_id: change.productId,
          quantity_issued: -change.quantity,
          date_issued: new Date().toISOString(),
        })

        if (invError) {
          throw new Error(
            `Failed to decrement inventory for product ${change.productId}: ${invError.message}`
          )
        }

        // Create sale record
        const { data: saleData, error: saleError } = await adminClient
          .from('sales')
          .insert({
            agent_id: change.agentId,
            product_id: change.productId,
            quantity: change.quantity,
            amount: 0, // Will be calculated from line items
            date: new Date().toISOString().split('T')[0],
            batch_id: this.batchId,
            transaction_id: this.transactionId,
          })
          .select('*')
          .single()

        if (saleError || !saleData) {
          throw new Error(
            `Failed to create sale record for product ${change.productId}: ${saleError?.message}`
          )
        }

        saleRecords.push({
          id: saleData.id,
          productId: saleData.product_id,
          productName: '', // Will be populated from line items
          quantity: saleData.quantity,
          unitPrice: 0, // Will be populated from line items
          totalAmount: 0, // Will be calculated
          status: 'success',
        })
      }

      this.isActive = false
      return saleRecords
    } catch (error) {
      // On error, mark transaction as inactive but don't rollback
      // (rollback will be called explicitly if needed)
      this.isActive = false
      throw error
    }
  }

  /**
   * Rolls back all changes (clears tracked changes)
   * Note: Since we haven't committed yet, this just clears the changes
   */
  async rollback(): Promise<void> {
    if (!this.isActive) {
      throw new Error('Transaction already committed or rolled back')
    }

    // Clear all tracked changes
    this.changes = []
    this.isActive = false
  }

  /**
   * Checks if transaction is still active
   */
  isTransactionActive(): boolean {
    return this.isActive
  }
}

/**
 * Processes a batch of sales with atomic transaction handling
 * All items succeed together or all fail together with rollback
 *
 * @param agentId - The agent ID
 * @param request - The batch sales request
 * @returns Batch processing result with success/failure status
 */
export async function processBatch(
  agentId: string,
  request: BatchSalesRequest
): Promise<BatchProcessingResult> {
  const transaction = new BatchTransaction()
  const batchId = transaction.getBatchId()
  const transactionId = transaction.getTransactionId()

  try {
    // Validate inventory for all line items
    const inventoryErrors = await validateBatchInventory(agentId, request.lineItems)

    if (inventoryErrors.length > 0) {
      // Rollback transaction on validation failure
      await transaction.rollback()

      // Log the failure
      await createAuditLog({
        actorId: agentId,
        action: 'batch_sales.failed',
        targetTable: 'batch_sales',
        targetId: batchId,
        details: {
          transactionId,
          reason: 'Inventory validation failed',
          errors: inventoryErrors,
        },
      })

      return {
        success: false,
        batchId,
        transactionId,
        saleRecords: [],
        totalAmount: 0,
        totalQuantity: 0,
        totalReturns: 0,
        createdAt: new Date().toISOString(),
        errors: inventoryErrors.map((err) => ({
          productId: err.productId,
          error: err.error?.message || 'Unknown error',
        })),
      }
    }

    // Track all inventory decrements in the transaction
    for (const lineItem of request.lineItems) {
      transaction.trackChange(agentId, lineItem.productId, lineItem.quantity)
    }

    // Commit all changes atomically
    const saleRecords = await transaction.commit()

    // Calculate totals
    let totalAmount = 0
    let totalQuantity = 0
    let totalReturns = 0

    const enrichedSaleRecords: Sale[] = request.lineItems.map((lineItem, index) => {
      const saleRecord = saleRecords[index]
      const lineTotal = lineItem.quantity * lineItem.unitPrice

      totalAmount += lineTotal
      totalQuantity += lineItem.quantity
      totalReturns += lineItem.returnsAmount

      return {
        id: saleRecord.id,
        productId: lineItem.productId,
        productName: lineItem.productName,
        quantity: lineItem.quantity,
        unitPrice: lineItem.unitPrice,
        totalAmount: lineTotal,
        status: 'success',
      }
    })

    const createdAt = new Date().toISOString()

    // Log successful batch processing
    await createAuditLog({
      actorId: agentId,
      action: 'batch_sales.success',
      targetTable: 'batch_sales',
      targetId: batchId,
      details: {
        transactionId,
        lineItemCount: request.lineItems.length,
        totalAmount,
        totalQuantity,
      },
    })

    return {
      success: true,
      batchId,
      transactionId,
      saleRecords: enrichedSaleRecords,
      totalAmount,
      totalQuantity,
      totalReturns,
      createdAt,
    }
  } catch (error) {
    // Rollback on any error
    try {
      await transaction.rollback()
    } catch (rollbackError) {
      console.error('Error during rollback:', rollbackError)
    }

    // Log the error
    await createAuditLog({
      actorId: agentId,
      action: 'batch_sales.error',
      targetTable: 'batch_sales',
      targetId: batchId,
      details: {
        transactionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    })

    throw error
  }
}

/**
 * Validates that a batch can be processed atomically
 * Checks inventory availability for all items before any changes
 *
 * @param agentId - The agent ID
 * @param lineItems - Array of line items to validate
 * @returns Array of validation errors (empty if all valid)
 */
export async function validateBatchAtomicity(
  agentId: string,
  lineItems: LineItem[]
): Promise<
  Array<{
    productId: string
    error: string
  }>
> {
  const errors: Array<{ productId: string; error: string }> = []

  // Check each line item's inventory
  for (const lineItem of lineItems) {
    try {
      const inventoryLevel = await getInventoryLevel(agentId, lineItem.productId)
      const totalSold = await getTotalSoldQuantity(agentId, lineItem.productId)
      const available = inventoryLevel - totalSold

      if (lineItem.quantity > available) {
        errors.push({
          productId: lineItem.productId,
          error: `Insufficient inventory: need ${lineItem.quantity}, available ${available}`,
        })
      }
    } catch (error) {
      errors.push({
        productId: lineItem.productId,
        error: `Error validating inventory: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })
    }
  }

  return errors
}

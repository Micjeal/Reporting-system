import 'server-only'
import type { LineItem } from '@/lib/types/batch-sales'
import {
  getProductDetails,
  getInventoryLevel,
  getTotalSoldQuantity,
} from '@/lib/db/batch-sales.db'

/**
 * Validation result for a single line item
 */
export interface LineItemValidationResult {
  valid: boolean
  productId: string
  error?: {
    code: string
    message: string
    availableQuantity?: number
    requestedQuantity?: number
  }
}

/**
 * Inventory details for a product
 */
export interface InventoryDetails {
  productId: string
  productName: string
  unitPrice: number
  issuedQuantity: number
  soldQuantity: number
  availableQuantity: number
}

/**
 * Validates a single line item's inventory
 * Checks if product exists and has sufficient inventory
 *
 * @param agentId - The agent ID
 * @param lineItem - The line item to validate
 * @returns Validation result with error details if invalid
 */
export async function validateLineItemInventory(
  agentId: string,
  lineItem: LineItem
): Promise<LineItemValidationResult> {
  try {
    // Check if product exists
    const product = await getProductDetails(lineItem.productId)

    if (!product) {
      return {
        valid: false,
        productId: lineItem.productId,
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: `Product with ID ${lineItem.productId} not found`,
          requestedQuantity: lineItem.quantity,
        },
      }
    }

    // Get current inventory level
    const inventoryLevel = await getInventoryLevel(agentId, lineItem.productId)

    // Validate quantity doesn't exceed available inventory
    if (lineItem.quantity > inventoryLevel) {
      return {
        valid: false,
        productId: lineItem.productId,
        error: {
          code: 'INSUFFICIENT_INVENTORY',
          message: `Insufficient inventory for product ${lineItem.productId}. Requested: ${lineItem.quantity}, Available: ${inventoryLevel}`,
          availableQuantity: inventoryLevel,
          requestedQuantity: lineItem.quantity,
        },
      }
    }

    return {
      valid: true,
      productId: lineItem.productId,
    }
  } catch (error) {
    return {
      valid: false,
      productId: lineItem.productId,
      error: {
        code: 'VALIDATION_ERROR',
        message: `Error validating inventory for product ${lineItem.productId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        requestedQuantity: lineItem.quantity,
      },
    }
  }
}

/**
 * Validates all line items in a batch
 * Checks inventory for each item and detects duplicate product IDs
 *
 * @param agentId - The agent ID
 * @param lineItems - Array of line items to validate
 * @returns Array of validation errors (empty if all valid)
 */
export async function validateBatchInventory(
  agentId: string,
  lineItems: LineItem[]
): Promise<LineItemValidationResult[]> {
  const errors: LineItemValidationResult[] = []

  // Check for duplicate products first
  const duplicates = checkDuplicateProducts(lineItems)
  if (duplicates.length > 0) {
    for (const productId of duplicates) {
      errors.push({
        valid: false,
        productId,
        error: {
          code: 'DUPLICATE_PRODUCTS',
          message: `Product ${productId} appears multiple times in the batch`,
        },
      })
    }
    return errors
  }

  // Validate each line item's inventory
  for (const lineItem of lineItems) {
    const result = await validateLineItemInventory(agentId, lineItem)
    if (!result.valid) {
      errors.push(result)
    }
  }

  return errors
}

/**
 * Detects duplicate product IDs in a batch
 * Returns array of product IDs that appear more than once
 *
 * @param lineItems - Array of line items to check
 * @returns Array of duplicate product IDs (empty if no duplicates)
 */
export function checkDuplicateProducts(lineItems: LineItem[]): string[] {
  const productIds = new Map<string, number>()

  // Count occurrences of each product ID
  for (const lineItem of lineItems) {
    const count = productIds.get(lineItem.productId) || 0
    productIds.set(lineItem.productId, count + 1)
  }

  // Return product IDs that appear more than once
  const duplicates: string[] = []
  for (const [productId, count] of productIds.entries()) {
    if (count > 1) {
      duplicates.push(productId)
    }
  }

  return duplicates
}

/**
 * Gets inventory details for a product
 * Returns current inventory level, total sold quantity, and available quantity
 *
 * @param agentId - The agent ID
 * @param productId - The product ID
 * @returns Inventory details including issued, sold, and available quantities
 */
export async function getInventoryDetails(
  agentId: string,
  productId: string
): Promise<InventoryDetails | null> {
  try {
    // Get product details
    const product = await getProductDetails(productId)
    if (!product) {
      return null
    }

    // Get inventory levels
    const issuedQuantity = await getInventoryLevel(agentId, productId)
    const soldQuantity = await getTotalSoldQuantity(agentId, productId)

    // Calculate available quantity
    const availableQuantity = issuedQuantity - soldQuantity

    return {
      productId,
      productName: product.name,
      unitPrice: product.unit_price,
      issuedQuantity,
      soldQuantity,
      availableQuantity,
    }
  } catch (error) {
    throw new Error(
      `Error fetching inventory details for product ${productId}: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

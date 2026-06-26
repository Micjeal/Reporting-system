import { z, ZodError } from 'zod'
import { BatchSalesRequestSchema, LineItemSchema } from '@/lib/schemas/batch-sales.schema'
import { BatchSalesRequest, LineItem } from '@/lib/types/batch-sales'
import {
  getProductDetails,
  getInventoryLevel,
  getTotalSoldQuantity,
} from '@/lib/db/batch-sales.db'

/**
 * Validation error for a specific line item
 */
export interface LineItemValidationError {
  lineItemId: string
  field: string
  message: string
}

/**
 * Result of batch request validation
 */
export interface BatchValidationResult {
  valid: boolean
  data?: BatchSalesRequest
  errors?: ZodError
}

/**
 * Result of batch size validation
 */
export interface BatchSizeValidationResult {
  valid: boolean
  message?: string
}

/**
 * Result of required fields validation
 */
export interface RequiredFieldsValidationResult {
  errors: Array<{
    field: string
    message: string
  }>
}

/**
 * Result of numeric fields validation
 */
export interface NumericFieldsValidationResult {
  errors: LineItemValidationError[]
}

/**
 * Validates a batch sales request using the Zod schema
 * Returns validation result with data on success or errors on failure
 *
 * @param request - Unknown request object to validate
 * @returns Validation result with data or errors
 */
export function validateBatchRequest(request: unknown): BatchValidationResult {
  try {
    const data = BatchSalesRequestSchema.parse(request)
    return {
      valid: true,
      data,
    }
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        valid: false,
        errors: error,
      }
    }
    // Fallback for non-Zod errors
    return {
      valid: false,
      errors: new ZodError([
        {
          code: 'custom',
          message: 'Unknown validation error',
          path: [],
        },
      ]),
    }
  }
}

/**
 * Validates line item calculations
 * Checks that totalAmount = quantity × unitPrice
 * Checks that returnsAmount ≤ quantity
 *
 * @param lineItems - Array of line items to validate
 * @returns Array of calculation errors (empty if all valid)
 */
export function validateLineItemCalculations(
  lineItems: LineItem[]
): LineItemValidationError[] {
  const errors: LineItemValidationError[] = []

  lineItems.forEach((item, index) => {
    const lineItemId = item.id || `line-item-${index}`

    // Validate totalAmount = quantity × unitPrice
    const expectedTotal = item.quantity * item.unitPrice
    if (Math.abs(item.totalAmount - expectedTotal) > 0.01) {
      // Using 0.01 tolerance for floating point comparison
      errors.push({
        lineItemId,
        field: 'totalAmount',
        message: `Total amount must equal quantity (${item.quantity}) × unit price (${item.unitPrice}). Expected ${expectedTotal}, got ${item.totalAmount}`,
      })
    }

    // Validate returnsAmount ≤ quantity
    if (item.returnsAmount > item.quantity) {
      errors.push({
        lineItemId,
        field: 'returnsAmount',
        message: `Returns amount (${item.returnsAmount}) cannot exceed quantity (${item.quantity})`,
      })
    }
  })

  return errors
}

/**
 * Validates batch size constraints
 * Checks that batch has at least 1 item and at most 50 items
 *
 * @param lineItems - Array of line items in the batch
 * @returns Validation result with valid flag and optional message
 */
export function validateBatchSize(lineItems: LineItem[]): BatchSizeValidationResult {
  const itemCount = lineItems.length

  if (itemCount < 1) {
    return {
      valid: false,
      message: 'Batch must contain at least 1 item',
    }
  }

  if (itemCount > 50) {
    return {
      valid: false,
      message: `Batch must contain at most 50 items. Current batch has ${itemCount} items`,
    }
  }

  return {
    valid: true,
  }
}

/**
 * Validates that all required fields are present in the batch request
 * Checks that saleDate is in valid YYYY-MM-DD format
 *
 * @param request - Batch sales request to validate
 * @returns Array of missing field errors (empty if all present)
 */
export function validateRequiredFields(
  request: BatchSalesRequest
): RequiredFieldsValidationResult {
  const errors: Array<{ field: string; message: string }> = []

  // Check lineItems
  if (!request.lineItems) {
    errors.push({
      field: 'lineItems',
      message: 'lineItems is required',
    })
  } else if (!Array.isArray(request.lineItems)) {
    errors.push({
      field: 'lineItems',
      message: 'lineItems must be an array',
    })
  }

  // Check saleDate
  if (!request.saleDate) {
    errors.push({
      field: 'saleDate',
      message: 'saleDate is required',
    })
  } else if (typeof request.saleDate !== 'string') {
    errors.push({
      field: 'saleDate',
      message: 'saleDate must be a string',
    })
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(request.saleDate)) {
    errors.push({
      field: 'saleDate',
      message: 'saleDate must be in YYYY-MM-DD format',
    })
  } else {
    // Validate that it's a valid date
    const date = new Date(request.saleDate)
    if (isNaN(date.getTime())) {
      errors.push({
        field: 'saleDate',
        message: 'saleDate is not a valid date',
      })
    }
  }

  // Check expensesTotal
  if (request.expensesTotal === undefined) {
    errors.push({
      field: 'expensesTotal',
      message: 'expensesTotal is required',
    })
  } else if (typeof request.expensesTotal !== 'number') {
    errors.push({
      field: 'expensesTotal',
      message: 'expensesTotal must be a number',
    })
  }

  // Check tokensDeducted
  if (request.tokensDeducted === undefined) {
    errors.push({
      field: 'tokensDeducted',
      message: 'tokensDeducted is required',
    })
  } else if (typeof request.tokensDeducted !== 'number') {
    errors.push({
      field: 'tokensDeducted',
      message: 'tokensDeducted must be a number',
    })
  }

  return { errors }
}

/**
 * Validates numeric fields in line items
 * Checks that quantities are positive integers
 * Checks that prices are non-negative numbers
 * Checks that amounts are non-negative numbers
 *
 * @param lineItems - Array of line items to validate
 * @returns Array of numeric validation errors (empty if all valid)
 */
export function validateNumericFields(lineItems: LineItem[]): NumericFieldsValidationResult {
  const errors: LineItemValidationError[] = []

  lineItems.forEach((item, index) => {
    const lineItemId = item.id || `line-item-${index}`

    // Validate quantity is a positive integer
    if (typeof item.quantity !== 'number') {
      errors.push({
        lineItemId,
        field: 'quantity',
        message: 'Quantity must be a number',
      })
    } else if (!Number.isInteger(item.quantity)) {
      errors.push({
        lineItemId,
        field: 'quantity',
        message: 'Quantity must be an integer',
      })
    } else if (item.quantity <= 0) {
      errors.push({
        lineItemId,
        field: 'quantity',
        message: 'Quantity must be a positive integer',
      })
    }

    // Validate unitPrice is a non-negative number
    if (typeof item.unitPrice !== 'number') {
      errors.push({
        lineItemId,
        field: 'unitPrice',
        message: 'Unit price must be a number',
      })
    } else if (item.unitPrice < 0) {
      errors.push({
        lineItemId,
        field: 'unitPrice',
        message: 'Unit price must be a non-negative number',
      })
    }

    // Validate totalAmount is a non-negative number
    if (typeof item.totalAmount !== 'number') {
      errors.push({
        lineItemId,
        field: 'totalAmount',
        message: 'Total amount must be a number',
      })
    } else if (item.totalAmount < 0) {
      errors.push({
        lineItemId,
        field: 'totalAmount',
        message: 'Total amount must be a non-negative number',
      })
    }

    // Validate returnsAmount is a non-negative number
    if (typeof item.returnsAmount !== 'number') {
      errors.push({
        lineItemId,
        field: 'returnsAmount',
        message: 'Returns amount must be a number',
      })
    } else if (item.returnsAmount < 0) {
      errors.push({
        lineItemId,
        field: 'returnsAmount',
        message: 'Returns amount must be a non-negative number',
      })
    }

    // Validate adjustmentsAmount is a non-negative number
    if (typeof item.adjustmentsAmount !== 'number') {
      errors.push({
        lineItemId,
        field: 'adjustmentsAmount',
        message: 'Adjustments amount must be a number',
      })
    } else if (item.adjustmentsAmount < 0) {
      errors.push({
        lineItemId,
        field: 'adjustmentsAmount',
        message: 'Adjustments amount must be a non-negative number',
      })
    }
  })

  return { errors }
}

/**
 * Result of line item inventory validation
 */
export interface LineItemInventoryValidationResult {
  valid: boolean
  error?: string
}

/**
 * Result of batch inventory validation
 */
export interface BatchInventoryValidationResult {
  valid: boolean
  errors?: Array<{
    productId: string
    error: string
  }>
}

/**
 * Validates inventory for a single line item
 * Checks if product exists, gets current inventory level, and validates
 * that sold + new_quantity <= issued_inventory
 *
 * @param agentId - The agent ID
 * @param lineItem - The line item to validate
 * @returns Validation result with error details if insufficient inventory
 */
export async function validateLineItemInventory(
  agentId: string,
  lineItem: LineItem
): Promise<LineItemInventoryValidationResult> {
  try {
    // Check if product exists
    const product = await getProductDetails(lineItem.productId)
    if (!product) {
      return {
        valid: false,
        error: `Product ${lineItem.productId} not found`,
      }
    }

    // Get current inventory level (issued inventory)
    const issuedInventory = await getInventoryLevel(agentId, lineItem.productId)

    // Get total sold quantity
    const totalSold = await getTotalSoldQuantity(agentId, lineItem.productId)

    // Validate: sold + new_quantity <= issued_inventory
    const available = issuedInventory - totalSold
    if (totalSold + lineItem.quantity > issuedInventory) {
      return {
        valid: false,
        error: getInventoryErrorMessage(
          lineItem.productId,
          lineItem.quantity,
          available
        ),
      }
    }

    return { valid: true }
  } catch (error) {
    return {
      valid: false,
      error: `Error validating inventory for product ${lineItem.productId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Validates inventory for all line items in a batch
 * Checks each line item's inventory and checks for duplicate product IDs
 *
 * @param agentId - The agent ID
 * @param lineItems - Array of line items to validate
 * @returns Validation result with all errors collected
 */
export async function validateBatchInventory(
  agentId: string,
  lineItems: LineItem[]
): Promise<BatchInventoryValidationResult> {
  const errors: Array<{ productId: string; error: string }> = []

  // Check for duplicate products
  const duplicates = checkDuplicateProducts(lineItems)
  if (duplicates.length > 0) {
    duplicates.forEach((productId) => {
      errors.push({
        productId,
        error: `Product ${productId} appears multiple times in batch`,
      })
    })
  }

  // Validate each line item's inventory
  for (const lineItem of lineItems) {
    const result = await validateLineItemInventory(agentId, lineItem)
    if (!result.valid && result.error) {
      errors.push({
        productId: lineItem.productId,
        error: result.error,
      })
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  }
}

/**
 * Checks if any product ID appears more than once in the batch
 *
 * @param lineItems - Array of line items to check
 * @returns Array of duplicate product IDs (empty if no duplicates)
 */
export function checkDuplicateProducts(lineItems: LineItem[]): string[] {
  const productIds = new Map<string, number>()

  // Count occurrences of each product ID
  lineItems.forEach((item) => {
    const count = productIds.get(item.productId) || 0
    productIds.set(item.productId, count + 1)
  })

  // Return product IDs that appear more than once
  return Array.from(productIds.entries())
    .filter(([_, count]) => count > 1)
    .map(([productId, _]) => productId)
}

/**
 * Formats a user-friendly error message for inventory shortage
 *
 * @param productId - The product ID
 * @param needed - The quantity needed
 * @param available - The quantity available
 * @returns Formatted error message
 */
export function getInventoryErrorMessage(
  productId: string,
  needed: number,
  available: number
): string {
  return `Product ${productId}: Need ${needed} units, only ${available} available`
}

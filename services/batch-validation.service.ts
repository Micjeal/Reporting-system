import { z, ZodError } from 'zod'
import { BatchSalesRequestSchema } from '@/lib/schemas/batch-sales.schema'
import { BatchSalesRequest, LineItem } from '@/lib/types/batch-sales'

/**
 * Validation result for batch structure
 */
export type BatchStructureValidationResult =
  | { valid: true }
  | {
      valid: false
      errors: Array<{
        path: string
        message: string
      }>
    }

/**
 * Validation result for line item calculations
 */
export type LineItemCalculationValidationResult =
  | { valid: true }
  | {
      valid: false
      errors: Array<{
        lineItemIndex: number
        field: string
        message: string
      }>
    }

/**
 * Validation result for batch size
 */
export type BatchSizeValidationResult =
  | { valid: true }
  | {
      valid: false
      error: string
    }

/**
 * Validation result for required fields
 */
export type RequiredFieldsValidationResult =
  | { valid: true }
  | {
      valid: false
      missingFields: string[]
    }

/**
 * Validation result for batch date
 */
export type BatchDateValidationResult =
  | { valid: true }
  | {
      valid: false
      error: string
    }

/**
 * Validates the batch structure using the BatchSalesRequestSchema
 * Returns { valid: true } if validation passes
 * Returns { valid: false, errors: [...] } with Zod validation errors if it fails
 *
 * @param batch - Unknown batch object to validate
 * @returns Validation result with valid flag and errors if invalid
 */
export function validateBatchStructure(batch: unknown): BatchStructureValidationResult {
  try {
    BatchSalesRequestSchema.parse(batch)
    return { valid: true }
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.errors.map((err) => ({
        path: err.path.join('.') || 'root',
        message: err.message,
      }))
      return {
        valid: false,
        errors,
      }
    }
    return {
      valid: false,
      errors: [
        {
          path: 'root',
          message: 'Unknown validation error',
        },
      ],
    }
  }
}

/**
 * Validates line item calculations
 * For each line item, verifies:
 * - totalAmount = quantity × unitPrice
 * - quantity is a positive integer
 * - unitPrice is non-negative
 * - returnsAmount <= quantity
 *
 * @param lineItems - Array of line items to validate
 * @returns Validation result with valid flag and errors if invalid
 */
export function validateLineItemCalculations(
  lineItems: LineItem[]
): LineItemCalculationValidationResult {
  const errors: Array<{
    lineItemIndex: number
    field: string
    message: string
  }> = []

  lineItems.forEach((item, index) => {
    // Validate quantity is a positive integer
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      errors.push({
        lineItemIndex: index,
        field: 'quantity',
        message: 'Quantity must be a positive integer',
      })
    }

    // Validate unitPrice is non-negative
    if (item.unitPrice < 0) {
      errors.push({
        lineItemIndex: index,
        field: 'unitPrice',
        message: 'Unit price must be non-negative',
      })
    }

    // Validate totalAmount = quantity × unitPrice
    const expectedTotal = item.quantity * item.unitPrice
    // Using 0.01 tolerance for floating point comparison
    if (Math.abs(item.totalAmount - expectedTotal) > 0.01) {
      errors.push({
        lineItemIndex: index,
        field: 'totalAmount',
        message: `Total amount must equal quantity (${item.quantity}) × unit price (${item.unitPrice}). Expected ${expectedTotal}, got ${item.totalAmount}`,
      })
    }

    // Validate returnsAmount <= quantity
    if (item.returnsAmount > item.quantity) {
      errors.push({
        lineItemIndex: index,
        field: 'returnsAmount',
        message: `Returns amount (${item.returnsAmount}) cannot exceed quantity (${item.quantity})`,
      })
    }
  })

  if (errors.length > 0) {
    return {
      valid: false,
      errors,
    }
  }

  return { valid: true }
}

/**
 * Validates batch size constraints
 * Checks that batch has at least 1 item
 * Checks that batch has at most 50 items
 *
 * @param lineItems - Array of line items in the batch
 * @returns Validation result with valid flag and error message if invalid
 */
export function validateBatchSize(lineItems: LineItem[]): BatchSizeValidationResult {
  const itemCount = lineItems.length

  if (itemCount < 1) {
    return {
      valid: false,
      error: 'Batch must contain at least 1 item',
    }
  }

  if (itemCount > 50) {
    return {
      valid: false,
      error: `Batch must contain at most 50 items. Current batch has ${itemCount} items`,
    }
  }

  return { valid: true }
}

/**
 * Validates that all required fields are present and non-empty
 * Required fields: lineItems, saleDate
 *
 * @param batch - Batch sales request to validate
 * @returns Validation result with valid flag and missing fields if invalid
 */
export function validateRequiredFields(batch: BatchSalesRequest): RequiredFieldsValidationResult {
  const missingFields: string[] = []

  // Check lineItems
  if (!batch.lineItems || !Array.isArray(batch.lineItems) || batch.lineItems.length === 0) {
    missingFields.push('lineItems')
  }

  // Check saleDate
  if (!batch.saleDate || typeof batch.saleDate !== 'string' || batch.saleDate.trim() === '') {
    missingFields.push('saleDate')
  }

  if (missingFields.length > 0) {
    return {
      valid: false,
      missingFields,
    }
  }

  return { valid: true }
}

/**
 * Validates batch date
 * Validates date is in YYYY-MM-DD format
 * Validates date is not in the future
 *
 * @param dateString - Date string to validate
 * @returns Validation result with valid flag and error message if invalid
 */
export function validateBatchDate(dateString: string): BatchDateValidationResult {
  // Validate format is YYYY-MM-DD
  const dateFormatRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateFormatRegex.test(dateString)) {
    return {
      valid: false,
      error: 'Date must be in YYYY-MM-DD format',
    }
  }

  // Validate it's a valid date
  const date = new Date(dateString)
  if (isNaN(date.getTime())) {
    return {
      valid: false,
      error: 'Invalid date provided',
    }
  }

  // Validate date is not in the future
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Set to start of day for fair comparison

  if (date > today) {
    return {
      valid: false,
      error: 'Sale date cannot be in the future',
    }
  }

  return { valid: true }
}
import { z } from 'zod'

/**
 * LineItemSchema validates individual line items in a batch sales request
 * Each line item represents a single product sale with quantity, pricing, and optional returns/adjustments
 */
export const LineItemSchema = z.object({
  id: z.string().optional(),
  productId: z
    .string()
    .min(1, 'Product ID is required'),
  productName: z.string().optional(),
  quantity: z
    .number()
    .int('Quantity must be a positive integer')
    .gt(0, 'Quantity must be a positive integer'),
  unitPrice: z
    .number()
    .nonnegative('Price must be a non-negative number'),
  totalAmount: z
    .number()
    .nonnegative('Total amount must be a non-negative number')
    .optional(),
  returnsAmount: z
    .number()
    .nonnegative('Returns amount must be a non-negative number')
    .optional()
    .default(0),
  adjustmentsAmount: z
    .number()
    .nonnegative('Adjustments amount must be a non-negative number')
    .optional()
    .default(0),
})

export type LineItem = z.infer<typeof LineItemSchema>

/**
 * BatchSalesRequestSchema validates the entire batch sales request
 * Ensures batch contains 1-50 line items and all optional fields are properly formatted
 */
export const BatchSalesRequestSchema = z.object({
  lineItems: z
    .array(LineItemSchema)
    .min(1, 'Batch must contain between 1 and 50 products')
    .max(50, 'Batch must contain between 1 and 50 products'),
  saleDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Sale date must be in YYYY-MM-DD format'),
  customerName: z
    .string()
    .max(100, 'Customer name must be less than 100 characters')
    .optional(),
  customerPhone: z
    .string()
    .max(20, 'Phone number must be less than 20 characters')
    .optional(),
  location: z
    .string()
    .max(200, 'Location must be less than 200 characters')
    .optional(),
  route: z
    .string()
    .max(100, 'Route must be less than 100 characters')
    .optional(),
  bankDetails: z
    .string()
    .max(200, 'Bank details must be less than 200 characters')
    .optional(),
  expensesTotal: z
    .number()
    .nonnegative('Expenses total must be a non-negative number')
    .optional()
    .default(0),
  tokensDeducted: z
    .number()
    .nonnegative('Tokens deducted must be a non-negative number')
    .optional()
    .default(0),
  notes: z
    .string()
    .max(500, 'Notes must be less than 500 characters')
    .optional(),
})

export type BatchSalesRequest = z.infer<typeof BatchSalesRequestSchema>

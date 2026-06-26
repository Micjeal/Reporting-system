import { z } from 'zod'

export const newSaleSchema = z.object({
  productId: z
    .string()
    .min(1, 'Please select a product'),
  quantity: z
    .number()
    .int('Quantity must be a whole number')
    .gt(0, 'Quantity must be greater than 0')
    .max(9999, 'Quantity must be less than 10,000'),
  unitPrice: z
    .number()
    .nonnegative('Unit price must be non-negative'),
  totalAmount: z
    .number()
    .nonnegative('Total amount must be non-negative'),
  saleDate: z
    .union([z.string(), z.date()])
    .transform((val) => {
      if (typeof val === 'string') return val
      return val.toISOString().split('T')[0]
    }),
  // New fields
  customerName: z
    .string()
    .min(2, 'Customer name must be at least 2 characters')
    .max(100, 'Customer name must be less than 100 characters')
    .optional()
    .default(''),
  customerPhone: z
    .string()
    .regex(/^[\d\s\-\+\(\)]*$/, 'Invalid phone number format')
    .max(20, 'Phone number must be less than 20 characters')
    .optional()
    .default(''),
  location: z
    .string()
    .max(200, 'Location must be less than 200 characters')
    .optional()
    .default(''),
  route: z
    .string()
    .max(100, 'Route must be less than 100 characters')
    .optional()
    .default(''),
  bankDetails: z
    .string()
    .max(200, 'Bank details must be less than 200 characters')
    .optional()
    .default(''),
  expensesTotal: z
    .number()
    .nonnegative('Expenses total must be non-negative')
    .optional()
    .default(0),
  tokensDeducted: z
    .number()
    .nonnegative('Tokens deducted must be non-negative')
    .optional()
    .default(0),
  returnsAmount: z
    .number()
    .nonnegative('Returns amount must be non-negative')
    .optional()
    .default(0),
  notes: z
    .string()
    .max(500, 'Notes must be less than 500 characters')
    .optional()
    .default(''),
  paymentMethod: z
    .enum(['cash', 'mobile_money', 'bank'])
    .optional()
    .default('cash'),
}).refine(
  (data) => {
    // Validate that total equals quantity * unitPrice (allow for floating point errors)
    if (data.unitPrice === 0 && data.totalAmount === 0) return true
    const calculated = data.quantity * data.unitPrice
    return Math.abs(calculated - data.totalAmount) < 0.01
  },
  {
    message: 'Total amount does not match quantity × unit price',
    path: ['totalAmount'],
  }
)

export type NewSaleFormData = z.infer<typeof newSaleSchema>

// Mock product data
export const mockProducts = [
  { id: 'prod-001', name: 'Wireless Headphones', price: 79.99, available: 45 },
  { id: 'prod-002', name: 'USB-C Cable', price: 12.99, available: 120 },
  { id: 'prod-003', name: 'Phone Stand', price: 24.99, available: 67 },
  { id: 'prod-004', name: 'Screen Protector (Pack of 3)', price: 8.99, available: 200 },
  { id: 'prod-005', name: 'Portable Charger', price: 34.99, available: 32 },
  { id: 'prod-006', name: 'Bluetooth Speaker', price: 59.99, available: 28 },
  { id: 'prod-007', name: 'Phone Case', price: 19.99, available: 85 },
  { id: 'prod-008', name: 'Screen Cleaning Kit', price: 9.99, available: 150 },
]

import { describe, it, expect } from 'vitest'
import { LineItemSchema, BatchSalesRequestSchema } from './batch-sales.schema'

describe('LineItemSchema', () => {
  it('should validate a valid line item', () => {
    const validItem = {
      productId: 'prod-001',
      quantity: 5,
      unitPrice: 29.99,
    }
    const result = LineItemSchema.safeParse(validItem)
    expect(result.success).toBe(true)
  })

  it('should validate a line item with optional fields', () => {
    const validItem = {
      productId: 'prod-001',
      quantity: 5,
      unitPrice: 29.99,
      returnsAmount: 2.50,
      adjustmentsAmount: 1.00,
    }
    const result = LineItemSchema.safeParse(validItem)
    expect(result.success).toBe(true)
  })

  it('should default returnsAmount to 0', () => {
    const item = {
      productId: 'prod-001',
      quantity: 5,
      unitPrice: 29.99,
    }
    const result = LineItemSchema.safeParse(item)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.returnsAmount).toBe(0)
    }
  })

  it('should default adjustmentsAmount to 0', () => {
    const item = {
      productId: 'prod-001',
      quantity: 5,
      unitPrice: 29.99,
    }
    const result = LineItemSchema.safeParse(item)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.adjustmentsAmount).toBe(0)
    }
  })

  it('should reject empty productId', () => {
    const invalidItem = {
      productId: '',
      quantity: 5,
      unitPrice: 29.99,
    }
    const result = LineItemSchema.safeParse(invalidItem)
    expect(result.success).toBe(false)
  })

  it('should reject zero quantity', () => {
    const invalidItem = {
      productId: 'prod-001',
      quantity: 0,
      unitPrice: 29.99,
    }
    const result = LineItemSchema.safeParse(invalidItem)
    expect(result.success).toBe(false)
  })

  it('should reject negative quantity', () => {
    const invalidItem = {
      productId: 'prod-001',
      quantity: -5,
      unitPrice: 29.99,
    }
    const result = LineItemSchema.safeParse(invalidItem)
    expect(result.success).toBe(false)
  })

  it('should reject non-integer quantity', () => {
    const invalidItem = {
      productId: 'prod-001',
      quantity: 5.5,
      unitPrice: 29.99,
    }
    const result = LineItemSchema.safeParse(invalidItem)
    expect(result.success).toBe(false)
  })

  it('should reject negative unitPrice', () => {
    const invalidItem = {
      productId: 'prod-001',
      quantity: 5,
      unitPrice: -10.00,
    }
    const result = LineItemSchema.safeParse(invalidItem)
    expect(result.success).toBe(false)
  })

  it('should accept zero unitPrice', () => {
    const validItem = {
      productId: 'prod-001',
      quantity: 5,
      unitPrice: 0,
    }
    const result = LineItemSchema.safeParse(validItem)
    expect(result.success).toBe(true)
  })

  it('should reject negative returnsAmount', () => {
    const invalidItem = {
      productId: 'prod-001',
      quantity: 5,
      unitPrice: 29.99,
      returnsAmount: -1.00,
    }
    const result = LineItemSchema.safeParse(invalidItem)
    expect(result.success).toBe(false)
  })

  it('should reject negative adjustmentsAmount', () => {
    const invalidItem = {
      productId: 'prod-001',
      quantity: 5,
      unitPrice: 29.99,
      adjustmentsAmount: -0.50,
    }
    const result = LineItemSchema.safeParse(invalidItem)
    expect(result.success).toBe(false)
  })
})

describe('BatchSalesRequestSchema', () => {
  it('should validate a valid batch request with single item', () => {
    const validBatch = {
      lineItems: [
        {
          productId: 'prod-001',
          quantity: 5,
          unitPrice: 29.99,
        },
      ],
      saleDate: '2024-01-15',
    }
    const result = BatchSalesRequestSchema.safeParse(validBatch)
    expect(result.success).toBe(true)
  })

  it('should validate a valid batch request with multiple items', () => {
    const validBatch = {
      lineItems: [
        {
          productId: 'prod-001',
          quantity: 5,
          unitPrice: 29.99,
        },
        {
          productId: 'prod-002',
          quantity: 10,
          unitPrice: 15.50,
        },
      ],
      saleDate: '2024-01-15',
    }
    const result = BatchSalesRequestSchema.safeParse(validBatch)
    expect(result.success).toBe(true)
  })

  it('should validate a batch with all optional fields', () => {
    const validBatch = {
      lineItems: [
        {
          productId: 'prod-001',
          quantity: 5,
          unitPrice: 29.99,
        },
      ],
      saleDate: '2024-01-15',
      customerName: 'John Doe',
      customerPhone: '+1-555-123-4567',
      location: 'New York',
      route: 'Route A',
      bankDetails: 'Bank of America',
      expensesTotal: 50.00,
      tokensDeducted: 10,
      notes: 'Special order',
    }
    const result = BatchSalesRequestSchema.safeParse(validBatch)
    expect(result.success).toBe(true)
  })

  it('should default expensesTotal to 0', () => {
    const batch = {
      lineItems: [
        {
          productId: 'prod-001',
          quantity: 5,
          unitPrice: 29.99,
        },
      ],
      saleDate: '2024-01-15',
    }
    const result = BatchSalesRequestSchema.safeParse(batch)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.expensesTotal).toBe(0)
    }
  })

  it('should default tokensDeducted to 0', () => {
    const batch = {
      lineItems: [
        {
          productId: 'prod-001',
          quantity: 5,
          unitPrice: 29.99,
        },
      ],
      saleDate: '2024-01-15',
    }
    const result = BatchSalesRequestSchema.safeParse(batch)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.tokensDeducted).toBe(0)
    }
  })

  it('should reject empty lineItems array', () => {
    const invalidBatch = {
      lineItems: [],
      saleDate: '2024-01-15',
    }
    const result = BatchSalesRequestSchema.safeParse(invalidBatch)
    expect(result.success).toBe(false)
  })

  it('should reject batch with more than 50 items', () => {
    const items = Array.from({ length: 51 }, (_, i) => ({
      productId: `prod-${i}`,
      quantity: 1,
      unitPrice: 10.00,
    }))
    const invalidBatch = {
      lineItems: items,
      saleDate: '2024-01-15',
    }
    const result = BatchSalesRequestSchema.safeParse(invalidBatch)
    expect(result.success).toBe(false)
  })

  it('should accept batch with exactly 50 items', () => {
    const items = Array.from({ length: 50 }, (_, i) => ({
      productId: `prod-${i}`,
      quantity: 1,
      unitPrice: 10.00,
    }))
    const validBatch = {
      lineItems: items,
      saleDate: '2024-01-15',
    }
    const result = BatchSalesRequestSchema.safeParse(validBatch)
    expect(result.success).toBe(true)
  })

  it('should reject invalid saleDate format', () => {
    const invalidBatch = {
      lineItems: [
        {
          productId: 'prod-001',
          quantity: 5,
          unitPrice: 29.99,
        },
      ],
      saleDate: '01/15/2024',
    }
    const result = BatchSalesRequestSchema.safeParse(invalidBatch)
    expect(result.success).toBe(false)
  })

  it('should reject customerName exceeding 100 characters', () => {
    const invalidBatch = {
      lineItems: [
        {
          productId: 'prod-001',
          quantity: 5,
          unitPrice: 29.99,
        },
      ],
      saleDate: '2024-01-15',
      customerName: 'a'.repeat(101),
    }
    const result = BatchSalesRequestSchema.safeParse(invalidBatch)
    expect(result.success).toBe(false)
  })

  it('should reject customerPhone exceeding 20 characters', () => {
    const invalidBatch = {
      lineItems: [
        {
          productId: 'prod-001',
          quantity: 5,
          unitPrice: 29.99,
        },
      ],
      saleDate: '2024-01-15',
      customerPhone: '1'.repeat(21),
    }
    const result = BatchSalesRequestSchema.safeParse(invalidBatch)
    expect(result.success).toBe(false)
  })

  it('should reject location exceeding 200 characters', () => {
    const invalidBatch = {
      lineItems: [
        {
          productId: 'prod-001',
          quantity: 5,
          unitPrice: 29.99,
        },
      ],
      saleDate: '2024-01-15',
      location: 'a'.repeat(201),
    }
    const result = BatchSalesRequestSchema.safeParse(invalidBatch)
    expect(result.success).toBe(false)
  })

  it('should reject route exceeding 100 characters', () => {
    const invalidBatch = {
      lineItems: [
        {
          productId: 'prod-001',
          quantity: 5,
          unitPrice: 29.99,
        },
      ],
      saleDate: '2024-01-15',
      route: 'a'.repeat(101),
    }
    const result = BatchSalesRequestSchema.safeParse(invalidBatch)
    expect(result.success).toBe(false)
  })

  it('should reject bankDetails exceeding 200 characters', () => {
    const invalidBatch = {
      lineItems: [
        {
          productId: 'prod-001',
          quantity: 5,
          unitPrice: 29.99,
        },
      ],
      saleDate: '2024-01-15',
      bankDetails: 'a'.repeat(201),
    }
    const result = BatchSalesRequestSchema.safeParse(invalidBatch)
    expect(result.success).toBe(false)
  })

  it('should reject notes exceeding 500 characters', () => {
    const invalidBatch = {
      lineItems: [
        {
          productId: 'prod-001',
          quantity: 5,
          unitPrice: 29.99,
        },
      ],
      saleDate: '2024-01-15',
      notes: 'a'.repeat(501),
    }
    const result = BatchSalesRequestSchema.safeParse(invalidBatch)
    expect(result.success).toBe(false)
  })

  it('should reject negative expensesTotal', () => {
    const invalidBatch = {
      lineItems: [
        {
          productId: 'prod-001',
          quantity: 5,
          unitPrice: 29.99,
        },
      ],
      saleDate: '2024-01-15',
      expensesTotal: -10.00,
    }
    const result = BatchSalesRequestSchema.safeParse(invalidBatch)
    expect(result.success).toBe(false)
  })

  it('should reject negative tokensDeducted', () => {
    const invalidBatch = {
      lineItems: [
        {
          productId: 'prod-001',
          quantity: 5,
          unitPrice: 29.99,
        },
      ],
      saleDate: '2024-01-15',
      tokensDeducted: -5,
    }
    const result = BatchSalesRequestSchema.safeParse(invalidBatch)
    expect(result.success).toBe(false)
  })
})

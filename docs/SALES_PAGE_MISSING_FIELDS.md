# Sales Page - Missing Fields Analysis

## Overview
The sales form has been enhanced with new fields, but they are not being persisted to the database. This document outlines all missing pieces.

## 1. DATABASE SCHEMA CHANGES NEEDED

### Current Sales Table
```sql
CREATE TABLE sales (
  id BIGINT PRIMARY KEY,
  agent_id BIGINT NOT NULL,
  product_id BIGINT,
  quantity INTEGER,
  amount NUMERIC,
  date TIMESTAMP,
  created_at TIMESTAMP,
  FOREIGN KEY (agent_id) REFERENCES agents(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);
```

### Required New Columns
```sql
ALTER TABLE sales ADD COLUMN customer_name VARCHAR(100);
ALTER TABLE sales ADD COLUMN customer_phone VARCHAR(20);
ALTER TABLE sales ADD COLUMN location VARCHAR(200);
ALTER TABLE sales ADD COLUMN route VARCHAR(100);
ALTER TABLE sales ADD COLUMN bank_details VARCHAR(200);
ALTER TABLE sales ADD COLUMN expenses_total NUMERIC DEFAULT 0;
ALTER TABLE sales ADD COLUMN tokens_deducted NUMERIC DEFAULT 0;
ALTER TABLE sales ADD COLUMN returns_amount NUMERIC DEFAULT 0;
ALTER TABLE sales ADD COLUMN notes TEXT;
```

## 2. API CHANGES NEEDED

### File: `/app/api/sales/route.ts`

**Current POST Schema:**
```typescript
const createSaleSchema = z.object({
  product_id: z.string().min(1),
  quantity: z.number().int().positive(),
  amount: z.number().positive(),
  date: z.string().min(10),
})
```

**Required Updated Schema:**
```typescript
const createSaleSchema = z.object({
  product_id: z.string().min(1),
  quantity: z.number().int().positive(),
  amount: z.number().positive(),
  date: z.string().min(10),
  customer_name: z.string().max(100).optional().default(''),
  customer_phone: z.string().max(20).optional().default(''),
  location: z.string().max(200).optional().default(''),
  route: z.string().max(100).optional().default(''),
  bank_details: z.string().max(200).optional().default(''),
  expenses_total: z.number().nonnegative().optional().default(0),
  tokens_deducted: z.number().nonnegative().optional().default(0),
  returns_amount: z.number().nonnegative().optional().default(0),
  notes: z.string().max(500).optional().default(''),
})
```

**Required Changes in POST Handler:**
- Update the insert statement to include all new fields
- Pass new fields from body to database insert

## 3. SERVICE LAYER CHANGES NEEDED

### File: `/services/sales.service.ts`

**Current createSale Function:**
```typescript
export function createSale(payload: { 
  product_id: string
  quantity: number
  amount: number
  date: string 
}) {
  return apiPost<Sale, typeof payload>('/api/sales', payload)
}
```

**Required Updated Function:**
```typescript
export function createSale(payload: {
  product_id: string
  quantity: number
  amount: number
  date: string
  customer_name?: string
  customer_phone?: string
  location?: string
  route?: string
  bank_details?: string
  expenses_total?: number
  tokens_deducted?: number
  returns_amount?: number
  notes?: string
}) {
  return apiPost<Sale, typeof payload>('/api/sales', payload)
}
```

## 4. FRONTEND CHANGES NEEDED

### File: `/components/agent/new-sale-form.tsx`

**Current Issue:**
- Form has the fields but they're not being passed to `createSale()`
- The `onSubmit` function only sends: `product_id`, `quantity`, `amount`, `date`

**Required Fix:**
```typescript
async function onSubmit(data: NewSaleFormData) {
  // ... existing code ...
  
  await salesService.createSale({
    product_id: String(data.productId),
    quantity: data.quantity,
    amount: data.totalAmount,
    date: typeof data.saleDate === 'string' ? data.saleDate : data.saleDate.toISOString().slice(0, 10),
    // ADD THESE NEW FIELDS:
    customer_name: data.customerName,
    customer_phone: data.customerPhone,
    location: data.location,
    route: data.route,
    bank_details: data.bankDetails,
    notes: data.notes,
  })
}
```

## 5. TYPE DEFINITIONS CHANGES NEEDED

### File: `/lib/database.types.ts`

**Current Sales Row Type:**
```typescript
sales: {
  Row: {
    id: string
    agent_id: string
    product_id: string
    quantity: number
    amount: number
    date: string
    created_at: string
    updated_at: string
  }
}
```

**Required Updated Type:**
```typescript
sales: {
  Row: {
    id: string
    agent_id: string
    product_id: string
    quantity: number
    amount: number
    date: string
    customer_name?: string
    customer_phone?: string
    location?: string
    route?: string
    bank_details?: string
    expenses_total?: number
    tokens_deducted?: number
    returns_amount?: number
    notes?: string
    created_at: string
    updated_at: string
  }
  Insert: {
    // ... same fields as Row ...
  }
  Update: {
    // ... same fields as Row ...
  }
}
```

## 6. IMPLEMENTATION CHECKLIST

- [ ] Update database schema with new columns
- [ ] Update `/lib/database.types.ts` with new fields
- [ ] Update `/app/api/sales/route.ts` POST schema
- [ ] Update `/app/api/sales/route.ts` insert statement
- [ ] Update `/services/sales.service.ts` createSale function
- [ ] Update `/components/agent/new-sale-form.tsx` onSubmit to pass new fields
- [ ] Test form submission with new fields
- [ ] Verify data is saved to database
- [ ] Update GET endpoint to return new fields
- [ ] Update admin sales page to display new fields

## 7. MISSING FEATURES

### Route Sales Summary Report
The form references a "Route Sales Summary Report" which should include:
- Invoice number and value
- Expenses breakdown (Fuel, Feeding, Accommodation, Airtime, Parking, Others)
- Banking details (Bank name, Account number, Amount)
- Summary (B/F, Invoice Value, Less Tokens, Less Expenses, Less Returns)
- Route details
- Signatures (Prepared by, Received by)

This requires a separate report generation feature.

## 8. PRIORITY

**High Priority (Blocking):**
1. Database schema updates
2. API schema and handler updates
3. Service layer updates
4. Form submission fix

**Medium Priority (Enhancement):**
1. Type definitions update
2. Admin page display updates
3. Report generation feature

**Low Priority (Nice to have):**
1. Expense tracking integration
2. Token/discount system
3. Returns management

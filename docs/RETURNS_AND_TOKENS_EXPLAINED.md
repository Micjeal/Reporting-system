# Returns and Tokens Explained

## Overview

Your sales system tracks two important deductions that affect net revenue:
1. **Returns Amount** - Money refunded to customers
2. **Tokens Deducted** - Discounts, vouchers, or promotional credits applied

## How They Work

### Net Revenue Calculation

```typescript
Net Revenue = Total Sales - Expenses - Tokens Deducted - Returns Amount
```

**Example**:
- Total Sales: $1,000
- Expenses: $200
- Tokens Deducted: $50
- Returns Amount: $100
- **Net Revenue**: $1,000 - $200 - $50 - $100 = **$650**

## Field Definitions

### 1. Returns Amount (`returns_amount`)

**Purpose**: Track money refunded to customers for returned products

**Use Cases**:
- Customer returns a defective product → Record the refund amount
- Partial returns on bulk orders → Record the partial refund
- Full order cancellation → Record the full refund amount
- Product exchanges with price differences → Record the difference

**Example Scenarios**:

| Scenario | Sale Amount | Returns Amount | Net Impact |
|----------|-------------|----------------|------------|
| Customer returns $50 item | $200 | $50 | $150 |
| No returns | $200 | $0 | $200 |
| Full refund | $200 | $200 | $0 |

**Database Field**:
```sql
returns_amount NUMERIC DEFAULT 0
-- Comment: 'Amount of returns or refunds'
```

### 2. Tokens Deducted (`tokens_deducted`)

**Purpose**: Track discounts, vouchers, loyalty points, or promotional credits applied to the sale

**Use Cases**:
- **Loyalty Points**: Customer redeems 500 points worth $50
- **Discount Vouchers**: Customer uses a $20 off coupon
- **Promotional Credits**: Store credit from previous returns
- **Referral Bonuses**: $10 discount for referring a friend
- **Seasonal Promotions**: Black Friday 15% off applied as tokens
- **Employee Discounts**: Staff discount applied as token value

**Example Scenarios**:

| Scenario | Sale Amount | Tokens Deducted | Customer Pays |
|----------|-------------|-----------------|---------------|
| $100 sale with $20 voucher | $100 | $20 | $80 |
| Loyalty points worth $15 | $100 | $15 | $85 |
| No discounts | $100 | $0 | $100 |
| Multiple discounts | $100 | $35 | $65 |

**Database Field**:
```sql
tokens_deducted NUMERIC DEFAULT 0
-- Comment: 'Tokens or discounts deducted from the sale'
```

## When to Use Each Field

### Use Returns Amount When:
✅ Customer physically returns a product  
✅ Issuing a refund for any reason  
✅ Processing a product exchange with refund  
✅ Canceling an order after payment  

### Use Tokens Deducted When:
✅ Applying a discount code or voucher  
✅ Redeeming loyalty points  
✅ Using store credit  
✅ Applying promotional offers  
✅ Employee or special discounts  
✅ Referral bonuses  

## Impact on Reports

Both fields affect your financial reports:

### Sales Report
```
Total Sales:        $10,000
Total Expenses:     $2,000
Tokens Deducted:    $500
Returns Amount:     $300
─────────────────────────────
Net Revenue:        $7,200
Profit Margin:      72%
```

### Route Performance
Each sales route tracks:
- Total sales on the route
- Expenses incurred
- Tokens/discounts given
- Returns processed
- **Net revenue per route**

### Agent Performance
Agents are evaluated on:
- Gross sales (before deductions)
- Net revenue (after all deductions)
- Return rate (returns / total sales)
- Discount rate (tokens / total sales)

## Best Practices

### For Returns Amount
1. **Always document the reason** in the notes field
2. **Track return dates** separately if needed
3. **Monitor return rates** by product/agent/route
4. **Set return policies** and enforce consistently

### For Tokens Deducted
1. **Document the token type** (voucher, points, promo)
2. **Track token sources** in notes (e.g., "Black Friday promo")
3. **Monitor discount rates** to ensure profitability
4. **Set discount limits** per transaction/agent

### Combined Usage
You can use both fields in the same transaction:

**Example**: Customer buys $200 worth of products, uses a $30 voucher, and returns a $50 item later.

**Initial Sale**:
- Total Amount: $200
- Tokens Deducted: $30
- Returns Amount: $0
- Customer Pays: $170

**After Return**:
- Total Amount: $200
- Tokens Deducted: $30
- Returns Amount: $50
- Net Revenue: $120

## Form Fields

In the sales form (`/agent/sales/new`):

```typescript
// Returns Amount
<Input
  type="number"
  min="0"
  step="0.01"
  value={returnsAmount || ''}
  onChange={(e) => setReturnsAmount(parseFloat(e.target.value) || 0)}
  placeholder="0.00"
/>

// Tokens Deducted
<Input
  type="number"
  min="0"
  step="0.01"
  value={tokensDeducted || ''}
  onChange={(e) => setTokensDeducted(parseFloat(e.target.value) || 0)}
  placeholder="0.00"
/>
```

## Database Schema

```sql
-- From migrations/001_add_sales_fields.sql
ALTER TABLE public.sales 
  ADD COLUMN IF NOT EXISTS tokens_deducted NUMERIC DEFAULT 0;

ALTER TABLE public.sales 
  ADD COLUMN IF NOT EXISTS returns_amount NUMERIC DEFAULT 0;
```

## API Validation

```typescript
// From app/api/sales/route.ts
const createSaleSchema = z.object({
  // ... other fields
  tokens_deducted: z.number().min(0).optional().default(0),
  returns_amount: z.number().min(0).optional().default(0),
  // ... other fields
})
```

## Common Questions

### Q: Can I have a negative value?
**A**: No, both fields only accept zero or positive values (≥ 0).

### Q: What if returns exceed the sale amount?
**A**: The system allows it, but you should investigate. This might indicate:
- Multiple returns from different sales
- Data entry error
- Fraudulent activity

### Q: Should I use tokens for employee discounts?
**A**: Yes! Tokens are perfect for any type of discount or credit applied at the time of sale.

### Q: How do I track which products were returned?
**A**: Use the `notes` field to document specific items returned. For detailed tracking, consider a separate returns management system.

### Q: Can I edit these values after the sale?
**A**: Currently, the system doesn't have a built-in edit feature. You would need to create a new adjustment transaction or manually update the database.

## Related Files

- `migrations/001_add_sales_fields.sql` - Database schema
- `app/api/sales/route.ts` - API validation
- `app/agent/sales/new/page.tsx` - Sales form
- `lib/expense-tracking.ts` - Net revenue calculations
- `lib/database.types.ts` - TypeScript types

## Summary

- **Returns Amount** = Money refunded to customers
- **Tokens Deducted** = Discounts, vouchers, credits applied
- Both reduce net revenue
- Both are optional (default to 0)
- Both accept only non-negative values
- Use notes field to document details

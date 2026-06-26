# Empty Product ID Fix

## Issue

Sales form submission failing with database error:
```
Error: invalid input syntax for type bigint: ""
```

**Request body showing the problem**:
```javascript
items: [ { product_id: '', quantity: 1, unit_price: 0 } ]
```

The form was allowing submission without selecting a product, sending an empty string `''` as the `product_id`, which PostgreSQL couldn't convert to a `bigint`.

## Root Cause

The sales form had no validation to ensure:
1. A product was selected before submission
2. All items had valid product IDs
3. All quantities were positive

Users could click "Record Sale" with empty product selections, causing a database error.

## Solution

### 1. Frontend Validation (Form)

**Added pre-submission validation**:
```typescript
// Validate that all items have a product selected
const invalidItems = items.filter(item => !item.product_id || item.product_id === '');
if (invalidItems.length > 0) {
  alert('Please select a product for all items');
  return;
}

// Validate that all items have valid quantity
const invalidQuantity = items.filter(item => item.quantity <= 0);
if (invalidQuantity.length > 0) {
  alert('Please enter a valid quantity for all items');
  return;
}
```

**Added real-time form validation**:
```typescript
const isFormValid = useMemo(() => {
  const hasValidProducts = items.every(item => item.product_id && item.product_id !== '');
  const hasValidQuantities = items.every(item => item.quantity > 0);
  return hasValidProducts && hasValidQuantities;
}, [items]);
```

**Disabled submit button when invalid**:
```typescript
<Button
  onClick={handleSubmit}
  disabled={loading || !isFormValid}
  className="w-full h-12 text-base"
>
```

**Added validation message**:
```typescript
{!isFormValid && (
  <p className="text-sm text-red-500 text-center -mt-2">
    Please select a product and enter valid quantities for all items
  </p>
)}
```

**File**: `app/agent/sales/new/page.tsx`

### 2. Backend Validation (API Route)

**Enhanced Zod schema validation**:
```typescript
product_id: z.union([z.string(), z.number()])
  .transform((v) => String(v))
  .refine((v) => v !== '' && v !== '0', { message: 'Product ID is required' }),
```

This provides a clear error message if an empty product ID somehow gets through.

**File**: `app/api/sales/route.ts`

## User Experience Improvements

✅ **Submit button disabled** when form is invalid  
✅ **Clear error message** shown below button  
✅ **Pre-submission validation** with user-friendly alerts  
✅ **Real-time validation** updates as user fills form  
✅ **Better error messages** from backend if validation fails

## Testing

Test the fix by:
1. Navigate to `/agent/sales/new`
2. Try to submit without selecting a product
   - Expected: Button is disabled, error message shown
3. Select a product
   - Expected: Button becomes enabled
4. Set quantity to 0 or negative
   - Expected: Button becomes disabled again
5. Set valid quantity
   - Expected: Button enabled, form submits successfully

## Date Fixed

May 25, 2026

## Related Files

- `app/agent/sales/new/page.tsx` - Frontend form validation
- `app/api/sales/route.ts` - Backend schema validation
- `services/sales.service.ts` - Sales service (no changes needed)

## Related Issues

This fix also prevents:
- Accidental submissions with incomplete data
- Database constraint violations
- Poor user experience with cryptic error messages
- Invalid data entering the database

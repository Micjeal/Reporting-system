# New Sale Page Documentation

## Overview
The New Sale page (`/agent/sales/new`) allows field sales agents to quickly and efficiently record new sales transactions. The form is optimized for mobile use with large touch targets and intuitive auto-calculation features.

## Features

### Form Fields
1. **Product Selector** (Required)
   - Dropdown with all available products
   - Shows product name and available inventory count
   - Auto-filters list as you type

2. **Quantity** (Required)
   - Number input with large touch target (h-12)
   - Validation: Must be > 0 and ≤ available inventory
   - Spinbutton controls for fine adjustment

3. **Unit Price** (Read-only)
   - Auto-filled when product is selected
   - Displays 2 decimal places
   - Gray background indicates read-only field

4. **Total Amount** (Auto-calculated, Read-only)
   - Automatically calculated: Quantity × Unit Price
   - Highlighted with primary color for visibility
   - Displays formatted currency ($)
   - Updates in real-time as quantity changes

5. **Sale Date** (Required)
   - Date picker with default to today
   - Validation: Cannot be more than 30 days in the past
   - Accessible date input

6. **Notes** (Optional)
   - Textarea for additional sale context
   - 500 character limit with real-time count
   - Useful for customer notes, special conditions, etc.

### Auto-Calculation Behavior
- **Product Selection**: When a product is selected, the Unit Price field is automatically populated with the product's list price
- **Quantity Change**: When quantity changes, the Total Amount is instantly recalculated (quantity × unit price)
- **Client-side Validation**: All calculations are validated on the client side using Zod schemas
- **Floating Point Handling**: Uses toFixed(2) for accurate currency calculations

### Form Validation
Uses React Hook Form + Zod for comprehensive validation:
- Product: Required field
- Quantity: Must be positive integer, ≤ available inventory
- Sale Date: Required, not more than 30 days in past
- Total Amount: Verified to match quantity × unit price calculation
- Notes: Max 500 characters (optional)

### Success State
After successful submission:
- Green checkmark icon with success message
- Summary card showing all transaction details
- Product name, quantity, unit price, total amount, and date displayed
- Two action buttons:
  - "Add Another Sale" - Resets form for next transaction
  - "Back to Dashboard" - Returns to agent dashboard

### Error Handling
- **Validation Errors**: Displayed inline under each form field
- **Submission Errors**: Alert box at top of form with error message
- **Loading State**: Button text changes to "Creating Sale..." with disabled state during submission
- **API Error Fallback**: Graceful error messaging if API call fails

### Mock Data
The form includes 8 mock products for testing:
- Wireless Headphones ($79.99, 45 available)
- USB-C Cable ($12.99, 120 available)
- Phone Stand ($24.99, 67 available)
- Screen Protector 3-pack ($8.99, 200 available)
- Portable Charger ($34.99, 32 available)
- Bluetooth Speaker ($59.99, 28 available)
- Phone Case ($19.99, 85 available)
- Screen Cleaning Kit ($9.99, 150 available)

## Responsive Design

### Desktop (1280px+)
- Full-width form with max-width constraint
- Two-column layout available (not used in this form)
- Large input fields (h-12, text-lg)

### Tablet (768px - 1279px)
- Single-column form
- Optimized input sizing
- Full-width buttons

### Mobile (375px - 767px)
- Single-column stacked layout
- Maximum-size touch targets (h-12)
- Full-width inputs and buttons
- Hamburger sidebar navigation
- Date picker accessible via native mobile interface

## Dark/Light Mode
- Full support for both themes using next-themes
- All form colors adapt based on system preference
- Badge colors and input states properly contrasted in both modes
- Success card uses emerald theme for visibility

## Accessibility
- Proper label associations with form fields
- ARIA descriptions for auto-calculated fields
- Keyboard navigation fully supported
- Focus indicators visible on all interactive elements
- Error messages properly associated with fields
- Date input accessible via native mobile pickers

## API Integration (TODO)

### Endpoint
```
POST /api/sales
```

### Request Body
```typescript
{
  productId: string
  quantity: number
  unitPrice: number
  totalAmount: number
  saleDate: Date
  notes: string
  agentId: string // Current agent's ID
}
```

### Response
```typescript
{
  id: string
  agentId: string
  productId: string
  quantity: number
  unitPrice: number
  totalAmount: number
  saleDate: Date
  notes: string
  createdAt: Date
}
```

### Implementation
Replace the mock API call in `components/agent/new-sale-form.tsx`:

```typescript
// TODO: Replace with actual API call
const response = await fetch('/api/sales', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ...data,
    agentId: currentAgent.id,
    createdAt: new Date(),
  }),
})
if (!response.ok) throw new Error('Failed to create sale')
const result = await response.json()
```

## Related Pages
- Agent Dashboard: `/agent/dashboard`
- My Sales: `/agent/sales`
- Agent Expenses: `/agent/expenses/new`

## File Structure
```
app/agent/sales/new/page.tsx          # Main page component
components/agent/new-sale-form.tsx    # Form component with logic
lib/schemas/sale-schema.ts            # Zod schema + mock products
```

## Dependencies
- `react-hook-form` - Form state management
- `zod` - Schema validation
- `@hookform/resolvers/zod` - Zod resolver for RHF
- `shadcn/ui` - UI components (Select, Input, Button, Card, etc.)
- `lucide-react` - Icons
- `next/navigation` - Client-side routing

## Notes
- All calculations use toFixed(2) to prevent floating-point errors
- The form prevents submission if total amount doesn't match calculation
- Product availability is checked client-side but should be re-verified server-side
- Agent ID should be extracted from authenticated session
- Timestamps should be in UTC on server

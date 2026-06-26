# Agent Dashboard Documentation

## Overview

The Agent Dashboard is a mobile-first field sales agent's personal dashboard for the Route Sales Management System. Agents can only see their own data, enforced through Row-Level Security (RLS) on the Supabase backend.

## File Structure

```
app/agent/
├── layout.tsx                      # Agent layout with sidebar & navbar
└── dashboard/
    └── page.tsx                    # Main dashboard page

components/agent/
├── agent-header.tsx                # Welcome header with agent name & region
├── agent-kpi-cards.tsx             # 4 KPI cards (Sales, Expenses, Inventory, Target)
├── agent-sales-chart.tsx           # Sales this week LineChart
├── quick-actions.tsx               # Add Sale & Add Expense buttons
├── recent-sales-list.tsx           # Last 5 sales table
├── recent-expenses-list.tsx        # Last 5 expenses with icons
└── inventory-list.tsx              # Assigned inventory with progress bars
```

## Features

### 1. Welcome Header
- **Agent Name**: Sarah Mitchell (or authenticated agent name)
- **Region**: San Francisco Bay Area (from agents table)
- **Date**: Current date in readable format
- **Icons**: Map pin for region, calendar for date

### 2. KPI Cards (4 total)

| Card | Content | Icon |
|------|---------|------|
| My Sales Today | $12,467.50 | DollarSign (Purple) |
| My Expenses Today | $155.25 | TrendingUp (Red) |
| Inventory Assigned | 62 units | Package (Blue) |
| Monthly Target Progress | $28,450 of $50,000 (57%) | Target (Green) with Progress Bar |

### 3. Quick Action Buttons
- **+ Add Sale**: Primary button (purple) - Opens modal to log new sale
- **+ Add Expense**: Secondary button (outline) - Opens modal to log new expense
- Large, tappable buttons optimized for phone use

### 4. Sales This Week Chart
- **Type**: LineChart (Recharts)
- **Data**: 7 days of sales data
- **Lines**: 
  - Actual Sales (solid blue line)
  - Daily Target (dashed gray line)
- **Interaction**: Hover tooltips show values

### 5. Recent Sales Table
- **Columns**: Product, Qty, Amount, Date, Status
- **Rows**: Last 5 completed sales
- **Status Badge**: Green "Completed" badge

Sample Data:
```
- Enterprise Package | 2 | $4,200.00 | Today, 2:30 PM | Completed
- Premium License | 5 | $3,500.00 | Today, 11:15 AM | Completed
- Standard Bundle | 1 | $899.00 | Yesterday, 4:45 PM | Completed
- Pro Support Plan | 3 | $2,700.00 | Yesterday, 10:20 AM | Completed
- Starter Kit | 4 | $1,996.00 | 2 days ago, 3:15 PM | Completed
```

### 6. Recent Expenses List
- **Card-based layout** - Better mobile UX than table
- **Icon indicators**: Different icons for Meals, Travel, Materials
- **Color coding**: Orange (Meals), Blue (Travel), Purple (Materials)
- **Receipt button**: View/upload receipt (icon button)
- **Info**: Category, description, amount, date

### 7. Assigned Inventory List
- **Alert**: Shows critical/low stock items prominently
- **Each Item Shows**:
  - Product name
  - Current quantity (large, color-coded)
  - Status (In Stock, Low Stock, Critical)
  - Reorder level
  - Progress bar showing capacity
  - Date issued
- **Status Colors**:
  - In Stock: Emerald/Green
  - Low Stock: Amber/Yellow
  - Critical: Red
- **Request Restock**: Button to request more inventory

## Responsive Design

### Desktop (1024px+)
- Sidebar always visible (left)
- 2-column layout for charts and sales
- 2-column layout for expenses and inventory
- Full-width tables

### Tablet (768px - 1023px)
- Sidebar collapsible
- Grid adjusts to 2 columns where appropriate

### Mobile (< 768px)
- Sidebar slides in from left (hamburger menu)
- Single-column layout (full width)
- Cards stack vertically
- KPI cards in single column for readability
- Action buttons take full width
- Table uses horizontal scroll

## Dark/Light Mode

- Fully supports both modes via next-themes
- Colors adapt automatically:
  - Status badges adjust contrast
  - Chart lines adapt to theme
  - Icons maintain visibility
  - Borders and cards update colors

## TODO: Supabase Integration

All queries should be filtered by `agent_id` and use Row-Level Security:

```typescript
// Fetch agent data
// TODO: SELECT agent_name, region FROM agents WHERE user_id = $1

// Fetch sales today
// TODO: SELECT SUM(amount) as sales_today 
//       FROM sales 
//       WHERE agent_id = $1 AND DATE(created_at) = TODAY

// Fetch expenses today
// TODO: SELECT SUM(amount) as expenses_today 
//       FROM expenses 
//       WHERE agent_id = $1 AND DATE(created_at) = TODAY

// Fetch inventory count
// TODO: SELECT COUNT(*) as inventory_count 
//       FROM inventory 
//       WHERE agent_id = $1 AND quantity > 0

// Fetch monthly sales
// TODO: SELECT SUM(amount) as monthly_sales 
//       FROM sales 
//       WHERE agent_id = $1 
//       AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW())

// Fetch recent sales
// TODO: SELECT product_name, quantity, amount, created_at, status 
//       FROM sales 
//       WHERE agent_id = $1 
//       ORDER BY created_at DESC LIMIT 5

// Fetch recent expenses
// TODO: SELECT category, amount, created_at, has_receipt, description 
//       FROM expenses 
//       WHERE agent_id = $1 
//       ORDER BY created_at DESC LIMIT 5

// Fetch inventory
// TODO: SELECT product_name, quantity, reorder_level, date_issued, status 
//       FROM inventory 
//       WHERE agent_id = $1 AND quantity > 0
//       ORDER BY date_issued DESC
```

## API Endpoints (TODO)

```
PATCH /api/sales
- Body: { product_id, quantity, amount, notes }
- Returns: Created sale record

PATCH /api/expenses
- Body: { category, amount, receipt, description }
- Returns: Created expense record

GET /api/sales/my-week
- Returns: Sales data for the past 7 days

GET /api/inventory/restock
- Body: { product_id, requested_quantity }
- Returns: Restock request confirmation
```

## Component Props

### AgentHeader
```typescript
interface AgentHeaderProps {
  agentName: string
  region: string
  date?: string
}
```

### AgentKPICards
```typescript
interface AgentKPICardsProps {
  salesToday: number
  expensesToday: number
  inventoryAssigned: number
  monthlyTargetProgress: number
  monthlyTarget: number
}
```

### RecentSalesList
```typescript
interface RecentSale {
  id: string
  product: string
  quantity: number
  amount: number
  date: string
  status: 'completed' | 'pending' | 'cancelled'
}
```

### RecentExpensesList
```typescript
interface Expense {
  id: string
  category: string
  amount: number
  date: string
  hasReceipt: boolean
  description: string
}
```

### InventoryList
```typescript
interface InventoryItem {
  id: string
  productName: string
  quantity: number
  reorderLevel: number
  dateIssued: string
  status: 'in-stock' | 'low-stock' | 'critical'
}
```

## Mobile-First Design Principles

1. **Touch-friendly**: Large buttons (44px minimum height)
2. **Legible**: 16px+ minimum font size
3. **Performance**: Chart optimization for mobile devices
4. **Data**: Show essential metrics first, details secondary
5. **Actions**: Prominent action buttons for quick entry
6. **Scrolling**: Vertical scrolling only on mobile, no horizontal
7. **Alerts**: Prominent alerts for low stock/critical items

## Security Notes

- All agent data is scoped to the authenticated user via `agent_id`
- Backend RLS policies enforce data isolation
- No agent can see another agent's sales, expenses, or inventory
- API calls include agent_id from session/auth context
- TODO comments indicate where RLS should be implemented

## Testing

- Desktop (1920px): All features visible, responsive grid
- Tablet (768px): Sidebar collapsible, single-column option
- Mobile (375px): Hamburger menu, vertical stack, touch-optimized buttons
- Dark Mode: All elements maintain contrast and visibility
- Light Mode: All elements maintain contrast and visibility

## Known Limitations

- Current mock data in development
- Add Sale/Expense buttons are placeholder (no modals yet)
- Chart displays 7-day mock data (no real-time updates yet)
- Receipt upload not yet implemented
- Inventory restock request is placeholder

## Future Enhancements

1. Real-time sales/expense entry modals
2. Receipt image upload with OCR
3. Push notifications for low stock alerts
4. Offline sync for sales/expenses
5. GPS-based location tracking
6. Customer history and notes
7. Target progress notifications
8. Performance analytics and coaching

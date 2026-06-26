# Design Document: Admin Pages Fix

## Overview

This design addresses the admin pages fix for the Next.js sales management system. The system uses a modern React/Next.js stack with Supabase backend, shadcn/ui components, and TypeScript. The design covers:

1. **Import Error Fix**: Correcting the icon import in the expenses page
2. **Agents Management Page**: A new admin page for viewing and managing agents
3. **Approvals Management Page**: A dedicated page for approving/rejecting user registrations
4. **Sales Management Page**: A comprehensive page for viewing all sales across agents

All new pages follow established patterns from existing admin pages (users, expenses, inventory) to ensure consistency in UI/UX, state management, and code structure.

### Design Principles

- **Consistency**: Follow existing patterns for layout, components, styling, and state management
- **Reusability**: Leverage existing UI components, services, hooks, and utilities
- **Type Safety**: Use TypeScript with proper types from @/types
- **User Experience**: Provide loading states, error handling, search, filters, and pagination
- **Maintainability**: Keep code DRY and follow established conventions

## Architecture

### Technology Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **UI Library**: React 18+ with 'use client' directive for interactive components
- **Component Library**: shadcn/ui (built on Radix UI)
- **Styling**: Tailwind CSS with custom design tokens
- **Icons**: lucide-react
- **Backend**: Supabase with Row Level Security (RLS)
- **State Management**: React hooks (useState, useEffect, useMemo, useCallback)
- **Data Fetching**: Custom service functions wrapping fetch API
- **Date Handling**: date-fns for formatting

### Application Structure

```
app/admin/
├── agents/page.tsx          # New: Agents management page
├── approvals/page.tsx       # New: Approvals management page
├── sales/page.tsx           # New: Sales management page
├── expenses/page.tsx        # Fix: Update icon import
├── users/page.tsx           # Reference: Existing pattern
├── inventory/page.tsx       # Reference: Existing pattern
└── layout.tsx               # Shared admin layout

services/
├── users.service.ts         # Existing: User API calls
├── sales.service.ts         # Existing: Sales API calls
└── api-client.ts            # Existing: HTTP client wrapper

hooks/
├── use-users.ts             # Existing: Users state management
└── use-sales.ts             # Existing: Sales state management

components/ui/               # Existing: shadcn/ui components
types/index.ts               # Existing: TypeScript type definitions
```

### Page Architecture Pattern

All admin pages follow a consistent architecture:

```typescript
'use client'

// 1. Imports: React, UI components, services, types, utilities
// 2. Helper functions: formatters, calculators, constants
// 3. Skeleton components: Loading states
// 4. Main page component:
//    - State management (useState for filters, pagination, selection)
//    - Data fetching (useEffect with service calls)
//    - Memoized computations (useMemo for filtering, pagination)
//    - Event handlers (callbacks for actions)
//    - Render: Title → KPI Cards → Filters → Data Table → Pagination
```

### Data Flow

```
User Action → Event Handler → Service Function → API Route → Supabase (RLS) → Response → State Update → UI Re-render
```

### RLS Policy Assumptions

The design assumes existing RLS policies grant admin users (`role='admin'`) full access to:
- All user records (for agents page and approvals page)
- All sales records (for sales page)
- All agent profiles, products, and inventory records

## Components and Interfaces

### 1. Import Error Fix (Expenses Page)

**Component**: `app/admin/expenses/page.tsx`

**Change Required**:
```typescript
// Current (incorrect):
import { ..., BedFront, ... } from 'lucide-react'

// Fixed:
import { ..., Bed, ... } from 'lucide-react'

// Update in categoryBadgeConfig:
accommodation: {
  label: 'Accommodation',
  icon: <Bed className="h-3 w-3" />,  // Changed from BedFront
  className: '...',
}
```

**Impact**: Single line change in import and one line in the badge configuration object.

### 2. Agents Management Page

**Component**: `app/admin/agents/page.tsx`

**Purpose**: Display and manage all agents (users with `role='agent'`)

**State Management**:
```typescript
interface AgentsPageState {
  agents: UsersListItem[]           // All agents from API
  loading: boolean                  // Loading state
  searchQuery: string               // Search filter
  statusFilter: string              // Status filter: 'all' | 'active' | 'pending' | 'suspended'
  currentPage: number               // Pagination state
}
```

**Data Fetching**:
- Use `usersService.listUsers({ role: 'agent' })` to fetch all agents
- Fetch on component mount
- No custom hook needed (direct service call pattern like inventory page)

**KPI Cards** (4 cards in grid):
1. **Total Agents**: Count of all agents
2. **Active Agents**: Count of agents with `status='active'`
3. **Sales Performance**: Placeholder metric (e.g., "View Analytics")
4. **Inventory Issued**: Placeholder metric (e.g., "View Inventory")

**Filters**:
- Search input: Filter by name or email (client-side)
- Status dropdown: Filter by status (all, active, pending, suspended)

**Data Table Columns**:
- Name (from `name` field)
- Email (from `email` field)
- Phone (from `phone` field)
- Status (badge with color coding)
- Region (from `region` field)
- Actions (dropdown menu)

**Actions**:
- View Details (placeholder - shows toast)
- View Sales (placeholder - shows toast)
- View Inventory (placeholder - shows toast)

**Pagination**: 10 items per page

**Loading State**: Skeleton rows (8 rows) while loading

**Error Handling**: Display error message if fetch fails

### 3. Approvals Management Page

**Component**: `app/admin/approvals/page.tsx`

**Purpose**: Dedicated page for approving/rejecting pending user registrations

**State Management**:
```typescript
interface ApprovalsPageState {
  users: UsersListItem[]            // All users from API
  loading: boolean                  // Loading state
  currentPage: number               // Pagination state
}
```

**Data Fetching**:
- Use `useUsers()` hook (existing pattern from users page)
- Hook provides: `{ data, loading, refresh, approve, reject }`
- Filter to pending users in component: `users.filter(u => u.status === 'pending')`

**KPI Cards** (4 cards in grid):
1. **Pending Approvals**: Count of users with `status='pending'`
2. **Approved Today**: Placeholder count (e.g., 0 or calculated from timestamps)
3. **Rejected Today**: Placeholder count (e.g., 0 or calculated from timestamps)
4. **Total Users**: Count of all users

**Data Table Columns**:
- Name (from `name` field)
- Email (from `email` field)
- Phone (from `phone` field)
- Role (badge showing requested role)
- Registration Date (formatted from `created_at`)
- Actions (Approve/Reject buttons)

**Actions**:
- **Approve Button**: Calls `approve(userId)` from hook, refreshes data
- **Reject Button**: Calls `reject(userId)` from hook, refreshes data
- Both buttons show loading state during API call
- Success/error feedback via toast notifications

**Pagination**: 10 items per page

**Loading State**: Skeleton rows (8 rows) while loading

**Error Handling**: Display error message if fetch fails

**UI Pattern**: Similar to users page but focused only on pending approvals

### 4. Sales Management Page

**Component**: `app/admin/sales/page.tsx`

**Purpose**: View all sales across all agents with comprehensive filtering and export

**State Management**:
```typescript
interface SalesPageState {
  sales: Sale[]                     // All sales from API
  agents: UsersListItem[]           // All agents for filter dropdown
  products: Product[]               // All products for filter dropdown
  loading: boolean                  // Loading state
  searchQuery: string               // Search filter
  dateFrom: string                  // Date range filter (start)
  dateTo: string                    // Date range filter (end)
  agentFilter: string               // Agent filter: 'all' | agent_id
  productFilter: string             // Product filter: 'all' | product_id
  currentPage: number               // Pagination state
  selectedRows: Set<string>         // Batch selection
}
```

**Data Fetching**:
- Use `salesService.listSales()` to fetch all sales
- Use `usersService.listUsers({ role: 'agent' })` to fetch agents for filter
- Use `productsService.listProducts()` to fetch products for filter
- Fetch all data on component mount using `Promise.all()`
- Pattern: Direct service calls like expenses page

**KPI Cards** (4 cards in grid):
1. **Total Sales**: Sum of all sale amounts
2. **Total Revenue**: Same as total sales (formatted as currency)
3. **Sales This Month**: Sum of sales in current month
4. **Top Agent**: Agent with highest total sales (name + amount)

**Filters**:
- Search input: Filter by agent name or product name (client-side)
- Date From input: Filter sales by start date
- Date To input: Filter sales by end date
- Agent dropdown: Filter by specific agent (includes "All Agents" option)
- Product dropdown: Filter by specific product (includes "All Products" option)
- Reset button: Clear all filters
- Export CSV button: Export filtered sales to CSV file

**Data Table Columns**:
- Checkbox (for batch selection)
- Agent Name (lookup from agents array)
- Product Name (lookup from products array)
- Quantity (from `quantity` field)
- Amount (formatted as currency)
- Date (formatted from `date` field)
- Actions (dropdown menu)

**Actions**:
- View Details (placeholder - shows toast)
- Edit (placeholder - shows toast)
- Delete (placeholder - shows toast with confirmation)

**Pagination**: 10 items per page

**Total Row**: Display sum of amounts for current page at bottom of table

**CSV Export**:
- Export filtered sales data
- Columns: ID, Agent, Product, Quantity, Amount, Date
- Filename: `sales-YYYY-MM-DD.csv`

**Loading State**: Skeleton rows (8 rows) while loading

**Error Handling**: Display error message if fetch fails

## Data Models

### Existing Types (from @/types)

```typescript
// User types
export type UserRole = 'admin' | 'manager' | 'agent'
export type UserStatus = 'pending' | 'active' | 'rejected' | 'suspended'

export interface User {
  id: string
  email: string
  role: UserRole
  status: UserStatus
  created_at: string
  updated_at: string
}

// Service type (from users.service.ts)
export type UsersListItem = {
  id: string
  email: string
  role: 'admin' | 'manager' | 'agent'
  status: 'pending' | 'active' | 'rejected' | 'suspended'
  created_at: string
  updated_at: string
  name: string | null
  phone: string | null
  region: string | null
}

// Sales transaction
export interface Sale {
  id: string
  agent_id: string
  product_id: string
  quantity: number
  amount: number
  date: string
  created_at: string
  updated_at: string
  agent?: Agent
  product?: Product
}

// Product catalog
export interface Product {
  id: string
  name: string
  unit_price: number
  description: string | null
  created_at: string
  updated_at: string
}
```

### Data Transformations

**Agent Name Lookup**:
```typescript
// Create a map for O(1) lookups
const agentNameMap = useMemo(() => {
  const map = new Map<string, string>()
  for (const agent of agents) {
    if (agent.name) map.set(agent.id, agent.name)
  }
  return map
}, [agents])

// Usage: agentNameMap.get(sale.agent_id) ?? 'Unknown Agent'
```

**Product Name Lookup**:
```typescript
// Create a map for O(1) lookups
const productNameMap = useMemo(() => {
  const map = new Map<string, string>()
  for (const product of products) {
    map.set(product.id, product.name)
  }
  return map
}, [products])

// Usage: productNameMap.get(sale.product_id) ?? 'Unknown Product'
```

### Filtering Logic

**Client-Side Filtering Pattern**:
```typescript
const filteredData = useMemo(() => {
  return data.filter((item) => {
    // Search filter
    const q = searchQuery.toLowerCase().trim()
    const matchesSearch = !q || 
      item.name?.toLowerCase().includes(q) ||
      item.email.toLowerCase().includes(q)

    // Status filter
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter

    // Date range filter
    const matchesDateFrom = !dateFrom || new Date(item.date) >= new Date(dateFrom)
    const matchesDateTo = !dateTo || new Date(item.date) <= new Date(dateTo)

    return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo
  })
}, [data, searchQuery, statusFilter, dateFrom, dateTo])
```

### Pagination Logic

**Pagination Pattern**:
```typescript
const PAGE_SIZE = 10

const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE))
const safePage = Math.min(currentPage, totalPages)
const paginatedData = filteredData.slice(
  (safePage - 1) * PAGE_SIZE, 
  safePage * PAGE_SIZE
)

// Reset to page 1 when filters change
useEffect(() => {
  setCurrentPage(1)
}, [searchQuery, statusFilter, dateFrom, dateTo])
```

## UI/UX Patterns

### Layout Structure

All admin pages follow this structure:

```tsx
<div className="space-y-6">
  {/* 1. Page Header */}
  <div>
    <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
    <p className="text-muted-foreground mt-2">{description}</p>
  </div>

  {/* 2. KPI Cards Grid */}
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    {/* 4 KPI cards */}
  </div>

  {/* 3. Filters Card (optional) */}
  <Card>
    <CardContent className="pt-6">
      {/* Search, dropdowns, date inputs, action buttons */}
    </CardContent>
  </Card>

  {/* 4. Data Table Card */}
  <Card>
    <CardHeader>
      <CardTitle>{tableTitle}</CardTitle>
      <CardDescription>{tableDescription}</CardDescription>
    </CardHeader>
    <CardContent className="p-0 overflow-x-auto">
      <table className="w-full text-sm">
        {/* Table content */}
      </table>
    </CardContent>
    {/* Pagination */}
  </Card>
</div>
```

### KPI Card Pattern

```tsx
<Card>
  <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
    <CardTitle className="text-sm font-medium">{title}</CardTitle>
    <Icon className="h-4 w-4 text-muted-foreground" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">{value}</div>
    <p className="text-xs text-muted-foreground mt-1">{description}</p>
  </CardContent>
</Card>
```

### Status Badge Pattern

```tsx
// Status color mapping
const statusColors = {
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  suspended: 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300',
}

<Badge variant="outline" className={statusColors[status]}>
  {status}
</Badge>
```

### Skeleton Loading Pattern

```tsx
function SkeletonRow() {
  return (
    <tr className="border-b border-muted">
      <td className="px-4 py-3">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
      </td>
      {/* More skeleton cells */}
    </tr>
  )
}

// Usage in table body
{loading ? (
  Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
) : (
  // Actual data rows
)}
```

### Empty State Pattern

```tsx
{data.length === 0 && (
  <tr>
    <td colSpan={columnCount} className="px-4 py-12 text-center text-muted-foreground">
      No {entityName} found matching your criteria.
    </td>
  </tr>
)}
```

### Action Dropdown Pattern

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon" className="h-8 w-8">
      <MoreHorizontal className="h-4 w-4" />
      <span className="sr-only">Open actions</span>
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={() => handleAction1()}>
      Action 1
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => handleAction2()}>
      Action 2
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem className="text-red-600 dark:text-red-400">
      Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

## State Management Approach

### Pattern Selection

The design uses two state management patterns based on complexity:

**Pattern 1: Custom Hook (for complex state with actions)**
- Used when: Multiple actions (approve, reject, suspend, etc.)
- Example: Approvals page uses `useUsers()` hook
- Benefits: Encapsulates state, loading, error, and action handlers
- Pattern from: `app/admin/users/page.tsx`

**Pattern 2: Direct Service Calls (for simple read-only or basic CRUD)**
- Used when: Simple data fetching with client-side filtering
- Example: Agents page, Sales page (like expenses and inventory pages)
- Benefits: Simpler, less abstraction, easier to understand
- Pattern from: `app/admin/expenses/page.tsx`, `app/admin/inventory/page.tsx`

### State Management by Page

| Page | Pattern | Rationale |
|------|---------|-----------|
| Agents | Direct Service Calls | Read-only view with client-side filtering |
| Approvals | Custom Hook (`useUsers`) | Needs approve/reject actions |
| Sales | Direct Service Calls | Read-only view with complex filtering |

### State Initialization Pattern

```typescript
export default function PageComponent() {
  // 1. State declarations
  const [data, setData] = useState<Type[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // 2. Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  
  // 3. Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  
  // 4. Data fetching effect
  useEffect(() => {
    let cancelled = false
    
    async function fetchData() {
      setLoading(true)
      try {
        const result = await service.fetchData()
        if (!cancelled) setData(result ?? [])
      } catch (err) {
        if (!cancelled) setError('Failed to load data')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    
    fetchData()
    return () => { cancelled = true }
  }, [])
  
  // 5. Memoized computations
  const filteredData = useMemo(() => {
    // Filtering logic
  }, [data, searchQuery, statusFilter])
  
  // 6. Event handlers
  const handleAction = useCallback(() => {
    // Action logic
  }, [dependencies])
  
  // 7. Render
  return (/* JSX */)
}
```

## Error Handling

### Error Handling Strategy

**Fetch Errors**:
```typescript
try {
  const data = await service.fetchData()
  setData(data ?? [])
} catch (error) {
  console.error('Failed to load data:', error)
  setError(error instanceof Error ? error.message : 'Failed to load data')
  setData([]) // Set empty array to prevent undefined errors
}
```

**Action Errors** (for approve/reject):
```typescript
const handleApprove = async (id: string) => {
  try {
    await approve(id) // Hook handles refresh
    toast.success('User approved successfully')
  } catch (error) {
    toast.error('Failed to approve user')
    console.error(error)
  }
}
```

**Error Display**:
```tsx
{error && (
  <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-red-800 dark:text-red-300">
    <p className="text-sm font-medium">Error loading data</p>
    <p className="text-sm mt-1">{error}</p>
  </div>
)}
```

### Loading States

**Page-Level Loading**:
- Show skeleton rows in table (8 rows)
- Show loading spinner in KPI cards
- Disable action buttons during loading

**Action-Level Loading**:
- Disable button during action
- Show loading spinner in button
- Prevent multiple simultaneous actions

```tsx
<Button 
  onClick={handleAction} 
  disabled={isLoading}
>
  {isLoading && <Spinner className="mr-2 h-4 w-4" />}
  Action
</Button>
```

### Toast Notifications

Use toast for user feedback on actions:

```typescript
import { toast } from '@/hooks/use-toast'

// Success
toast.success('Operation completed successfully')

// Error
toast.error('Operation failed')

// Info
toast.info('Processing...')
```

## Testing Strategy

### Property-Based Testing Assessment

**Property-based testing (PBT) is NOT appropriate for this feature** because:

1. **UI Rendering Focus**: The feature primarily involves UI components and page layouts
2. **Simple CRUD Operations**: Data fetching and display with no complex transformations
3. **External Service Integration**: Testing relies on Supabase API responses, not pure functions
4. **No Universal Properties**: The behavior is deterministic and doesn't vary meaningfully across input ranges

**Alternative Testing Approaches**:
- **Unit Tests**: Test individual components and utility functions with concrete examples
- **Integration Tests**: Test API integration and data flow with representative examples
- **Manual Testing**: Verify UI rendering, interactions, and user workflows
- **Snapshot Tests**: Capture component rendering for regression detection

### Unit Testing Strategy

**Test Coverage Areas**:

1. **Utility Functions**:
   - Date formatting functions
   - Currency formatting functions
   - Data transformation functions (agent/product name lookups)
   - Filter logic functions

2. **Component Behavior**:
   - KPI calculations (totals, counts, aggregations)
   - Filtering logic (search, status, date range)
   - Pagination logic (page calculations, bounds checking)
   - CSV export functionality

3. **Error Handling**:
   - API error responses
   - Empty data states
   - Invalid filter inputs

**Example Unit Tests**:

```typescript
// Test: Agent name lookup
describe('agentNameMap', () => {
  it('should return agent name for valid ID', () => {
    const agents = [{ id: '1', name: 'John Doe' }]
    const map = createAgentNameMap(agents)
    expect(map.get('1')).toBe('John Doe')
  })
  
  it('should return undefined for invalid ID', () => {
    const agents = [{ id: '1', name: 'John Doe' }]
    const map = createAgentNameMap(agents)
    expect(map.get('999')).toBeUndefined()
  })
})

// Test: Filtering logic
describe('filterSales', () => {
  it('should filter by search query', () => {
    const sales = [
      { id: '1', agent_id: '1', product_id: '1', amount: 100 },
      { id: '2', agent_id: '2', product_id: '2', amount: 200 },
    ]
    const filtered = filterSales(sales, { searchQuery: 'agent 1' })
    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe('1')
  })
  
  it('should filter by date range', () => {
    const sales = [
      { id: '1', date: '2024-01-01', amount: 100 },
      { id: '2', date: '2024-02-01', amount: 200 },
    ]
    const filtered = filterSales(sales, { 
      dateFrom: '2024-01-15', 
      dateTo: '2024-02-15' 
    })
    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe('2')
  })
})

// Test: Pagination
describe('pagination', () => {
  it('should calculate correct page count', () => {
    const items = Array.from({ length: 25 }, (_, i) => ({ id: String(i) }))
    const pageCount = Math.ceil(items.length / 10)
    expect(pageCount).toBe(3)
  })
  
  it('should return correct page items', () => {
    const items = Array.from({ length: 25 }, (_, i) => ({ id: String(i) }))
    const page2 = items.slice(10, 20)
    expect(page2).toHaveLength(10)
    expect(page2[0].id).toBe('10')
  })
})
```

### Integration Testing Strategy

**Test Coverage Areas**:

1. **API Integration**:
   - Service functions call correct endpoints
   - Response data is correctly parsed
   - Error responses are handled gracefully

2. **User Workflows**:
   - Approve/reject user flow
   - Search and filter flow
   - Pagination flow
   - CSV export flow

3. **Data Flow**:
   - Data fetching on mount
   - State updates after actions
   - UI re-renders with new data

**Example Integration Tests**:

```typescript
// Test: Approve user workflow
describe('Approvals Page - Approve User', () => {
  it('should approve user and refresh data', async () => {
    const mockUser = { id: '1', status: 'pending', name: 'John Doe' }
    mockApiResponse('/api/users', [mockUser])
    mockApiResponse('/api/users/1/approve', { id: '1', status: 'active' })
    
    render(<ApprovalsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })
    
    const approveButton = screen.getByRole('button', { name: /approve/i })
    fireEvent.click(approveButton)
    
    await waitFor(() => {
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
    })
  })
})

// Test: Sales filtering
describe('Sales Page - Filtering', () => {
  it('should filter sales by agent', async () => {
    const mockSales = [
      { id: '1', agent_id: 'agent1', amount: 100 },
      { id: '2', agent_id: 'agent2', amount: 200 },
    ]
    mockApiResponse('/api/sales', mockSales)
    
    render(<SalesPage />)
    
    await waitFor(() => {
      expect(screen.getAllByRole('row')).toHaveLength(3) // header + 2 data rows
    })
    
    const agentFilter = screen.getByRole('combobox', { name: /agent/i })
    fireEvent.change(agentFilter, { target: { value: 'agent1' } })
    
    await waitFor(() => {
      expect(screen.getAllByRole('row')).toHaveLength(2) // header + 1 data row
    })
  })
})
```

### Manual Testing Checklist

**Agents Page**:
- [ ] Page loads without errors
- [ ] KPI cards display correct counts
- [ ] Search filters agents by name/email
- [ ] Status filter works correctly
- [ ] Pagination works correctly
- [ ] Action buttons show toast notifications
- [ ] Loading state displays skeleton rows
- [ ] Empty state displays when no agents found

**Approvals Page**:
- [ ] Page loads without errors
- [ ] Only pending users are displayed
- [ ] KPI cards display correct counts
- [ ] Approve button approves user and refreshes data
- [ ] Reject button rejects user and refreshes data
- [ ] Toast notifications appear on success/error
- [ ] Loading state displays skeleton rows
- [ ] Empty state displays when no pending users

**Sales Page**:
- [ ] Page loads without errors
- [ ] KPI cards display correct calculations
- [ ] Search filters sales by agent/product name
- [ ] Date range filter works correctly
- [ ] Agent filter works correctly
- [ ] Product filter works correctly
- [ ] CSV export downloads correct data
- [ ] Pagination works correctly
- [ ] Total row displays correct sum
- [ ] Loading state displays skeleton rows
- [ ] Empty state displays when no sales found

**Expenses Page Fix**:
- [ ] Page builds without import errors
- [ ] Accommodation badge displays Bed icon correctly

## Implementation Notes

### Code Organization

**File Structure**:
```
app/admin/
├── agents/
│   └── page.tsx          # New file (400-500 lines)
├── approvals/
│   └── page.tsx          # New file (350-450 lines)
├── sales/
│   └── page.tsx          # New file (500-600 lines)
└── expenses/
    └── page.tsx          # Modify: 2 lines changed
```

**No New Services Required**:
- All necessary service functions already exist
- `usersService.listUsers()` for agents and approvals
- `salesService.listSales()` for sales
- `productsService.listProducts()` for product filter
- `usersService.approveUser()` and `rejectUser()` for approvals

**No New Hooks Required**:
- Agents page: Direct service calls (like expenses/inventory pattern)
- Approvals page: Use existing `useUsers()` hook
- Sales page: Direct service calls (like expenses pattern)

### Styling Consistency

**Tailwind Classes to Use**:
- Layout: `space-y-6`, `grid gap-4 md:grid-cols-2 lg:grid-cols-4`
- Typography: `text-3xl font-bold tracking-tight`, `text-muted-foreground`
- Cards: `pb-3`, `text-sm font-medium`, `text-2xl font-bold`
- Table: `w-full text-sm`, `px-4 py-3`, `border-b`
- Buttons: `variant="ghost"`, `variant="outline"`, `size="icon"`
- Badges: `variant="outline"`, custom color classes
- Loading: `animate-pulse rounded bg-muted`

**Color Palette**:
- Success/Active: `emerald-600`, `emerald-400`, `emerald-100`, `emerald-900/40`
- Warning/Pending: `amber-600`, `amber-400`, `amber-100`, `amber-900/40`
- Error/Rejected: `red-600`, `red-400`, `red-100`, `red-900/40`
- Neutral: `gray-600`, `gray-400`, `gray-100`, `gray-900/40`
- Primary: `primary`, `primary/5`
- Muted: `muted-foreground`, `muted/50`, `muted/30`

### Performance Considerations

**Memoization**:
- Use `useMemo` for filtered data (prevents re-filtering on every render)
- Use `useMemo` for lookup maps (agent names, product names)
- Use `useMemo` for paginated data (prevents re-slicing on every render)

**Callback Optimization**:
- Use `useCallback` for event handlers passed to child components
- Use `useCallback` for action handlers (approve, reject, etc.)

**Data Fetching**:
- Use `Promise.all()` for concurrent fetches (sales page)
- Use cleanup function in `useEffect` to prevent state updates after unmount
- Set loading state before fetch, clear after completion

**Large Lists**:
- Pagination limits rendered rows to 10 per page
- Client-side filtering is acceptable for expected data sizes (<1000 items)
- Consider server-side filtering for larger datasets in future

### Accessibility

**Keyboard Navigation**:
- All interactive elements are keyboard accessible
- Dropdown menus support arrow key navigation
- Table rows can be navigated with Tab key

**Screen Readers**:
- Use semantic HTML (`<table>`, `<th>`, `<td>`)
- Add `aria-label` to icon-only buttons
- Add `sr-only` class for screen reader text

**Focus Management**:
- Visible focus indicators on all interactive elements
- Logical tab order through page elements

### Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS Grid and Flexbox for layouts
- CSS custom properties for theming
- No IE11 support required

## Security Considerations

### Row Level Security (RLS)

**Assumptions**:
- Supabase RLS policies are already configured
- Admin users (`role='admin'`) have full read access to all tables
- Admin users can approve/reject users via API endpoints
- API routes verify user role before allowing operations

**No Changes Required**:
- Existing RLS policies should already grant admin access
- No new database operations are introduced
- All operations use existing API endpoints

### Client-Side Security

**Data Exposure**:
- All data fetched is intended for admin viewing
- No sensitive data (passwords, tokens) is exposed in responses
- User emails and phone numbers are appropriate for admin view

**Action Authorization**:
- Approve/reject actions are server-side validated
- Client-side buttons are UI convenience only
- API endpoints enforce role-based access control

### Input Validation

**Search Inputs**:
- Client-side filtering only (no SQL injection risk)
- Search queries are not sent to server
- No special character escaping needed

**Date Inputs**:
- HTML5 date inputs provide basic validation
- Invalid dates are handled gracefully (no filter applied)
- No server-side date validation needed for filtering

**CSV Export**:
- Data is sanitized for CSV format (quotes escaped)
- No user-provided filenames (generated from date)
- No server-side processing (client-side only)

## Future Enhancements

### Potential Improvements

**Agents Page**:
- Real sales performance metrics (integrate with analytics)
- Real inventory issued metrics (aggregate from inventory table)
- Agent detail modal with full profile and history
- Bulk actions (suspend multiple agents, export selected)

**Approvals Page**:
- Bulk approve/reject functionality
- Approval notes/comments
- Email notifications on approval/rejection
- Approval history and audit trail

**Sales Page**:
- Advanced analytics (charts, trends, comparisons)
- Sales forecasting and predictions
- Commission calculations
- Integration with inventory (stock levels)
- Real-time updates via Supabase subscriptions

**General**:
- Server-side filtering and pagination for large datasets
- Advanced search with multiple criteria
- Saved filter presets
- Customizable column visibility
- Export to multiple formats (Excel, PDF)
- Real-time data updates via WebSocket/Supabase subscriptions

### Technical Debt

**Current Limitations**:
- Client-side filtering may not scale beyond ~1000 items
- No real-time updates (manual refresh required)
- Placeholder metrics in some KPI cards
- Action buttons show toasts but don't navigate to detail pages

**Recommended Refactoring**:
- Extract common table component (reduce duplication)
- Extract common filter component (reduce duplication)
- Extract common KPI card grid component
- Create shared types for filter state
- Add server-side pagination for scalability

## Design Decisions and Rationale

### Why Direct Service Calls for Agents and Sales Pages?

**Decision**: Use direct service calls instead of custom hooks

**Rationale**:
- Agents page is read-only with simple filtering (no actions needed)
- Sales page is read-only with complex filtering (no actions needed)
- Pattern matches existing expenses and inventory pages
- Simpler code, less abstraction, easier to understand
- Custom hooks add complexity without clear benefit for read-only views

### Why Use Existing useUsers Hook for Approvals Page?

**Decision**: Use existing `useUsers()` hook instead of direct service calls

**Rationale**:
- Approvals page needs approve/reject actions
- Hook already provides these actions with proper state management
- Reusing existing hook reduces code duplication
- Pattern matches existing users page
- Hook handles loading, error, and refresh logic

### Why Client-Side Filtering?

**Decision**: Implement filtering on client-side instead of server-side

**Rationale**:
- Expected data sizes are manageable (<1000 items per page)
- Reduces server load and API calls
- Provides instant feedback (no network latency)
- Simpler implementation (no API changes needed)
- Matches pattern from existing expenses page
- Can be upgraded to server-side filtering later if needed

### Why 10 Items Per Page?

**Decision**: Use 10 items per page for pagination

**Rationale**:
- Matches existing pattern from expenses page
- Good balance between data density and scrolling
- Standard pagination size in admin interfaces
- Keeps table height manageable on most screens

### Why Placeholder Metrics in KPI Cards?

**Decision**: Use placeholder values for some KPI metrics

**Rationale**:
- Real metrics require additional API endpoints or complex calculations
- Placeholders allow UI to be complete and functional
- Can be replaced with real data in future iterations
- Focuses implementation on core functionality first
- Clearly marked as placeholders in code comments

### Why CSV Export Only?

**Decision**: Implement CSV export only (not Excel, PDF, etc.)

**Rationale**:
- CSV is universal format, works with Excel and other tools
- Client-side implementation (no server processing needed)
- Simple to implement with JavaScript
- Matches pattern from existing expenses page
- Other formats can be added later if needed

### Why No Real-Time Updates?

**Decision**: Use manual refresh instead of real-time subscriptions

**Rationale**:
- Simpler implementation (no WebSocket/subscription setup)
- Admin pages typically don't need real-time updates
- Manual refresh is acceptable for admin workflows
- Matches pattern from existing pages
- Real-time updates can be added later via Supabase subscriptions

### Why No Batch Actions?

**Decision**: No batch approve/reject or bulk operations

**Rationale**:
- Keeps initial implementation simple
- Individual actions are sufficient for MVP
- Batch operations require additional UI complexity
- Can be added in future iteration if needed
- Focuses on core functionality first

## Summary

This design provides a comprehensive blueprint for fixing the admin pages in the Next.js sales management system. The implementation follows established patterns from existing admin pages to ensure consistency and maintainability.

### Key Design Points

1. **Import Fix**: Simple one-line change to fix the icon import error
2. **Agents Page**: Read-only view of all agents with search and status filtering
3. **Approvals Page**: Dedicated page for approving/rejecting pending users
4. **Sales Page**: Comprehensive view of all sales with advanced filtering and CSV export
5. **Consistency**: All pages follow the same layout, styling, and state management patterns
6. **Reusability**: Leverages existing services, hooks, components, and utilities
7. **Type Safety**: Uses TypeScript with proper types throughout
8. **User Experience**: Includes loading states, error handling, and user feedback
9. **Testing**: Unit and integration tests for core functionality (no PBT needed)
10. **Scalability**: Client-side filtering is acceptable for expected data sizes

### Implementation Complexity

| Component | Complexity | Lines of Code | Effort |
|-----------|-----------|---------------|--------|
| Import Fix | Very Low | 2 lines | 5 minutes |
| Agents Page | Medium | 400-500 lines | 4-6 hours |
| Approvals Page | Medium | 350-450 lines | 3-5 hours |
| Sales Page | High | 500-600 lines | 6-8 hours |
| **Total** | **Medium** | **~1350 lines** | **~15 hours** |

### Dependencies

**No New Dependencies Required**:
- All UI components exist in `@/components/ui`
- All service functions exist in `@/services`
- All hooks exist in `@/hooks`
- All types exist in `@/types`
- All utilities exist in `@/lib/utils`

**External Dependencies** (already installed):
- React 18+
- Next.js 14+
- TypeScript
- Tailwind CSS
- lucide-react (icons)
- date-fns (date formatting)
- shadcn/ui components

### Risk Assessment

**Low Risk**:
- Import fix is trivial and isolated
- All patterns are proven from existing pages
- No database schema changes required
- No new API endpoints required
- No new dependencies required

**Medium Risk**:
- Client-side filtering may not scale beyond ~1000 items
- Placeholder metrics need to be replaced with real data eventually
- No real-time updates may impact user experience for some workflows

**Mitigation**:
- Start with client-side filtering, upgrade to server-side if needed
- Document placeholder metrics clearly for future implementation
- Add manual refresh button for data updates

### Success Criteria

The implementation will be considered successful when:

1. ✅ Expenses page builds without import errors
2. ✅ Agents page displays all agents with working filters
3. ✅ Approvals page allows approving/rejecting pending users
4. ✅ Sales page displays all sales with working filters and CSV export
5. ✅ All pages follow consistent UI/UX patterns
6. ✅ All pages include proper loading and error states
7. ✅ All pages are responsive and accessible
8. ✅ All pages pass manual testing checklist
9. ✅ Code follows TypeScript best practices
10. ✅ Code is well-documented with comments

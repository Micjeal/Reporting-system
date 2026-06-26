# Unbuilt Admin Pages - Implementation Guide

## Overview

This document outlines the three admin pages that were specified in the `admin-pages-fix` spec but have not yet been implemented. All necessary backend APIs, services, and hooks already exist. These pages follow established patterns from existing admin pages.

---

## 📋 Missing Pages

### 1. Agents Management Page
**Route:** `/admin/agents`  
**Status:** ❌ Not Implemented  
**Estimated Effort:** 4-6 hours

### 2. Approvals Management Page
**Route:** `/admin/approvals`  
**Status:** ❌ Not Implemented  
**Estimated Effort:** 3-4 hours

### 3. Sales Management Page
**Route:** `/admin/sales`  
**Status:** ❌ Not Implemented  
**Estimated Effort:** 5-7 hours

---

## 🎯 1. Agents Management Page

### Purpose
Display and manage all agents (users with `role='agent'`) with performance metrics and filtering capabilities.

### File to Create
```
app/admin/agents/page.tsx
```

### Key Features
- **KPI Cards (4):**
  - Total Agents (count of all agents)
  - Active Agents (count where `status='active'`)
  - Sales Performance (placeholder - "View Analytics")
  - Inventory Issued (placeholder - "View Inventory")

- **Filters:**
  - Search by name or email (client-side)
  - Status dropdown: all, active, pending, suspended

- **Data Table Columns:**
  - Name
  - Email
  - Phone
  - Status (badge with color coding)
  - Region
  - Actions (dropdown menu)

- **Actions:**
  - View Details (placeholder - shows toast)
  - View Sales (placeholder - shows toast)
  - View Inventory (placeholder - shows toast)

- **Pagination:** 10 items per page

### Data Fetching Pattern
```typescript
// Use direct service calls (like expenses/inventory pattern)
const [agents, setAgents] = useState<UsersListItem[]>([])
const [loading, setLoading] = useState(true)

useEffect(() => {
  async function fetchAgents() {
    const data = await usersService.listUsers({ role: 'agent' })
    setAgents(data ?? [])
    setLoading(false)
  }
  fetchAgents()
}, [])
```

### Existing Resources
- ✅ API: `GET /api/users` (with role filter)
- ✅ Service: `usersService.listUsers({ role: 'agent' })`
- ✅ Types: `UsersListItem` from `@/types`
- ✅ Reference: `app/admin/inventory/page.tsx` (similar pattern)

### UI Components Needed
- Card, CardHeader, CardTitle, CardContent
- Input, Button, Select
- Badge (for status)
- Table with skeleton loading
- Pagination
- DropdownMenu (for actions)

---

## 🎯 2. Approvals Management Page

### Purpose
Dedicated page for approving or rejecting pending user registrations with streamlined workflow.

### File to Create
```
app/admin/approvals/page.tsx
```

### Key Features
- **KPI Cards (4):**
  - Pending Approvals (count where `status='pending'`)
  - Approved Today (placeholder - 0 or calculated)
  - Rejected Today (placeholder - 0 or calculated)
  - Total Users (count of all users)

- **Data Table Columns:**
  - Name
  - Email
  - Phone
  - Role (badge showing requested role)
  - Registration Date (formatted from `created_at`)
  - Actions (Approve/Reject buttons)

- **Actions:**
  - Approve Button → calls `approve(userId)` → refreshes data
  - Reject Button → calls `reject(userId)` → refreshes data
  - Both show loading state during API call
  - Success/error feedback via toast

- **Pagination:** 10 items per page

### Data Fetching Pattern
```typescript
// Use existing useUsers hook (like users page pattern)
const { data, loading, refresh, approve, reject } = useUsers()

// Filter to pending users
const pendingUsers = useMemo(() => {
  return data.filter(u => u.status === 'pending')
}, [data])
```

### Existing Resources
- ✅ API: `GET /api/users`
- ✅ API: `PATCH /api/users/:id/approve`
- ✅ API: `PATCH /api/users/:id/reject`
- ✅ Service: `usersService.listUsers()`, `usersService.approveUser()`, `usersService.rejectUser()`
- ✅ Hook: `useUsers()` from `@/hooks/use-users`
- ✅ Types: `UsersListItem` from `@/types`
- ✅ Reference: `app/admin/users/page.tsx` (similar pattern)
- ✅ Audit Logging: Already implemented in approve/reject APIs

### UI Components Needed
- Card, CardHeader, CardTitle, CardContent
- Button (with loading states)
- Badge (for role)
- Table with skeleton loading
- Pagination
- Toast notifications

---

## 🎯 3. Sales Management Page

### Purpose
Comprehensive view of all sales across all agents with advanced filtering, export capabilities, and analytics.

### File to Create
```
app/admin/sales/page.tsx
```

### Key Features
- **KPI Cards (4):**
  - Total Sales (sum of all sale amounts)
  - Total Revenue (same as total sales, formatted as currency)
  - Sales This Month (sum of sales in current month)
  - Top Agent (agent with highest total sales - name + amount)

- **Filters:**
  - Search by agent name or product name (client-side)
  - Date From input (filter by start date)
  - Date To input (filter by end date)
  - Agent dropdown (filter by specific agent + "All Agents" option)
  - Product dropdown (filter by specific product + "All Products" option)
  - Reset button (clear all filters)
  - Export CSV button (export filtered sales)

- **Data Table Columns:**
  - Checkbox (for batch selection)
  - Agent Name (lookup from agents array)
  - Product Name (lookup from products array)
  - Quantity
  - Amount (formatted as currency)
  - Date (formatted)
  - Actions (dropdown menu)

- **Actions:**
  - View Details (placeholder - shows toast)
  - Edit (placeholder - shows toast)
  - Delete (placeholder - shows toast with confirmation)

- **Pagination:** 10 items per page

- **Total Row:** Display sum of amounts for current page at bottom of table

- **CSV Export:**
  - Columns: ID, Agent, Product, Quantity, Amount, Date
  - Filename: `sales-YYYY-MM-DD.csv`

### Data Fetching Pattern
```typescript
// Use direct service calls with Promise.all (like expenses pattern)
const [sales, setSales] = useState<Sale[]>([])
const [agents, setAgents] = useState<UsersListItem[]>([])
const [products, setProducts] = useState<Product[]>([])
const [loading, setLoading] = useState(true)

useEffect(() => {
  async function fetchData() {
    const [salesData, agentsData, productsData] = await Promise.all([
      salesService.listSales(),
      usersService.listUsers({ role: 'agent' }),
      productsService.listProducts(),
    ])
    setSales(salesData ?? [])
    setAgents(agentsData ?? [])
    setProducts(productsData ?? [])
    setLoading(false)
  }
  fetchData()
}, [])

// Create lookup maps for O(1) performance
const agentNameMap = useMemo(() => {
  const map = new Map<string, string>()
  agents.forEach(a => { if (a.name) map.set(a.id, a.name) })
  return map
}, [agents])

const productNameMap = useMemo(() => {
  const map = new Map<string, string>()
  products.forEach(p => map.set(p.id, p.name))
  return map
}, [products])
```

### Existing Resources
- ✅ API: `GET /api/sales`
- ✅ API: `GET /api/users` (for agents filter)
- ✅ API: `GET /api/products` (for products filter)
- ✅ Service: `salesService.listSales()`
- ✅ Service: `usersService.listUsers({ role: 'agent' })`
- ✅ Service: `productsService.listProducts()`
- ✅ Types: `Sale`, `Product`, `UsersListItem` from `@/types`
- ✅ Reference: `app/admin/expenses/page.tsx` (very similar pattern)
- ✅ Audit Logging: Already implemented in sales API

### UI Components Needed
- Card, CardHeader, CardTitle, CardContent
- Input, Button, Select, Checkbox
- Badge
- Table with skeleton loading
- Pagination
- DropdownMenu (for actions)
- CSV export logic

---

## 🛠️ Implementation Guidelines

### Common Patterns to Follow

#### 1. File Structure
```typescript
'use client'

// 1. Imports
import { useState, useEffect, useMemo } from 'react'
import { /* icons */ } from 'lucide-react'
import { /* services */ } from '@/services/...'
import { /* UI components */ } from '@/components/ui/...'
import type { /* types */ } from '@/types'

// 2. Helper functions
const formatCurrency = (amount: number) => { /* ... */ }
const formatDate = (dateStr: string) => { /* ... */ }

// 3. Skeleton component
function SkeletonRow() { /* ... */ }

// 4. Main page component
const PAGE_SIZE = 10

export default function PageName() {
  // State declarations
  // Data fetching
  // Memoized computations
  // Event handlers
  // Render
}
```

#### 2. Status Badge Colors
```typescript
const statusColors = {
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  suspended: 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300',
}
```

#### 3. Pagination Pattern
```typescript
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

#### 4. Loading States
```typescript
{loading ? (
  Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
) : paginatedData.length === 0 ? (
  <tr>
    <td colSpan={columnCount} className="px-4 py-12 text-center text-muted-foreground">
      No {entityName} found matching your criteria.
    </td>
  </tr>
) : (
  paginatedData.map(item => <DataRow key={item.id} item={item} />)
)}
```

#### 5. Error Handling
```typescript
try {
  const data = await service.fetchData()
  setData(data ?? [])
} catch (error) {
  console.error('Failed to load data:', error)
  setError(error instanceof Error ? error.message : 'Failed to load data')
  setData([]) // Prevent undefined errors
}
```

---

## 📚 Reference Files

### For Agents Page
- **Primary Reference:** `app/admin/inventory/page.tsx`
- **Pattern:** Direct service calls, client-side filtering
- **Similar To:** Read-only view with simple actions

### For Approvals Page
- **Primary Reference:** `app/admin/users/page.tsx`
- **Pattern:** Custom hook with actions (approve, reject)
- **Similar To:** User management with state-changing actions

### For Sales Page
- **Primary Reference:** `app/admin/expenses/page.tsx`
- **Pattern:** Direct service calls, complex filtering, CSV export
- **Similar To:** Transaction view with multiple filters and export

---

## ✅ Pre-Implementation Checklist

Before starting implementation, verify:

- [ ] All backend APIs are functional and accessible
- [ ] Service functions are tested and working
- [ ] Types are properly defined in `@/types`
- [ ] Reference pages are reviewed for patterns
- [ ] UI components from shadcn/ui are available
- [ ] Audit logging is confirmed on mutation APIs

---

## 🚀 Implementation Order

**Recommended sequence:**

1. **Approvals Page** (Easiest - 3-4 hours)
   - Uses existing `useUsers()` hook
   - Simple approve/reject actions
   - Minimal filtering

2. **Agents Page** (Medium - 4-6 hours)
   - Direct service calls
   - Client-side filtering
   - Read-only with placeholder actions

3. **Sales Page** (Most Complex - 5-7 hours)
   - Multiple data sources (sales, agents, products)
   - Complex filtering (search, date range, dropdowns)
   - CSV export functionality
   - Lookup maps for performance

**Total Estimated Time:** 12-17 hours

---

## 📝 Testing Checklist

For each page, verify:

- [ ] Page loads without errors
- [ ] KPI cards display correct values
- [ ] Search/filters work correctly
- [ ] Pagination functions properly
- [ ] Actions trigger appropriate responses
- [ ] Loading states display skeleton rows
- [ ] Empty states display when no data
- [ ] Error states display on API failures
- [ ] Responsive design works on mobile
- [ ] Dark mode styling is correct

---

## 🔗 Related Documentation

- **Spec:** `.kiro/specs/admin-pages-fix/requirements.md`
- **Design:** `.kiro/specs/admin-pages-fix/design.md`
- **Types:** `types/index.ts`
- **Services:** `services/users.service.ts`, `services/sales.service.ts`, `services/products.service.ts`
- **Hooks:** `hooks/use-users.ts`

---

## 💡 Notes

- All backend infrastructure is complete and tested
- Audit logging is already implemented on all mutation APIs
- RLS policies are configured for admin access
- UI components and patterns are well-established
- These pages are purely frontend implementation work
- No database migrations or API changes needed

## 🐛 Recent Fixes

### Analytics Filters Fix (2024-05-22)
**Issue:** The `analytics-filters.tsx` component was importing from deleted mock data file.

**Fix Applied:**
- Removed mock data import from `@/lib/mock-analytics-data`
- Added real-time data fetching from `/api/users` for agents and regions
- Updated `/api/users` to allow both `admin` and `manager` roles (was admin-only)
- Added error handling to gracefully handle permission issues

**Files Modified:**
- `components/admin/analytics-filters.tsx` - Now fetches real data
- `app/api/users/route.ts` - Now allows manager role access

---

**Last Updated:** 2026-05-22  
**Status:** Ready for Implementation  
**Blocked By:** None - All dependencies are complete

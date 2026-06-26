# Users Management Page - Implementation Guide

## Overview
Complete Users Management page for the Route Sales Management System admin panel, featuring advanced data table functionality, bulk actions, and user approval workflows.

## Features Implemented

### 1. Tabbed Interface
- **All Users**: View all users in the system
- **Pending**: New user sign-ups awaiting admin approval
- **Active**: Users with active access to the system
- **Rejected**: Users whose registration was denied

Each tab shows live count of users in that status.

### 2. Data Table (TanStack Table v8)
Built with `@tanstack/react-table` for high-performance data management:
- **Columns**: Name, Email, Phone, Role, Status, Actions
- **Search**: Real-time filtering by name, email, or phone number
- **Pagination**: 10 users per page with Next/Previous navigation
- **Row Selection**: Checkbox selection for bulk operations
- **Sorting**: Click column headers to sort (when implemented with API)

### 3. Badges & Color Coding
**Role Badges (color-coded)**:
- Admin: Red background
- Manager: Blue background
- Agent: Green background

**Status Badges (color-coded)**:
- Active: Emerald green
- Pending: Amber/Orange
- Rejected: Red
- Suspended: Gray

### 4. Row Actions
**For Pending Users**:
- Approve: Opens confirmation dialog, then approves user
- Reject: Opens confirmation dialog, then rejects user

**For Active/Suspended Users**:
- Change Role: Dropdown to switch between Admin/Manager/Agent
- Suspend: Disables user account (grayed out if already suspended)

### 5. Bulk Actions
When users are selected from the Pending tab:
- Bulk Approve: Approve multiple users at once
- Bulk Reject: Reject multiple users at once
- Action buttons appear dynamically based on selection

### 6. Confirmation Dialogs
AlertDialog component for critical actions:
- Approve dialog: Confirms user will gain system access
- Reject dialog: Confirms user will be denied access
- Loading state during API call
- Cancel option to abort action

### 7. Toast Notifications
`useToast` hook provides feedback for:
- Successful approval/rejection/role changes
- Failed operations with error messages
- Bulk action confirmations

### 8. Responsive Design
- **Desktop**: Full-width table with all columns visible
- **Tablet**: Adjusted column widths, table remains readable
- **Mobile**: Horizontal scrolling table with checkbox column always visible
  - Name and Email columns sticky on scroll
  - Role/Status badges and Actions visible with horizontal scroll

### 9. Dark/Light Mode
- Supports both theme modes via next-themes
- Badge colors adapt to theme with appropriate contrast
- Table styling adjusts for readability

## File Structure

```
/app/admin/users/
├── page.tsx                    # Main users page with tabs and KPIs
├── layout.tsx                  # Uses parent admin layout

/components/admin/tables/
├── users-data-table.tsx        # Main table component with TanStack Table
├── approval-dialog.tsx         # Confirmation dialog for approve/reject

/lib/types/
└── users.ts                    # User type definitions
```

## Data Types

```typescript
type UserRole = 'admin' | 'manager' | 'agent'
type UserStatus = 'active' | 'pending' | 'rejected' | 'suspended'

interface User {
  id: string
  name: string
  email: string
  phone: string
  role: UserRole
  status: UserStatus
  createdAt: Date
  updatedAt: Date
}
```

## API Integration Points

All API calls have TODO comments with the following endpoints:

### Single User Actions
- `PATCH /api/users/:id/approve` - Approve pending user
- `PATCH /api/users/:id/reject` - Reject pending user
- `PATCH /api/users/:id/role` - Change user role
- `PATCH /api/users/:id/suspend` - Suspend active user

### Bulk Actions
- `POST /api/users/bulk-approve` - Approve multiple users
- `POST /api/users/bulk-reject` - Reject multiple users

## Implementation Notes

### State Management
- Uses React hooks for local state (`useState`)
- `loadingActions` Set tracks which rows are loading
- `rowSelection` tracks selected rows via TanStack Table
- Dialog state (`dialogOpen`, `dialogAction`) for confirmation flows

### Search & Filtering
- Real-time search filters across name, email, and phone
- Status tab filtering combined with search
- Uses TanStack Table's `getFilteredRowModel` for efficiency

### Error Handling
- Try-catch blocks around API calls
- Toast notifications for success/error states
- Disabled buttons during loading to prevent duplicate submissions
- Error state preserves UI state

### Loading States
- Spinner icon in action buttons during API calls
- Buttons disabled during loading
- Prevents race conditions with Set-based tracking

## Usage Example

```typescript
// The page automatically loads mock data
// To connect to real API:
// 1. Replace mockUsers with API data fetch
// 2. Update TODO comments with actual API calls
// 3. Add loading/error states for initial data fetch
// 4. Implement real-time updates via Supabase Realtime
```

## UI Components Used
- shadcn/ui: Card, Button, Input, Badge, Dialog, AlertDialog, Tabs, Table, Checkbox
- lucide-react: Search, ChevronDown, Loader2 icons
- Tailwind CSS: Responsive grid, spacing, and colors

## Performance Considerations
- TanStack Table provides virtual scrolling capability (can be added)
- Row selection state is lightweight with checkbox IDs only
- Search debouncing could be added for large datasets
- Pagination limits DOM nodes to ~10 rows at a time

## Future Enhancements
- [ ] CSV export of user list
- [ ] Advanced filters (date range, role, status combinations)
- [ ] Bulk email actions
- [ ] User activity timeline
- [ ] Custom user fields
- [ ] API integration with Supabase RLS

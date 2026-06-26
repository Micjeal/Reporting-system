# Implementation Plan: Admin Pages Fix

## Overview
This plan outlines the implementation of fixes and new admin pages for the review document application. The work includes fixing an import error in the expenses page, creating three new admin management pages (agents, approvals, sales), and verifying all pages build and render correctly.

## Tasks

- [ ] 1. Fix Import Error in Expenses Page
  - Read the current expenses page to locate the import and usage
  - Replace 'BedFront' with 'Bed' in the import statement
  - Update the categoryBadgeConfig to use the 'Bed' icon
  - Verify the build succeeds and the page renders

- [ ] 2. Create Agents Management Page
  - Create the page file at app/admin/agents/page.tsx
  - Implement state management for agents, filters, and pagination
  - Implement data fetching from GET /api/users with role='agent' filter
  - Create KPI cards component with correct calculations
  - Create filters section with search and status dropdown
  - Create data table with agent columns and action buttons
  - Implement pagination logic
  - Add loading state with skeleton rows
  - Add error handling and display
  - Test the page loads and displays data correctly

- [ ] 3. Create Approvals Management Page
  - Create the page file at app/admin/approvals/page.tsx
  - Implement state management using the useUsers() hook
  - Filter users to show only pending status
  - Create KPI cards component with correct calculations
  - Create data table with user columns and approve/reject buttons
  - Implement approve action with API call and data refresh
  - Implement reject action with API call and data refresh
  - Add toast notifications for success/error feedback
  - Implement pagination logic
  - Add loading state with skeleton rows
  - Add error handling and display
  - Test the page loads and approve/reject actions work correctly

- [ ] 4. Create Sales Management Page
  - Create the page file at app/admin/sales/page.tsx
  - Implement state management for sales, agents, products, filters, and pagination
  - Implement concurrent data fetching from GET /api/sales, GET /api/users (agents), GET /api/products
  - Create KPI cards component with correct calculations
  - Create filters section with search, date range, agent, and product filters
  - Create data table with sales columns and action buttons
  - Implement agent and product name lookups using maps
  - Implement filtering logic for all filter types
  - Implement pagination logic
  - Implement CSV export functionality
  - Add loading state with skeleton rows
  - Add error handling and display
  - Test the page loads, filters work, and CSV export functions correctly

- [ ] 5. Verify All Pages Build and Render Correctly
  - Run the build process to verify no compilation errors
  - Test the expenses page in the browser
  - Test the agents page in the browser
  - Test the approvals page in the browser
  - Test the sales page in the browser
  - Verify all routes are accessible
  - Check browser console for errors
  - Verify all UI components render correctly

## Task Dependency Graph

```json
{
  "waves": [
    {
      "wave": 1,
      "tasks": [1]
    },
    {
      "wave": 2,
      "tasks": [2, 3, 4]
    },
    {
      "wave": 3,
      "tasks": [5]
    }
  ]
}
```

## Notes

- All new pages should follow the same UI patterns and styling as existing admin pages
- Use the existing hooks and services where applicable (useUsers, agents.service, etc.)
- Ensure proper error handling and loading states on all pages
- All API calls should use the appropriate client (adminClient for admin operations)
- Test each page thoroughly before marking as complete

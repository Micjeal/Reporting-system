# Requirements Document

## Introduction

This document specifies the requirements for fixing and enhancing the admin pages in the Next.js sales management system. The system uses Supabase backend with Row Level Security (RLS) policies that grant admin users access to all data. The fixes address an import error, and add three missing admin pages following established patterns.

## Glossary

- **Admin_User**: A user with role='admin' who has full access to all system data and management functions
- **Agent**: A user with role='agent' who performs sales activities and submits expenses
- **RLS**: Row Level Security policies in Supabase that control data access based on user roles
- **Expenses_Page**: The admin page at /admin/expenses for viewing and managing expense claims
- **Users_Page**: The admin page at /admin/users for managing user accounts
- **Inventory_Page**: The admin page at /admin/inventory for tracking inventory issuance
- **Agents_Page**: The new admin page at /admin/agents for viewing and managing agents
- **Approvals_Page**: The new admin page at /admin/approvals for approving/rejecting user registrations
- **Sales_Page**: The new admin page at /admin/sales for viewing all sales transactions
- **KPI_Card**: A card component displaying a key performance indicator with title, value, and description
- **Data_Table**: A table component with search, filters, pagination, and actions
- **Service_Function**: A TypeScript function in /services that calls backend APIs

## Requirements

### Requirement 1: Fix Import Error in Expenses Page

**User Story:** As a developer, I want the expenses page to import the correct icon, so that the application builds without errors.

#### Acceptance Criteria

1. WHEN the expenses page is compiled, THE System SHALL use the 'Bed' icon instead of 'BedFront'
2. THE Expenses_Page SHALL import 'Bed' from lucide-react
3. THE Expenses_Page SHALL display the accommodation category badge with the 'Bed' icon

### Requirement 2: Create Agents Management Page

**User Story:** As an Admin_User, I want to view and manage all agents, so that I can monitor agent performance and inventory allocation.

#### Acceptance Criteria

1. WHEN an Admin_User navigates to /admin/agents, THE System SHALL display the Agents_Page
2. THE Agents_Page SHALL display four KPI_Cards showing Total Agents, Active Agents, Sales Performance, and Inventory Issued
3. WHEN the Agents_Page loads, THE System SHALL fetch all users with role='agent' from GET /api/users
4. THE Agents_Page SHALL display a Data_Table with columns: name, email, phone, status, region, and actions
5. THE Agents_Page SHALL provide search functionality to filter agents by name or email
6. THE Agents_Page SHALL provide a status filter dropdown with options: all, active, pending, suspended
7. THE Agents_Page SHALL provide action buttons for each agent: View Details, View Sales, View Inventory
8. THE Agents_Page SHALL use the same UI components and styling patterns as Users_Page and Inventory_Page
9. THE Agents_Page SHALL include loading states with skeleton components during data fetching
10. THE Agents_Page SHALL handle errors gracefully and display error messages to the user

### Requirement 3: Create Approvals Management Page

**User Story:** As an Admin_User, I want a dedicated page for approving or rejecting pending user registrations, so that I can efficiently manage user access requests.

#### Acceptance Criteria

1. WHEN an Admin_User navigates to /admin/approvals, THE System SHALL display the Approvals_Page
2. THE Approvals_Page SHALL display four KPI_Cards showing Pending Approvals, Approved Today, Rejected Today, and Total Users
3. WHEN the Approvals_Page loads, THE System SHALL fetch all users with status='pending' from GET /api/users
4. THE Approvals_Page SHALL display a Data_Table with columns: name, email, phone, role, registration date, and actions
5. THE Approvals_Page SHALL provide an Approve button for each pending user that calls POST /api/users/:id/approve
6. THE Approvals_Page SHALL provide a Reject button for each pending user that calls POST /api/users/:id/reject
7. WHEN a user is approved or rejected, THE Approvals_Page SHALL refresh the data to reflect the updated status
8. THE Approvals_Page SHALL display user details including name, email, phone, requested role, and registration date
9. THE Approvals_Page SHALL use the same UI components and styling patterns as Users_Page
10. THE Approvals_Page SHALL include loading states with skeleton components during data fetching
11. THE Approvals_Page SHALL handle errors gracefully and display error messages to the user

### Requirement 4: Create Sales Management Page

**User Story:** As an Admin_User, I want to view all sales across all agents, so that I can monitor sales performance and revenue.

#### Acceptance Criteria

1. WHEN an Admin_User navigates to /admin/sales, THE System SHALL display the Sales_Page
2. THE Sales_Page SHALL display four KPI_Cards showing Total Sales, Total Revenue, Sales This Month, and Top Agent
3. WHEN the Sales_Page loads, THE System SHALL fetch all sales from GET /api/sales
4. THE Sales_Page SHALL display a Data_Table with columns: agent name, product name, quantity, amount, date, and actions
5. THE Sales_Page SHALL provide search functionality to filter sales by agent name or product name
6. THE Sales_Page SHALL provide a date range filter with "Date From" and "Date To" inputs
7. THE Sales_Page SHALL provide an agent filter dropdown to filter sales by specific agent
8. THE Sales_Page SHALL provide a product filter dropdown to filter sales by specific product
9. THE Sales_Page SHALL provide an "Export CSV" button that exports filtered sales data to a CSV file
10. THE Sales_Page SHALL implement pagination with 10 items per page
11. THE Sales_Page SHALL display a total row showing the sum of amounts for the current page
12. THE Sales_Page SHALL use the same UI components and styling patterns as Expenses_Page
13. THE Sales_Page SHALL include loading states with skeleton components during data fetching
14. THE Sales_Page SHALL handle errors gracefully and display error messages to the user

### Requirement 5: Maintain Consistent UI Patterns

**User Story:** As a developer, I want all admin pages to follow consistent patterns, so that the codebase is maintainable and the user experience is cohesive.

#### Acceptance Criteria

1. THE System SHALL use 'use client' directive for all new admin page components
2. THE System SHALL use existing UI components from @/components/ui for all new pages
3. THE System SHALL use existing Service_Functions from @/services for all API calls
4. THE System SHALL follow the same layout structure as existing admin pages
5. THE System SHALL use the same styling classes and patterns as existing admin pages
6. THE System SHALL use TypeScript with proper types from @/types for all new code
7. THE System SHALL include the same error handling patterns as existing admin pages
8. THE System SHALL include the same loading state patterns as existing admin pages

### Requirement 6: Ensure RLS Policy Compatibility

**User Story:** As an Admin_User, I want to access all data through the new pages, so that I can perform my administrative duties.

#### Acceptance Criteria

1. THE System SHALL ensure RLS policies allow Admin_User to read all agent data
2. THE System SHALL ensure RLS policies allow Admin_User to read all sales data
3. THE System SHALL ensure RLS policies allow Admin_User to read all pending user data
4. THE System SHALL ensure RLS policies allow Admin_User to approve and reject users
5. THE System SHALL ensure all API endpoints respect RLS policies for Admin_User access

# Requirements Document

## Introduction

This document defines requirements for simplifying the Agent Dashboard and Admin Users Page to improve usability, reduce visual redundancy, optimize data fetching, and implement proper loading and error handling patterns. The current implementations suffer from multiple data fetches, information overload, complex layouts, excessive animations, redundant filtering, and poor mobile responsiveness. The simplified versions will consolidate data operations, streamline UI components, establish consistent visual patterns, and provide proper error boundaries with loading skeletons.

## Glossary

- **Agent_Dashboard**: The main landing page for agents displaying key metrics and recent activity (c:\Users\mickn\Desktop\review-document\app\agent\dashboard\page.tsx)
- **Admin_Users_Page**: The admin page for managing user accounts and approvals (c:\Users\mickn\Desktop\review-document\app\admin\users\page.tsx)
- **Dashboard_Service**: A consolidated service layer that fetches all dashboard data in a single call
- **Circular_KPI**: A circular progress ring component showing metrics like Gross Sales, Monthly Target, and Inventory
- **Activity_Feed**: A unified component consolidating sales, expenses, and inventory activity into one stream
- **Loading_Skeleton**: UI placeholder components shown during data fetching
- **Error_Boundary**: Component that catches and handles errors with retry functionality
- **Date_Navigator**: Navigation component with prev/next buttons and date display (currently non-functional)
- **View_Mode_Toggle**: Toggle buttons for Daily/Weekly/Monthly views (currently non-functional)
- **Tab_Content**: Component that displays filtered user data in the Admin_Users_Page
- **Users_Table**: Table component that displays user data with action buttons

## Requirements

### Requirement 1: Consolidate Agent Dashboard Data Fetching

**User Story:** As an agent, I want the dashboard to load quickly with a single server request, so that I see all my data appear at once without multiple loading states.

#### Acceptance Criteria

1. THE Dashboard_Service SHALL provide a single API endpoint that returns all dashboard data in one response
2. THE Agent_Dashboard SHALL make exactly one service call on page load to fetch all dashboard data
3. THE Dashboard_Service SHALL return sales data, expenses data, inventory data, and agent information in a single response object
4. THE Agent_Dashboard SHALL remove the four separate useEffect hooks and replace them with one consolidated data fetch
5. WHEN the dashboard data loads, THE Agent_Dashboard SHALL update all components simultaneously

### Requirement 2: Reduce Agent Dashboard KPI Cards to Three

**User Story:** As an agent, I want to see only the most critical KPIs at the top, so that I can quickly understand my performance without information overload.

#### Acceptance Criteria

1. THE Agent_Dashboard SHALL display exactly 3 Circular_KPI components
2. THE Agent_Dashboard SHALL show Gross Sales Today, Monthly Target, and Inventory Assigned as the 3 KPIs
3. THE Agent_Dashboard SHALL remove the Expenses Today Circular_KPI from the primary display
4. THE Agent_Dashboard SHALL remove the Net Sales Circular_KPI from the primary display
5. THE Agent_Dashboard SHALL remove the Stat_Card row that displays duplicate KPI information

### Requirement 3: Simplify Agent Dashboard Grid Layout

**User Story:** As an agent, I want a clearer visual hierarchy without complex grid spanning, so that I can find information quickly.

#### Acceptance Criteria

1. THE Agent_Dashboard SHALL use a two-column layout on desktop (lg:grid-cols-2) instead of three columns with spanning
2. THE Agent_Dashboard SHALL place the 3 Circular_KPI components in a simple row at the top using grid-cols-3
3. THE Agent_Dashboard SHALL position the Sales_Chart in the left column without complex col-span directives
4. THE Agent_Dashboard SHALL position the Activity_Feed in the right column
5. THE Agent_Dashboard SHALL stack all sections vertically on mobile (single column)

### Requirement 4: Use Single Consistent Animation

**User Story:** As an agent, I want subtle consistent animations, so that the interface feels responsive without being distracting.

#### Acceptance Criteria

1. THE Agent_Dashboard SHALL use a single fade-in animation for all components
2. THE Agent_Dashboard SHALL remove differentiated animations (fade-in-down, fade-in-up, fade-in-left, fade-in-right)
3. THE Agent_Dashboard SHALL apply the same transition duration (300ms) to all animated elements
4. THE Agent_Dashboard SHALL limit animations to opacity and transform properties only
5. THE Agent_Dashboard SHALL use the same easing function (ease-out) for all transitions

### Requirement 5: Remove Gradient Background from Agent Dashboard

**User Story:** As an agent, I want a clean solid background, so that I can focus on data without visual noise.

#### Acceptance Criteria

1. THE Agent_Dashboard SHALL use a solid background color instead of gradient backgrounds
2. THE Agent_Dashboard SHALL use bg-slate-50 or bg-gray-50 as the page background
3. THE Agent_Dashboard SHALL remove the gradient-to-br classes from the main container
4. THE Agent_Dashboard SHALL maintain white backgrounds for card components
5. THE Agent_Dashboard SHALL use solid colors for all UI elements except intentional accent areas

### Requirement 6: Consolidate Agent Dashboard Activity Lists into Single Feed

**User Story:** As an agent, I want to see all recent activity in one place, so that I don't have to scan multiple separate lists.

#### Acceptance Criteria

1. THE Agent_Dashboard SHALL display a single Activity_Feed component instead of three separate lists
2. THE Activity_Feed SHALL combine sales, expenses, and inventory activity into one chronological stream
3. THE Activity_Feed SHALL display the 10 most recent activities sorted by timestamp
4. THE Activity_Feed SHALL show activity type indicators (sale icon, expense icon, inventory icon) for each entry
5. THE Activity_Feed SHALL provide a "View All" link that navigates to the respective detail pages

### Requirement 7: Remove Non-Functional Date Navigator and View Toggle

**User Story:** As an agent, I want to avoid interacting with controls that don't work, so that I don't waste time clicking non-functional UI elements.

#### Acceptance Criteria

1. THE Agent_Dashboard SHALL remove the Date_Navigator component entirely
2. THE Agent_Dashboard SHALL remove the View_Mode_Toggle component entirely
3. THE Agent_Dashboard SHALL remove the selectedDate state variable and related logic
4. THE Agent_Dashboard SHALL remove the viewMode state variable and related logic
5. THE Agent_Dashboard SHALL display current day data by default without date selection UI

### Requirement 8: Optimize Admin Users Page Data Filtering

**User Story:** As an admin, I want the users page to filter data efficiently, so that I don't experience lag when switching between tabs.

#### Acceptance Criteria

1. THE Admin_Users_Page SHALL use useMemo to compute filtered user arrays (allUsers, pendingUsers, activeUsers, rejectedUsers)
2. THE Admin_Users_Page SHALL recalculate filtered arrays only when the users data changes
3. THE Admin_Users_Page SHALL pass the correct filtered array to each Tab_Content based on the active tab
4. WHEN the pending tab is active, THE Admin_Users_Page SHALL pass pendingUsers to the Users_Table
5. WHEN the active tab is active, THE Admin_Users_Page SHALL pass activeUsers to the Users_Table

### Requirement 9: Flatten Admin Users Page Card Structure

**User Story:** As an admin, I want a cleaner visual design without excessive nesting, so that the interface feels lighter and more modern.

#### Acceptance Criteria

1. THE Admin_Users_Page SHALL remove the nested Card wrapper around the Tabs component
2. THE Admin_Users_Page SHALL display the stats cards and table at the same visual level
3. THE Admin_Users_Page SHALL use consistent padding (p-6) across all sections
4. THE Admin_Users_Page SHALL eliminate redundant CardHeader wrappers where unnecessary
5. THE Admin_Users_Page SHALL maintain clear visual separation using borders or spacing instead of depth

### Requirement 10: Refactor Admin Users Page TabContent to Dynamic Component

**User Story:** As a developer, I want to avoid code duplication, so that the component is easier to maintain and modify.

#### Acceptance Criteria

1. THE Admin_Users_Page SHALL replace four separate TabsContent blocks with a single dynamic rendering pattern
2. THE Admin_Users_Page SHALL pass the appropriate filtered data array to each tab based on the active tab value
3. THE Admin_Users_Page SHALL use the same Users_Table component for all tabs
4. THE Admin_Users_Page SHALL maintain the status prop correctly for each tab
5. THE Admin_Users_Page SHALL eliminate duplicate TabsContent JSX while preserving all functionality

### Requirement 11: Remove Duplicate Tab Counts in Admin Users Page

**User Story:** As an admin, I want to see user counts once per category, so that I don't see the same number repeated multiple times.

#### Acceptance Criteria

1. THE Admin_Users_Page SHALL display user counts in either the stats cards OR the tab labels, but not both
2. THE Admin_Users_Page SHALL remove count badges from tab labels if stats cards are displayed above
3. WHERE tab counts are removed, THE Admin_Users_Page SHALL maintain visual clarity about which tab is selected
4. THE Admin_Users_Page SHALL ensure the selected tab is visually distinct using color and font weight
5. THE Admin_Users_Page SHALL position stats cards prominently above the tabs

### Requirement 12: Remove Max-Width Constraint on Admin Users Tabs

**User Story:** As an admin, I want the tabs to use available space efficiently, so that I can see more data without unnecessary horizontal scrolling.

#### Acceptance Criteria

1. THE Admin_Users_Page SHALL remove the max-w-md class from the TabsList component
2. THE TabsList SHALL expand to fill the available width within its container
3. THE Admin_Users_Page SHALL ensure tab labels remain readable at different viewport sizes
4. THE Admin_Users_Page SHALL maintain responsive behavior using grid-cols-4 for equal-width tabs
5. WHERE the viewport is narrow, THE Admin_Users_Page SHALL allow tabs to stack or scroll horizontally

### Requirement 13: Add Loading Skeletons to Agent Dashboard

**User Story:** As an agent, I want to see placeholder UI while data loads, so that I understand the page is working and know what to expect.

#### Acceptance Criteria

1. THE Agent_Dashboard SHALL display Loading_Skeleton components for all KPI cards during data fetch
2. THE Agent_Dashboard SHALL display Loading_Skeleton for the Activity_Feed while loading
3. THE Loading_Skeleton SHALL match the dimensions and layout of the actual content
4. THE Loading_Skeleton SHALL use a subtle pulse animation to indicate loading state
5. THE Agent_Dashboard SHALL replace Loading_Skeleton with actual data when the fetch completes

### Requirement 14: Add Loading Skeletons to Admin Users Page

**User Story:** As an admin, I want to see placeholder UI while user data loads, so that I understand the page is responding to my actions.

#### Acceptance Criteria

1. THE Admin_Users_Page SHALL display Loading_Skeleton for the stats cards while data loads
2. THE Admin_Users_Page SHALL display Loading_Skeleton rows in the Users_Table while data loads
3. THE Loading_Skeleton SHALL show 5 skeleton rows representing the typical table content
4. THE Loading_Skeleton SHALL use consistent styling with the Agent_Dashboard skeletons
5. THE Admin_Users_Page SHALL remove Loading_Skeleton when user data is available

### Requirement 15: Add Error Boundaries with Retry to Agent Dashboard

**User Story:** As an agent, I want clear error messages with retry options when data fails to load, so that I can attempt to recover without refreshing the entire page.

#### Acceptance Criteria

1. THE Agent_Dashboard SHALL implement an Error_Boundary component that catches data fetch errors
2. WHEN a data fetch fails, THE Error_Boundary SHALL display a user-friendly error message
3. THE Error_Boundary SHALL provide a "Retry" button that re-attempts the failed data fetch
4. THE Error_Boundary SHALL display the specific error type (network error, timeout, server error)
5. THE Agent_Dashboard SHALL log detailed error information to the console for debugging

### Requirement 16: Add Error Boundaries with Retry to Admin Users Page

**User Story:** As an admin, I want clear error messages with retry options when user data fails to load, so that I can recover without losing my current tab selection.

#### Acceptance Criteria

1. THE Admin_Users_Page SHALL implement an Error_Boundary component for user data operations
2. WHEN user data fails to load, THE Error_Boundary SHALL display an error message above the table
3. THE Error_Boundary SHALL provide a "Retry" button that refetches user data
4. THE Error_Boundary SHALL maintain the current tab selection when retrying
5. THE Admin_Users_Page SHALL preserve user action context (approve, reject, suspend) in error messages

### Requirement 17: Ensure Single-Column Mobile Layout for Agent Dashboard

**User Story:** As an agent using mobile devices, I want all content to stack vertically, so that I can scroll naturally without horizontal panning.

#### Acceptance Criteria

1. WHEN the viewport width is less than 768px, THE Agent_Dashboard SHALL use a single-column layout
2. THE Agent_Dashboard SHALL display the 3 Circular_KPI components in a horizontal scrollable row on mobile
3. THE Agent_Dashboard SHALL stack the Sales_Chart and Activity_Feed vertically on mobile
4. THE Agent_Dashboard SHALL use full-width components on mobile (w-full)
5. THE Agent_Dashboard SHALL maintain readable font sizes (minimum 14px body text) on mobile

### Requirement 18: Ensure Single-Column Mobile Layout for Admin Users Page

**User Story:** As an admin using mobile devices, I want the users page to adapt to small screens, so that I can manage users on any device.

#### Acceptance Criteria

1. WHEN the viewport width is less than 768px, THE Admin_Users_Page SHALL stack stats cards vertically (grid-cols-1)
2. THE Admin_Users_Page SHALL make the Users_Table horizontally scrollable on mobile
3. THE Admin_Users_Page SHALL ensure tab labels remain fully visible on mobile
4. THE Admin_Users_Page SHALL use minimum 44px touch targets for all interactive elements on mobile
5. THE Admin_Users_Page SHALL maintain table functionality with horizontal scroll for wide content

### Requirement 19: Standardize Spacing to 16px or 24px

**User Story:** As a user, I want consistent spacing throughout the interface, so that the design feels cohesive and professional.

#### Acceptance Criteria

1. THE Agent_Dashboard SHALL use gap-6 (24px) for main section spacing
2. THE Agent_Dashboard SHALL use gap-4 (16px) for component-level spacing
3. THE Admin_Users_Page SHALL use the same spacing scale (gap-4 and gap-6)
4. THE Agent_Dashboard SHALL remove inconsistent spacing classes (space-y-8, gap-8)
5. WHERE vertical spacing is needed, THE Agent_Dashboard SHALL use space-y-6 or space-y-4 consistently

### Requirement 20: Reduce Component Layer Over-Engineering

**User Story:** As a developer, I want a simpler component structure, so that I can understand and modify the code more easily.

#### Acceptance Criteria

1. THE Agent_Dashboard SHALL inline small utility components (StatCard, CircularKPI) if they are used only once
2. THE Agent_Dashboard SHALL remove wrapper components that serve no functional purpose
3. THE Admin_Users_Page SHALL flatten the component hierarchy where nested components add no value
4. THE Agent_Dashboard SHALL keep component nesting to a maximum of 3 levels deep
5. WHERE components are extracted, THE Agent_Dashboard SHALL ensure they are reusable in at least 2 places

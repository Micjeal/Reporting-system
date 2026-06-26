# Expenses Report Feature - Implementation Tasks

## Task Overview

This document outlines the implementation tasks for the Expenses Report Feature. Tasks are organized by component and follow the design specification.

## Phase 1: Component Development

### 1.1 Create ExpensesReportTab Component Structure

**Description**: Create the main `ExpensesReportTab` component with state management and data fetching logic.

**Acceptance Criteria**:
- [ ] Component file created at `/components/admin/reports/expenses-report-tab.tsx`
- [ ] All state variables initialized (expenses, agents, trends, filters, pagination, loading, error)
- [ ] Date range initialization to last 30 days implemented
- [ ] Component exports properly for use in reports page

**Implementation Notes**:
- Use React hooks (useState, useEffect, useMemo, useCallback)
- Follow the same pattern as SalesReportTab
- Initialize date range in useEffect on component mount

---

### 1.2 Implement Data Fetching Logic

**Description**: Implement fetching of expenses, agents, and analytics data.

**Acceptance Criteria**:
- [ ] `listExpenses()` called with date range filters
- [ ] `listAgents()` called to populate agent dropdown
- [ ] Analytics endpoints called for trends and category distribution
- [ ] Error handling implemented for all API calls
- [ ] Loading state managed during data fetching
- [ ] Data refetched when date range changes

**Implementation Notes**:
- Use Promise.all() for parallel requests
- Implement try-catch error handling
- Set loading state before and after fetching

---

### 1.3 Implement KPI Card Component

**Description**: Create reusable KPI card component with styling and change indicators.

**Acceptance Criteria**:
- [ ] KPI card component accepts title, value, icon, change, and changeType props
- [ ] Card displays icon in top-right corner
- [ ] Card displays percentage change with appropriate color
- [ ] Hover effects implemented (scale and shadow)
- [ ] Responsive sizing for different screen sizes

**Implementation Notes**:
- Create as a separate component or inline function
- Use Lucide icons for consistency
- Apply gradient background on hover

---

### 1.4 Implement KPI Calculations

**Description**: Calculate KPI values with period comparison logic.

**Acceptance Criteria**:
- [ ] Total Expenses calculated for current month
- [ ] Top Category identified by highest amount
- [ ] Average Expense per Agent calculated
- [ ] Expense Count calculated
- [ ] Percentage changes calculated vs previous month
- [ ] Change type (positive/negative/neutral) determined

**Implementation Notes**:
- Use useMemo for performance
- Handle edge cases (no data, division by zero)
- Use ISO date strings for date comparisons

---

### 1.5 Implement Filter Section

**Description**: Create filter UI with date range, agent, and category selectors.

**Acceptance Criteria**:
- [ ] Date From input field implemented
- [ ] Date To input field implemented
- [ ] Agent dropdown populated with agents
- [ ] Category dropdown with all 5 categories
- [ ] Reset Filters button implemented
- [ ] Filters responsive on mobile/tablet/desktop

**Implementation Notes**:
- Use native HTML inputs for dates
- Use select elements for dropdowns
- Reset pagination when filters change

---

### 1.6 Implement Filtering Logic

**Description**: Apply filters to expense data and calculate filtered results.

**Acceptance Criteria**:
- [ ] Expenses filtered by date range
- [ ] Expenses filtered by selected agent
- [ ] Expenses filtered by selected category
- [ ] Multiple filters applied simultaneously
- [ ] Filtered results used for all calculations and displays

**Implementation Notes**:
- Use useMemo for performance
- Create lookup maps for O(1) agent/category lookups
- Handle 'all' values for no filtering

---

### 1.7 Implement Expense Trend Chart

**Description**: Create line chart showing expense trends over 30 days.

**Acceptance Criteria**:
- [ ] Line chart displays daily expense totals
- [ ] X-axis shows dates
- [ ] Y-axis shows amounts in currency format
- [ ] Chart responsive to container size
- [ ] Loading state displays spinner
- [ ] No data state displays message
- [ ] Tooltip shows formatted values

**Implementation Notes**:
- Use Recharts library (already in project)
- Fetch data from `/api/analytics/expense-trends`
- Format Y-axis as currency

---

### 1.8 Implement Category Distribution Chart

**Description**: Create bar chart showing expense distribution by category.

**Acceptance Criteria**:
- [ ] Bar chart displays each category with total amount
- [ ] Each category has distinct color
- [ ] Chart responsive to container size
- [ ] Loading state displays spinner
- [ ] No data state displays message
- [ ] Tooltip shows category name and amount

**Implementation Notes**:
- Use Recharts library
- Fetch data from `/api/analytics/expense-categories`
- Use consistent colors for categories

---

### 1.9 Implement Period Comparison Chart

**Description**: Create bar chart comparing current vs previous month metrics.

**Acceptance Criteria**:
- [ ] Bar chart displays three metrics: Total Expenses, Count, Average
- [ ] Current month shown in one color, previous month in another
- [ ] Chart responsive to container size
- [ ] Loading state displays spinner
- [ ] No data state displays message
- [ ] Legend identifies current vs previous month

**Implementation Notes**:
- Calculate comparison data from filtered expenses
- Use useMemo for performance
- Handle months with no data

---

### 1.10 Implement Expense Table

**Description**: Create paginated table displaying filtered expenses.

**Acceptance Criteria**:
- [ ] Table displays: Date, Agent Name, Category, Description, Amount, Receipt Status
- [ ] 10 expenses displayed per page
- [ ] Alternating row colors for readability
- [ ] Amounts formatted as currency
- [ ] Responsive table with horizontal scroll on mobile
- [ ] No data state displays message

**Implementation Notes**:
- Use semantic HTML table structure
- Apply hover effects to rows
- Format dates consistently

---

### 1.11 Implement Pagination Controls

**Description**: Add pagination navigation to expense table.

**Acceptance Criteria**:
- [ ] Previous/Next buttons displayed when multiple pages exist
- [ ] Previous button disabled on first page
- [ ] Next button disabled on last page
- [ ] Current page and total pages displayed
- [ ] Page changes update displayed expenses
- [ ] Pagination resets when filters change

**Implementation Notes**:
- Calculate total pages from filtered data
- Slice data based on current page
- Update currentPage state on button click

---

### 1.12 Implement CSV Export

**Description**: Generate and download CSV file of filtered expenses.

**Acceptance Criteria**:
- [ ] Export CSV button displayed in table header
- [ ] CSV includes: Date, Agent Name, Category, Description, Amount, Receipt URL
- [ ] Filename formatted as "expenses-report-YYYY-MM-DD.csv"
- [ ] File automatically downloads to user device
- [ ] Button disabled when no expenses available
- [ ] Error handling for export failures

**Implementation Notes**:
- Create CSV string with proper escaping
- Use Blob and URL.createObjectURL for download
- Clean up object URL after download

---

### 1.13 Implement Loading States

**Description**: Display loading indicators while data is being fetched.

**Acceptance Criteria**:
- [ ] Spinner displayed in KPI cards during loading
- [ ] Spinner displayed in charts during loading
- [ ] Spinner displayed in table during loading
- [ ] Loading text displayed with spinner
- [ ] Loading state cleared when data arrives

**Implementation Notes**:
- Create reusable loading spinner component
- Show spinner in each section independently
- Use consistent styling

---

### 1.14 Implement Error Handling

**Description**: Display error messages and allow recovery from errors.

**Acceptance Criteria**:
- [ ] Error alert displayed when data fetch fails
- [ ] Error message describes what went wrong
- [ ] Error alert dismissible
- [ ] User can retry by changing filters
- [ ] Specific error messages for different failure types

**Implementation Notes**:
- Use Alert component from UI library
- Catch errors in try-catch blocks
- Provide actionable error messages

---

### 1.15 Implement Responsive Design

**Description**: Ensure component works well on all screen sizes.

**Acceptance Criteria**:
- [ ] KPI cards stack on mobile, 2 columns on tablet, 4 on desktop
- [ ] Filters stack on mobile, 2 columns on tablet, 4 on desktop
- [ ] Charts stack on mobile, 2 columns on desktop
- [ ] Table scrolls horizontally on mobile
- [ ] All text readable on small screens
- [ ] Touch targets adequate for mobile

**Implementation Notes**:
- Use Tailwind responsive classes
- Test on 320px, 768px, 1024px, 1440px widths
- Use grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 pattern

---

## Phase 2: Integration

### 2.1 Update Reports Page

**Description**: Replace the "Expenses report coming soon..." placeholder with the ExpensesReportTab component.

**Acceptance Criteria**:
- [ ] ExpensesReportTab imported in reports page
- [ ] Component rendered in Expenses tab content
- [ ] Placeholder text removed
- [ ] Tab navigation works correctly
- [ ] Component styling matches other tabs

**Implementation Notes**:
- Update `/app/admin/reports/page.tsx`
- Import from `@/components/admin/reports/expenses-report-tab`
- Maintain consistent tab structure

---

### 2.2 Verify API Endpoints

**Description**: Ensure all required API endpoints are available and working.

**Acceptance Criteria**:
- [ ] `/api/expenses` endpoint returns expense data
- [ ] `/api/agents` endpoint returns agent list
- [ ] `/api/analytics/expense-trends` endpoint returns trend data
- [ ] `/api/analytics/expense-categories` endpoint returns category data
- [ ] All endpoints support required query parameters
- [ ] Error responses handled gracefully

**Implementation Notes**:
- Test endpoints with Postman or similar tool
- Verify response formats match expected types
- Check query parameter support

---

## Phase 3: Testing

### 3.1 Unit Tests - KPI Calculations

**Description**: Test KPI calculation logic with various data scenarios.

**Acceptance Criteria**:
- [ ] Total expenses calculated correctly
- [ ] Top category identified correctly
- [ ] Average per agent calculated correctly
- [ ] Percentage changes calculated correctly
- [ ] Edge cases handled (no data, single agent, etc.)

---

### 3.2 Unit Tests - Filtering Logic

**Description**: Test filter application logic.

**Acceptance Criteria**:
- [ ] Date range filtering works correctly
- [ ] Agent filtering works correctly
- [ ] Category filtering works correctly
- [ ] Multiple filters applied simultaneously
- [ ] 'all' values result in no filtering

---

### 3.3 Unit Tests - Pagination

**Description**: Test pagination logic.

**Acceptance Criteria**:
- [ ] Correct number of pages calculated
- [ ] Correct items displayed per page
- [ ] Page navigation works correctly
- [ ] Pagination resets on filter change

---

### 3.4 Integration Tests - Data Fetching

**Description**: Test data fetching and state updates.

**Acceptance Criteria**:
- [ ] Expenses fetched on component mount
- [ ] Agents fetched on component mount
- [ ] Analytics data fetched on component mount
- [ ] Data refetched when date range changes
- [ ] Error state set on fetch failure

---

### 3.5 Integration Tests - User Interactions

**Description**: Test user interactions with filters and controls.

**Acceptance Criteria**:
- [ ] Changing date range updates displayed data
- [ ] Changing agent filter updates displayed data
- [ ] Changing category filter updates displayed data
- [ ] Reset filters button resets all filters
- [ ] Export CSV button generates file

---

### 3.6 E2E Tests - Complete Workflows

**Description**: Test complete user workflows.

**Acceptance Criteria**:
- [ ] User can view expenses report on reports page
- [ ] User can filter by date range
- [ ] User can filter by agent
- [ ] User can filter by category
- [ ] User can navigate through pages
- [ ] User can export to CSV
- [ ] User can reset filters

---

## Phase 4: Documentation & Deployment

### 4.1 Code Documentation

**Description**: Add comments and documentation to code.

**Acceptance Criteria**:
- [ ] Component purpose documented
- [ ] Complex logic explained with comments
- [ ] Props documented with JSDoc
- [ ] State variables documented
- [ ] API calls documented

---

### 4.2 User Documentation

**Description**: Create user guide for expenses report feature.

**Acceptance Criteria**:
- [ ] Feature overview documented
- [ ] Filter usage explained
- [ ] Chart interpretation explained
- [ ] Export process documented
- [ ] Screenshots included

---

### 4.3 Performance Optimization

**Description**: Optimize component performance.

**Acceptance Criteria**:
- [ ] useMemo used for expensive calculations
- [ ] Lookup maps created for O(1) access
- [ ] Unnecessary re-renders eliminated
- [ ] Component renders in < 1 second
- [ ] Charts render smoothly

---

### 4.4 Accessibility Review

**Description**: Ensure component meets accessibility standards.

**Acceptance Criteria**:
- [ ] Semantic HTML used throughout
- [ ] ARIA labels added to interactive elements
- [ ] Keyboard navigation supported
- [ ] Color contrast meets WCAG AA
- [ ] Screen reader tested

---

### 4.5 Deployment

**Description**: Deploy feature to production.

**Acceptance Criteria**:
- [ ] Code reviewed and approved
- [ ] All tests passing
- [ ] No console errors or warnings
- [ ] Feature works in production environment
- [ ] Monitoring configured for errors

---

## Acceptance Criteria Properties

### Property-Based Testing Opportunities

The following acceptance criteria are suitable for property-based testing:

**1. KPI Calculations (Invariants)**
- Property: Total expenses = sum of all individual expenses
- Property: Average per agent = total expenses / unique agent count
- Property: Top category amount >= all other category amounts

**2. Filtering (Metamorphic Properties)**
- Property: Filtered count <= unfiltered count
- Property: Filtered total <= unfiltered total
- Property: Applying same filter twice = applying once (idempotence)

**3. Pagination (Invariants)**
- Property: Total items = items per page * (pages - 1) + items on last page
- Property: Current page items <= items per page
- Property: Page number >= 1 and <= total pages

**4. CSV Export (Round-trip)**
- Property: Parse exported CSV = original data (round-trip property)
- Property: All filtered expenses present in export
- Property: No extra rows in export


# Implementation Plan: Weekly Sales and Expenses Tracking

## Overview

This implementation plan breaks down the weekly tracking feature into discrete coding tasks. The feature adds weekly aggregation, filtering, visualization, and comparison capabilities to the admin sales and expenses pages. All components will be built using TypeScript and React, integrating with the existing Next.js application structure.

## Tasks

- [ ] 1. Create core weekly aggregation utilities
  - [ ] 1.1 Implement week calculation and boundary functions
    - Create `lib/weekly-aggregation.ts` with `getWeekBoundaries()`, `getWeekKey()`, and `generateWeekRanges()` functions
    - Ensure weeks start on Sunday and end on Saturday
    - Handle edge cases for current week and date range alignment
    - _Requirements: 1.4, 1.5_
  
  - [ ]* 1.2 Write property test for week boundary consistency
    - **Property 1: Week Boundary Consistency**
    - **Validates: Requirements 1.4**
    - Test that for any date and week option, calculated week boundaries always start on Sunday and end on Saturday with exactly 7 days between
  
  - [ ]* 1.3 Write property test for week start alignment
    - **Property 10: Week Start Alignment**
    - **Validates: Requirements 1.4**
    - Test that for any generated week range, each week's start date is a Sunday (day of week = 0)
  
  - [~] 1.4 Implement weekly data aggregation function
    - Create `aggregateByWeek()` function that groups transactions by week
    - Calculate total amounts and transaction counts per week
    - Generate entries for all weeks in range, including weeks with zero transactions
    - Calculate week-over-week changes (absolute and percentage)
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6, 3.6_
  
  - [ ]* 1.5 Write property test for aggregation completeness
    - **Property 2: Aggregation Completeness**
    - **Validates: Requirements 2.3**
    - Test that sum of all weekly aggregated amounts equals sum of all individual transaction amounts
  
  - [ ]* 1.6 Write property test for transaction count preservation
    - **Property 3: Transaction Count Preservation**
    - **Validates: Requirements 2.5**
    - Test that sum of transaction counts across all weekly aggregations equals total number of transactions
  
  - [ ]* 1.7 Write property test for week coverage completeness
    - **Property 4: Week Coverage Completeness**
    - **Validates: Requirements 2.6**
    - Test that weekly aggregation generates entries for all weeks within or overlapping the range, including weeks with zero transactions
  
  - [ ]* 1.8 Write property test for percentage change calculation
    - **Property 5: Percentage Change Calculation Correctness**
    - **Validates: Requirements 3.6**
    - Test that for any two consecutive weeks where previous week has non-zero amount, percentage change equals ((current - previous) / previous) * 100
  
  - [ ]* 1.9 Write property test for date range filtering
    - **Property 9: Date Range Filtering**
    - **Validates: Requirements 1.2, 1.3**
    - Test that any transaction with date outside specified date range is not included in any weekly aggregation

- [~] 2. Checkpoint - Verify core aggregation logic
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 3. Implement weekly net revenue aggregation
  - [~] 3.1 Create `aggregateWeeklyNetRevenue()` function
    - Extend weekly aggregation to include sales, expenses, and returns breakdown
    - Calculate net revenue as: salesTotal - expensesTotal - returnsTotal
    - Return `WeeklyNetRevenueData[]` with all revenue components
    - _Requirements: 8.2_
  
  - [ ]* 3.2 Write property test for net revenue calculation
    - **Property 6: Net Revenue Calculation Correctness**
    - **Validates: Requirements 8.2**
    - Test that for any week with sales, expenses, and returns data, calculated net revenue equals (salesTotal - expensesTotal - returnsTotal)
  
  - [~] 3.3 Implement KPI calculation functions
    - Create `calculateWeeklyKpis()` function for average, best week, and worst week
    - Create `calculateAverageNetRevenue()` function for net revenue average
    - Handle edge cases (empty data, equal amounts)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 8.6_
  
  - [ ]* 3.4 Write property test for KPI average calculation
    - **Property 7: KPI Average Calculation**
    - **Validates: Requirements 4.1, 4.4**
    - Test that for any set of weekly data, average weekly amount equals sum of all weekly amounts divided by number of weeks
  
  - [ ]* 3.5 Write property test for best/worst week identification
    - **Property 8: Best/Worst Week Identification**
    - **Validates: Requirements 4.2, 4.3, 4.5, 4.6**
    - Test that for any set of weekly data with at least one week, best week has amount >= all other weeks and worst week has amount <= all other weeks

- [ ] 4. Create CSV export functionality
  - [~] 4.1 Implement `exportWeeklyCsv()` function
    - Generate CSV with columns: Week Start Date, Week End Date, Total Amount, Transaction Count, Change from Previous Week (%)
    - Create downloadable blob with proper filename format
    - Handle null values in percentage changes (display as "N/A")
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
  
  - [ ]* 4.2 Write unit tests for CSV export
    - Test CSV header generation
    - Test data row formatting
    - Test filename generation with date ranges
    - Test handling of null percentage values

- [~] 5. Checkpoint - Verify utility functions
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Create custom hooks for data fetching
  - [~] 6.1 Implement `useWeeklySales` hook
    - Create `hooks/use-weekly-sales.ts`
    - Fetch sales data from existing API
    - Apply `aggregateWeeklyNetRevenue()` to transform data
    - Return `{ weeklyData, loading, error }` state
    - _Requirements: 2.1, 8.1_
  
  - [~] 6.2 Implement `useWeeklyExpenses` hook
    - Create `hooks/use-weekly-expenses.ts`
    - Fetch expenses data from existing API
    - Apply `aggregateByWeek()` to transform data
    - Return `{ weeklyData, loading, error }` state
    - _Requirements: 2.2_
  
  - [ ]* 6.3 Write unit tests for custom hooks
    - Test data fetching and aggregation flow
    - Test loading and error states
    - Test re-fetching on date range changes

- [ ] 7. Build WeeklyFilter component
  - [~] 7.1 Create `components/admin/weekly-filter.tsx`
    - Implement dropdown/select with predefined week options
    - Options: "This Week", "Last Week", "Last 4 Weeks", "Last 8 Weeks", "Last 12 Weeks"
    - Calculate date boundaries using `getWeekBoundaries()`
    - Emit `onChange` callback with selected option and calculated date range
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [ ]* 7.2 Write unit tests for WeeklyFilter
    - Test option selection and date calculation
    - Test onChange callback with correct date ranges
    - Test "This Week" includes current date

- [ ] 8. Build WeeklySummaryTable component
  - [~] 8.1 Create `components/admin/weekly-summary-table.tsx`
    - Display weekly data in table format with columns: Week Range, Total Amount, Transaction Count, Change %
    - Implement color-coded change indicators (green for positive, red for negative)
    - Use Lucide icons (TrendingUp, TrendingDown) for visual indicators
    - Display "N/A" for null percentage changes
    - Add "Export CSV" button that calls export function
    - _Requirements: 2.1, 2.2, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 6.1, 6.2_
  
  - [ ]* 8.2 Write unit tests for WeeklySummaryTable
    - Test table rendering with mock data
    - Test change indicator color coding
    - Test export button functionality

- [ ] 9. Build WeeklyKpiCards component
  - [~] 9.1 Create `components/admin/weekly-kpi-cards.tsx`
    - Display KPI cards in responsive grid layout
    - For sales: Average Weekly Sales, Best Week, Worst Week, Average Weekly Net Revenue
    - For expenses: Average Weekly Expenses, Highest Week, Lowest Week
    - Format amounts as currency with proper locale formatting
    - Display week date ranges for best/worst weeks
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 8.6_
  
  - [ ]* 9.2 Write unit tests for WeeklyKpiCards
    - Test KPI calculations and display
    - Test responsive grid layout
    - Test handling of empty data (null best/worst weeks)

- [ ] 10. Build WeeklyTrendChart component
  - [~] 10.1 Create `components/admin/weekly-trend-chart.tsx`
    - Use Recharts library for line chart visualization
    - X-axis: week labels in "MMM DD" format
    - Y-axis: amounts with currency formatting
    - Implement custom tooltip showing week range and exact amount
    - Make chart responsive with ResponsiveContainer
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_
  
  - [ ]* 10.2 Write unit tests for WeeklyTrendChart
    - Test chart data transformation
    - Test tooltip content rendering
    - Test date label formatting

- [ ] 11. Build ViewToggle component
  - [~] 11.1 Create `components/admin/view-toggle.tsx`
    - Use shadcn/ui Tabs component for view switching
    - Two tabs: "Transactions" and "Weekly Summary"
    - Accept `transactionsView` and `weeklyView` as React node props
    - Support `defaultView` prop for initial view selection
    - Persist view selection in component state during session
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_
  
  - [ ]* 11.2 Write unit tests for ViewToggle
    - Test tab switching functionality
    - Test default view selection
    - Test view persistence during filter changes

- [~] 12. Checkpoint - Verify all components
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Integrate weekly features into Sales page
  - [~] 13.1 Enhance `app/admin/sales/page.tsx` with weekly features
    - Add state management for view mode and weekly filter
    - Integrate WeeklyFilter component at top of page
    - Wrap existing table and new weekly view in ViewToggle component
    - Conditionally render WeeklyKpiCards when in weekly view
    - Add WeeklyTrendChart above weekly summary table
    - Wire up useWeeklySales hook with filter date ranges
    - Display WeeklySummaryTable with net revenue column
    - Implement color coding for net revenue (red for negative, green for positive)
    - _Requirements: 1.2, 2.1, 2.4, 3.1, 4.1, 4.2, 4.3, 5.1, 7.1, 7.3, 8.1, 8.4, 8.5, 8.6_
  
  - [ ]* 13.2 Write integration tests for Sales page weekly features
    - Test filter selection updates data
    - Test view toggle switches between transactions and weekly views
    - Test KPI cards display correct calculations
    - Test chart renders with weekly data

- [ ] 14. Integrate weekly features into Expenses page
  - [~] 14.1 Enhance `app/admin/expenses/page.tsx` with weekly features
    - Add state management for view mode and weekly filter
    - Integrate WeeklyFilter component at top of page
    - Wrap existing table and new weekly view in ViewToggle component
    - Conditionally render WeeklyKpiCards when in weekly view
    - Add WeeklyTrendChart above weekly summary table
    - Wire up useWeeklyExpenses hook with filter date ranges
    - Display WeeklySummaryTable with expenses-specific labels
    - _Requirements: 1.3, 2.2, 2.4, 3.2, 4.4, 4.5, 4.6, 5.2, 7.2, 7.4_
  
  - [ ]* 14.2 Write integration tests for Expenses page weekly features
    - Test filter selection updates data
    - Test view toggle switches between transactions and weekly views
    - Test KPI cards display correct calculations
    - Test chart renders with weekly data

- [ ] 15. Final checkpoint and polish
  - [~] 15.1 Verify responsive design on mobile and desktop
    - Test all components on various screen sizes
    - Ensure tables scroll horizontally on small screens
    - Verify KPI cards stack properly on mobile
    - Check chart readability on mobile devices
  
  - [~] 15.2 Implement loading states and error handling
    - Add skeleton loaders for KPI cards during data fetch
    - Display loading spinner in chart area
    - Show error alerts with retry buttons for failed requests
    - Implement empty state messages for no data scenarios
  
  - [~] 15.3 Final integration testing
    - Test complete user flow: filter selection → view toggle → data display → export
    - Verify all requirements are met
    - Test edge cases (empty data, single week, current week)
    - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The implementation uses TypeScript throughout, matching the existing codebase
- All components integrate with existing shadcn/ui components and styling
- The feature is purely client-side aggregation, leveraging existing API endpoints

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4"] },
    { "id": 2, "tasks": ["1.5", "1.6", "1.7", "1.8", "1.9", "3.1"] },
    { "id": 3, "tasks": ["3.2", "3.3", "4.1"] },
    { "id": 4, "tasks": ["3.4", "3.5", "4.2", "6.1", "6.2"] },
    { "id": 5, "tasks": ["6.3", "7.1"] },
    { "id": 6, "tasks": ["7.2", "8.1"] },
    { "id": 7, "tasks": ["8.2", "9.1"] },
    { "id": 8, "tasks": ["9.2", "10.1"] },
    { "id": 9, "tasks": ["10.2", "11.1"] },
    { "id": 10, "tasks": ["11.2", "13.1", "14.1"] },
    { "id": 11, "tasks": ["13.2", "14.2", "15.1", "15.2"] },
    { "id": 12, "tasks": ["15.3"] }
  ]
}
```

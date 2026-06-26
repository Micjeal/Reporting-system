# Requirements Document

## Introduction

This document specifies the requirements for adding weekly tracking capabilities to the admin sales and expenses pages. The feature will enable administrators to view, analyze, and compare sales and expenses data aggregated by week, providing better insights into weekly performance trends and patterns.

## Glossary

- **Sales_Page**: The admin interface located at `/admin/sales` that displays sales transactions and metrics
- **Expenses_Page**: The admin interface located at `/admin/expenses` that displays expense records and metrics
- **Week**: A 7-day period starting on Sunday and ending on Saturday
- **Weekly_Aggregation**: The process of grouping and summing sales or expenses data by week
- **Week_Filter**: A UI component that allows users to select predefined weekly time periods
- **Weekly_View**: A display mode that shows data organized and summarized by week
- **Week_Over_Week_Comparison**: A calculation showing the percentage or absolute change between consecutive weeks
- **Weekly_KPI**: Key Performance Indicator calculated for a specific week period
- **Weekly_Trend_Chart**: A visualization showing how metrics change across multiple weeks

## Requirements

### Requirement 1: Weekly Time Period Filters

**User Story:** As an administrator, I want to quickly filter data by common weekly periods, so that I can view weekly performance without manually entering date ranges.

#### Acceptance Criteria

1. THE Week_Filter SHALL provide options for "This Week", "Last Week", "Last 4 Weeks", "Last 8 Weeks", and "Last 12 Weeks"
2. WHEN a user selects a weekly period option, THE Sales_Page SHALL update to display only sales within that period
3. WHEN a user selects a weekly period option, THE Expenses_Page SHALL update to display only expenses within that period
4. THE Week_Filter SHALL calculate week boundaries starting on Sunday and ending on Saturday
5. WHEN "This Week" is selected, THE system SHALL include all days from the most recent Sunday through the current date

### Requirement 2: Weekly Data Aggregation

**User Story:** As an administrator, I want to see sales and expenses grouped by week, so that I can understand weekly performance patterns.

#### Acceptance Criteria

1. THE Sales_Page SHALL display a weekly aggregation view showing total sales amount per week
2. THE Expenses_Page SHALL display a weekly aggregation view showing total expenses amount per week
3. FOR ALL weeks in the selected period, THE Weekly_Aggregation SHALL calculate the sum of all transactions within each week
4. THE Weekly_View SHALL display the week start date and week end date for each aggregated row
5. THE Weekly_View SHALL display the count of transactions for each week
6. WHEN no data exists for a week in the selected range, THE Weekly_View SHALL display that week with zero values

### Requirement 3: Week-Over-Week Comparison

**User Story:** As an administrator, I want to see how weekly metrics compare to the previous week, so that I can identify trends and anomalies.

#### Acceptance Criteria

1. THE Weekly_View SHALL display the percentage change from the previous week for total sales
2. THE Weekly_View SHALL display the percentage change from the previous week for total expenses
3. WHEN the percentage change is positive, THE system SHALL display it with a green indicator
4. WHEN the percentage change is negative, THE system SHALL display it with a red indicator
5. WHEN there is no previous week data, THE system SHALL display "N/A" for the comparison
6. THE Week_Over_Week_Comparison SHALL calculate percentage as: ((current_week - previous_week) / previous_week) * 100

### Requirement 4: Weekly Summary KPIs

**User Story:** As an administrator, I want to see key weekly metrics at a glance, so that I can quickly assess weekly performance.

#### Acceptance Criteria

1. THE Sales_Page SHALL display a Weekly_KPI card showing "Average Weekly Sales" for the selected period
2. THE Sales_Page SHALL display a Weekly_KPI card showing "Best Week" with the highest sales amount and its date range
3. THE Sales_Page SHALL display a Weekly_KPI card showing "Worst Week" with the lowest sales amount and its date range
4. THE Expenses_Page SHALL display a Weekly_KPI card showing "Average Weekly Expenses" for the selected period
5. THE Expenses_Page SHALL display a Weekly_KPI card showing "Highest Week" with the highest expenses amount and its date range
6. THE Expenses_Page SHALL display a Weekly_KPI card showing "Lowest Week" with the lowest expenses amount and its date range
7. THE Weekly_KPI cards SHALL update automatically when the week filter selection changes

### Requirement 5: Weekly Trend Visualization

**User Story:** As an administrator, I want to see a visual chart of weekly trends, so that I can quickly identify patterns and outliers.

#### Acceptance Criteria

1. THE Sales_Page SHALL display a Weekly_Trend_Chart showing sales amounts across all weeks in the selected period
2. THE Expenses_Page SHALL display a Weekly_Trend_Chart showing expense amounts across all weeks in the selected period
3. THE Weekly_Trend_Chart SHALL use a line chart or bar chart format
4. THE Weekly_Trend_Chart SHALL display week labels on the x-axis in "MMM DD" format (e.g., "Jan 07")
5. THE Weekly_Trend_Chart SHALL display amount values on the y-axis with currency formatting
6. WHEN a user hovers over a data point, THE Weekly_Trend_Chart SHALL display a tooltip with the exact week range and amount
7. THE Weekly_Trend_Chart SHALL be responsive and adjust to different screen sizes

### Requirement 6: Weekly Data Export

**User Story:** As an administrator, I want to export weekly aggregated data, so that I can perform further analysis in external tools.

#### Acceptance Criteria

1. THE Sales_Page SHALL provide an "Export Weekly CSV" button
2. THE Expenses_Page SHALL provide an "Export Weekly CSV" button
3. WHEN the export button is clicked, THE system SHALL generate a CSV file containing weekly aggregated data
4. THE exported CSV SHALL include columns: "Week Start Date", "Week End Date", "Total Amount", "Transaction Count", "Change from Previous Week (%)"
5. THE exported CSV SHALL include only weeks within the currently selected filter period
6. THE exported CSV file name SHALL include the date range in the format "weekly-sales-YYYY-MM-DD-to-YYYY-MM-DD.csv"

### Requirement 7: Toggle Between Detail and Weekly Views

**User Story:** As an administrator, I want to switch between detailed transaction view and weekly summary view, so that I can analyze data at different levels of granularity.

#### Acceptance Criteria

1. THE Sales_Page SHALL provide a view toggle control with options "Transactions" and "Weekly Summary"
2. THE Expenses_Page SHALL provide a view toggle control with options "Transactions" and "Weekly Summary"
3. WHEN "Transactions" is selected, THE system SHALL display the existing detailed transaction table
4. WHEN "Weekly Summary" is selected, THE system SHALL display the weekly aggregation table
5. THE view toggle selection SHALL persist when filters are changed
6. THE system SHALL remember the last selected view mode for each page during the user session

### Requirement 8: Weekly Net Revenue Calculation

**User Story:** As an administrator, I want to see weekly net revenue (sales minus expenses), so that I can understand true weekly profitability.

#### Acceptance Criteria

1. WHERE weekly view is enabled, THE Sales_Page SHALL display a "Weekly Net Revenue" column
2. THE Weekly_Net_Revenue SHALL be calculated as: (weekly_sales_total - weekly_expenses_total - weekly_returns_total)
3. THE Weekly_Net_Revenue SHALL display in currency format with two decimal places
4. WHEN weekly net revenue is negative, THE system SHALL display it in red color
5. WHEN weekly net revenue is positive, THE system SHALL display it in green color
6. THE system SHALL include a Weekly_KPI card showing "Average Weekly Net Revenue" for the selected period

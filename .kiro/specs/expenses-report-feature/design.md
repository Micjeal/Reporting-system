# Expenses Report Feature - Design Document

## Overview

The Expenses Report Feature is implemented as an `ExpensesReportTab` component that follows the same architectural pattern as the existing `SalesReportTab`. It provides comprehensive expense analytics through KPI cards, interactive filters, trend visualizations, and a detailed transaction table with export capabilities.

## Architecture

### Component Structure

```
ExpensesReportTab (Main Component)
├── KPI Cards Section
│   ├── Total Expenses Card
│   ├── Top Category Card
│   ├── Average per Agent Card
│   └── Expense Count Card
├── Filters Section
│   ├── Date Range Inputs
│   ├── Agent Dropdown
│   ├── Category Dropdown
│   └── Reset Button
├── Charts Section
│   ├── Expense Trend Chart (Line Chart)
│   ├── Category Distribution Chart (Bar Chart)
│   └── Period Comparison Chart (Bar Chart)
└── Expense Table Section
    ├── Paginated Table
    └── Export CSV Button
```

### Data Flow

1. **Initialization**: Component initializes with last 30 days date range
2. **Data Fetching**: Fetches expenses, agents, and analytics data on mount and when filters change
3. **Filtering**: Applies client-side filters (agent, category) to fetched data
4. **Aggregation**: Calculates KPIs and comparison metrics from filtered data
5. **Rendering**: Displays filtered data in tables and charts
6. **Export**: Generates CSV from filtered data on user request

## Component Implementation Details

### State Management

```typescript
// Data states
const [expenses, setExpenses] = useState<Expense[]>([])
const [agents, setAgents] = useState<Agent[]>([])
const [trends, setTrends] = useState<ExpenseTrendData[]>([])
const [categoryDistribution, setCategoryDistribution] = useState<CategoryData[]>([])

// Filter states
const [dateFrom, setDateFrom] = useState<string>('')
const [dateTo, setDateTo] = useState<string>('')
const [selectedAgent, setSelectedAgent] = useState('all')
const [selectedCategory, setSelectedCategory] = useState('all')
const [currentPage, setCurrentPage] = useState(1)

// UI states
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)
```

### Data Fetching

- **Expenses**: `listExpenses()` with date range, agent, and category filters
- **Agents**: `listAgents()` for dropdown population
- **Trends**: `/api/analytics/expense-trends` (30-day trend data)
- **Categories**: `/api/analytics/expense-categories` (category distribution)

### KPI Calculations

**Total Expenses**: Sum of all filtered expenses in current month
**Top Category**: Category with highest total amount
**Average per Agent**: Total expenses / unique agent count
**Expense Count**: Number of filtered expense records

**Period Comparison**: Calculate current month vs previous month for each metric

### Filtering Logic

- **Date Range**: Filter expenses where `date >= dateFrom AND date <= dateTo`
- **Agent**: Filter expenses where `agent_id === selectedAgent` (if not 'all')
- **Category**: Filter expenses where `category === selectedCategory` (if not 'all')

### Pagination

- **Items per Page**: 10 expenses
- **Total Pages**: `Math.ceil(filteredExpenses.length / 10)`
- **Current Page**: Managed in state, reset to 1 when filters change

### CSV Export

Columns: Date, Agent Name, Category, Description, Amount, Receipt URL
Filename: `expenses-report-YYYY-MM-DD.csv`

## UI/UX Design

### Responsive Breakpoints

- **Mobile** (< 640px): Single column layout, stacked filters
- **Tablet** (640px - 1024px): 2-column grid for KPIs, 2-column filter layout
- **Desktop** (> 1024px): 4-column grid for KPIs, 4-column filter layout

### Color Scheme

- **Positive Change**: Green (#10b981)
- **Negative Change**: Red (#ef4444)
- **Neutral Change**: Gray (#6b7280)
- **Primary Action**: Blue (#3b82f6)
- **Hover State**: Light blue background

### Loading States

- Spinner with "Loading..." text in data sections
- Disabled buttons during loading
- Skeleton screens for tables (optional enhancement)

### Error Handling

- Alert component with error message
- Retry capability through filter changes
- Graceful fallbacks for missing data

## Integration Points

### Reports Page Integration

The `ExpensesReportTab` component is imported and used in `/app/admin/reports/page.tsx`:

```typescript
import { ExpensesReportTab } from '@/components/admin/reports/expenses-report-tab'

// In TabsContent
<TabsContent value="expenses" className="mt-6">
  <ExpensesReportTab />
</TabsContent>
```

### API Endpoints Used

- `GET /api/expenses` - Fetch expense records
- `GET /api/agents` - Fetch agent list
- `GET /api/analytics/expense-trends` - Fetch trend data
- `GET /api/analytics/expense-categories` - Fetch category distribution

## Performance Considerations

1. **Memoization**: Use `useMemo` for expensive calculations (filtering, aggregation)
2. **Lookup Maps**: Create agent/category maps for O(1) lookups
3. **Pagination**: Only render 10 items per page to reduce DOM nodes
4. **Lazy Loading**: Charts load only when visible (optional enhancement)
5. **Debouncing**: Debounce filter changes to reduce API calls (optional enhancement)

## Accessibility

- Semantic HTML structure
- ARIA labels for interactive elements
- Keyboard navigation support
- Color contrast compliance
- Screen reader friendly table structure

## Testing Strategy

### Unit Tests
- KPI calculation logic
- Filter application logic
- Pagination logic
- CSV generation

### Integration Tests
- Data fetching and state updates
- Filter interactions
- Export functionality
- Error handling

### E2E Tests
- Complete user workflows
- Filter combinations
- Export and download
- Responsive behavior

## Future Enhancements

1. **Advanced Filtering**: Multi-select filters, custom date ranges
2. **Drill-down Analysis**: Click on category to see detailed expenses
3. **Scheduled Reports**: Email reports on schedule
4. **Custom Metrics**: User-defined KPIs
5. **Real-time Updates**: WebSocket updates for live data
6. **Expense Approval Workflow**: Approve/reject expenses from report
7. **Budget Tracking**: Compare expenses against budget
8. **Forecasting**: Predict future expenses based on trends


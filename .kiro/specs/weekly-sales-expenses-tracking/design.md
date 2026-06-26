# Design Document

## Overview

This document provides the technical design for implementing weekly tracking capabilities on the admin sales and expenses pages. The solution will add weekly aggregation, filtering, visualization, and comparison features while maintaining the existing transaction-level views.

## Architecture

### Component Structure

```
app/admin/
├── sales/
│   └── page.tsx (enhanced with weekly features)
├── expenses/
│   └── page.tsx (enhanced with weekly features)

components/admin/
├── weekly-filter.tsx (new)
├── weekly-summary-table.tsx (new)
├── weekly-trend-chart.tsx (new)
├── weekly-kpi-cards.tsx (new)
└── view-toggle.tsx (new)

lib/
├── weekly-aggregation.ts (new)
└── date-utils.ts (enhanced)

hooks/
├── use-weekly-sales.ts (new)
└── use-weekly-expenses.ts (new)
```

### Data Flow

1. User selects weekly filter → State update triggers data fetch
2. Raw transaction data fetched from existing APIs
3. Client-side aggregation groups data by week
4. Aggregated data displayed in tables, charts, and KPI cards
5. Export functionality generates CSV from aggregated data

## Components and Interfaces

### Core Components

#### WeeklyFilter
**Purpose:** Provides predefined weekly period selection options

**Interface:**
```typescript
interface WeeklyFilterProps {
  value: WeekOption
  onChange: (option: WeekOption, dates: { dateFrom: string, dateTo: string }) => void
}

type WeekOption = 'this-week' | 'last-week' | 'last-4-weeks' | 'last-8-weeks' | 'last-12-weeks' | 'custom'
```

#### WeeklySummaryTable
**Purpose:** Displays aggregated weekly data in tabular format

**Interface:**
```typescript
interface WeeklySummaryTableProps {
  weeklyData: WeeklyData[]
  type: 'sales' | 'expenses'
  onExport: () => void
}
```

#### WeeklyTrendChart
**Purpose:** Visualizes weekly trends using line charts

**Interface:**
```typescript
interface WeeklyTrendChartProps {
  weeklyData: WeeklyData[]
  type: 'sales' | 'expenses'
}
```

#### WeeklyKpiCards
**Purpose:** Displays key performance indicators for weekly data

**Interface:**
```typescript
interface WeeklyKpiCardsProps {
  weeklyData: WeeklyData[]
  type: 'sales' | 'expenses'
}
```

#### ViewToggle
**Purpose:** Switches between transaction detail and weekly summary views

**Interface:**
```typescript
interface ViewToggleProps {
  transactionsView: React.ReactNode
  weeklyView: React.ReactNode
  defaultView?: 'transactions' | 'weekly'
}
```

### Utility Functions

#### Week Calculation
```typescript
function getWeekBoundaries(option: WeekOption): { start: Date, end: Date }
function getWeekKey(date: Date): string
function generateWeekRanges(start: Date, end: Date): Array<{ key: string, start: string, end: string }>
```

#### Aggregation Functions
```typescript
function aggregateByWeek(
  transactions: Array<{ date: string; amount: number }>,
  startDate: Date,
  endDate: Date
): WeeklyData[]

function aggregateWeeklyNetRevenue(
  sales: Array<{ date: string; total_amount: number; expenses_total: number; returns_amount: number }>,
  startDate: Date,
  endDate: Date
): WeeklyNetRevenueData[]
```

#### KPI Calculation
```typescript
function calculateWeeklyKpis(weeklyData: WeeklyData[]): WeeklyKpis
function calculateAverageNetRevenue(weeklyData: WeeklyNetRevenueData[]): number
```

#### Export Functions
```typescript
function exportWeeklyCsv(
  weeklyData: WeeklyData[],
  type: 'sales' | 'expenses',
  dateFrom: string,
  dateTo: string
): void
```

### Custom Hooks

#### useWeeklySales
**Purpose:** Fetches and aggregates sales data by week

**Interface:**
```typescript
function useWeeklySales(dateFrom?: string, dateTo?: string): {
  weeklyData: WeeklyNetRevenueData[]
  loading: boolean
  error: string | null
}
```

#### useWeeklyExpenses
**Purpose:** Fetches and aggregates expenses data by week

**Interface:**
```typescript
function useWeeklyExpenses(dateFrom?: string, dateTo?: string): {
  weeklyData: WeeklyData[]
  loading: boolean
  error: string | null
}
```

## Data Models

### WeeklyData
**Purpose:** Represents aggregated data for a single week

```typescript
interface WeeklyData {
  weekStart: string        // ISO date format (YYYY-MM-DD)
  weekEnd: string          // ISO date format (YYYY-MM-DD)
  totalAmount: number      // Sum of all transaction amounts in the week
  transactionCount: number // Number of transactions in the week
  changeFromPrevious: number | null  // Absolute change from previous week
  changePercentage: number | null    // Percentage change from previous week
}
```

**Constraints:**
- `weekStart` must be a Sunday
- `weekEnd` must be a Saturday
- `weekEnd` must be exactly 6 days after `weekStart`
- `totalAmount` must be >= 0
- `transactionCount` must be >= 0
- `changeFromPrevious` is null for the first week in a range
- `changePercentage` is null when previous week amount is 0 or unavailable

### WeeklyNetRevenueData
**Purpose:** Extends WeeklyData with revenue breakdown for sales

```typescript
interface WeeklyNetRevenueData extends WeeklyData {
  salesTotal: number      // Total sales amount for the week
  expensesTotal: number   // Total expenses amount for the week
  returnsTotal: number    // Total returns amount for the week
  netRevenue: number      // Calculated as: salesTotal - expensesTotal - returnsTotal
}
```

**Constraints:**
- All constraints from `WeeklyData` apply
- `netRevenue = salesTotal - expensesTotal - returnsTotal`
- `netRevenue` can be negative
- `salesTotal`, `expensesTotal`, `returnsTotal` must be >= 0

### WeeklyKpis
**Purpose:** Aggregated KPI metrics across multiple weeks

```typescript
interface WeeklyKpis {
  averageWeekly: number   // Mean of totalAmount across all weeks
  bestWeek: {             // Week with highest totalAmount
    amount: number
    weekStart: string
    weekEnd: string
  } | null
  worstWeek: {            // Week with lowest totalAmount
    amount: number
    weekStart: string
    weekEnd: string
  } | null
}
```

**Constraints:**
- `averageWeekly` is 0 when no weeks are present
- `bestWeek` and `worstWeek` are null when no weeks are present
- When all weeks have equal amounts, `bestWeek` and `worstWeek` reference the same week

### ChartDataPoint
**Purpose:** Formatted data point for chart visualization

```typescript
interface ChartDataPoint {
  weekLabel: string   // Formatted as "MMM DD" (e.g., "Jan 07")
  amount: number      // Total amount for the week
  weekStart: string   // ISO date for tooltip
  weekEnd: string     // ISO date for tooltip
}
```

**Constraints:**
- `weekLabel` must be in "MMM DD" format
- Derived from `WeeklyData` or `WeeklyNetRevenueData`

### WeekOption
**Purpose:** Enumeration of predefined weekly filter options

```typescript
type WeekOption = 
  | 'this-week'      // Current week (Sunday to today)
  | 'last-week'      // Previous complete week
  | 'last-4-weeks'   // Last 4 complete weeks
  | 'last-8-weeks'   // Last 8 complete weeks
  | 'last-12-weeks'  // Last 12 complete weeks
  | 'custom'         // User-defined date range
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

This feature involves data aggregation logic that is well-suited for property-based testing. The core aggregation functions transform transaction data into weekly summaries, and these transformations should maintain specific invariants regardless of input data.

### Property 1: Week Boundary Consistency

*For any* date and week option, the calculated week boundaries SHALL always start on Sunday and end on Saturday, with exactly 7 days between start and end.

**Validates: Requirements 1.4**

### Property 2: Aggregation Completeness

*For any* set of transactions and date range, the sum of all weekly aggregated amounts SHALL equal the sum of all individual transaction amounts within that range.

**Validates: Requirements 2.3**

### Property 3: Transaction Count Preservation

*For any* set of transactions and date range, the sum of transaction counts across all weekly aggregations SHALL equal the total number of transactions within that range.

**Validates: Requirements 2.5**

### Property 4: Week Coverage Completeness

*For any* date range, the weekly aggregation SHALL generate entries for all weeks that fall within or overlap the range, including weeks with zero transactions.

**Validates: Requirements 2.6**

### Property 5: Percentage Change Calculation Correctness

*For any* two consecutive weeks where the previous week has a non-zero amount, the percentage change SHALL equal ((current - previous) / previous) * 100.

**Validates: Requirements 3.6**

### Property 6: Net Revenue Calculation Correctness

*For any* week with sales, expenses, and returns data, the calculated net revenue SHALL equal (salesTotal - expensesTotal - returnsTotal).

**Validates: Requirements 8.2**

### Property 7: KPI Average Calculation

*For any* set of weekly data, the average weekly amount SHALL equal the sum of all weekly amounts divided by the number of weeks.

**Validates: Requirements 4.1, 4.4**

### Property 8: Best/Worst Week Identification

*For any* set of weekly data with at least one week, the best week SHALL have an amount greater than or equal to all other weeks, and the worst week SHALL have an amount less than or equal to all other weeks.

**Validates: Requirements 4.2, 4.3, 4.5, 4.6**

### Property 9: Date Range Filtering

*For any* transaction with a date outside the specified date range, that transaction SHALL NOT be included in any weekly aggregation within that range.

**Validates: Requirements 1.2, 1.3**

### Property 10: Week Start Alignment

*For any* generated week range, each week's start date SHALL be a Sunday (day of week = 0).

**Validates: Requirements 1.4**

## Technical Design

### 1. Weekly Time Period Filters (Requirement 1)

**Component:** `WeeklyFilter`

**Implementation:**
- Create a reusable filter component with predefined weekly period options
- Calculate week boundaries using Sunday as the start of the week
- Expose `onFilterChange` callback that returns `{ dateFrom: string, dateTo: string }`

**Week Calculation Logic:**
```typescript
function getWeekBoundaries(option: WeekOption): { start: Date, end: Date } {
  const today = new Date()
  const currentDay = today.getDay() // 0 = Sunday
  
  // Calculate most recent Sunday
  const thisSunday = new Date(today)
  thisSunday.setDate(today.getDate() - currentDay)
  thisSunday.setHours(0, 0, 0, 0)
  
  // Calculate Saturday of current week
  const thisSaturday = new Date(thisSunday)
  thisSaturday.setDate(thisSunday.getDate() + 6)
  thisSaturday.setHours(23, 59, 59, 999)
  
  switch (option) {
    case 'this-week':
      return { start: thisSunday, end: today }
    case 'last-week':
      const lastSunday = new Date(thisSunday)
      lastSunday.setDate(thisSunday.getDate() - 7)
      const lastSaturday = new Date(lastSunday)
      lastSaturday.setDate(lastSunday.getDate() + 6)
      return { start: lastSunday, end: lastSaturday }
    case 'last-4-weeks':
      const start4 = new Date(thisSunday)
      start4.setDate(thisSunday.getDate() - (4 * 7))
      return { start: start4, end: thisSaturday }
    // ... similar for 8 and 12 weeks
  }
}
```

**Props:**
```typescript
interface WeeklyFilterProps {
  value: WeekOption
  onChange: (option: WeekOption, dates: { dateFrom: string, dateTo: string }) => void
}

type WeekOption = 'this-week' | 'last-week' | 'last-4-weeks' | 'last-8-weeks' | 'last-12-weeks' | 'custom'
```

### 2. Weekly Data Aggregation (Requirement 2)

**Module:** `lib/weekly-aggregation.ts`

**Core Function:**
```typescript
interface WeeklyData {
  weekStart: string // ISO date
  weekEnd: string // ISO date
  totalAmount: number
  transactionCount: number
  changeFromPrevious: number | null
  changePercentage: number | null
}

function aggregateByWeek(
  transactions: Array<{ date: string; amount: number }>,
  startDate: Date,
  endDate: Date
): WeeklyData[] {
  // 1. Generate all weeks in range (including empty weeks)
  const weeks = generateWeekRanges(startDate, endDate)
  
  // 2. Group transactions by week
  const grouped = new Map<string, typeof transactions>()
  for (const txn of transactions) {
    const weekKey = getWeekKey(new Date(txn.date))
    if (!grouped.has(weekKey)) grouped.set(weekKey, [])
    grouped.get(weekKey)!.push(txn)
  }
  
  // 3. Calculate aggregates for each week
  const result: WeeklyData[] = []
  let previousAmount: number | null = null
  
  for (const week of weeks) {
    const weekTxns = grouped.get(week.key) ?? []
    const totalAmount = weekTxns.reduce((sum, t) => sum + t.amount, 0)
    const transactionCount = weekTxns.length
    
    const changeFromPrevious = previousAmount !== null ? totalAmount - previousAmount : null
    const changePercentage = previousAmount !== null && previousAmount !== 0
      ? ((totalAmount - previousAmount) / previousAmount) * 100
      : null
    
    result.push({
      weekStart: week.start,
      weekEnd: week.end,
      totalAmount,
      transactionCount,
      changeFromPrevious,
      changePercentage,
    })
    
    previousAmount = totalAmount
  }
  
  return result
}

function getWeekKey(date: Date): string {
  const sunday = new Date(date)
  sunday.setDate(date.getDate() - date.getDay())
  return sunday.toISOString().split('T')[0]
}

function generateWeekRanges(start: Date, end: Date): Array<{ key: string, start: string, end: string }> {
  const weeks: Array<{ key: string, start: string, end: string }> = []
  const current = new Date(start)
  
  // Align to Sunday
  current.setDate(current.getDate() - current.getDay())
  
  while (current <= end) {
    const weekStart = new Date(current)
    const weekEnd = new Date(current)
    weekEnd.setDate(current.getDate() + 6)
    
    weeks.push({
      key: weekStart.toISOString().split('T')[0],
      start: weekStart.toISOString().split('T')[0],
      end: weekEnd.toISOString().split('T')[0],
    })
    
    current.setDate(current.getDate() + 7)
  }
  
  return weeks
}
```

### 3. Week-Over-Week Comparison (Requirement 3)

**Component:** `WeeklySummaryTable`

**Implementation:**
- Display change percentage with color coding
- Use Lucide icons: `TrendingUp` (green) for positive, `TrendingDown` (red) for negative
- Show "N/A" when previous week data is unavailable

**Rendering Logic:**
```typescript
function renderChangeIndicator(change: number | null) {
  if (change === null) return <span className="text-muted-foreground">N/A</span>
  
  const isPositive = change >= 0
  const color = isPositive ? 'text-green-600' : 'text-red-600'
  const Icon = isPositive ? TrendingUp : TrendingDown
  
  return (
    <div className={`flex items-center gap-1 ${color}`}>
      <Icon className="h-4 w-4" />
      <span>{Math.abs(change).toFixed(1)}%</span>
    </div>
  )
}
```

### 4. Weekly Summary KPIs (Requirement 4)

**Component:** `WeeklyKpiCards`

**Implementation:**
- Calculate KPIs from aggregated weekly data
- Display in card grid layout (similar to existing KPI cards)
- Update reactively when filter changes

**KPI Calculations:**
```typescript
interface WeeklyKpis {
  averageWeekly: number
  bestWeek: { amount: number; weekStart: string; weekEnd: string } | null
  worstWeek: { amount: number; weekStart: string; weekEnd: string } | null
}

function calculateWeeklyKpis(weeklyData: WeeklyData[]): WeeklyKpis {
  if (weeklyData.length === 0) {
    return { averageWeekly: 0, bestWeek: null, worstWeek: null }
  }
  
  const total = weeklyData.reduce((sum, w) => sum + w.totalAmount, 0)
  const averageWeekly = total / weeklyData.length
  
  const sorted = [...weeklyData].sort((a, b) => b.totalAmount - a.totalAmount)
  const bestWeek = {
    amount: sorted[0].totalAmount,
    weekStart: sorted[0].weekStart,
    weekEnd: sorted[0].weekEnd,
  }
  const worstWeek = {
    amount: sorted[sorted.length - 1].totalAmount,
    weekStart: sorted[sorted.length - 1].weekStart,
    weekEnd: sorted[sorted.length - 1].weekEnd,
  }
  
  return { averageWeekly, bestWeek, worstWeek }
}
```

**Props:**
```typescript
interface WeeklyKpiCardsProps {
  weeklyData: WeeklyData[]
  type: 'sales' | 'expenses'
}
```

### 5. Weekly Trend Visualization (Requirement 5)

**Component:** `WeeklyTrendChart`

**Implementation:**
- Use Recharts library (already in project dependencies)
- Line chart for trend visualization
- Responsive container with proper axis formatting

**Chart Configuration:**
```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface ChartDataPoint {
  weekLabel: string // "Jan 07"
  amount: number
  weekStart: string // For tooltip
  weekEnd: string // For tooltip
}

function WeeklyTrendChart({ weeklyData }: { weeklyData: WeeklyData[] }) {
  const chartData: ChartDataPoint[] = weeklyData.map(w => ({
    weekLabel: formatWeekLabel(w.weekStart),
    amount: w.totalAmount,
    weekStart: w.weekStart,
    weekEnd: w.weekEnd,
  }))
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="weekLabel" />
        <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
        <Tooltip content={<CustomTooltip />} />
        <Line 
          type="monotone" 
          dataKey="amount" 
          stroke="#3b82f6" 
          strokeWidth={2}
          dot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null
  
  const data = payload[0].payload
  return (
    <div className="bg-white p-3 border rounded shadow-lg">
      <p className="font-semibold">{formatDateRange(data.weekStart, data.weekEnd)}</p>
      <p className="text-lg">${data.amount.toLocaleString()}</p>
    </div>
  )
}

function formatWeekLabel(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start)
  const endDate = new Date(end)
  return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
}
```

### 6. Weekly Data Export (Requirement 6)

**Implementation:**
- Add export button to weekly view
- Generate CSV from aggregated data
- Include all required columns

**Export Function:**
```typescript
function exportWeeklyCsv(
  weeklyData: WeeklyData[],
  type: 'sales' | 'expenses',
  dateFrom: string,
  dateTo: string
) {
  const headers = [
    'Week Start Date',
    'Week End Date',
    'Total Amount',
    'Transaction Count',
    'Change from Previous Week (%)',
  ]
  
  const rows = weeklyData.map(w => [
    w.weekStart,
    w.weekEnd,
    w.totalAmount.toFixed(2),
    w.transactionCount.toString(),
    w.changePercentage !== null ? w.changePercentage.toFixed(1) : 'N/A',
  ])
  
  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')
  
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `weekly-${type}-${dateFrom}-to-${dateTo}.csv`
  a.click()
  window.URL.revokeObjectURL(url)
}
```

### 7. Toggle Between Detail and Weekly Views (Requirement 7)

**Component:** `ViewToggle`

**Implementation:**
- Tabs component for view switching
- Persist selection in component state
- Conditional rendering based on active view

**Component Structure:**
```typescript
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

interface ViewToggleProps {
  transactionsView: React.ReactNode
  weeklyView: React.ReactNode
  defaultView?: 'transactions' | 'weekly'
}

function ViewToggle({ transactionsView, weeklyView, defaultView = 'transactions' }: ViewToggleProps) {
  return (
    <Tabs defaultValue={defaultView} className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="transactions">Transactions</TabsTrigger>
        <TabsTrigger value="weekly">Weekly Summary</TabsTrigger>
      </TabsList>
      
      <TabsContent value="transactions" className="mt-6">
        {transactionsView}
      </TabsContent>
      
      <TabsContent value="weekly" className="mt-6">
        {weeklyView}
      </TabsContent>
    </Tabs>
  )
}
```

### 8. Weekly Net Revenue Calculation (Requirement 8)

**Implementation:**
- Extend weekly aggregation to include expenses data
- Calculate net revenue per week
- Display in weekly summary table with color coding

**Enhanced Aggregation:**
```typescript
interface WeeklyNetRevenueData extends WeeklyData {
  salesTotal: number
  expensesTotal: number
  returnsTotal: number
  netRevenue: number
}

function aggregateWeeklyNetRevenue(
  sales: Array<{ date: string; total_amount: number; expenses_total: number; returns_amount: number }>,
  startDate: Date,
  endDate: Date
): WeeklyNetRevenueData[] {
  const weeks = generateWeekRanges(startDate, endDate)
  const grouped = new Map<string, typeof sales>()
  
  for (const sale of sales) {
    const weekKey = getWeekKey(new Date(sale.date))
    if (!grouped.has(weekKey)) grouped.set(weekKey, [])
    grouped.get(weekKey)!.push(sale)
  }
  
  return weeks.map(week => {
    const weekSales = grouped.get(week.key) ?? []
    const salesTotal = weekSales.reduce((sum, s) => sum + s.total_amount, 0)
    const expensesTotal = weekSales.reduce((sum, s) => sum + (s.expenses_total || 0), 0)
    const returnsTotal = weekSales.reduce((sum, s) => sum + (s.returns_amount || 0), 0)
    const netRevenue = salesTotal - expensesTotal - returnsTotal
    
    return {
      weekStart: week.start,
      weekEnd: week.end,
      totalAmount: salesTotal,
      transactionCount: weekSales.length,
      changeFromPrevious: null, // Calculated in second pass
      changePercentage: null,
      salesTotal,
      expensesTotal,
      returnsTotal,
      netRevenue,
    }
  })
}
```

**Net Revenue KPI:**
```typescript
function calculateAverageNetRevenue(weeklyData: WeeklyNetRevenueData[]): number {
  if (weeklyData.length === 0) return 0
  const total = weeklyData.reduce((sum, w) => sum + w.netRevenue, 0)
  return total / weeklyData.length
}
```

## Page Integration

### Sales Page Enhancement

**File:** `app/admin/sales/page.tsx`

**Changes:**
1. Add state for view mode and weekly filter
2. Integrate `WeeklyFilter` component
3. Add `ViewToggle` with existing table and new weekly view
4. Conditionally render weekly KPI cards when in weekly view
5. Add weekly trend chart above the table in weekly view

**State Management:**
```typescript
const [viewMode, setViewMode] = useState<'transactions' | 'weekly'>('transactions')
const [weeklyFilter, setWeeklyFilter] = useState<WeekOption>('last-4-weeks')
const [weeklyDateRange, setWeeklyDateRange] = useState<{ dateFrom: string; dateTo: string }>()
```

### Expenses Page Enhancement

**File:** `app/admin/expenses/page.tsx`

**Changes:**
- Same structure as sales page
- Use expenses-specific data and labels
- Integrate all weekly components

## Custom Hooks

### `use-weekly-sales.ts`

```typescript
export function useWeeklySales(dateFrom?: string, dateTo?: string) {
  const [weeklyData, setWeeklyData] = useState<WeeklyNetRevenueData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    if (!dateFrom || !dateTo) return
    
    async function fetchAndAggregate() {
      setLoading(true)
      setError(null)
      try {
        const sales = await salesService.listSales({ date_from: dateFrom, date_to: dateTo })
        const aggregated = aggregateWeeklyNetRevenue(
          sales,
          new Date(dateFrom),
          new Date(dateTo)
        )
        setWeeklyData(aggregated)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load weekly data')
      } finally {
        setLoading(false)
      }
    }
    
    fetchAndAggregate()
  }, [dateFrom, dateTo])
  
  return { weeklyData, loading, error }
}
```

### `use-weekly-expenses.ts`

```typescript
export function useWeeklyExpenses(dateFrom?: string, dateTo?: string) {
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    if (!dateFrom || !dateTo) return
    
    async function fetchAndAggregate() {
      setLoading(true)
      setError(null)
      try {
        const expenses = await expensesService.listExpenses({ date_from: dateFrom, date_to: dateTo })
        const aggregated = aggregateByWeek(
          expenses.map(e => ({ date: e.date, amount: e.amount })),
          new Date(dateFrom),
          new Date(dateTo)
        )
        setWeeklyData(aggregated)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load weekly data')
      } finally {
        setLoading(false)
      }
    }
    
    fetchAndAggregate()
  }, [dateFrom, dateTo])
  
  return { weeklyData, loading, error }
}
```

## UI/UX Considerations

### Layout
- Weekly filter placed prominently at the top of the page
- View toggle positioned below filters, above content area
- KPI cards displayed in a responsive grid (2 columns on mobile, 4 on desktop)
- Chart placed above the weekly summary table for better visibility

### Responsive Design
- All components must be mobile-friendly
- Tables should scroll horizontally on small screens
- Charts should maintain aspect ratio and readability
- KPI cards should stack vertically on mobile

### Loading States
- Show skeleton loaders for KPI cards during data fetch
- Display loading spinner in chart area
- Use existing table loading patterns

### Error Handling
- Display error alerts if aggregation fails
- Gracefully handle missing data (show empty states)
- Validate date ranges before processing

## Error Handling

### Data Fetching Errors

**Scenario:** API request fails when fetching sales or expenses data

**Handling:**
- Display error alert with user-friendly message
- Preserve previous data if available
- Provide retry button
- Log error details to console for debugging

**Implementation:**
```typescript
try {
  const data = await salesService.listSales({ date_from: dateFrom, date_to: dateTo })
  setWeeklyData(aggregateWeeklyNetRevenue(data, new Date(dateFrom), new Date(dateTo)))
} catch (err) {
  setError(err instanceof Error ? err.message : 'Failed to load weekly data')
  console.error('Weekly data fetch error:', err)
}
```

### Invalid Date Range

**Scenario:** User provides invalid or malformed date range

**Handling:**
- Validate dates before processing
- Display validation error message
- Prevent aggregation with invalid dates
- Default to safe fallback (e.g., last 4 weeks)

**Validation:**
```typescript
function validateDateRange(dateFrom: string, dateTo: string): boolean {
  const start = new Date(dateFrom)
  const end = new Date(dateTo)
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return false
  }
  
  if (start > end) {
    return false
  }
  
  return true
}
```

### Empty Data Sets

**Scenario:** No transactions exist for the selected period

**Handling:**
- Display empty state message: "No data available for the selected period"
- Show zero values in KPI cards
- Render empty chart with axis labels
- Disable export button when no data

**Empty State Component:**
```typescript
if (weeklyData.length === 0) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <p className="text-muted-foreground">No data available for the selected period</p>
    </div>
  )
}
```

### Division by Zero in Percentage Calculations

**Scenario:** Previous week has zero amount when calculating percentage change

**Handling:**
- Return `null` for percentage when previous amount is 0
- Display "N/A" in UI instead of infinity or error
- Document this behavior in code comments

**Implementation:**
```typescript
const changePercentage = previousAmount !== null && previousAmount !== 0
  ? ((totalAmount - previousAmount) / previousAmount) * 100
  : null
```

### Chart Rendering Failures

**Scenario:** Recharts fails to render due to invalid data or browser issues

**Handling:**
- Wrap chart in error boundary
- Display fallback message: "Unable to display chart"
- Provide option to view data in table format
- Log error for debugging

**Error Boundary:**
```typescript
class ChartErrorBoundary extends React.Component {
  componentDidCatch(error: Error) {
    console.error('Chart rendering error:', error)
  }
  
  render() {
    if (this.state.hasError) {
      return <div>Unable to display chart. Please view data in table format.</div>
    }
    return this.props.children
  }
}
```

### CSV Export Failures

**Scenario:** Browser blocks download or export generation fails

**Handling:**
- Catch export errors and display alert
- Provide alternative: copy data to clipboard
- Log error details
- Ensure no partial downloads

**Implementation:**
```typescript
try {
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  window.URL.revokeObjectURL(url)
} catch (err) {
  console.error('Export failed:', err)
  alert('Failed to export data. Please try again or contact support.')
}
```

### Network Timeout

**Scenario:** API request takes too long to respond

**Handling:**
- Set reasonable timeout (e.g., 30 seconds)
- Display timeout message
- Provide retry option
- Consider implementing request cancellation

### Concurrent Filter Changes

**Scenario:** User rapidly changes filters before previous request completes

**Handling:**
- Cancel previous requests when new filter is applied
- Use AbortController for request cancellation
- Show loading state during transitions
- Ensure only latest request updates state

**Implementation:**
```typescript
useEffect(() => {
  const abortController = new AbortController()
  
  async function fetchData() {
    try {
      const data = await fetch(url, { signal: abortController.signal })
      // Process data
    } catch (err) {
      if (err.name === 'AbortError') {
        // Request was cancelled, ignore
        return
      }
      setError(err.message)
    }
  }
  
  fetchData()
  
  return () => abortController.abort()
}, [dateFrom, dateTo])
```

### Browser Compatibility Issues

**Scenario:** Older browsers don't support required features

**Handling:**
- Use polyfills for Date methods if needed
- Test in major browsers (Chrome, Firefox, Safari, Edge)
- Provide graceful degradation for unsupported features
- Display compatibility warning if critical features unavailable

## Testing Strategy

### Unit Tests
- Test week boundary calculations with various dates
- Test aggregation logic with edge cases (empty weeks, single transaction)
- Test percentage change calculations including division by zero
- Test date formatting functions

### Integration Tests
- Test filter changes trigger correct data updates
- Test view toggle preserves filter state
- Test export generates correct CSV format
- Test KPI calculations with real data structures

### Manual Testing Scenarios
1. Select each weekly filter option and verify date ranges
2. Toggle between views and verify data consistency
3. Export CSV and verify content matches displayed data
4. Test with empty data sets
5. Test with single week of data
6. Test week-over-week calculations across month boundaries
7. Verify responsive behavior on mobile devices

## Performance Considerations

### Optimization Strategies
1. **Memoization**: Use `useMemo` for expensive aggregation calculations
2. **Debouncing**: Debounce filter changes if needed
3. **Lazy Loading**: Load chart library only when weekly view is active
4. **Data Caching**: Cache aggregated results for recently used date ranges

### Example Memoization:
```typescript
const weeklyData = useMemo(() => {
  if (!sales || !dateFrom || !dateTo) return []
  return aggregateWeeklyNetRevenue(sales, new Date(dateFrom), new Date(dateTo))
}, [sales, dateFrom, dateTo])

const kpis = useMemo(() => {
  return calculateWeeklyKpis(weeklyData)
}, [weeklyData])
```

## Dependencies

### Existing Dependencies (No Installation Needed)
- `recharts` - For chart visualization
- `lucide-react` - For icons
- `@/components/ui/*` - Existing UI components (Card, Button, Tabs, etc.)

### New Utility Functions
- Week calculation utilities
- Aggregation functions
- Date formatting helpers

## Migration and Rollout

### Phase 1: Core Components
1. Create utility functions and hooks
2. Build reusable components (WeeklyFilter, ViewToggle)
3. Test components in isolation

### Phase 2: Sales Page Integration
1. Integrate weekly features into sales page
2. Test with production data
3. Gather feedback

### Phase 3: Expenses Page Integration
1. Apply same pattern to expenses page
2. Ensure consistency with sales page
3. Final testing and refinement

### Phase 4: Polish and Optimization
1. Performance optimization
2. Accessibility improvements
3. Documentation updates

## Future Enhancements (Out of Scope)

- Server-side aggregation for better performance with large datasets
- Comparison between different time periods (e.g., this year vs last year)
- Drill-down from weekly view to transaction details
- Customizable week start day (currently fixed to Sunday)
- Weekly email reports
- Advanced filtering (by agent, route, category) in weekly view

## Acceptance Criteria Mapping

| Requirement | Design Component | Implementation File |
|-------------|------------------|---------------------|
| Req 1: Weekly Filters | WeeklyFilter component | `components/admin/weekly-filter.tsx` |
| Req 2: Aggregation | aggregateByWeek function | `lib/weekly-aggregation.ts` |
| Req 3: Comparison | WeeklySummaryTable with change indicators | `components/admin/weekly-summary-table.tsx` |
| Req 4: KPIs | WeeklyKpiCards component | `components/admin/weekly-kpi-cards.tsx` |
| Req 5: Visualization | WeeklyTrendChart component | `components/admin/weekly-trend-chart.tsx` |
| Req 6: Export | exportWeeklyCsv function | Integrated in page components |
| Req 7: View Toggle | ViewToggle component | `components/admin/view-toggle.tsx` |
| Req 8: Net Revenue | aggregateWeeklyNetRevenue function | `lib/weekly-aggregation.ts` |

## Conclusion

This design provides a comprehensive solution for weekly tracking on the admin sales and expenses pages. The implementation leverages existing infrastructure and UI components while adding new, reusable components for weekly-specific functionality. The client-side aggregation approach keeps the solution simple and avoids backend changes, while still providing powerful analytics capabilities for administrators.

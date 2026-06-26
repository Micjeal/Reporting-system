# Admin Reports Page - Design

## Page Structure

```
/admin/reports
├── Page Title & Description
├── Tab Navigation (Sales | Expenses | Inventory)
└── Tab Content
    ├── Filter Controls
    ├── KPI Cards (3-4 cards)
    ├── Charts Section
    │   ├── Trend Chart (line chart)
    │   └── Comparison Chart (bar chart)
    ├── Data Table
    └── Export Button
```

## Component Hierarchy

```
ReportsPage (main component)
├── PageHeader
├── Tabs (shadcn/ui)
│   ├── SalesReportTab
│   │   ├── SalesFilters
│   │   ├── SalesKPICards
│   │   ├── SalesTrendChart
│   │   ├── SalesComparisonChart
│   │   ├── SalesBreakdownTable
│   │   └── ExportButton
│   ├── ExpensesReportTab
│   │   ├── ExpensesFilters
│   │   ├── ExpensesKPICards
│   │   ├── ExpensesTrendChart
│   │   ├── ExpensesComparisonChart
│   │   ├── ExpensesBreakdownTable
│   │   └── ExportButton
│   └── InventoryReportTab
│       ├── InventoryFilters
│       ├── InventoryKPICards
│       ├── InventoryTrendChart
│       ├── InventoryBreakdownTable
│       └── ExportButton
```

## Sales Report Tab

### KPI Cards (4 cards)
1. **Total Sales** - Sum of all sales amounts
   - Icon: DollarSign
   - Change: % change from previous month
   
2. **Sales Count** - Number of sales transactions
   - Icon: ShoppingCart
   - Change: % change from previous month

3. **Average Sale Value** - Total sales / count
   - Icon: TrendingUp
   - Change: % change from previous month

4. **Top Agent** - Agent with highest sales
   - Icon: User
   - Value: Agent name + total amount

### Filters
- **Date Range:** From date, To date (defaults to last 30 days)
- **Agent:** Dropdown with all agents + "All Agents"
- **Product:** Dropdown with all products + "All Products"
- **Reset Button:** Clear all filters

### Charts
1. **Sales Trend Chart** (Line Chart)
   - X-axis: Date (daily)
   - Y-axis: Sales amount
   - Period: Last 30 days
   - Shows trend over time

2. **Sales Comparison Chart** (Bar Chart)
   - Compares current period vs previous period
   - Shows: Total Sales, Sales Count, Average Value
   - Color coding: Current (blue), Previous (gray)

### Data Table
- **Columns:** Agent Name, Product Name, Quantity, Amount, Date
- **Sorting:** By date (descending)
- **Pagination:** 10 rows per page
- **Total Row:** Sum of amounts for current page

### Export
- **Button:** "Export Sales Report"
- **Format:** CSV
- **Filename:** `sales-report-YYYY-MM-DD.csv`
- **Includes:** All filtered data

---

## Expenses Report Tab

### KPI Cards (4 cards)
1. **Total Expenses** - Sum of all expense amounts
   - Icon: ShoppingCart
   - Change: % change from previous month

2. **Expense Count** - Number of expense records
   - Icon: FileText
   - Change: % change from previous month

3. **Average Expense** - Total expenses / count
   - Icon: TrendingDown
   - Change: % change from previous month

4. **Top Category** - Category with highest expenses
   - Icon: Tag
   - Value: Category name + total amount

### Filters
- **Date Range:** From date, To date (defaults to last 30 days)
- **Category:** Dropdown with all categories + "All Categories"
- **Reset Button:** Clear all filters

### Charts
1. **Expenses Trend Chart** (Line Chart)
   - X-axis: Date (daily)
   - Y-axis: Expense amount
   - Period: Last 30 days
   - Shows trend over time

2. **Expenses Comparison Chart** (Bar Chart)
   - Compares current period vs previous period
   - Shows: Total Expenses, Expense Count, Average Expense
   - Color coding: Current (blue), Previous (gray)

### Data Table
- **Columns:** Category, Amount, Date, Description
- **Sorting:** By date (descending)
- **Pagination:** 10 rows per page
- **Total Row:** Sum of amounts for current page

### Export
- **Button:** "Export Expenses Report"
- **Format:** CSV
- **Filename:** `expenses-report-YYYY-MM-DD.csv`
- **Includes:** All filtered data

---

## Inventory Report Tab

### KPI Cards (4 cards)
1. **Total Units** - Sum of all inventory quantities
   - Icon: Package
   - Change: % change from previous month

2. **Total Categories** - Count of unique categories
   - Icon: Grid
   - Value: Number of categories

3. **Most Issued Item** - Item with highest quantity issued
   - Icon: TrendingUp
   - Value: Item name + quantity

4. **Inventory Value** - Estimated total value (quantity × estimated unit price)
   - Icon: DollarSign
   - Value: Formatted currency

### Filters
- **Category:** Dropdown with all categories + "All Categories"
- **Sort By:** Dropdown (Quantity, Category, Recently Added)
- **Reset Button:** Clear all filters

### Charts
1. **Inventory Trend Chart** (Line Chart)
   - X-axis: Date (daily)
   - Y-axis: Total units
   - Period: Last 30 days
   - Shows inventory movement over time

2. **Category Breakdown Chart** (Pie/Doughnut Chart)
   - Shows distribution of inventory by category
   - Includes legend with percentages

### Data Table
- **Columns:** Item Name, Category, Quantity, Status, Last Updated
- **Sorting:** By quantity (descending)
- **Pagination:** 10 rows per page
- **Status:** Color-coded badge (In Stock, Low Stock, Out of Stock)

### Export
- **Button:** "Export Inventory Report"
- **Format:** CSV
- **Filename:** `inventory-report-YYYY-MM-DD.csv`
- **Includes:** All filtered data

---

## Visual Design

### Color Scheme
- **Positive Change:** Green (#10b981)
- **Negative Change:** Red (#ef4444)
- **Neutral:** Gray (#6b7280)
- **Current Period:** Blue (#3b82f6)
- **Previous Period:** Gray (#d1d5db)

### Typography
- **Page Title:** 3xl, bold
- **Section Headers:** 2xl, bold
- **Card Titles:** sm, medium
- **Card Values:** 2xl, bold
- **Table Headers:** sm, medium, muted
- **Table Data:** sm, regular

### Spacing
- **Page Padding:** 24px
- **Section Gap:** 24px
- **Card Gap:** 16px
- **Chart Height:** 300px
- **Table Row Height:** 48px

### Responsive Breakpoints
- **Mobile (< 640px):** Single column layout, stacked cards
- **Tablet (640px - 1024px):** 2-column grid for cards
- **Desktop (> 1024px):** 4-column grid for cards, 2-column for charts

---

## Data Transformation

### Sales Report Calculations
```typescript
// Period comparison
const currentPeriodSales = sales.filter(s => 
  new Date(s.date) >= currentPeriodStart && 
  new Date(s.date) <= currentPeriodEnd
)
const previousPeriodSales = sales.filter(s => 
  new Date(s.date) >= previousPeriodStart && 
  new Date(s.date) <= previousPeriodEnd
)

// Trend data (daily aggregation)
const trendData = aggregateSalesByDay(filteredSales)

// Top agents
const topAgents = getTopAgents(filteredSales, 5)

// Top products
const topProducts = getTopProducts(filteredSales, 5)
```

### Expenses Report Calculations
```typescript
// Similar to sales but with expense data
// Group by category instead of agent/product
// Calculate category totals and percentages
```

### Inventory Report Calculations
```typescript
// Inventory by category
const inventoryByCategory = groupInventoryByCategory(inventory)

// Most issued items
const mostIssuedItems = sortByQuantity(inventory, 'desc').slice(0, 10)

// Inventory value (estimated)
const totalValue = inventory.reduce((sum, item) => 
  sum + (item.quantity_issued * estimatedUnitPrice), 0
)
```

---

## State Management

### Local State
```typescript
// Tab selection
const [activeTab, setActiveTab] = useState('sales')

// Sales filters
const [salesDateFrom, setSalesDateFrom] = useState(thirtyDaysAgo)
const [salesDateTo, setSalesDateTo] = useState(today)
const [selectedAgent, setSelectedAgent] = useState('all')
const [selectedProduct, setSelectedProduct] = useState('all')

// Expenses filters
const [expensesDateFrom, setExpensesDateFrom] = useState(thirtyDaysAgo)
const [expensesDateTo, setExpensesDateTo] = useState(today)
const [selectedCategory, setSelectedCategory] = useState('all')

// Inventory filters
const [inventoryCategory, setInventoryCategory] = useState('all')
const [inventorySortBy, setInventorySortBy] = useState('quantity')

// Data loading
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)
```

### Memoized Computations
```typescript
// Filtered data
const filteredSales = useMemo(() => { /* ... */ }, [sales, filters])
const filteredExpenses = useMemo(() => { /* ... */ }, [expenses, filters])
const filteredInventory = useMemo(() => { /* ... */ }, [inventory, filters])

// Aggregated data
const salesTrendData = useMemo(() => { /* ... */ }, [filteredSales])
const expensesTrendData = useMemo(() => { /* ... */ }, [filteredExpenses])

// Comparison data
const salesComparison = useMemo(() => { /* ... */ }, [sales])
const expensesComparison = useMemo(() => { /* ... */ }, [expenses])
```

---

## Error Handling

### Loading States
- Show skeleton loaders for KPI cards
- Show skeleton loaders for charts
- Show skeleton loaders for tables

### Error States
- Display error message if data fetch fails
- Show retry button
- Gracefully handle missing data

### Empty States
- Display "No data available" if filters result in empty dataset
- Suggest clearing filters
- Show default message if no data exists

---

## Performance Considerations

### Optimization Strategies
1. **Memoization:** Use useMemo for expensive calculations
2. **Lookup Maps:** Create O(1) lookup maps for agent/product/category names
3. **Lazy Loading:** Load charts only when tab is active
4. **Pagination:** Limit table rows to 10 per page
5. **Debouncing:** Debounce filter changes to reduce re-renders

### Bundle Size
- Use existing chart library (recharts or similar)
- Avoid importing unused components
- Tree-shake unused utilities

---

## Accessibility

### ARIA Labels
- Add aria-label to all interactive elements
- Add aria-describedby to form inputs
- Add role="tablist" to tab navigation

### Keyboard Navigation
- Tab through all interactive elements
- Enter/Space to activate buttons
- Arrow keys to navigate tabs

### Color Contrast
- Ensure all text meets WCAG AA standards
- Use patterns in addition to colors for status indicators
- Provide text alternatives for color-coded information

### Screen Readers
- Describe chart data in text format
- Provide table summaries
- Announce loading/error states

/**
 * Expense Tracking Integration
 * Handles calculation and tracking of expenses related to sales
 */

export interface ExpenseBreakdown {
  fuel: number
  feeding: number
  accommodation: number
  airtime: number
  parking: number
  other: number
  total: number
}

export interface SaleExpenseMetrics {
  totalSales: number
  totalExpenses: number
  totalTokens: number
  totalReturns: number
  netRevenue: number
  expenseRatio: number // expenses as % of sales
  profitMargin: number // net revenue as % of sales
}

/**
 * Parse expense notes to extract expense breakdown
 * Looks for patterns like "fuel: 100, feeding: 50" in notes
 */
export function parseExpenseNotes(notes: string | null | undefined): ExpenseBreakdown {
  const breakdown: ExpenseBreakdown = {
    fuel: 0,
    feeding: 0,
    accommodation: 0,
    airtime: 0,
    parking: 0,
    other: 0,
    total: 0,
  }

  if (!notes) return breakdown

  const categories = ['fuel', 'feeding', 'accommodation', 'airtime', 'parking', 'other']
  const lowerNotes = notes.toLowerCase()

  categories.forEach((category) => {
    // Look for patterns like "fuel: 100" or "fuel 100"
    const regex = new RegExp(`${category}[:\\s]+([\\d.]+)`, 'gi')
    const match = regex.exec(lowerNotes)
    if (match) {
      breakdown[category as keyof ExpenseBreakdown] = parseFloat(match[1])
    }
  })

  breakdown.total = Object.values(breakdown).slice(0, -1).reduce((sum, val) => sum + val, 0)
  return breakdown
}

/**
 * Calculate sales metrics including expenses
 */
export function calculateSaleMetrics(
  totalSales: number,
  totalExpenses: number,
  totalTokens: number = 0,
  totalReturns: number = 0
): SaleExpenseMetrics {
  const netRevenue = totalSales - totalExpenses - totalTokens - totalReturns

  return {
    totalSales,
    totalExpenses,
    totalTokens,
    totalReturns,
    netRevenue,
    expenseRatio: totalSales > 0 ? (totalExpenses / totalSales) * 100 : 0,
    profitMargin: totalSales > 0 ? (netRevenue / totalSales) * 100 : 0,
  }
}

/**
 * Group sales by route and calculate metrics for each route
 */
export function groupSalesByRoute(
  sales: Array<{
    route?: string | null
    amount: number
    expenses_total?: number | null
    tokens_deducted?: number | null
    returns_amount?: number | null
  }>
) {
  const routeMetrics: Record<
    string,
    {
      count: number
      totalSales: number
      totalExpenses: number
      totalTokens: number
      totalReturns: number
      metrics: SaleExpenseMetrics
    }
  > = {}

  sales.forEach((sale) => {
    const route = sale.route || 'Unassigned'
    if (!routeMetrics[route]) {
      routeMetrics[route] = {
        count: 0,
        totalSales: 0,
        totalExpenses: 0,
        totalTokens: 0,
        totalReturns: 0,
        metrics: calculateSaleMetrics(0, 0, 0, 0),
      }
    }

    routeMetrics[route].count += 1
    routeMetrics[route].totalSales += sale.amount
    routeMetrics[route].totalExpenses += sale.expenses_total || 0
    routeMetrics[route].totalTokens += sale.tokens_deducted || 0
    routeMetrics[route].totalReturns += sale.returns_amount || 0
  })

  // Calculate metrics for each route
  Object.keys(routeMetrics).forEach((route) => {
    const data = routeMetrics[route]
    data.metrics = calculateSaleMetrics(data.totalSales, data.totalExpenses, data.totalTokens, data.totalReturns)
  })

  return routeMetrics
}

/**
 * Generate expense summary for a period
 */
export function generateExpenseSummary(
  sales: Array<{
    date: string
    amount: number
    expenses_total?: number | null
    tokens_deducted?: number | null
    returns_amount?: number | null
    notes?: string | null
  }>
) {
  const summary = {
    period: {
      start: sales.length > 0 ? sales[sales.length - 1].date : new Date().toISOString(),
      end: sales.length > 0 ? sales[0].date : new Date().toISOString(),
    },
    totalSales: 0,
    totalExpenses: 0,
    totalTokens: 0,
    totalReturns: 0,
    expenseBreakdown: {
      fuel: 0,
      feeding: 0,
      accommodation: 0,
      airtime: 0,
      parking: 0,
      other: 0,
    },
    dailyMetrics: [] as Array<{
      date: string
      sales: number
      expenses: number
      netRevenue: number
    }>,
  }

  const dailyData: Record<string, { sales: number; expenses: number }> = {}

  sales.forEach((sale) => {
    summary.totalSales += sale.amount
    summary.totalExpenses += sale.expenses_total || 0
    summary.totalTokens += sale.tokens_deducted || 0
    summary.totalReturns += sale.returns_amount || 0

    // Parse expense breakdown from notes
    const breakdown = parseExpenseNotes(sale.notes)
    Object.keys(breakdown).forEach((key) => {
      if (key !== 'total') {
        summary.expenseBreakdown[key as keyof typeof summary.expenseBreakdown] += breakdown[key as keyof ExpenseBreakdown]
      }
    })

    // Daily metrics
    if (!dailyData[sale.date]) {
      dailyData[sale.date] = { sales: 0, expenses: 0 }
    }
    dailyData[sale.date].sales += sale.amount
    dailyData[sale.date].expenses += sale.expenses_total || 0
  })

  // Convert daily data to array
  summary.dailyMetrics = Object.entries(dailyData)
    .map(([date, data]) => ({
      date,
      sales: data.sales,
      expenses: data.expenses,
      netRevenue: data.sales - data.expenses,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return summary
}

/**
 * Calculate expense efficiency metrics
 */
export function calculateEfficiency(metrics: SaleExpenseMetrics) {
  return {
    expensePerSale: metrics.totalSales > 0 ? metrics.totalExpenses / (metrics.totalSales / 100) : 0,
    revenuePerExpense: metrics.totalExpenses > 0 ? metrics.totalSales / metrics.totalExpenses : 0,
    profitPerExpense: metrics.totalExpenses > 0 ? metrics.netRevenue / metrics.totalExpenses : 0,
  }
}

'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { AlertCircle, Download, DollarSign, Receipt, TrendingDown, Tag } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { listExpenses } from '@/services/expenses.service'
import { listAgents } from '@/services/agents.service'
import type { Expense, Agent } from '@/types'

interface ExpenseTrendData {
  expense_date: string
  daily_total: number
  expense_count: number
}

interface TopCategory {
  category: string
  total_expenses: number
  expense_count: number
}

interface ComparisonData {
  metric: string
  current: number
  previous: number
}

function KPICard({ 
  title, 
  value, 
  icon: Icon, 
  change,
  changeType
}: { 
  title: string
  value: string | number
  icon: React.ComponentType<any>
  change?: number
  changeType?: 'positive' | 'negative' | 'neutral'
}) {
  const changeColor = changeType === 'positive' ? 'text-green-600' : changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
  const changeBgColor = changeType === 'positive' ? 'bg-green-50' : changeType === 'negative' ? 'bg-red-50' : 'bg-gray-50'

  return (
    <Card className="relative overflow-hidden transition-all hover:shadow-lg hover:scale-105">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide truncate">{title}</CardTitle>
        <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
          <Icon className="h-4 w-4 text-orange-600" />
        </div>
      </CardHeader>
      <CardContent className="relative z-10 space-y-1">
        <div className="text-lg sm:text-xl font-bold text-gray-900 truncate">{value}</div>
        {change !== undefined && (
          <div className={`text-xs font-medium ${changeColor}`}>
            {change > 0 ? '+' : ''}{change.toFixed(1)}% vs last month
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function ExpensesReportTab() {
  // Currency formatting helper
  const formatCurrency = (amount: number | string) =>
    new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX' }).format(Number(amount))

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [trends, setTrends] = useState<ExpenseTrendData[]>([])
  const [topCategories, setTopCategories] = useState<TopCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter states
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Create lookup map for agents
  const agentMap = useMemo(() => {
    const map = new Map<string, Agent>()
    agents.forEach(agent => map.set(agent.id, agent))
    return map
  }, [agents])

  // Get unique categories from expenses
  const categories = useMemo(() => {
    const cats = new Set<string>()
    expenses.forEach(exp => {
      if (exp.category) cats.add(exp.category)
    })
    return Array.from(cats).sort()
  }, [expenses])

  // Initialize date range (last 30 days)
  useEffect(() => {
    const today = new Date()
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    setDateTo(today.toISOString().split('T')[0])
    setDateFrom(thirtyDaysAgo.toISOString().split('T')[0])
  }, [])

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch expenses data and agents
        const [expensesData, agentsData] = await Promise.all([
          listExpenses({
            date_from: dateFrom,
            date_to: dateTo,
          }),
          listAgents(),
        ])

        // Fetch trends
        const trendsRes = await fetch('/api/analytics/expense-categories?days=30')
        if (!trendsRes.ok) throw new Error('Failed to fetch expense trends')
        const trendsData = await trendsRes.json()

        setExpenses(expensesData)
        setAgents(agentsData)
        setTrends(trendsData.data || [])
        
        // Calculate top categories
        const categoryMap = new Map<string, { total: number; count: number }>()
        expensesData.forEach(exp => {
          const cat = exp.category || 'Uncategorized'
          const existing = categoryMap.get(cat) || { total: 0, count: 0 }
          categoryMap.set(cat, {
            total: existing.total + exp.amount,
            count: existing.count + 1
          })
        })
        
        const topCats = Array.from(categoryMap.entries())
          .map(([category, data]) => ({
            category,
            total_expenses: data.total,
            expense_count: data.count
          }))
          .sort((a, b) => b.total_expenses - a.total_expenses)
          .slice(0, 5)
        
        setTopCategories(topCats)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load expenses data')
      } finally {
        setLoading(false)
      }
    }

    if (dateFrom && dateTo) {
      fetchData()
    }
  }, [dateFrom, dateTo])

  // Filter expenses data
  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      if (selectedCategory !== 'all' && (expense.category || 'Uncategorized') !== selectedCategory) return false
      return true
    })
  }, [expenses, selectedCategory])

  // Pagination
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage)
  const paginatedExpenses = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredExpenses.slice(start, start + itemsPerPage)
  }, [filteredExpenses, currentPage])

  // Calculate KPI data with period comparison
  const kpiData = useMemo(() => {
    if (!dateTo) return {
      totalExpenses: 0,
      totalChange: 0,
      expenseCount: 0,
      countChange: 0,
      averageExpense: 0,
      avgChange: 0,
      topCategory: null,
    }

    const today = new Date(dateTo + 'T00:00:00')
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const previousMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const previousMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)

    const currentMonthStr = currentMonthStart.toISOString().split('T')[0]
    const previousMonthStartStr = previousMonthStart.toISOString().split('T')[0]
    const previousMonthEndStr = previousMonthEnd.toISOString().split('T')[0]

    // Current period
    const currentExpenses = expenses.filter(e => e.date >= currentMonthStr)
    const currentTotal = currentExpenses.reduce((sum, e) => sum + e.amount, 0)
    const currentCount = currentExpenses.length
    const currentAvg = currentCount > 0 ? currentTotal / currentCount : 0

    // Previous period
    const previousExpenses = expenses.filter(e => e.date >= previousMonthStartStr && e.date <= previousMonthEndStr)
    const previousTotal = previousExpenses.reduce((sum, e) => sum + e.amount, 0)
    const previousCount = previousExpenses.length
    const previousAvg = previousCount > 0 ? previousTotal / previousCount : 0

    // Calculate percentage changes
    const totalChange = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0
    const countChange = previousCount > 0 ? ((currentCount - previousCount) / previousCount) * 100 : 0
    const avgChange = previousAvg > 0 ? ((currentAvg - previousAvg) / previousAvg) * 100 : 0

    // Top category
    const topCategory = topCategories[0] || null

    return {
      totalExpenses: currentTotal,
      totalChange,
      expenseCount: currentCount,
      countChange,
      averageExpense: currentAvg,
      avgChange,
      topCategory,
    }
  }, [expenses, topCategories, dateTo])

  // Comparison data for bar chart
  const comparisonData = useMemo(() => {
    if (!dateTo) return []

    const today = new Date(dateTo + 'T00:00:00')
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const previousMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const previousMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)

    const currentMonthStr = currentMonthStart.toISOString().split('T')[0]
    const previousMonthStartStr = previousMonthStart.toISOString().split('T')[0]
    const previousMonthEndStr = previousMonthEnd.toISOString().split('T')[0]

    const currentExpenses = expenses.filter(e => e.date >= currentMonthStr)
    const previousExpenses = expenses.filter(e => e.date >= previousMonthStartStr && e.date <= previousMonthEndStr)

    const currentTotal = currentExpenses.reduce((sum, e) => sum + e.amount, 0)
    const currentCount = currentExpenses.length
    const currentAvg = currentCount > 0 ? currentTotal / currentCount : 0

    const previousTotal = previousExpenses.reduce((sum, e) => sum + e.amount, 0)
    const previousCount = previousExpenses.length
    const previousAvg = previousCount > 0 ? previousTotal / previousCount : 0

    return [
      {
        metric: 'Total Expenses',
        current: Math.round(currentTotal),
        previous: Math.round(previousTotal),
      },
      {
        metric: 'Expense Count',
        current: currentCount,
        previous: previousCount,
      },
      {
        metric: 'Avg Expense',
        current: Math.round(currentAvg),
        previous: Math.round(previousAvg),
      },
    ]
  }, [expenses, dateTo])

  const handleExport = useCallback(() => {
    if (filteredExpenses.length === 0) return

    const csv = [
      ['Agent Name', 'Category', 'Description', 'Amount', 'Date'],
      ...filteredExpenses.map(expense => {
        const agent = agentMap.get(expense.agent_id)
        return [
          agent?.name || 'Unknown',
          expense.category || 'Uncategorized',
          expense.description || '',
          expense.amount,
          expense.date,
        ]
      })
    ]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `expenses-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }, [filteredExpenses, agentMap])

  const handleResetFilters = useCallback(() => {
    setSelectedCategory('all')
    setCurrentPage(1)
  }, [])

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards - Responsive Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Expenses"
          value={formatCurrency(kpiData.totalExpenses)}
          icon={DollarSign}
          change={kpiData.totalChange}
          changeType={kpiData.totalChange > 0 ? 'negative' : kpiData.totalChange < 0 ? 'positive' : 'neutral'}
        />
        <KPICard
          title="Expense Count"
          value={kpiData.expenseCount}
          icon={Receipt}
          change={kpiData.countChange}
          changeType={kpiData.countChange > 0 ? 'negative' : kpiData.countChange < 0 ? 'positive' : 'neutral'}
        />
        <KPICard
          title="Average Expense"
          value={formatCurrency(kpiData.averageExpense)}
          icon={TrendingDown}
          change={kpiData.avgChange}
          changeType={kpiData.avgChange > 0 ? 'negative' : kpiData.avgChange < 0 ? 'positive' : 'neutral'}
        />
        <KPICard
          title="Top Category"
          value={kpiData.topCategory?.category || 'N/A'}
          icon={Tag}
          change={undefined}
        />
      </div>

      {/* Filters Section */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {/* Date From */}
            <div className="space-y-2">
              <label className="text-sm font-medium">From Date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <label className="text-sm font-medium">To Date</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Button */}
            <div className="flex items-end col-span-1 sm:col-span-2 lg:col-span-4">
              <Button
                onClick={handleResetFilters}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Reset Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Section - Responsive Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Expenses Trend Chart */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Expenses Trend</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Last 30 days trend</CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            {loading ? (
              <div className="h-64 sm:h-80 flex items-center justify-center text-muted-foreground bg-gray-50">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-2" />
                  <p className="text-sm">Loading chart...</p>
                </div>
              </div>
            ) : trends.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trends} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="expense_date" 
                    tick={{ fontSize: 12 }}
                    stroke="#9ca3af"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke="#9ca3af"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="daily_total" 
                    stroke="#f97316" 
                    name="Daily Expenses"
                    strokeWidth={2}
                    dot={{ fill: '#f97316', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 sm:h-80 flex items-center justify-center text-muted-foreground bg-gray-50">
                <p className="text-sm">No trend data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expenses Comparison Chart */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Period Comparison</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Current vs previous month</CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            {loading ? (
              <div className="h-64 sm:h-80 flex items-center justify-center text-muted-foreground bg-gray-50">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-2" />
                  <p className="text-sm">Loading chart...</p>
                </div>
              </div>
            ) : comparisonData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparisonData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="metric" 
                    tick={{ fontSize: 12 }}
                    stroke="#9ca3af"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke="#9ca3af"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="current" fill="#f97316" name="Current Month" />
                  <Bar dataKey="previous" fill="#d1d5db" name="Previous Month" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 sm:h-80 flex items-center justify-center text-muted-foreground bg-gray-50">
                <p className="text-sm">No comparison data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Expenses Breakdown Table */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
          <div>
            <CardTitle className="text-base sm:text-lg">Expenses Breakdown</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Showing {paginatedExpenses.length} of {filteredExpenses.length} expenses
            </CardDescription>
          </div>
          <Button 
            onClick={handleExport} 
            size="sm" 
            variant="outline"
            className="w-full sm:w-auto"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground bg-gray-50">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-2" />
                <p className="text-sm">Loading data...</p>
              </div>
            </div>
          ) : paginatedExpenses.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Agent Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 hidden sm:table-cell">Description</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedExpenses.map((expense, idx) => {
                      const agent = agentMap.get(expense.agent_id)
                      return (
                        <tr 
                          key={expense.id} 
                          className={`border-b border-gray-100 transition-colors hover:bg-orange-50 ${
                            idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900 truncate">
                              {agent?.name || 'Unknown'}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900 truncate">
                              {expense.category || 'Uncategorized'}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600 hidden sm:table-cell truncate">
                            {expense.description || '-'}
                          </td>
                          <td className="text-right py-3 px-4 font-semibold text-gray-900">
                            {formatCurrency(expense.amount)}
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {expense.date}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      size="sm"
                      variant="outline"
                    >
                      Previous
                    </Button>
                    <Button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      size="sm"
                      variant="outline"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground bg-gray-50">
              <p className="text-sm">No expenses data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

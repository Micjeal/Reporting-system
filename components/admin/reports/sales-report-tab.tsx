'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { AlertCircle, Download, DollarSign, ShoppingCart, TrendingUp, User } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { listSales } from '@/services/sales.service'
import { listAgents } from '@/services/agents.service'
import { listProducts } from '@/services/products.service'
import type { Sale, Agent, Product } from '@/types'

interface SalesTrendData {
  sale_date: string
  daily_total: number
  sale_count: number
}

interface TopAgent {
  agent_id: string
  agent_name: string
  region: string
  phone: string
  total_sales: number
  sale_count: number
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
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide truncate">{title}</CardTitle>
        <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
          <Icon className="h-4 w-4 text-blue-600" />
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

export function SalesReportTab() {
  // Helpers to handle both legacy (amount/date) and new (total_amount/sale_date) field names
  const saleAmount = (s: Sale) => s.total_amount ?? s.amount ?? 0
  const saleDate = (s: Sale) => s.sale_date ?? s.date ?? ''

  // Currency formatting helper
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX' }).format(amount)

  const [sales, setSales] = useState<Sale[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [trends, setTrends] = useState<SalesTrendData[]>([])
  const [topAgents, setTopAgents] = useState<TopAgent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter states
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [selectedAgent, setSelectedAgent] = useState('all')
  const [selectedProduct, setSelectedProduct] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

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

        // Fetch sales data
        const salesData = await listSales({
          date_from: dateFrom,
          date_to: dateTo,
        })

        // Fetch agents and products
        const [agentsData, productsData] = await Promise.all([
          listAgents(),
          listProducts(),
        ])

        // Fetch trends
        const trendsRes = await fetch('/api/analytics/sales-trends?days=30')
        if (!trendsRes.ok) throw new Error('Failed to fetch sales trends')
        const trendsData = await trendsRes.json()

        // Fetch top agents
        const topAgentsRes = await fetch('/api/analytics/top-agents?days=30')
        if (!topAgentsRes.ok) throw new Error('Failed to fetch top agents')
        const topAgentsData = await topAgentsRes.json()

        setSales(salesData)
        setAgents(agentsData)
        setProducts(productsData)
        setTrends(trendsData.data || [])
        setTopAgents(topAgentsData.data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load sales data')
      } finally {
        setLoading(false)
      }
    }

    if (dateFrom && dateTo) {
      fetchData()
    }
  }, [dateFrom, dateTo])

  // Create lookup maps for O(1) performance
  const agentMap = useMemo(() => {
    const map = new Map<string, Agent>()
    agents.forEach(agent => map.set(agent.id, agent))
    return map
  }, [agents])

  const productMap = useMemo(() => {
    const map = new Map<string, Product>()
    products.forEach(product => map.set(product.id, product))
    return map
  }, [products])

  // Filter sales data
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      if (selectedAgent !== 'all' && sale.agent_id !== selectedAgent) return false
      if (selectedProduct !== 'all' && sale.product_id !== selectedProduct) return false
      return true
    })
  }, [sales, selectedAgent, selectedProduct])

  // Pagination
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage)
  const paginatedSales = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredSales.slice(start, start + itemsPerPage)
  }, [filteredSales, currentPage])

  // Calculate KPI data with period comparison
  const kpiData = useMemo(() => {
    if (!dateTo) return {
      totalSales: 0,
      totalChange: 0,
      salesCount: 0,
      countChange: 0,
      averageValue: 0,
      avgChange: 0,
      topAgent: null,
    }

    const today = new Date(dateTo + 'T00:00:00')
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const previousMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const previousMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)

    const currentMonthStr = currentMonthStart.toISOString().split('T')[0]
    const previousMonthStartStr = previousMonthStart.toISOString().split('T')[0]
    const previousMonthEndStr = previousMonthEnd.toISOString().split('T')[0]

    // Current period
    const currentSales = sales.filter(s => saleDate(s) >= currentMonthStr)
    const currentTotal = currentSales.reduce((sum, s) => sum + saleAmount(s), 0)
    const currentCount = currentSales.length
    const currentAvg = currentCount > 0 ? currentTotal / currentCount : 0

    // Previous period
    const previousSales = sales.filter(s => saleDate(s) >= previousMonthStartStr && saleDate(s) <= previousMonthEndStr)
    const previousTotal = previousSales.reduce((sum, s) => sum + saleAmount(s), 0)
    const previousCount = previousSales.length
    const previousAvg = previousCount > 0 ? previousTotal / previousCount : 0

    // Calculate percentage changes
    const totalChange = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0
    const countChange = previousCount > 0 ? ((currentCount - previousCount) / previousCount) * 100 : 0
    const avgChange = previousAvg > 0 ? ((currentAvg - previousAvg) / previousAvg) * 100 : 0

    // Top agent
    const topAgent = topAgents[0] || null

    return {
      totalSales: currentTotal,
      totalChange,
      salesCount: currentCount,
      countChange,
      averageValue: currentAvg,
      avgChange,
      topAgent,
    }
  }, [sales, topAgents, dateTo])

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

    const currentSales = sales.filter(s => saleDate(s) >= currentMonthStr)
    const previousSales = sales.filter(s => saleDate(s) >= previousMonthStartStr && saleDate(s) <= previousMonthEndStr)

    const currentTotal = currentSales.reduce((sum, s) => sum + saleAmount(s), 0)
    const currentCount = currentSales.length
    const currentAvg = currentCount > 0 ? currentTotal / currentCount : 0

    const previousTotal = previousSales.reduce((sum, s) => sum + saleAmount(s), 0)
    const previousCount = previousSales.length
    const previousAvg = previousCount > 0 ? previousTotal / previousCount : 0

    return [
      {
        metric: 'Total Sales',
        current: Math.round(currentTotal),
        previous: Math.round(previousTotal),
      },
      {
        metric: 'Sales Count',
        current: currentCount,
        previous: previousCount,
      },
      {
        metric: 'Avg Value',
        current: Math.round(currentAvg),
        previous: Math.round(previousAvg),
      },
    ]
  }, [sales, dateTo])

  const handleExport = useCallback(() => {
    if (filteredSales.length === 0) return

    const csv = [
      ['Agent Name', 'Product Name', 'Quantity', 'Amount', 'Date'],
      ...filteredSales.map(sale => {
        const agent = agentMap.get(sale.agent_id)
        const product = sale.product_id ? productMap.get(sale.product_id) : null
        return [
          agent?.name || 'Unknown',
          product?.name || 'Unknown',
          sale.quantity ?? (sale.items?.reduce((s, i) => s + i.quantity, 0) ?? 0),
          sale.total_amount ?? sale.amount ?? 0,
          sale.sale_date ?? sale.date,
        ]
      })
    ]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sales-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }, [filteredSales, agentMap, productMap])

  const handleResetFilters = useCallback(() => {
    setSelectedAgent('all')
    setSelectedProduct('all')
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
          title="Total Sales"
          value={formatCurrency(kpiData.totalSales)}
          icon={DollarSign}
          change={kpiData.totalChange}
          changeType={kpiData.totalChange > 0 ? 'positive' : kpiData.totalChange < 0 ? 'negative' : 'neutral'}
        />
        <KPICard
          title="Sales Count"
          value={kpiData.salesCount}
          icon={ShoppingCart}
          change={kpiData.countChange}
          changeType={kpiData.countChange > 0 ? 'positive' : kpiData.countChange < 0 ? 'negative' : 'neutral'}
        />
        <KPICard
          title="Average Value"
          value={formatCurrency(kpiData.averageValue)}
          icon={TrendingUp}
          change={kpiData.avgChange}
          changeType={kpiData.avgChange > 0 ? 'positive' : kpiData.avgChange < 0 ? 'negative' : 'neutral'}
        />
        <KPICard
          title="Top Agent"
          value={kpiData.topAgent?.agent_name || 'N/A'}
          icon={User}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Agent Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Agent</label>
              <select
                value={selectedAgent}
                onChange={(e) => {
                  setSelectedAgent(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Agents</option>
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Product Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Product</label>
              <select
                value={selectedProduct}
                onChange={(e) => {
                  setSelectedProduct(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Products</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name}
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
        {/* Sales Trend Chart */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Sales Trend</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Last 30 days trend</CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            {loading ? (
              <div className="h-64 sm:h-80 flex items-center justify-center text-muted-foreground bg-gray-50">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
                  <p className="text-sm">Loading chart...</p>
                </div>
              </div>
            ) : trends.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trends} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="sale_date" 
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
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="daily_total" 
                    stroke="#3b82f6" 
                    name="Daily Sales"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
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

        {/* Sales Comparison Chart */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Period Comparison</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Current vs previous month</CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            {loading ? (
              <div className="h-64 sm:h-80 flex items-center justify-center text-muted-foreground bg-gray-50">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
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
                  <Bar dataKey="current" fill="#3b82f6" name="Current Month" />
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

      {/* Sales Breakdown Table */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
          <div>
            <CardTitle className="text-base sm:text-lg">Sales Breakdown</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Showing {paginatedSales.length} of {filteredSales.length} sales
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
                <p className="text-sm">Loading data...</p>
              </div>
            </div>
          ) : paginatedSales.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Agent Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 hidden sm:table-cell">Product Name</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Quantity</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedSales.map((sale, idx) => {
                      const agent = agentMap.get(sale.agent_id)
                      // For multi-product sales, show the first product or aggregate
                      const firstProduct = sale.items && sale.items.length > 0 ? sale.items[0].product_name : null
                      const totalQuantity = sale.quantity ?? (sale.items?.reduce((s, i) => s + (i.quantity ?? 0), 0) ?? 0)
                      return (
                        <tr 
                          key={sale.id} 
                          className={`border-b border-gray-100 transition-colors hover:bg-blue-50 ${
                            idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900 truncate">{agent?.name || 'Unknown'}</div>
                          </td>
                          <td className="py-3 px-4 text-gray-600 truncate">
                            {firstProduct || 'Unknown'}
                          </td>
                          <td className="text-right py-3 px-4 font-semibold text-gray-900">
                            {totalQuantity}
                          </td>
                          <td className="text-right py-3 px-4 font-semibold text-gray-900">
                            {formatCurrency(Number(sale.total_amount ?? sale.amount ?? 0))}
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {sale.sale_date ?? sale.date ?? ''}
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
              <p className="text-sm">No sales data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

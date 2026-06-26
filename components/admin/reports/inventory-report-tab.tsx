'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { AlertCircle, Download, TrendingUp, DollarSign, Package, Grid } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface InventoryTrendData {
  date: string
  total_units: number
  item_count: number
}

interface InventoryBreakdownItem {
  product: string
  issued: number
  sold: number
}

interface ProductCategory {
  product: string
  total_units: number
}

function KPICard({ 
  title, 
  value, 
  icon: Icon, 
  subtitle
}: { 
  title: string
  value: string | number
  icon: React.ComponentType<any>
  subtitle?: string
}) {
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
        {subtitle && (
          <div className="text-xs text-gray-600 truncate">{subtitle}</div>
        )}
      </CardContent>
    </Card>
  )
}

export function InventoryReportTab() {
  // Currency formatting helper
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX' }).format(amount)

  const [inventory, setInventory] = useState<InventoryBreakdownItem[]>([])
  const [trends, setTrends] = useState<InventoryTrendData[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState('all')
  const [sortBy, setSortBy] = useState<'quantity' | 'recently-added'>('quantity')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const [inventoryRes, trendsRes, categoriesRes] = await Promise.all([
          fetch('/api/analytics/inventory-utilization'),
          fetch('/api/analytics/inventory-trends?days=30'),
          fetch('/api/analytics/inventory-categories'),
        ])

        if (!inventoryRes.ok || !trendsRes.ok || !categoriesRes.ok) {
          throw new Error('Failed to fetch inventory data')
        }

        const inventoryData = await inventoryRes.json()
        const trendsData = await trendsRes.json()
        const categoriesData = await categoriesRes.json()

        setInventory(inventoryData.data || [])
        setTrends(trendsData.data || [])
        setCategories(categoriesData.data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load inventory data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filter and sort inventory data
  const filteredInventory = useMemo(() => {
    let filtered = [...inventory]

    if (selectedProduct !== 'all') {
      filtered = filtered.filter(item => item.product === selectedProduct)
    }

    if (sortBy === 'quantity') {
      filtered.sort((a, b) => b.issued - a.issued)
    }

    return filtered
  }, [inventory, selectedProduct, sortBy])

  // Pagination
  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage)
  const paginatedInventory = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredInventory.slice(start, start + itemsPerPage)
  }, [filteredInventory, currentPage])

  // KPI calculations
  const kpiData = useMemo(() => {
    const totalUnits = inventory.reduce((sum, i) => sum + i.issued, 0)
    const uniqueProducts = new Set(inventory.map(i => i.product)).size
    const mostIssued = inventory[0] || null

    // Estimate inventory value (assuming average unit price of 100)
    const estimatedUnitPrice = 100
    const inventoryValue = totalUnits * estimatedUnitPrice

    return {
      totalUnits,
      categories: uniqueProducts,
      mostIssued,
      inventoryValue,
    }
  }, [inventory])

  // Category breakdown for pie chart
  const categoryBreakdown = useMemo(() => {
    return categories.slice(0, 5).map(cat => ({
      name: cat.product,
      value: cat.total_units,
    }))
  }, [categories])

  const handleExport = useCallback(() => {
    if (filteredInventory.length === 0) return

    const csv = [
      ['Product', 'Units Issued', 'Units Sold', 'Utilization %'],
      ...filteredInventory.map(i => {
        const utilization = i.issued > 0 ? Math.round((i.sold / i.issued) * 100) : 0
        return [i.product, i.issued, i.sold, utilization + '%']
      })
    ]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inventory-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }, [filteredInventory])

  const handleResetFilters = useCallback(() => {
    setSelectedProduct('all')
    setSortBy('quantity')
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
          title="Total Units"
          value={kpiData.totalUnits}
          icon={Package}
        />
        <KPICard
          title="Total Categories"
          value={kpiData.categories}
          icon={Grid}
        />
        <KPICard
          title="Most Issued Item"
          value={kpiData.mostIssued?.product || 'N/A'}
          subtitle={kpiData.mostIssued ? `${kpiData.mostIssued.issued} units` : undefined}
          icon={TrendingUp}
        />
        <KPICard
          title="Inventory Value"
          value={formatCurrency(kpiData.inventoryValue)}
          icon={DollarSign}
        />
      </div>

      {/* Filters Section */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
                {inventory.map(item => (
                  <option key={item.product} value={item.product}>
                    {item.product}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as 'quantity' | 'recently-added')
                  setCurrentPage(1)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="quantity">Quantity (High to Low)</option>
                <option value="recently-added">Recently Added</option>
              </select>
            </div>

            {/* Reset Button */}
            <div className="flex items-end">
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
        {/* Inventory Trend Chart */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Inventory Trend</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Last 30 days movement</CardDescription>
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
                    dataKey="date" 
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
                  <Line 
                    type="monotone" 
                    dataKey="total_units" 
                    stroke="#3b82f6" 
                    name="Total Units"
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

        {/* Category Breakdown Chart */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Category Breakdown</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Top 5 products by units</CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            {loading ? (
              <div className="h-64 sm:h-80 flex items-center justify-center text-muted-foreground bg-gray-50">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
                  <p className="text-sm">Loading chart...</p>
                </div>
              </div>
            ) : categoryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {categoryBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 sm:h-80 flex items-center justify-center text-muted-foreground bg-gray-50">
                <p className="text-sm">No category data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Inventory Breakdown Table */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
          <div>
            <CardTitle className="text-base sm:text-lg">Inventory Breakdown</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Showing {paginatedInventory.length} of {filteredInventory.length} items
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
          ) : paginatedInventory.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Product</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Units Issued</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700 hidden sm:table-cell">Units Sold</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Utilization %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedInventory.map((item, idx) => {
                      const utilization = item.issued > 0 ? Math.round((item.sold / item.issued) * 100) : 0
                      return (
                        <tr 
                          key={item.product} 
                          className={`border-b border-gray-100 transition-colors hover:bg-blue-50 ${
                            idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900 truncate">{item.product}</div>
                          </td>
                          <td className="text-right py-3 px-4 font-semibold text-gray-900">
                            {item.issued}
                          </td>
                          <td className="text-right py-3 px-4 text-gray-600 hidden sm:table-cell">
                            {item.sold}
                          </td>
                          <td className="text-right py-3 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              utilization >= 80 ? 'bg-green-100 text-green-800' :
                              utilization >= 50 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {utilization}%
                            </span>
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
              <p className="text-sm">No inventory data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

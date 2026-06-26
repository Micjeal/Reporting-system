'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Download, Search } from 'lucide-react'
import * as salesService from '@/services/sales.service'
import type { Sale } from '@/lib/types-index'

export default function AdminSalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRoute, setFilterRoute] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    fetchSales()
  }, [dateFrom, dateTo])

  const fetchSales = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await salesService.listSales({
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      })
      setSales(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sales')
    } finally {
      setLoading(false)
    }
  }

  const filteredSales = useMemo(() => {
    return (sales || []).filter((sale) => {
      const matchesSearch =
        !searchTerm ||
        sale.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.customer_phone?.includes(searchTerm) ||
        sale.location?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesRoute = filterRoute === 'all' || sale.route === filterRoute

      return matchesSearch && matchesRoute
    })
  }, [sales, searchTerm, filterRoute])

  const routes = useMemo(() => {
    const uniqueRoutes = new Set(sales.map((s) => s.route).filter(Boolean))
    return Array.from(uniqueRoutes).sort()
  }, [sales])

  const stats = useMemo(() => {
    const filtered = filteredSales
    return {
      totalSales: filtered.reduce((sum, s) => sum + (s.total_amount ?? s.amount ?? 0), 0),
      totalExpenses: filtered.reduce((sum, s) => sum + (s.expenses_total || 0), 0),
      totalReturns: filtered.reduce((sum, s) => sum + (s.returns_amount || 0), 0),
      count: filtered.length,
    }
  }, [filteredSales])

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX' }).format(amount)

  const handleExport = () => {
    const csv = [
      ['Date', 'Agent', 'Customer', 'Phone', 'Location', 'Route', 'Quantity', 'Amount', 'Expenses', 'Tokens', 'Returns', 'Bank Details', 'Notes'],
      ...filteredSales.map((s) => {
        const tokens = s.tokens_deducted as number | undefined;
        const returns = s.returns_amount as number | undefined;
        const amount = (typeof (s.total_amount ?? s.amount) === 'number') ? Number(s.total_amount ?? s.amount) : 0;
        const expenses = (typeof s.expenses_total === 'number') ? Number(s.expenses_total) : 0;
        const agentName = (s as any).agents?.name || '-';
        return [
          s.date,
          agentName,
          s.customer_name || '-',
          s.customer_phone || '-',
          s.location || '-',
          s.route || '-',
          s.quantity || 0,
          formatCurrency(amount),
          formatCurrency(expenses),
          typeof tokens === 'number' && isFinite(tokens) ? tokens.toFixed(2) : '0.00',
          typeof returns === 'number' && isFinite(returns) ? formatCurrency(returns) : 'UGX 0',
          s.bank_details || '-',
          s.notes || '-',
        ];
      }),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sales-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sales Management</h1>
        <p className="text-muted-foreground mt-2">View and manage all sales transactions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalSales)}</div>
            <p className="text-xs text-muted-foreground">{stats.count} transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">Route expenses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalReturns)}</div>
            <p className="text-xs text-muted-foreground">Refunds & returns</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Net Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalSales - stats.totalExpenses - stats.totalReturns)}</div>
            <p className="text-xs text-muted-foreground">After expenses & returns</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="text-sm font-medium">Search</label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Customer name, phone, location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Route</label>
              <Select value={filterRoute} onValueChange={setFilterRoute}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Routes</SelectItem>
                  {routes.map((route) => (
                    <SelectItem key={route} value={route || 'unassigned'}>
                      {route || 'Unassigned'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">From Date</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">To Date</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <Button onClick={handleExport} variant="outline" className="w-full md:w-auto">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </CardContent>
      </Card>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Transactions</CardTitle>
          <CardDescription>{filteredSales.length} sales found</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading sales...</p>
              </div>
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">No sales found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted border-b sticky top-0">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold whitespace-nowrap">Date</th>
                    <th className="text-left py-3 px-4 font-semibold whitespace-nowrap">Agent</th>
                    <th className="text-left py-3 px-4 font-semibold whitespace-nowrap">Customer</th>
                    <th className="text-left py-3 px-4 font-semibold whitespace-nowrap">Phone</th>
                    <th className="text-left py-3 px-4 font-semibold whitespace-nowrap">Location</th>
                    <th className="text-left py-3 px-4 font-semibold whitespace-nowrap">Route</th>
                    <th className="text-right py-3 px-4 font-semibold whitespace-nowrap">Qty</th>
                    <th className="text-right py-3 px-4 font-semibold whitespace-nowrap">Amount</th>
                    <th className="text-right py-3 px-4 font-semibold whitespace-nowrap">Expenses</th>
                    <th className="text-right py-3 px-4 font-semibold whitespace-nowrap">Tokens</th>
                    <th className="text-right py-3 px-4 font-semibold whitespace-nowrap">Returns</th>
                    <th className="text-left py-3 px-4 font-semibold whitespace-nowrap">Bank Details</th>
                    <th className="text-left py-3 px-4 font-semibold whitespace-nowrap">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map((sale, idx) => (
                    <tr
                      key={sale.id}
                      className={`border-b transition-colors hover:bg-muted/50 ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-muted/30'
                      }`}
                    >
                      <td className="py-3 px-4 whitespace-nowrap">{sale.date ? new Date(sale.date).toLocaleDateString() : (sale.sale_date ?? '-')}</td>
                      <td className="py-3 px-4 font-medium whitespace-nowrap">
                        <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs font-medium">
                          {(sale as any).agents?.name || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium whitespace-nowrap">{sale.customer_name || '-'}</td>
                      <td className="py-3 px-4 text-xs whitespace-nowrap">{sale.customer_phone || '-'}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{sale.location || '-'}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                          {sale.route || 'N/A'}
                        </span>
                      </td>
                      <td className="text-right py-3 px-4 whitespace-nowrap">{sale.quantity || 0}</td>
                      <td className="text-right py-3 px-4 font-semibold whitespace-nowrap">
                        ${(() => {
                          const amount = (typeof (sale.total_amount ?? sale.amount) === 'number') ? Number(sale.total_amount ?? sale.amount) : 0;
                          return formatCurrency(amount);
                        })()}
                      </td>
                      <td className="text-right py-3 px-4 text-orange-600 whitespace-nowrap">
                        ${(() => {
                          const expenses = (typeof sale.expenses_total === 'number') ? Number(sale.expenses_total) : 0;
                          return formatCurrency(expenses);
                        })()}
                      </td>
                      <td className="text-right py-3 px-4 text-purple-600 whitespace-nowrap">
                        {(() => {
                          const tokens = sale.tokens_deducted;
                          return typeof tokens === 'number' ? tokens.toFixed(2) : '0.00';
                        })()}
                      </td>
                      <td className="text-right py-3 px-4 text-red-600 whitespace-nowrap">
                        {(() => {
                          const returns = sale.returns_amount;
                          return typeof returns === 'number' ? formatCurrency(returns) : 'UGX 0';
                        })()}
                      </td>
                      <td className="py-3 px-4 text-xs whitespace-nowrap max-w-xs truncate" title={sale.bank_details || ''}>
                        {sale.bank_details || '-'}
                      </td>
                      <td className="py-3 px-4 text-xs whitespace-nowrap max-w-xs truncate" title={sale.notes || ''}>
                        {sale.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

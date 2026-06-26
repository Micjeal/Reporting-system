'use client'

import { useState, useEffect, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import * as salesService from '@/services/sales.service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Package, DollarSign, TrendingUp, ChevronDown, Calendar as CalendarIcon, FileText } from 'lucide-react'
import type { Sale } from '@/types'

export default function AgentSalesPage() {
  const router = useRouter()
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [initialLoad, setInitialLoad] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Currency formatting helper
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX' }).format(amount)

  useEffect(() => {
    fetchSales()
  }, [])

  const fetchSales = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await salesService.listSales()
      setSales(data || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load sales'
      setError(message)
      if (message.includes('401') || message.includes('Unauthorized')) {
        router.push('/login')
      }
    } finally {
      setLoading(false)
      setInitialLoad(false)
    }
  }

  const filteredSales = sales.filter(sale => {
    const matchesSearch = searchQuery === '' ||
      sale.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.payment_method?.toLowerCase().includes(searchQuery.toLowerCase())
    const saleDate = sale.sale_date ?? ''
    const matchesDateFrom = dateFrom === '' || saleDate >= dateFrom
    const matchesDateTo = dateTo === '' || saleDate <= dateTo
    return matchesSearch && matchesDateFrom && matchesDateTo
  })

  const totalAmount = filteredSales.reduce((sum, s) => sum + (s.total_amount ?? 0), 0)
  const totalTransactions = filteredSales.length
  const averageSale = totalTransactions > 0 ? (totalAmount / totalTransactions).toFixed(2) : '0.00'

  const paginatedSales = filteredSales.slice((page - 1) * pageSize, page * pageSize)
  const totalPages = Math.ceil(filteredSales.length / pageSize)

  const getPaymentBadgeVariant = (method: string) => {
    const normalized = method?.toLowerCase() || ''
    if (normalized.includes('cash')) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
    if (normalized.includes('card')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    if (normalized.includes('mobile')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
    return 'bg-muted text-muted-foreground'
  }

  if (initialLoad && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading sales data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/20 pb-20 lg:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">My Sales</h1>
            <p className="text-base text-muted-foreground">Monitor and manage your sales transactions</p>
          </div>
          <Button onClick={() => router.push('/agent/sales/new')} className="shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            New Sale
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card className="shadow-sm border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(totalAmount)}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Transactions</CardTitle>
              <div className="h-8 w-8 rounded-md bg-blue-500/10 flex items-center justify-center">
                <Package className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {totalTransactions}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average Sale</CardTitle>
              <div className="h-8 w-8 rounded-md bg-orange-500/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(parseFloat(averageSale))}
              </div>
            </CardContent>
          </Card>

          <Card 
            className="shadow-sm border-border/60 border-dashed hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer flex flex-col items-center justify-center text-center p-6 group"
            onClick={() => router.push('/agent/sales/new')}
          >
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Plus className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-base font-medium text-foreground">Create New Sale</CardTitle>
            <CardDescription className="mt-1">Record a new transaction</CardDescription>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="space-y-4">
          
          {/* Filters Toolbar */}
          <Card className="shadow-sm border-border/60">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search customers or payment methods..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-full bg-background/50"
                  />
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
                  <div className="flex items-center gap-2 w-full sm:w-auto text-sm text-muted-foreground">
                    <CalendarIcon className="h-4 w-4 hidden sm:block" />
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full sm:w-36 bg-background/50 h-9"
                    />
                    <span>-</span>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full sm:w-36 bg-background/50 h-9"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sales Table */}
          <Card className="shadow-sm border-border/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border/60">
                    <th className="w-12 px-4 py-3 text-left"></th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Customer</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Payment Method</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Items</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mb-3"></div>
                          Loading transactions...
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-destructive">
                        {error}
                      </td>
                    </tr>
                  ) : filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-16 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                            <FileText className="h-6 w-6" />
                          </div>
                          <p className="text-base font-medium text-foreground mb-1">No sales found</p>
                          <p className="text-sm">We couldn't find any transactions matching your filters.</p>
                          {(searchQuery || dateFrom || dateTo) && (
                            <Button 
                              variant="link" 
                              onClick={() => { setSearchQuery(''); setDateFrom(''); setDateTo(''); }}
                              className="mt-2"
                            >
                              Clear filters
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedSales.map((sale) => (
                      <Fragment key={sale.id}>
                        <tr
                          className={`border-b border-border/40 transition-colors hover:bg-muted/30 cursor-pointer ${expandedId === sale.id ? 'bg-muted/10' : 'bg-background'}`}
                          onClick={() => setExpandedId(expandedId === sale.id ? null : sale.id)}
                        >
                          <td className="px-4 py-4 text-center">
                            <div className="flex items-center justify-center w-6 h-6 rounded-md hover:bg-muted/50 transition-colors">
                              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${expandedId === sale.id ? 'rotate-180' : ''}`} />
                            </div>
                          </td>
                          <td className="px-4 py-4 font-medium text-foreground">
                            {sale.customer_name || 'Walk-in Customer'}
                          </td>
                          <td className="px-4 py-4 text-muted-foreground">
                            {sale.sale_date || '—'}
                          </td>
                          <td className="px-4 py-4">
                            <Badge variant="secondary" className={`border-0 capitalize ${getPaymentBadgeVariant(sale.payment_method || '')}`}>
                              {sale.payment_method?.replace('_', ' ') || 'Unknown'}
                            </Badge>
                          </td>
                          <td className="px-4 py-4 text-muted-foreground">
                            {sale.items?.length ?? 0} item(s)
                          </td>
                          <td className="px-4 py-4 text-right font-semibold text-foreground">
                            {formatCurrency(sale.total_amount ?? 0)}
                          </td>
                        </tr>
                        
                        {/* Expanded Inner Table */}
                        {expandedId === sale.id && sale.items && sale.items.length > 0 && (
                          <tr className="bg-muted/5 border-b border-border/60">
                            <td colSpan={6} className="px-0 py-0">
                              <div className="px-12 py-4 shadow-inner">
                                <div className="rounded-lg border border-border/50 bg-background overflow-hidden">
                                  <table className="w-full text-sm">
                                    <thead className="bg-muted/30">
                                      <tr>
                                        <th className="text-left px-4 py-2 font-medium text-muted-foreground">Product</th>
                                        <th className="text-center px-4 py-2 font-medium text-muted-foreground w-24">Qty</th>
                                        <th className="text-right px-4 py-2 font-medium text-muted-foreground w-32">Unit Price</th>
                                        <th className="text-right px-4 py-2 font-medium text-muted-foreground w-32">Line Total</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/40">
                                      {sale.items.map((item, i) => (
                                        <tr key={i} className="hover:bg-muted/20">
                                          <td className="px-4 py-2 text-foreground font-medium">
                                            {(item as { product_name?: string | null }).product_name ?? item.product_id}
                                          </td>
                                          <td className="px-4 py-2 text-center text-muted-foreground">
                                            {item.quantity}
                                          </td>
                                          <td className="px-4 py-2 text-right text-muted-foreground">
                                            {formatCurrency(item.unit_price ?? 0)}
                                          </td>
                                          <td className="px-4 py-2 text-right font-medium">
                                            {formatCurrency((item.line_total ?? item.quantity * item.unit_price) ?? 0)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination footer */}
            {!loading && totalPages > 0 && (
              <div className="px-4 py-3 border-t border-border/60 flex items-center justify-between bg-muted/10">
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-medium text-foreground">{(page - 1) * pageSize + 1}</span> to <span className="font-medium text-foreground">{Math.min(page * pageSize, filteredSales.length)}</span> of <span className="font-medium text-foreground">{filteredSales.length}</span> results
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPage(p => Math.max(1, p - 1))} 
                    disabled={page === 1}
                    className="h-8 shadow-sm"
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                    disabled={page === totalPages}
                    className="h-8 shadow-sm"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
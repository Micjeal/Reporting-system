'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import * as salesService from '@/services/sales.service'
import * as productsService from '@/services/products.service'
import type { Sale } from '@/lib/types-index'

interface SaleWithProduct extends Sale {
  productName: string
}

export function RecentSalesList() {
  const [sales, setSales] = useState<SaleWithProduct[]>([])
  const [loading, setLoading] = useState(true)

  // Currency formatting helper
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX' }).format(amount)

  useEffect(() => {
    async function fetchRecentSales() {
      try {
        const [salesData, products] = await Promise.all([
          salesService.listSales(),
          productsService.listProducts(),
        ])

        const productMap = new Map(products?.map(p => [p.id, p.name]) || [])

        const recentSales = (salesData ?? [])
          .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
          .slice(0, 5)
          .map(sale => {
            // For multi-product sales, get the first product name from items
            let productName = 'Unknown Product'
            if (sale.product_id) {
              // Legacy single-product sale
              productName = productMap.get(sale.product_id) || 'Unknown Product'
            } else if (sale.items && sale.items.length > 0) {
              // Multi-product sale - use first item's product name
              const firstItem = sale.items[0]
              productName = firstItem.product_name || productMap.get(String(firstItem.product_id)) || 'Unknown Product'
            }
            
            return {
              ...sale,
              productName,
            }
          })

        setSales(recentSales)
      } catch (error) {
        console.error('Failed to fetch recent sales:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentSales()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
      case 'pending':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
    } else if (diffDays === 1) {
      return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            Loading...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">Recent Sales</CardTitle>
          <span className="text-sm text-muted-foreground">
            {sales.length} transaction{sales.length !== 1 && 's'}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {sales.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            No recent sales
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-muted-foreground">Product</TableHead>
                  <TableHead className="text-right font-semibold text-muted-foreground">Qty</TableHead>
                  <TableHead className="text-right font-semibold text-muted-foreground">Amount</TableHead>
                  <TableHead className="text-right font-semibold text-muted-foreground">Date</TableHead>
                  <TableHead className="text-right font-semibold text-muted-foreground">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow 
                    key={sale.id} 
                    className="hover:bg-accent/50 transition-colors group"
                  >
                    <TableCell className="font-medium text-foreground group-hover:text-primary transition-colors">
                      {sale.productName}
                    </TableCell>
                    <TableCell className="text-right text-foreground">
                      {sale.quantity || (sale.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-foreground group-hover:text-primary transition-colors">
                      {formatCurrency(sale.total_amount || sale.amount || 0)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatDate(sale.created_at || '')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className={getStatusColor(sale.status || 'completed')}>
                        {(sale.status || 'completed').charAt(0).toUpperCase() + (sale.status || 'completed').slice(1)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

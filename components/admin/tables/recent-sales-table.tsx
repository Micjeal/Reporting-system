'use client'

import { useState, useEffect } from 'react'
import { Eye, Edit2, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import * as salesService from '@/services/sales.service'
import * as usersService from '@/services/users.service'
import * as productsService from '@/services/products.service'
import type { Sale } from '@/lib/types-index'

interface SaleWithDetails extends Sale {
  agentName: string
  productName: string
}

export function RecentSalesTable() {
  const [salesData, setSalesData] = useState<SaleWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  // Currency formatting helper
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX' }).format(amount)

  useEffect(() => {
    async function fetchRecentSales() {
      try {
        const [sales, users, products] = await Promise.all([
          salesService.listSales(),
          usersService.listUsers(),
          productsService.listProducts(),
        ])

        // Create lookup maps
        const userMap = new Map(users?.map(u => [u.id, u.name || u.email]) || [])
        const productMap = new Map(products?.map(p => [p.id, p.name]) || [])

        // Get last 5 sales with details
        const recentSales = (sales ?? [])
          .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
          .slice(0, 5)
          .map(sale => {
            // For multi-product sales, get the first product name from items
            let productName = 'Unknown'
            if (sale.product_id) {
              // Legacy single-product sale
              productName = productMap.get(sale.product_id) || 'Unknown'
            } else if (sale.items && sale.items.length > 0) {
              // Multi-product sale - use first item's product name
              const firstItem = sale.items[0]
              productName = firstItem.product_name || productMap.get(String(firstItem.product_id)) || 'Unknown'
            }
            
            return {
              ...sale,
              agentName: userMap.get(sale.agent_id) || 'Unknown',
              productName,
            }
          })

        setSalesData(recentSales)
      } catch (error) {
        console.error('Failed to fetch recent sales:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentSales()
  }, [])

  if (loading) {
    return (
      <Card className="min-w-0 overflow-hidden">
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Loading...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader>
        <CardTitle>Recent Sales</CardTitle>
      </CardHeader>
      <CardContent className="min-w-0 px-0 sm:px-6">
        <div className="w-full min-w-0 overflow-x-auto">
          <Table className="min-w-[680px]">
            <TableHeader>
              <TableRow>
                <TableHead>Sale ID</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salesData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No recent sales found
                  </TableCell>
                </TableRow>
              ) : (
                salesData.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium text-primary">
                      {String(sale.id).slice(0, 8).toUpperCase()}
                    </TableCell>
                    <TableCell>{sale.agentName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{sale.productName}</TableCell>
                    <TableCell>{sale.quantity || (sale.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0)} units</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(sale.total_amount || sale.amount || 0)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(sale.sale_date || sale.date || '').toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon-sm" title="View">
                          <Eye className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" title="Edit">
                          <Edit2 className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" title="Delete">
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

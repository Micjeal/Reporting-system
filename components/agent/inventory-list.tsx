'use client'

import { useState, useEffect } from 'react'
import { Package, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import * as inventoryService from '@/services/inventory.service'
import * as productsService from '@/services/products.service'
import * as agentsService from '@/services/agents.service'
import type { InventoryItem } from '@/lib/domain/inventory'

interface InventoryItemWithProduct extends InventoryItem {
  productName: string
  unitPrice: number
}

const REORDER_LEVEL = 5

const getStatusColor = (quantity: number) => {
  if (quantity === 0) return 'text-red-600 dark:text-red-400'
  if (quantity <= REORDER_LEVEL) return 'text-amber-600 dark:text-amber-400'
  return 'text-emerald-600 dark:text-emerald-400'
}

const getStatusLabel = (quantity: number) => {
  if (quantity === 0) return 'Out of Stock'
  if (quantity <= REORDER_LEVEL) return 'Low Stock'
  return 'In Stock'
}

export function InventoryList() {
  const [items, setItems] = useState<InventoryItemWithProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [agentId, setAgentId] = useState<string>('')

  useEffect(() => {
    async function fetchAgentInfo() {
      try {
        const agent = await agentsService.getCurrentAgent()
        if (agent) {
          setAgentId(agent.id || '')
        }
      } catch (error) {
        console.error('Failed to fetch agent info:', error)
      }
    }

    fetchAgentInfo()
  }, [])

  useEffect(() => {
    async function fetchInventory() {
      try {
        const [inventory, products] = await Promise.all([
          inventoryService.listInventory(),
          productsService.listProducts(),
        ])

        const productMap = new Map(products?.map(p => [p.id, { name: p.name, price: p.unit_price }]) || [])

        // Group inventory by product_id to show total quantity per product
        const groupedInventory = new Map<string, InventoryItemWithProduct>()
        ;(inventory ?? [])
          .filter(item => String(item.agent_id) === String(agentId))
          .forEach(item => {
            const existing = groupedInventory.get(item.product_id)
            const productName = productMap.get(item.product_id)?.name || 'Unknown Product'
            const unitPrice = productMap.get(item.product_id)?.price || 0

            if (existing) {
              // Sum quantities for same product
              existing.quantity_issued += item.quantity_issued
            } else {
              groupedInventory.set(item.product_id, {
                ...item,
                productName,
                unitPrice,
              })
            }
          })

        const itemsWithProducts = Array.from(groupedInventory.values())
          .sort((a, b) => a.quantity_issued - b.quantity_issued)

        setItems(itemsWithProducts)
      } catch (error) {
        console.error('Failed to fetch inventory:', error)
        setItems([])
      } finally {
        setLoading(false)
      }
    }

    if (agentId) {
      fetchInventory()
    }
  }, [agentId])

  const criticalItems = items.filter(item => item.quantity_issued === 0)
  const lowStockItems = items.filter(item => item.quantity_issued > 0 && item.quantity_issued <= REORDER_LEVEL)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Assigned Inventory</CardTitle>
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
    <div className="space-y-4 animate-fade-in">
      {(criticalItems.length > 0 || lowStockItems.length > 0) && (
        <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950 animate-fade-in">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            {criticalItems.length > 0 && (
              <>
                <strong>{criticalItems.length}</strong> item(s) out of stock.{' '}
              </>
            )}
            {lowStockItems.length > 0 && (
              <>
                <strong>{lowStockItems.length}</strong> item(s) low on stock.
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-xl font-semibold">Assigned Inventory</CardTitle>
          <Button variant="outline" size="sm" asChild className="text-sm">
            <a href="/agent/inventory">View All</a>
          </Button>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              No inventory assigned
            </div>
          ) : (
            <div className="space-y-4">
              {items.slice(0, 5).map((item) => {
                const maxCapacity = REORDER_LEVEL * 3
                const stockPercentage = Math.min((item.quantity_issued / maxCapacity) * 100, 100)

                return (
                  <div
                    key={item.id}
                    className="border border-border rounded-xl p-5 hover:bg-accent/30 hover:border-primary/30 transition-all duration-300 group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`p-3 rounded-xl bg-blue-100 dark:bg-blue-900 mt-1 group-hover:scale-110 transition-transform duration-300`}>
                          <Package size={20} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">{item.productName}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Issued: {new Date(item.date_issued).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-3xl font-bold ${getStatusColor(item.quantity_issued)}`}>
                          {item.quantity_issued}
                        </p>
                        <p className={`text-xs font-semibold ${getStatusColor(item.quantity_issued)}`}>
                          {getStatusLabel(item.quantity_issued)}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Reorder Level: {REORDER_LEVEL}</span>
                        <span className="text-muted-foreground">{Math.round(stockPercentage)}% capacity</span>
                      </div>
                      <Progress 
                        value={stockPercentage} 
                        className="h-3"
                        indicatorClassName={getStatusColor(item.quantity_issued).replace('text-', 'bg-')}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Package, Plus, AlertCircle, Send, Clock, CheckCircle, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import * as inventoryService from '@/services/inventory.service'
import * as productsService from '@/services/products.service'
import * as agentsService from '@/services/agents.service'
import { toast } from 'sonner'
import type { InventoryRequest } from '@/services/inventory.service'

interface InventoryItemWithProduct {
  id: string
  product_id: string
  quantity_issued: number
  date_issued: string
  productName: string
  unitPrice: number
}

const REORDER_LEVEL = 5

const getStatusColor = (quantity: number) => {
  if (quantity === 0) return 'text-red-600'
  if (quantity <= REORDER_LEVEL) return 'text-amber-600'
  return 'text-emerald-600'
}

const getStatusLabel = (quantity: number) => {
  if (quantity === 0) return 'Out of Stock'
  if (quantity <= REORDER_LEVEL) return 'Low Stock'
  return 'In Stock'
}

export default function AgentInventoryPage() {
  const [items, setItems] = useState<InventoryItemWithProduct[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [agentId, setAgentId] = useState<string>('')
  const [agentName, setAgentName] = useState<string>('')
  
  // Request form state
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [requestProduct, setRequestProduct] = useState<string>('')
  const [requestQuantity, setRequestQuantity] = useState<string>('')
  const [requestReason, setRequestReason] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  // Request history state
  const [requests, setRequests] = useState<InventoryRequest[]>([])
  const [loadingRequests, setLoadingRequests] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    async function fetchAgentInfo() {
      try {
        const agent = await agentsService.getCurrentAgent()
        if (agent) {
          setAgentId(agent.id || '')
          setAgentName(agent.name || 'Agent')
        }
      } catch (error) {
        console.error('Failed to fetch agent info:', error)
      }
    }

    fetchAgentInfo()
  }, [])

  useEffect(() => {
    async function fetchRequests() {
      try {
        const data = await inventoryService.listInventoryRequests()
        setRequests(data || [])
      } catch (error) {
        console.error('Failed to fetch requests:', error)
      } finally {
        setLoadingRequests(false)
      }
    }

    fetchRequests()
  }, [])

  const filteredRequests = statusFilter === 'all' 
    ? requests 
    : requests.filter(r => r.status === statusFilter)

  useEffect(() => {
    async function fetchData() {
      try {
        const [inventory, productsData] = await Promise.all([
          inventoryService.listInventory(),
          productsService.listProducts(),
        ])

        const productMap = new Map(productsData?.map(p => [p.id, { name: p.name, price: p.unit_price }]) || [])
        setProducts(productsData || [])

        // Group inventory by product_id
        const groupedInventory = new Map<string, InventoryItemWithProduct>()
        ;(inventory ?? [])
          .filter(item => String(item.agent_id) === String(agentId))
          .forEach(item => {
            const existing = groupedInventory.get(item.product_id)
            const productName = productMap.get(item.product_id)?.name || 'Unknown Product'
            const unitPrice = productMap.get(item.product_id)?.price || 0

            if (existing) {
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
        console.error('Failed to fetch data:', error)
        setItems([])
      } finally {
        setLoading(false)
      }
    }

    if (agentId) {
      fetchData()
    }
  }, [agentId])

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!requestProduct || !requestQuantity || !requestReason) {
      toast.error('Please fill in all fields')
      return
    }

    setSubmitting(true)
    try {
      await inventoryService.createInventoryRequest({
        product_id: requestProduct,
        quantity_requested: parseInt(requestQuantity, 10),
        reason: requestReason,
      })
      
      toast.success('Inventory request submitted successfully')
      setShowRequestForm(false)
      setRequestProduct('')
      setRequestQuantity('')
      setRequestReason('')
    } catch (error) {
      toast.error('Failed to submit request')
      console.error('Request error:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const criticalItems = items.filter(item => item.quantity_issued === 0)
  const lowStockItems = items.filter(item => item.quantity_issued > 0 && item.quantity_issued <= REORDER_LEVEL)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
          <p className="text-muted-foreground">Loading inventory...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
        <p className="text-muted-foreground mt-2">View your assigned inventory and request more stock</p>
      </div>

      {/* Alert for low stock */}
      {(criticalItems.length > 0 || lowStockItems.length > 0) && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <AlertDescription className="text-amber-800">
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
            {' '}Request more inventory below.
          </AlertDescription>
        </Alert>
      )}

      {/* Request Form */}
      {showRequestForm && (
        <Card className="border-primary/50 shadow-lg">
          <CardHeader>
            <CardTitle>Request More Inventory</CardTitle>
            <CardDescription>Submit a request for additional stock</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product">Product</Label>
                <Select value={requestProduct} onValueChange={setRequestProduct}>
                  <SelectTrigger id="product">
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity Requested</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  placeholder="Enter quantity"
                  value={requestQuantity}
                  onChange={(e) => setRequestQuantity(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Request</Label>
                <Textarea
                  id="reason"
                  placeholder="Explain why you need more inventory"
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? (
                    <>Submitting...</>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Request
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowRequestForm(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Request Button */}
      <div className="flex justify-end">
        <Button 
          size="sm" 
          onClick={() => setShowRequestForm(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Request More Inventory
        </Button>
      </div>

      {/* Inventory Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No inventory assigned</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {items.map((item) => {
              const maxCapacity = REORDER_LEVEL * 3
              const stockPercentage = Math.min((item.quantity_issued / maxCapacity) * 100, 100)

              return (
                <Card key={item.id} className="hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="p-2 rounded-lg bg-indigo-100">
                          <Package className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base font-semibold truncate">
                            {item.productName}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            Issued: {new Date(item.date_issued).toLocaleDateString()}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className={`text-3xl font-bold ${getStatusColor(item.quantity_issued)}`}>
                          {item.quantity_issued}
                        </p>
                        <p className={`text-xs font-semibold ${getStatusColor(item.quantity_issued)}`}>
                          {getStatusLabel(item.quantity_issued)}
                        </p>
                      </div>
                      {item.quantity_issued <= REORDER_LEVEL && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setRequestProduct(item.product_id)
                            setShowRequestForm(true)
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Request
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Reorder Level: {REORDER_LEVEL}</span>
                        <span>{Math.round(stockPercentage)}% capacity</span>
                      </div>
                      <Progress 
                        value={stockPercentage} 
                        className="h-2"
                      />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </>
        )}
      </div>

      {/* Request History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Request History</CardTitle>
              <CardDescription>Track your inventory request status</CardDescription>
            </div>
            <div className="w-[180px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingRequests ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              Loading requests...
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              No requests found
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((request) => {
                const statusColors = {
                  pending: 'bg-amber-100 text-amber-800 border-amber-200',
                  approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                  rejected: 'bg-rose-100 text-rose-800 border-rose-200',
                }
                const statusIcons = {
                  pending: Clock,
                  approved: CheckCircle,
                  rejected: XCircle,
                }
                const StatusIcon = statusIcons[request.status]

                return (
                  <div key={request.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-semibold">{request.products?.name || 'Unknown Product'}</p>
                        <p className="text-sm text-muted-foreground">
                          Requested: {request.quantity_requested} • {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className={statusColors[request.status]}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {request.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{request.reason}</p>
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

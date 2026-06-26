'use client'

import { useState, useEffect } from 'react'
import { Package, CheckCircle, XCircle, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import * as inventoryService from '@/services/inventory.service'
import type { InventoryRequest } from '@/services/inventory.service'

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

export default function AdminInventoryRequestsPage() {
  const [requests, setRequests] = useState<InventoryRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<InventoryRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  
  // Approval modal state
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<InventoryRequest | null>(null)
  const [approvalQuantity, setApprovalQuantity] = useState<string>('')

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const data = await inventoryService.listInventoryRequests()
      console.log('Fetched requests:', data)
      console.log('Requests length:', data?.length)
      setRequests(data || [])
    } catch (error) {
      console.error('Failed to fetch requests:', error)
      toast.error('Failed to load inventory requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredRequests(requests)
    } else {
      setFilteredRequests(requests.filter(r => r.status === statusFilter))
    }
  }, [requests, statusFilter])

  const handleApprove = async (requestId: string) => {
    const request = requests.find(r => r.id === requestId)
    if (request) {
      setSelectedRequest(request)
      setApprovalQuantity(request.quantity_requested.toString())
      setShowApprovalModal(true)
    }
  }

  const handleConfirmApproval = async () => {
    if (!selectedRequest || !approvalQuantity) {
      toast.error('Please enter a quantity')
      return
    }

    setProcessing(selectedRequest.id)
    try {
      await inventoryService.approveInventoryRequest(selectedRequest.id, parseInt(approvalQuantity, 10))
      await fetchRequests()
      setShowApprovalModal(false)
      setSelectedRequest(null)
      setApprovalQuantity('')
      toast.success('Request approved and stock allocated')
    } catch (error) {
      toast.error('Failed to approve request')
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (requestId: string) => {
    setProcessing(requestId)
    try {
      await inventoryService.updateInventoryRequest(requestId, 'rejected')
      await fetchRequests()
      toast.success('Request rejected')
    } catch (error) {
      toast.error('Failed to reject request')
    } finally {
      setProcessing(null)
    }
  }

  const pendingCount = filteredRequests.filter(r => r.status === 'pending').length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
          <p className="text-muted-foreground">Loading requests...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Requests</h1>
          <p className="text-muted-foreground mt-2">Manage agent inventory requests</p>
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

      {/* Alert for pending requests */}
      {pendingCount > 0 && (
        <Alert className="border-amber-200 bg-amber-50">
          <Clock className="h-5 w-5 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>{pendingCount}</strong> request(s) pending approval
          </AlertDescription>
        </Alert>
      )}

      {/* Requests Grid */}
      {filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No inventory requests</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRequests.map((request) => {
            const StatusIcon = statusIcons[request.status]
            
            return (
              <Card key={request.id} className="hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 rounded-lg bg-indigo-100">
                        <Package className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base font-semibold truncate">
                          {request.products?.name || 'Unknown Product'}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Requested: {new Date(request.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={statusColors[request.status]}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {request.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Quantity:</span>
                      <span className="font-semibold">{request.quantity_requested}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Agent ID:</span>
                      <span className="font-semibold">{request.agent_id}</span>
                    </div>
                  </div>

                  <div className="text-sm">
                    <span className="text-muted-foreground">Reason:</span>
                    <p className="mt-1 text-foreground">{request.reason}</p>
                  </div>

                  {request.status === 'pending' && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(request.id)}
                        disabled={processing === request.id}
                        className="flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(request.id)}
                        disabled={processing === request.id}
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Approval Modal */}
      <Dialog open={showApprovalModal} onOpenChange={setShowApprovalModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Inventory Request</DialogTitle>
            <DialogDescription>
              Review the request and specify the quantity to issue to the agent.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedRequest && (
              <>
                <div className="space-y-2">
                  <Label>Product</Label>
                  <p className="text-sm font-medium">{selectedRequest.products?.name || 'Unknown Product'}</p>
                </div>
                <div className="space-y-2">
                  <Label>Requested Quantity</Label>
                  <p className="text-sm font-medium">{selectedRequest.quantity_requested}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="approval-quantity">Quantity to Issue</Label>
                  <Input
                    id="approval-quantity"
                    type="number"
                    min="1"
                    value={approvalQuantity}
                    onChange={(e) => setApprovalQuantity(e.target.value)}
                    placeholder="Enter quantity to issue"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Reason</Label>
                  <p className="text-sm text-muted-foreground">{selectedRequest.reason}</p>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowApprovalModal(false)
                setSelectedRequest(null)
                setApprovalQuantity('')
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmApproval}
              disabled={processing === selectedRequest?.id}
            >
              {processing === selectedRequest?.id ? 'Processing...' : 'Approve & Issue Stock'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

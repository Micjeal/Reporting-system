'use client'

import { useState, useEffect } from 'react'
import { Check, X, Eye } from 'lucide-react'
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
import * as usersService from '@/services/users.service'
import type { Database } from '@/lib/database.types'
import { toast } from 'sonner'

type User = Database['public']['Tables']['users']['Row']

export function PendingApprovalsTable() {
  const [approvalsData, setApprovalsData] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPendingUsers = async () => {
    try {
      const users = await usersService.listUsers()
      const pending = (users ?? []).filter(u => u.status === 'pending').slice(0, 4)
      setApprovalsData(pending)
    } catch (error) {
      console.error('Failed to fetch pending approvals:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPendingUsers()
  }, [])

  const handleApprove = async (id: string) => {
    try {
      await usersService.approveUser(id)
      toast.success('User approved successfully')
      fetchPendingUsers()
    } catch (error) {
      toast.error('Failed to approve user')
      console.error('Failed to approve user:', error)
    }
  }

  const handleReject = async (id: string) => {
    try {
      await usersService.rejectUser(id)
      toast.success('User rejected successfully')
      fetchPendingUsers()
    } catch (error) {
      toast.error('Failed to reject user')
      console.error('Failed to reject user:', error)
    }
  }

  if (loading) {
    return (
      <Card className="min-w-0 overflow-hidden">
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
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
        <CardTitle>Pending Approvals ({approvalsData.length})</CardTitle>
      </CardHeader>
      <CardContent className="min-w-0 px-0 sm:px-6">
        <div className="w-full min-w-0 overflow-x-auto">
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow>
                <TableHead>Request ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approvalsData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No pending approvals
                  </TableCell>
                </TableRow>
              ) : (
                approvalsData.map((approval) => (
                  <TableRow key={approval.id}>
                    <TableCell className="font-medium text-primary">
                      {String(approval.id).slice(0, 8).toUpperCase()}
                    </TableCell>
                    <TableCell className="font-medium">N/A</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{approval.email}</TableCell>
                    <TableCell className="text-sm">{approval.role || 'agent'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">New User</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(approval.created_at || '').toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon-sm" title="View Details">
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                          title="Approve"
                          onClick={() => handleApprove(approval.id)}
                        >
                          <Check className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:text-destructive"
                          title="Reject"
                          onClick={() => handleReject(approval.id)}
                        >
                          <X className="size-4" />
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

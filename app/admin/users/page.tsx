'use client'

import { useState, useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UsersDataTable } from '@/components/admin/tables/users-data-table'
import { User, UserStatus } from '@/lib/types/users'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useUsers } from '@/hooks/use-users'

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState<UserStatus | 'all'>('all')
  const { data, loading, refresh, approve, reject, suspend, setRole } = useUsers()

  const users: User[] = useMemo(() => {
    if (!data) return []
    return data.map((u) => ({
      id: u.id,
      name: u.name ?? '',
      email: u.email,
      phone: u.phone ?? '',
      role: u.role,
      status: u.status,
      createdAt: new Date(u.created_at),
      updatedAt: new Date(u.updated_at),
    }))
  }, [data])

  const allUsers = users
  const pendingUsers = useMemo(() => users.filter((u) => u.status === 'pending'), [users])
  const activeUsers = useMemo(() => users.filter((u) => u.status === 'active'), [users])
  const rejectedUsers = useMemo(() => users.filter((u) => u.status === 'rejected'), [users])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Users Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage user accounts, approve registrations, and control access
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <CardDescription>{allUsers.length}</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <CardDescription className="text-amber-600 dark:text-amber-400">
              {pendingUsers.length}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <CardDescription className="text-emerald-600 dark:text-emerald-400">
              {activeUsers.length}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <CardDescription className="text-red-600 dark:text-red-400">
              {rejectedUsers.length}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                View and manage all users in the system
              </CardDescription>
            </div>
            <Button onClick={refresh} disabled={loading} variant="outline">
              Refresh
            </Button>
          </div>
        </CardHeader>
        <div className="p-6">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as any)}
            className="w-full"
          >
            <TabsList className="grid w-full max-w-md grid-cols-4">
              <TabsTrigger value="all">
                All ({allUsers.length})
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({pendingUsers.length})
              </TabsTrigger>
              <TabsTrigger value="active">
                Active ({activeUsers.length})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejected ({rejectedUsers.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <UsersDataTable
                data={allUsers}
                status="all"
                isLoading={loading}
                onRefresh={refresh}
                onApprove={approve}
                onReject={reject}
                onSuspend={suspend}
                onSetRole={setRole}
              />
            </TabsContent>

            <TabsContent value="pending" className="mt-6">
              <UsersDataTable
                data={users}
                status="pending"
                isLoading={loading}
                onRefresh={refresh}
                onApprove={approve}
                onReject={reject}
                onSuspend={suspend}
                onSetRole={setRole}
              />
            </TabsContent>

            <TabsContent value="active" className="mt-6">
              <UsersDataTable
                data={users}
                status="active"
                isLoading={loading}
                onRefresh={refresh}
                onApprove={approve}
                onReject={reject}
                onSuspend={suspend}
                onSetRole={setRole}
              />
            </TabsContent>

            <TabsContent value="rejected" className="mt-6">
              <UsersDataTable
                data={users}
                status="rejected"
                isLoading={loading}
                onRefresh={refresh}
                onApprove={approve}
                onReject={reject}
                onSuspend={suspend}
                onSetRole={setRole}
              />
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </div>
  )
}

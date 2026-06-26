'use client'

import { useState, memo, useMemo } from 'react'
import {
  ColumnDef,
  SortingState,
  VisibilityState,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { User, UserRole, UserStatus } from '@/lib/types/users'
import { ChevronDown, Search, Loader2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { ApprovalDialog } from './approval-dialog'

const roleColors: Record<UserRole, string> = {
  admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  agent: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
}

const statusColors: Record<UserStatus, string> = {
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  suspended: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
}

interface UsersDataTableProps {
  data: User[]
  status?: UserStatus | 'all'
  isLoading?: boolean
  onRefresh?: () => void | Promise<void>
  onApprove?: (userId: string) => Promise<void>
  onReject?: (userId: string) => Promise<void>
  onSuspend?: (userId: string) => Promise<void>
  onSetRole?: (userId: string, role: UserRole) => Promise<void>
}

export const UsersDataTable = memo(function UsersDataTable({
  data,
  status = 'all',
  isLoading = false,
  onRefresh,
  onApprove,
  onReject,
  onSuspend,
  onSetRole,
}: UsersDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [searchValue, setSearchValue] = useState('')
  const [loadingActions, setLoadingActions] = useState<Set<string>>(new Set())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogAction, setDialogAction] = useState<'approve' | 'reject' | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const { toast } = useToast()

  // Filter data by status
  const filteredByStatus = useMemo(() => data.filter((user) => {
    if (status === 'all') return true
    return user.status === status
  }), [data, status])

  // Filter by search
  const filteredData = useMemo(() => filteredByStatus.filter((user) =>
    user.name.toLowerCase().includes(searchValue.toLowerCase()) ||
    user.email.toLowerCase().includes(searchValue.toLowerCase()) ||
    user.phone.includes(searchValue)
  ), [filteredByStatus, searchValue])

  const columns: ColumnDef<User>[] = useMemo(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => <div className="text-sm text-muted-foreground">{row.getValue('email')}</div>,
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => <div className="text-sm">{row.getValue('phone')}</div>,
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const role = row.getValue('role') as UserRole
        return (
          <Badge className={roleColors[role]}>
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const userStatus = row.getValue('status') as UserStatus
        return (
          <Badge className={statusColors[userStatus]}>
            {userStatus.charAt(0).toUpperCase() + userStatus.slice(1)}
          </Badge>
        )
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const user = row.original
        const isLoading = loadingActions.has(user.id)

        return (
          <div className="flex items-center gap-2">
            {user.status === 'pending' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedUserId(user.id)
                    setDialogAction('approve')
                    setDialogOpen(true)
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Approve'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedUserId(user.id)
                    setDialogAction('reject')
                    setDialogOpen(true)
                  }}
                  disabled={isLoading}
                >
                  Reject
                </Button>
              </>
            )}

            {user.status !== 'pending' && user.status !== 'rejected' && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isLoading}
                    >
                      Role <ChevronDown className="ml-1 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.preventDefault()
                      handleChangeRole(user.id, 'admin')
                    }}>
                      Admin
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.preventDefault()
                      handleChangeRole(user.id, 'manager')
                    }}>
                      Manager
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.preventDefault()
                      handleChangeRole(user.id, 'agent')
                    }}>
                      Agent
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSuspend(user.id)}
                  disabled={isLoading || user.status === 'suspended'}
                >
                  {user.status === 'suspended' ? 'Suspended' : 'Suspend'}
                </Button>
              </>
            )}
          </div>
        )
      },
      enableSorting: false,
    },
  ], [])

  const handleApprove = async (userId: string) => {
    setLoadingActions((prev) => new Set([...prev, userId]))
    try {
      if (!onApprove) throw new Error('Approve action not configured')
      await onApprove(userId)
      toast({
        title: 'Success',
        description: 'User approved successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve user',
        variant: 'destructive',
      })
    } finally {
      setLoadingActions((prev) => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
      setDialogOpen(false)
    }
  }

  const handleReject = async (userId: string) => {
    setLoadingActions((prev) => new Set([...prev, userId]))
    try {
      if (!onReject) throw new Error('Reject action not configured')
      await onReject(userId)
      toast({
        title: 'Success',
        description: 'User rejected',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject user',
        variant: 'destructive',
      })
    } finally {
      setLoadingActions((prev) => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
      setDialogOpen(false)
    }
  }

  const handleChangeRole = async (userId: string, newRole: UserRole) => {
    setLoadingActions((prev) => new Set([...prev, userId]))
    try {
      if (!onSetRole) throw new Error('Role change action not configured')
      await onSetRole(userId, newRole)
      toast({
        title: 'Success',
        description: `User role changed to ${newRole}`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to change user role',
        variant: 'destructive',
      })
    } finally {
      setLoadingActions((prev) => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    }
  }

  const handleSuspend = async (userId: string) => {
    setLoadingActions((prev) => new Set([...prev, userId]))
    try {
      if (!onSuspend) throw new Error('Suspend action not configured')
      await onSuspend(userId)
      toast({
        title: 'Success',
        description: 'User suspended',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to suspend user',
        variant: 'destructive',
      })
    } finally {
      setLoadingActions((prev) => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    }
  }

  const handleBulkApprove = async () => {
    const selectedRows = table.getSelectedRowModel().rows
    const selectedIds = selectedRows.map((row) => row.original.id)

    setLoadingActions((prev) => new Set([...prev, ...selectedIds]))
    try {
      if (!onApprove) throw new Error('Approve action not configured')
      await Promise.allSettled(selectedIds.map((id) => onApprove(id)))
      toast({
        title: 'Success',
        description: `${selectedIds.length} users approved`,
      })
      setRowSelection({})
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve users',
        variant: 'destructive',
      })
    } finally {
      setLoadingActions((prev) => {
        const newSet = new Set(prev)
        selectedIds.forEach((id) => newSet.delete(id))
        return newSet
      })
    }
  }

  const handleBulkReject = async () => {
    const selectedRows = table.getSelectedRowModel().rows
    const selectedIds = selectedRows.map((row) => row.original.id)

    setLoadingActions((prev) => new Set([...prev, ...selectedIds]))
    try {
      if (!onReject) throw new Error('Reject action not configured')
      await Promise.allSettled(selectedIds.map((id) => onReject(id)))
      toast({
        title: 'Success',
        description: `${selectedIds.length} users rejected`,
      })
      setRowSelection({})
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject users',
        variant: 'destructive',
      })
    } finally {
      setLoadingActions((prev) => {
        const newSet = new Set(prev)
        selectedIds.forEach((id) => newSet.delete(id))
        return newSet
      })
    }
  }

  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  const selectedRows = table.getSelectedRowModel().rows
  const isPendingTab = filteredByStatus.every((u) => u.status === 'pending')

  return (
    <div className="space-y-4">
      {/* Search and Bulk Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-8"
          />
        </div>

        {selectedRows.length > 0 && isPendingTab && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={handleBulkApprove}
              disabled={loadingActions.size > 0}
            >
              Approve ({selectedRows.length})
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleBulkReject}
              disabled={loadingActions.size > 0}
            >
              Reject ({selectedRows.length})
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No results found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {selectedRows.length > 0 ? (
            `${selectedRows.length} of ${table.getFilteredRowModel().rows.length} row(s) selected`
          ) : (
            `Showing ${table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to ${Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )} of ${table.getFilteredRowModel().rows.length} result(s)`
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Approval Dialog */}
      {selectedUserId && (
        <ApprovalDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          action={dialogAction}
          onConfirm={() => {
            if (dialogAction === 'approve') {
              handleApprove(selectedUserId)
            } else if (dialogAction === 'reject') {
              handleReject(selectedUserId)
            }
          }}
          isLoading={loadingActions.has(selectedUserId)}
        />
      )}
    </div>
  )
})

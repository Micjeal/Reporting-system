'use client'

import { useState, useEffect, useMemo } from 'react'
import { Search, Download, FileText, CheckCircle2, Clock, CalendarDays, Wrench, Utensils, Bed, Phone, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import * as expensesService from '@/services/expenses.service'
import * as agentsService from '@/services/agents.service'
import * as usersService from '@/services/users.service'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { Expense } from '@/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const categories: Expense['category'][] = ['fuel', 'food', 'accommodation', 'airtime', 'other']

const categoryBadgeConfig: Record<
  Expense['category'],
  { label: string; icon: React.ReactNode; className: string }
> = {
  fuel: {
    label: 'Fuel',
    icon: <Wrench className="h-3 w-3" />,
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  food: {
    label: 'Food',
    icon: <Utensils className="h-3 w-3" />,
    className: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-800',
  },
  accommodation: {
    label: 'Accommodation',
    icon: <Bed className="h-3 w-3" />,
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  },
  airtime: {
    label: 'Airtime',
    icon: <Phone className="h-3 w-3" />,
    className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  },
  other: {
    label: 'Other',
    icon: <MoreHorizontal className="h-3 w-3" />,
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300 border-gray-200 dark:border-gray-800',
  },
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX' }).format(amount)

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const getMonthExpenses = (expenses: Expense[]) => {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  return expenses.filter((e) => {
    const d = new Date(e.date)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  })
}

// ---------------------------------------------------------------------------
// Skeleton row component
// ---------------------------------------------------------------------------
function SkeletonRow() {
  return (
    <tr className="border-b border-muted">
      <td className="px-4 py-3">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
      </td>
      <td className="px-4 py-3">
        <div className="h-5 w-20 animate-pulse rounded bg-muted" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-48 animate-pulse rounded bg-muted" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-20 animate-pulse rounded bg-muted" />
      </td>
      <td className="px-4 py-3">
        <div className="h-8 w-8 animate-pulse rounded bg-muted" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
      </td>
      <td className="px-4 py-3">
        <div className="h-8 w-8 animate-pulse rounded bg-muted" />
      </td>
    </tr>
  )
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
const PAGE_SIZE = 10

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [agents, setAgents] = useState<Array<{ id: string; user_id: string; email: string | null }>>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)

  // Batch selection
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())

  // Modal state
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)

  // ---------------------------------------------------------------------------
  // Fetch data
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      setLoading(true)
      try {
        const [expensesData, agentsData, usersData] = await Promise.all([
          expensesService.listExpenses(),
          agentsService.listAgents(),
          usersService.listUsers(),
        ])

        if (cancelled) return

        console.log('[ADMIN EXPENSES] Fetched expenses:', expensesData)
        console.log('[ADMIN EXPENSES] Fetched agents:', agentsData)
        console.log('[ADMIN EXPENSES] Fetched users:', usersData)

        setExpenses(expensesData ?? [])
        
        // Debug: log agents and users data
        console.log('Agents data:', agentsData)
        console.log('Users data:', usersData)
        
        // Map users by id to get email
        const usersMap = new Map<string, string>()
        for (const user of (usersData ?? [])) {
          if (user.id && user.email) {
            usersMap.set(user.id, user.email)
          }
        }
        
        // Map agents by their id to get email via user_id
        const agentsMap = new Map<string, { id: string; user_id: string; email: string | null }>()
        for (const agent of (agentsData ?? [])) {
          console.log('Agent:', agent, 'User ID:', agent.user_id, 'Email:', agent.user_id ? usersMap.get(String(agent.user_id)) ?? null : null)
          const email = agent.user_id ? usersMap.get(String(agent.user_id)) ?? null : null
          agentsMap.set(String(agent.id), {
            id: String(agent.id),
            user_id: String(agent.user_id),
            email,
          })
        }
        setAgents(Array.from(agentsMap.values()))
      } catch {
        if (!cancelled) {
          setExpenses([])
          setAgents([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => {
      cancelled = true
    }
  }, [])

  // ---------------------------------------------------------------------------
  // Agent email lookup
  // ---------------------------------------------------------------------------
  const agentEmailMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const a of agents) {
      if (a.email) map.set(String(a.id), a.email)
    }
    return map
  }, [agents])

  // ---------------------------------------------------------------------------
  // Filtering
  // ---------------------------------------------------------------------------
  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        expense.description.toLowerCase().includes(q) ||
        (agentEmailMap.get(String(expense.agent_id)) ?? '').toLowerCase().includes(q)

      const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter

      const matchesDateFrom = !dateFrom || new Date(expense.date) >= new Date(dateFrom)
      const matchesDateTo = !dateTo || new Date(expense.date) <= new Date(dateTo)

      return matchesSearch && matchesCategory && matchesDateFrom && matchesDateTo
    })
  }, [expenses, searchQuery, categoryFilter, dateFrom, dateTo, agentEmailMap])

  // ---------------------------------------------------------------------------
  // Pagination
  // ---------------------------------------------------------------------------
  const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedExpenses = filteredExpenses.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const handleResetFilters = () => {
    setSearchQuery('')
    setCategoryFilter('all')
    setDateFrom('')
    setDateTo('')
    setCurrentPage(1)
  }

  useEffect(() => {
    setCurrentPage(1)
    setSelectedRows(new Set())
  }, [searchQuery, categoryFilter, dateFrom, dateTo])

  // ---------------------------------------------------------------------------
  // KPI calculations
  // ---------------------------------------------------------------------------
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const thisMonthExpenses = getMonthExpenses(expenses)
    .reduce((sum, e) => sum + e.amount, 0)

  // Placeholder approved / pending counts
  const approvedCount = Math.round(expenses.length * 0.6)
  const pendingCount = expenses.length - approvedCount

  // ---------------------------------------------------------------------------
  // Batch selection handlers
  // ---------------------------------------------------------------------------
  const allPaginatedSelected = paginatedExpenses.length > 0 && paginatedExpenses.every((e) => selectedRows.has(e.id))

  const handleToggleRow = (id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleToggleAll = () => {
    if (allPaginatedSelected) {
      setSelectedRows((prev) => {
        const next = new Set(prev)
        paginatedExpenses.forEach((e) => next.delete(e.id))
        return next
      })
    } else {
      setSelectedRows((prev) => {
        const next = new Set(prev)
        paginatedExpenses.forEach((e) => next.add(e.id))
        return next
      })
    }
  }

  // ---------------------------------------------------------------------------
  // Action handlers
  // ---------------------------------------------------------------------------
  const handleViewDetails = (expense: Expense) => {
    setSelectedExpense(expense)
  }

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
  }

  const handleDelete = (id: string) => {
    setExpenseToDelete(id)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!expenseToDelete) return

    try {
      await expensesService.deleteExpense(expenseToDelete)
      // Refresh the expenses list
      const expensesData = await expensesService.listExpenses()
      setExpenses(expensesData ?? [])
    } catch (error) {
      console.error('Failed to delete expense:', error)
      alert('Failed to delete expense')
    } finally {
      setIsDeleteModalOpen(false)
      setExpenseToDelete(null)
    }
  }

  const cancelDelete = () => {
    setIsDeleteModalOpen(false)
    setExpenseToDelete(null)
  }

  const handleEditChange = (field: keyof Expense, value: any) => {
    if (!editingExpense) return
    // Create a new object without the agent field to avoid circular reference
    const { agent, ...rest } = editingExpense
    setEditingExpense({ ...rest, [field]: value } as Expense)
  }

  const handleEditSubmit = async () => {
    if (!editingExpense) return

    try {
      // Create a clean payload without the agent field to avoid circular reference
      const payload = {
        category: editingExpense.category,
        description: editingExpense.description,
        amount: editingExpense.amount,
        receipt_url: editingExpense.receipt_url,
        date: editingExpense.date,
      }
      await expensesService.updateExpense(editingExpense.id, payload)
      // Refresh the expenses list
      const expensesData = await expensesService.listExpenses()
      setExpenses(expensesData ?? [])
      setEditingExpense(null)
    } catch (error) {
      console.error('Failed to update expense:', error)
      alert('Failed to update expense')
    }
  }

  const cancelEdit = () => {
    setEditingExpense(null)
  }

  // ---------------------------------------------------------------------------
  // CSV export
  // ---------------------------------------------------------------------------
  const handleExportCSV = () => {
    const header = ['ID', 'Agent', 'Category', 'Description', 'Amount', 'Date', 'Receipt URL']
    const rows = filteredExpenses.map((e) => [
      e.id,
      agentEmailMap.get(String(e.agent_id)) ?? e.agent_id,
      e.category,
      `"${e.description.replace(/"/g, '""')}"`,
      formatCurrency(e.amount),
      e.date,
      e.receipt_url ?? '',
    ])
    const csvContent = [header, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  // ---------------------------------------------------------------------------
  // Summary total for current page
  // ---------------------------------------------------------------------------
  const pageTotal = paginatedExpenses.reduce((sum, e) => sum + e.amount, 0)

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
        <p className="text-muted-foreground mt-2">
          Track, review, and manage all agent expense claims across the organization
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* KPI Cards                                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Expenses */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {expenses.length} total records
            </p>
          </CardContent>
        </Card>

        {/* Approved */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {approvedCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Expenses approved — placeholder
            </p>
          </CardContent>
        </Card>

        {/* Pending */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-amber-500 dark:text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {pendingCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting approval — placeholder
            </p>
          </CardContent>
        </Card>

        {/* This Month */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(thisMonthExpenses)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {getMonthExpenses(expenses).length} expenses this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Filters Card                                                        */}
      {/* ------------------------------------------------------------------ */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            {/* Search */}
            <div className="flex-1">
              <label className="mb-1.5 block text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Description or agent name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Category */}
            <div className="w-full lg:w-48">
              <label className="mb-1.5 block text-sm font-medium leading-none">
                Category
              </label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="fuel">Fuel</SelectItem>
                  <SelectItem value="food">Food</SelectItem>
                  <SelectItem value="accommodation">Accommodation</SelectItem>
                  <SelectItem value="airtime">Airtime</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
            <div className="w-full lg:w-44">
              <label className="mb-1.5 block text-sm font-medium leading-none">
                Date From
              </label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            {/* Date To */}
            <div className="w-full lg:w-44">
              <label className="mb-1.5 block text-sm font-medium leading-none">
                Date To
              </label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            {/* Search Button */}
            <Button className="self-end">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>

            {/* Reset */}
            <Button variant="outline" onClick={handleResetFilters} className="self-end">
              Reset
            </Button>

            {/* Export */}
            <Button variant="outline" onClick={handleExportCSV} className="self-end">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* Expenses Table                                                     */}
      {/* ------------------------------------------------------------------ */}
      <Card>
        <CardHeader>
          <CardTitle>Expenses</CardTitle>
          <CardDescription>
            {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left w-12">
                  <Checkbox
                    checked={allPaginatedSelected}
                    onCheckedChange={handleToggleAll}
                    aria-label="Select all"
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Agent Email
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Category
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Description
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Amount
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Receipt
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Date
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              ) : paginatedExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    No expenses found matching your criteria.
                  </td>
                </tr>
              ) : (
                paginatedExpenses.map((expense) => {
                  const catConfig = categoryBadgeConfig[expense.category]
                  const agentEmail = agentEmailMap.get(String(expense.agent_id)) ?? 'Unknown Agent'
                  const isSelected = selectedRows.has(expense.id)

                  return (
                    <tr
                      key={expense.id}
                      className={cn(
                        'border-b transition-colors hover:bg-muted/30',
                        isSelected && 'bg-primary/5'
                      )}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggleRow(expense.id)}
                          aria-label={`Select expense ${expense.id}`}
                        />
                      </td>

                      {/* Agent Email */}
                      <td className="px-4 py-3">
                        <span className="font-medium text-foreground">{agentEmail}</span>
                      </td>

                      {/* Category Badge */}
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={cn(
                            'inline-flex items-center gap-1.5 border',
                            catConfig.className
                          )}
                        >
                          {catConfig.icon}
                          {catConfig.label}
                        </Badge>
                      </td>

                      {/* Description */}
                      <td className="px-4 py-3 max-w-xs truncate text-muted-foreground">
                        {expense.description}
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3 text-right font-mono font-medium">
                        {formatCurrency(expense.amount)}
                      </td>

                      {/* Receipt */}
                      <td className="px-4 py-3">
                        {expense.receipt_url ? (
                          <a
                            href={expense.receipt_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1"
                          >
                            <FileText className="h-4 w-4" />
                            View
                          </a>
                        ) : (
                          <span className="text-muted-foreground italic">—</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(expense.date)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(expense)}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(expense)}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600 dark:text-red-400"
                              onClick={() => handleDelete(expense.id)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
            {/* Total row */}
            {!loading && paginatedExpenses.length > 0 && (
              <tfoot>
                <tr className="border-b-2 border-border bg-muted/50 font-semibold">
                  <td className="px-4 py-3" />
                  <td className="px-4 py-3">Total</td>
                  <td className="px-4 py-3" />
                  <td className="px-4 py-3" />
                  <td className="px-4 py-3 text-right font-mono">
                    {formatCurrency(pageTotal)}
                  </td>
                  <td className="px-4 py-3" />
                  <td className="px-4 py-3" />
                  <td className="px-4 py-3" />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </CardContent>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-6 py-4">
            <p className="text-sm text-muted-foreground">
              Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filteredExpenses.length)} of{' '}
              {filteredExpenses.length}
            </p>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      if (safePage > 1) setCurrentPage(safePage - 1)
                    }}
                    className={cn(safePage === 1 && 'pointer-events-none opacity-50')}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      isActive={page === safePage}
                      onClick={(e) => {
                        e.preventDefault()
                        setCurrentPage(page)
                      }}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      if (safePage < totalPages) setCurrentPage(safePage + 1)
                    }}
                    className={cn(safePage === totalPages && 'pointer-events-none opacity-50')}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </Card>

      {/* TODO: realtime subscription and patch workflow */}
      {/* TODO: Add real Supabase realtime subscription here */}
      {/* TODO: Add approve/reject expense workflow from PATCH /api/expenses/:id */}

      {/* View Details Modal */}
      {selectedExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-4 sm:p-6 shadow-lg dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Expense Details</h2>
              <button
                onClick={() => setSelectedExpense(null)}
                className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-slate-800"
                aria-label="Close details"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">ID</p>
                  <p className="font-medium">{selectedExpense.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Agent ID</p>
                  <p className="font-medium">{selectedExpense.agent_id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium capitalize">{selectedExpense.category}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{formatDate(selectedExpense.date)}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="font-medium">{selectedExpense.description}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="font-medium text-lg">{formatCurrency(selectedExpense.amount)}</p>
              </div>
              
              {selectedExpense.receipt_url && (
                <div>
                  <p className="text-sm text-muted-foreground">Receipt</p>
                  <a 
                    href={selectedExpense.receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <FileText className="h-4 w-4" />
                    View Receipt
                  </a>
                </div>
              )}
              
              <div>
                <p className="text-sm text-muted-foreground">Created At</p>
                <p className="font-medium">{new Date(selectedExpense.created_at).toLocaleString()}</p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setSelectedExpense(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-4 sm:p-6 shadow-lg dark:bg-slate-900">
            <h2 className="text-xl font-bold mb-2">Delete Expense?</h2>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete this expense? This action cannot be undone.
            </p>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={cancelDelete}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Expense Modal */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-4 sm:p-6 shadow-lg dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Edit Expense</h2>
              <button
                onClick={cancelEdit}
                className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-slate-800"
                aria-label="Close edit"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="edit-category" className="mb-1 block text-sm font-medium">Category</label>
                <select
                  id="edit-category"
                  value={editingExpense.category}
                  onChange={(e) => handleEditChange('category', e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="fuel">Fuel</option>
                  <option value="food">Food</option>
                  <option value="accommodation">Accommodation</option>
                  <option value="airtime">Airtime</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="edit-description" className="mb-1 block text-sm font-medium">Description</label>
                <input
                  id="edit-description"
                  type="text"
                  value={editingExpense.description}
                  onChange={(e) => handleEditChange('description', e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="edit-amount" className="mb-1 block text-sm font-medium">Amount</label>
                <input
                  id="edit-amount"
                  type="number"
                  value={editingExpense.amount}
                  onChange={(e) => handleEditChange('amount', parseFloat(e.target.value))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="edit-date" className="mb-1 block text-sm font-medium">Date</label>
                <input
                  id="edit-date"
                  type="date"
                  value={editingExpense.date}
                  onChange={(e) => handleEditChange('date', e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="edit-receipt" className="mb-1 block text-sm font-medium">Receipt URL</label>
                <input
                  id="edit-receipt"
                  type="text"
                  value={editingExpense.receipt_url ?? ''}
                  onChange={(e) => handleEditChange('receipt_url', e.target.value || null)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={cancelEdit}>
                Cancel
              </Button>
              <Button onClick={handleEditSubmit}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

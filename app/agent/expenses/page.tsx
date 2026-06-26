'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Search, Plus, Edit, Trash2, Calendar, DollarSign,
  FileText, X, Upload, CheckCircle2, AlertCircle,
  ChevronDown, Receipt, Layers
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import * as expensesService from '@/services/expenses.service'
import { uploadReceipt } from '@/services/storage.service'
import { useToast } from '@/components/ui/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { Expense } from '@/types'

// ─── Zod Schemas ────────────────────────────────────────────────────────────

const singleExpenseSchema = z.object({
  category: z.enum(['fuel', 'food', 'accommodation', 'airtime', 'other']),
  description: z.string().min(1, 'Required'),
  amount: z
    .string()
    .min(1, 'Required')
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, 'Must be > 0'),
  date: z.string().min(1, 'Required'),
  receipt_url: z.string().optional(),
})

const batchExpenseSchema = z.object({
  entries: z.array(singleExpenseSchema).min(1, 'Add at least one expense'),
})

type SingleExpenseRow = z.infer<typeof singleExpenseSchema>
type BatchFormData = z.infer<typeof batchExpenseSchema>

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORIES = ['fuel', 'food', 'accommodation', 'airtime', 'other'] as const

const categoryConfig: Record<
  typeof CATEGORIES[number],
  { label: string; color: string; dot: string }
> = {
  fuel: {
    label: 'Fuel',
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-400',
  },
  food: {
    label: 'Food',
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-400',
  },
  accommodation: {
    label: 'Accommodation',
    color: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    dot: 'bg-sky-400',
  },
  airtime: {
    label: 'Airtime',
    color: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300 border-violet-200 dark:border-violet-800',
    dot: 'bg-violet-400',
  },
  other: {
    label: 'Other',
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    dot: 'bg-slate-400',
  },
}

const EMPTY_ROW: SingleExpenseRow = {
  category: 'other',
  description: '',
  amount: '',
  date: new Date().toISOString().split('T')[0],
  receipt_url: '',
}

const PAGE_SIZE = 10

const fmt = (n: number) => {
  const formatted = Math.round(n).toLocaleString('en-UG')
  return `UGX ${formatted}`
}

const fmtDate = (d: string) => {
  const dt = new Date(d)
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Row status pill shown during/after batch submission */
function RowStatus({ status }: { status: 'idle' | 'loading' | 'success' | 'error' }) {
  if (status === 'idle') return null
  if (status === 'loading') return <Spinner className="h-4 w-4 text-muted-foreground" />
  if (status === 'success') return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
  return <AlertCircle className="h-4 w-4 text-red-500" />
}

/** Receipt upload button — uploads to Supabase Storage, returns public URL */
function ReceiptUploader({
  value,
  onChange,
  rowIndex,
}: {
  value: string | undefined
  onChange: (url: string) => void
  rowIndex: number
}) {
  const [uploading, setUploading] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      // TODO: replace 'agent-placeholder' with actual agent id from auth context
      const url = await uploadReceipt(file, 'agent-placeholder')
      if (url) onChange(url)
    } finally {
      setUploading(false)
      if (ref.current) ref.current.value = ''
    }
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              'h-8 w-8 shrink-0',
              value ? 'text-emerald-600 hover:text-emerald-700' : 'text-muted-foreground hover:text-foreground'
            )}
            onClick={() => ref.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Spinner className="h-4 w-4" /> : value ? <CheckCircle2 className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          {value ? 'Receipt uploaded — click to replace' : 'Upload receipt'}
        </TooltipContent>
      </Tooltip>
      <input ref={ref} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFile} aria-label="Upload receipt" />
    </TooltipProvider>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AgentExpensesPage() {
  // ── State ──
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [activeTab, setActiveTab] = useState<'list' | 'add-single' | 'add-batch'>('list')
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null)
  const [page, setPage] = useState(1)

  // Batch row statuses: index → 'idle' | 'loading' | 'success' | 'error'
  const [rowStatuses, setRowStatuses] = useState<Record<number, 'idle' | 'loading' | 'success' | 'error'>>({})
  const [batchSubmitting, setBatchSubmitting] = useState(false)
  const [batchDone, setBatchDone] = useState(false)

  const { toast } = useToast()

  // ── Single-entry form ──
  const singleForm = useForm<SingleExpenseRow>({
    resolver: zodResolver(singleExpenseSchema),
    defaultValues: { ...EMPTY_ROW },
  })

  // ── Batch form with field array ──
  const batchForm = useForm<BatchFormData>({
    resolver: zodResolver(batchExpenseSchema),
    defaultValues: { entries: [{ ...EMPTY_ROW }] },
  })

  const { fields, append, remove } = useFieldArray({
    control: batchForm.control,
    name: 'entries',
  })

  // ── Data ──
  useEffect(() => { fetchExpenses() }, [])

  const fetchExpenses = async () => {
    setLoading(true)
    try {
      const data = await expensesService.listExpenses({})
      console.log('[AGENT EXPENSES] Fetched expenses:', data)
      setExpenses(data || [])
    } catch (error) {
      console.error('[AGENT EXPENSES] Failed to fetch expenses:', error)
      setExpenses([])
    } finally {
      setLoading(false)
    }
  }

  // ── Derived data ──
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return expenses.filter((e) => {
      const matchQ = !q || e.description.toLowerCase().includes(q) || e.category.toLowerCase().includes(q)
      const matchCat = categoryFilter === 'all' || e.category === categoryFilter
      const matchFrom = !dateFrom || new Date(e.date) >= new Date(dateFrom)
      const matchTo = !dateTo || new Date(e.date) <= new Date(dateTo)
      return matchQ && matchCat && matchFrom && matchTo
    })
  }, [expenses, searchQuery, categoryFilter, dateFrom, dateTo])

  useEffect(() => { setPage(1) }, [searchQuery, categoryFilter, dateFrom, dateTo])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const totalAmount = useMemo(() => expenses.reduce((s, e) => s + (e.amount || 0), 0), [expenses])
  const now = new Date()
  const thisMonth = useMemo(() => expenses.filter((e) => {
    const d = new Date(e.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }), [expenses])
  const thisMonthTotal = useMemo(() => thisMonth.reduce((s, e) => s + (e.amount || 0), 0), [thisMonth])

  // Batch running total
  const batchEntries = batchForm.watch('entries')
  const batchTotal = batchEntries.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)

  // ── Handlers ──

  /** Single expense submit (create or edit) */
  const handleSingleSubmit = async (data: SingleExpenseRow) => {
    try {
      const payload = { 
        ...data, 
        amount: parseFloat(data.amount),
        receipt_url: data.receipt_url || null
      }
      if (editingExpense) {
        await expensesService.updateExpense(editingExpense.id, payload)
        toast({ title: 'Updated', description: 'Expense updated successfully.' })
        setEditingExpense(null)
      } else {
        await expensesService.createExpense(payload)
        toast({ title: 'Saved', description: 'Expense created.' })
      }
      singleForm.reset({ ...EMPTY_ROW })
      setActiveTab('list')
      fetchExpenses()
    } catch {
      toast({ title: 'Error', description: 'Could not save expense.', variant: 'destructive' })
    }
  }

  /** Batch submit — processes rows sequentially, updates row status live */
  const handleBatchSubmit = async (data: BatchFormData) => {
    setBatchSubmitting(true)
    setBatchDone(false)
    const statuses: Record<number, 'idle' | 'loading' | 'success' | 'error'> = {}
    data.entries.forEach((_, i) => { statuses[i] = 'idle' })
    setRowStatuses({ ...statuses })

    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < data.entries.length; i++) {
      setRowStatuses((prev) => ({ ...prev, [i]: 'loading' }))
      try {
        const entry = data.entries[i]
        await expensesService.createExpense({ 
          ...entry, 
          amount: parseFloat(entry.amount),
          receipt_url: entry.receipt_url || null
        })
        setRowStatuses((prev) => ({ ...prev, [i]: 'success' }))
        successCount++
      } catch {
        setRowStatuses((prev) => ({ ...prev, [i]: 'error' }))
        errorCount++
      }
      // Small delay so the user can see row-level status updates
      await new Promise((r) => setTimeout(r, 300))
    }

    setBatchSubmitting(false)
    setBatchDone(true)

    toast({
      title: errorCount === 0 ? 'All saved!' : `${successCount} saved, ${errorCount} failed`,
      description:
        errorCount === 0
          ? `${successCount} expense${successCount > 1 ? 's' : ''} submitted successfully.`
          : 'Failed rows are highlighted. Please retry those individually.',
      variant: errorCount === 0 ? 'default' : 'destructive',
    })

    if (errorCount === 0) {
      batchForm.reset({ entries: [{ ...EMPTY_ROW }] })
      setRowStatuses({})
      setBatchDone(false)
      setActiveTab('list')
    }

    fetchExpenses()
  }

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
    singleForm.reset({
      category: expense.category,
      description: expense.description,
      amount: String(expense.amount),
      date: expense.date,
      receipt_url: expense.receipt_url ?? '',
    })
    setActiveTab('add-single')
  }

  const handleDelete = async () => {
    if (!deletingExpense) return
    try {
      await expensesService.deleteExpense(deletingExpense.id)
      toast({ title: 'Deleted', description: 'Expense removed.' })
      setDeletingExpense(null)
      fetchExpenses()
    } catch {
      toast({ title: 'Error', description: 'Could not delete expense.', variant: 'destructive' })
    }
  }

  const handleCancelSingle = () => {
    setEditingExpense(null)
    singleForm.reset({ ...EMPTY_ROW })
    setActiveTab('list')
  }

  const handleAddRow = () => {
    append({ ...EMPTY_ROW })
  }

  const handleDuplicateRow = (index: number) => {
    const row = batchForm.getValues(`entries.${index}`)
    append({ ...row, description: row.description + ' (copy)', date: EMPTY_ROW.date })
  }

  // ── Render ──
  return (
    <TooltipProvider>
      <div className="w-full h-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 pb-24 lg:pb-10 space-y-6">

          {/* ── Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-1">Field Operations</p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">My Expenses</h1>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setEditingExpense(null); singleForm.reset({ ...EMPTY_ROW }); setActiveTab('add-single') }}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Single
              </Button>
              <Button
                size="sm"
                onClick={() => { setActiveTab('add-batch'); setBatchDone(false); setRowStatuses({}) }}
              >
                <Layers className="h-4 w-4 mr-1.5" />
                Batch Entry
              </Button>
            </div>
          </div>

          {/* ── KPI Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: 'Total All Time', value: fmt(totalAmount), sub: `${expenses.length} claims`, icon: DollarSign, accent: 'text-emerald-600' },
              { label: 'This Month', value: fmt(thisMonthTotal), sub: `${thisMonth.length} expenses`, icon: Calendar, accent: 'text-sky-600' },
              { label: 'Avg Per Claim', value: fmt(expenses.length ? totalAmount / expenses.length : 0), sub: 'Running average', icon: Receipt, accent: 'text-violet-600' },
              { label: 'Pending Review', value: '—', sub: 'Contact manager', icon: FileText, accent: 'text-amber-600' },
            ].map(({ label, value, sub, icon: Icon, accent }) => (
              <Card key={label} className="overflow-hidden">
                <CardContent className="pt-4 pb-4 px-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-muted-foreground truncate">{label}</p>
                      <p className="text-lg sm:text-xl font-bold mt-0.5 tabular-nums">{value}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{sub}</p>
                    </div>
                    <Icon className={cn('h-5 w-5 mt-0.5 shrink-0', accent)} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ── Tabs ── */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="list" className="flex-1 sm:flex-none">
                <FileText className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />
                All Expenses
              </TabsTrigger>
              <TabsTrigger value="add-single" className="flex-1 sm:flex-none">
                <Plus className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />
                {editingExpense ? 'Edit Expense' : 'Add Single'}
              </TabsTrigger>
              <TabsTrigger value="add-batch" className="flex-1 sm:flex-none">
                <Layers className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />
                Batch Entry
              </TabsTrigger>
            </TabsList>

            {/* ── LIST TAB ── */}
            <TabsContent value="list" className="mt-4 space-y-4">

              {/* Filters */}
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex flex-col gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <Input
                        placeholder="Search description or category..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="All categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {CATEGORIES.map((c) => (
                            <SelectItem key={c} value={c}>
                              <span className="flex items-center gap-2">
                                <span className={cn('h-2 w-2 rounded-full inline-block', categoryConfig[c].dot)} />
                                {categoryConfig[c].label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="text-sm" />
                      <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="text-sm" />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground text-xs"
                        onClick={() => { setSearchQuery(''); setCategoryFilter('all'); setDateFrom(''); setDateTo('') }}
                      >
                        Clear filters
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Table */}
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    {loading ? (
                      <div className="flex items-center justify-center py-16">
                        <Spinner className="h-8 w-8" />
                      </div>
                    ) : filtered.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 px-4 text-center gap-3">
                        <Receipt className="h-10 w-10 text-muted-foreground/40" />
                        <div>
                          <p className="font-medium">No expenses found</p>
                          <p className="text-sm text-muted-foreground">
                            {expenses.length === 0 ? 'Submit your first expense to get started.' : 'Adjust your filters to see results.'}
                          </p>
                        </div>
                        <Button size="sm" onClick={() => setActiveTab('add-single')}>
                          <Plus className="h-4 w-4 mr-1.5" /> Add Expense
                        </Button>
                      </div>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                            <th className="px-4 py-3 text-left font-medium">Category</th>
                            <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Description</th>
                            <th className="px-4 py-3 text-right font-medium">Amount</th>
                            <th className="px-4 py-3 text-center font-medium hidden md:table-cell">Receipt</th>
                            <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">Date</th>
                            <th className="px-4 py-3 text-right font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginated.map((expense) => {
                            const cfg = categoryConfig[expense.category]
                            return (
                              <tr key={expense.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                <td className="px-4 py-3">
                                  <Badge variant="outline" className={cn('text-xs border', cfg.color)}>
                                    <span className={cn('h-1.5 w-1.5 rounded-full inline-block mr-1.5', cfg.dot)} />
                                    {cfg.label}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate hidden sm:table-cell">
                                  {expense.description}
                                </td>
                                <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums">
                                  {fmt(expense.amount)}
                                </td>
                                <td className="px-4 py-3 text-center hidden md:table-cell">
                                  {expense.receipt_url ? (
                                    <a href={expense.receipt_url} target="_blank" rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                                      <FileText className="h-3.5 w-3.5" /> View
                                    </a>
                                  ) : (
                                    <span className="text-muted-foreground/50 text-xs">—</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell">
                                  {fmtDate(expense.date)}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex justify-end gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(expense)}>
                                      <Edit className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                      onClick={() => setDeletingExpense(expense)}>
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* Pagination */}
                  {!loading && totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t px-4 py-3">
                      <p className="text-xs text-muted-foreground">
                        Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
                      </p>
                      <div className="flex gap-1 flex-wrap justify-center">
                        <Button variant="outline" size="sm" onClick={() => setPage(safePage - 1)} disabled={safePage === 1} className="text-xs">
                          Previous
                        </Button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                          <Button key={p} variant={p === safePage ? 'default' : 'outline'} size="sm"
                            onClick={() => setPage(p)} className="text-xs min-w-[32px]">
                            {p}
                          </Button>
                        ))}
                        <Button variant="outline" size="sm" onClick={() => setPage(safePage + 1)} disabled={safePage === totalPages} className="text-xs">
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── SINGLE ENTRY TAB ── */}
            <TabsContent value="add-single" className="mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base sm:text-lg">
                    {editingExpense ? 'Edit Expense' : 'Add Expense'}
                  </CardTitle>
                  {editingExpense && (
                    <p className="text-xs text-muted-foreground">
                      Editing: <span className="font-medium text-foreground">{editingExpense.description}</span>
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <form onSubmit={singleForm.handleSubmit(handleSingleSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                      {/* Category */}
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Category <span className="text-red-500">*</span></label>
                        <Controller
                          control={singleForm.control}
                          name="category"
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {CATEGORIES.map((c) => (
                                  <SelectItem key={c} value={c}>
                                    <span className="flex items-center gap-2">
                                      <span className={cn('h-2 w-2 rounded-full', categoryConfig[c].dot)} />
                                      {categoryConfig[c].label}
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {singleForm.formState.errors.category && (
                          <p className="text-xs text-red-500">{singleForm.formState.errors.category.message}</p>
                        )}
                      </div>

                      {/* Amount */}
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Amount (UGX) <span className="text-red-500">*</span></label>
                        <Input
                          type="number"
                          step="1"
                          placeholder="0"
                          {...singleForm.register('amount')}
                        />
                        {singleForm.formState.errors.amount && (
                          <p className="text-xs text-red-500">{singleForm.formState.errors.amount.message}</p>
                        )}
                      </div>

                      {/* Date */}
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Date <span className="text-red-500">*</span></label>
                        <Input type="date" {...singleForm.register('date')} />
                        {singleForm.formState.errors.date && (
                          <p className="text-xs text-red-500">{singleForm.formState.errors.date.message}</p>
                        )}
                      </div>

                      {/* Receipt */}
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Receipt (optional)</label>
                        <div className="flex gap-2 items-center">
                          <Input
                            placeholder="Upload or paste URL"
                            {...singleForm.register('receipt_url')}
                            className="flex-1"
                          />
                          <ReceiptUploader
                            value={singleForm.watch('receipt_url')}
                            onChange={(url) => singleForm.setValue('receipt_url', url)}
                            rowIndex={-1}
                          />
                        </div>
                      </div>

                      {/* Description */}
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-sm font-medium">Description <span className="text-red-500">*</span></label>
                        <Input placeholder="What was this expense for?" {...singleForm.register('description')} />
                        {singleForm.formState.errors.description && (
                          <p className="text-xs text-red-500">{singleForm.formState.errors.description.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button type="submit" disabled={singleForm.formState.isSubmitting}>
                        {singleForm.formState.isSubmitting && <Spinner className="h-4 w-4 mr-2" />}
                        {editingExpense ? 'Update Expense' : 'Save Expense'}
                      </Button>
                      <Button type="button" variant="outline" onClick={handleCancelSingle}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── BATCH ENTRY TAB ── */}
            <TabsContent value="add-batch" className="mt-4 space-y-4">

              {/* Batch summary bar */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border bg-muted/40 px-4 py-3">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Rows</p>
                    <p className="text-lg font-bold tabular-nums">{fields.length}</p>
                  </div>
                  <div className="h-8 w-px bg-border" />
                  <div>
                    <p className="text-xs text-muted-foreground">Batch Total</p>
                    <p className="text-lg font-bold tabular-nums text-emerald-600">{fmt(batchTotal)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={handleAddRow}>
                    <Plus className="h-4 w-4 mr-1.5" /> Add Row
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={batchSubmitting}
                    onClick={batchForm.handleSubmit(handleBatchSubmit)}
                  >
                    {batchSubmitting ? (
                      <>
                        <Spinner className="h-4 w-4 mr-2" />
                        Submitting…
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-1.5" />
                        Submit All ({fields.length})
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Progress bar during submission */}
              {batchSubmitting && (
                <Progress
                  value={
                    (Object.values(rowStatuses).filter((s) => s === 'success' || s === 'error').length /
                      fields.length) * 100
                  }
                  className="h-1.5"
                />
              )}

              {/* Batch rows */}
              <div className="space-y-3">
                {fields.map((field, index) => {
                  const rowStatus = rowStatuses[index] ?? 'idle'
                  const hasError = Object.keys(batchForm.formState.errors.entries?.[index] ?? {}).length > 0
                  return (
                    <Card
                      key={field.id}
                      className={cn(
                        'transition-all',
                        rowStatus === 'success' && 'border-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/10',
                        rowStatus === 'error' && 'border-red-400 bg-red-50/30 dark:bg-red-950/10',
                        hasError && 'border-amber-400'
                      )}
                    >
                      <CardContent className="pt-3 pb-3 px-3 sm:px-4">
                        <div className="flex items-start gap-2 sm:gap-3">

                          {/* Row number */}
                          <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
                            <span className="text-xs font-mono text-muted-foreground w-6 text-center">
                              {index + 1}
                            </span>
                            <RowStatus status={rowStatus} />
                          </div>

                          {/* Fields grid */}
                          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 min-w-0">

                            {/* Category */}
                            <div className="space-y-1">
                              <label className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">Category</label>
                              <Controller
                                control={batchForm.control}
                                name={`entries.${index}.category`}
                                render={({ field: f }) => (
                                  <Select onValueChange={f.onChange} value={f.value} disabled={rowStatus === 'success'}>
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {CATEGORIES.map((c) => (
                                        <SelectItem key={c} value={c} className="text-xs">
                                          {categoryConfig[c].label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                              {batchForm.formState.errors.entries?.[index]?.category && (
                                <p className="text-[10px] text-red-500">{batchForm.formState.errors.entries[index]?.category?.message}</p>
                              )}
                            </div>

                            {/* Amount */}
                            <div className="space-y-1">
                              <label className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">Amount (UGX)</label>
                              <Input
                                type="number"
                                step="1"
                                placeholder="0"
                                className="h-8 text-xs"
                                disabled={rowStatus === 'success'}
                                {...batchForm.register(`entries.${index}.amount`)}
                              />
                              {batchForm.formState.errors.entries?.[index]?.amount && (
                                <p className="text-[10px] text-red-500">{batchForm.formState.errors.entries[index]?.amount?.message}</p>
                              )}
                            </div>

                            {/* Date */}
                            <div className="space-y-1">
                              <label className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">Date</label>
                              <Input
                                type="date"
                                className="h-8 text-xs"
                                disabled={rowStatus === 'success'}
                                {...batchForm.register(`entries.${index}.date`)}
                              />
                              {batchForm.formState.errors.entries?.[index]?.date && (
                                <p className="text-[10px] text-red-500">{batchForm.formState.errors.entries[index]?.date?.message}</p>
                              )}
                            </div>

                            {/* Description */}
                            <div className="space-y-1 col-span-2 sm:col-span-1 lg:col-span-2">
                              <label className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</label>
                              <div className="flex gap-1">
                                <Input
                                  placeholder="What was this for?"
                                  className="h-8 text-xs flex-1"
                                  disabled={rowStatus === 'success'}
                                  {...batchForm.register(`entries.${index}.description`)}
                                />
                                {/* Receipt uploader */}
                                <ReceiptUploader
                                  value={batchForm.watch(`entries.${index}.receipt_url`)}
                                  onChange={(url) => batchForm.setValue(`entries.${index}.receipt_url`, url)}
                                  rowIndex={index}
                                />
                              </div>
                              {batchForm.formState.errors.entries?.[index]?.description && (
                                <p className="text-[10px] text-red-500">{batchForm.formState.errors.entries[index]?.description?.message}</p>
                              )}
                            </div>
                          </div>

                          {/* Row actions */}
                          <div className="flex flex-col gap-1 shrink-0 pt-5">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                  onClick={() => handleDuplicateRow(index)}
                                  disabled={batchSubmitting || rowStatus === 'success'}
                                >
                                  <Layers className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="left">Duplicate row</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                  onClick={() => remove(index)}
                                  disabled={batchSubmitting || fields.length === 1 || rowStatus === 'success'}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="left">Remove row</TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Add row button at bottom */}
              <button
                type="button"
                onClick={handleAddRow}
                disabled={batchSubmitting}
                className={cn(
                  'w-full rounded-lg border-2 border-dashed py-3 text-sm text-muted-foreground',
                  'hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-colors',
                  'flex items-center justify-center gap-2',
                  batchSubmitting && 'opacity-50 pointer-events-none'
                )}
              >
                <Plus className="h-4 w-4" />
                Add another row
              </button>

              {/* Batch footer actions */}
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <Button
                  type="button"
                  disabled={batchSubmitting}
                  className="sm:w-auto"
                  onClick={batchForm.handleSubmit(handleBatchSubmit)}
                >
                  {batchSubmitting ? (
                    <><Spinner className="h-4 w-4 mr-2" /> Submitting…</>
                  ) : (
                    <><CheckCircle2 className="h-4 w-4 mr-1.5" /> Submit {fields.length} Expense{fields.length > 1 ? 's' : ''}</>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={batchSubmitting}
                  onClick={() => {
                    batchForm.reset({ entries: [{ ...EMPTY_ROW }] })
                    setRowStatuses({})
                    setBatchDone(false)
                  }}
                >
                  Clear All
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={batchSubmitting}
                  onClick={() => setActiveTab('list')}
                >
                  Cancel
                </Button>
              </div>
            </TabsContent>
          </Tabs>

        </div>

        {/* ── Delete Dialog ── */}
        <Dialog open={!!deletingExpense} onOpenChange={(open) => !open && setDeletingExpense(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Expense</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <p className="text-sm">Are you sure you want to delete this expense? This action cannot be undone.</p>
              {deletingExpense && (
                <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm space-y-0.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Description</span>
                    <span className="font-medium">{deletingExpense.description}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-mono font-semibold">{fmt(deletingExpense.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date</span>
                    <span>{fmtDate(deletingExpense.date)}</span>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button variant="destructive" onClick={handleDelete}>
                Delete Expense
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
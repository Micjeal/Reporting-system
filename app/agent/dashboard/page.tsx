'use client'

import { useState, useEffect, useCallback } from 'react'
import { AgentHeader } from '@/components/agent/agent-header'
import { QuickActions } from '@/components/agent/quick-actions'
import { AgentSalesChart } from '@/components/agent/agent-sales-chart'
import { RecentSalesList } from '@/components/agent/recent-sales-list'
import { RecentExpensesList } from '@/components/agent/recent-expenses-list'
import { InventoryList } from '@/components/agent/inventory-list'
import * as salesService from '@/services/sales.service'
import * as expensesService from '@/services/expenses.service'
import * as inventoryService from '@/services/inventory.service'
import * as agentsService from '@/services/agents.service'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns YYYY-MM-DD for any Date */
const toDateStr = (d: Date) => d.toISOString().split('T')[0]

/** First day of the week (Monday) containing `d` */
const startOfWeek = (d: Date) => {
  const n = new Date(d)
  const day = n.getDay() === 0 ? 6 : n.getDay() - 1 // Monday = 0
  n.setDate(n.getDate() - day)
  n.setHours(0, 0, 0, 0)
  return n
}

/** Last day of the week (Sunday) containing `d` */
const endOfWeek = (d: Date) => {
  const n = startOfWeek(d)
  n.setDate(n.getDate() + 6)
  n.setHours(23, 59, 59, 999)
  return n
}

/** Checks whether a sale/expense date string falls within the active window */
function isInWindow(
  dateStr: string | undefined | null,
  viewMode: 'Daily' | 'Weekly' | 'Monthly',
  selectedDate: Date
): boolean {
  if (!dateStr) return false
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return false

  if (viewMode === 'Daily') {
    return toDateStr(d) === toDateStr(selectedDate)
  }
  if (viewMode === 'Weekly') {
    return d >= startOfWeek(selectedDate) && d <= endOfWeek(selectedDate)
  }
  // Monthly
  return (
    d.getMonth() === selectedDate.getMonth() &&
    d.getFullYear() === selectedDate.getFullYear()
  )
}

// ─── Circular Progress KPI Card ───────────────────────────────────────────────
function CircularKPI({
  label,
  value,
  max,
  prefix = '',
  suffix = '',
  color = '#4F52FF',
  loading = false,
}: {
  label: string
  value: number
  max: number
  prefix?: string
  suffix?: string
  color?: string
  loading?: boolean
}) {
  const r = 52
  const circ = 2 * Math.PI * r
  const progress = max > 0 ? Math.min(value / max, 1) : 0
  const offset = circ * (1 - progress)

  const abbr = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
    return n.toLocaleString('en-UG')
  }

  return (
    <div className="relative flex flex-col items-center justify-center p-4">
      <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90 drop-shadow-sm">
        <circle cx="64" cy="64" r={r} fill="none" stroke="#F0F2FF" strokeWidth="10" className="opacity-50" />
        <circle
          cx="64" cy="64" r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={loading ? circ : offset}
          className="filter drop-shadow-md transition-all duration-[1200ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {loading ? (
          <div className="w-10 h-2 bg-gray-200 rounded animate-pulse" />
        ) : (
          <span className="text-lg font-bold text-gray-900 leading-tight">
            {prefix}{abbr(value)}{suffix}
          </span>
        )}
        <span className="text-[11px] text-gray-500 mt-1 font-medium leading-tight px-2">{label}</span>
      </div>
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  change,
  up,
  loading = false,
}: {
  label: string
  value: string
  change?: string
  up?: boolean
  loading?: boolean
}) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200/50 p-5 shadow-sm hover:shadow-lg hover:shadow-indigo-100/50 transition-all duration-300 hover:scale-[1.02]">
      {change && (
        <div className={`text-xs font-bold flex items-center gap-1 mb-2 ${up ? 'text-emerald-600' : 'text-rose-600'}`}>
          <span>{up ? '↑' : '↓'}</span>
          <span>{change}</span>
        </div>
      )}
      <div className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">{label}</div>
      {loading ? (
        <div className="w-16 h-5 bg-gray-100 rounded animate-pulse mt-1" />
      ) : (
        <div className="text-xl font-bold text-gray-900 mt-1 tracking-tight">{value}</div>
      )}
    </div>
  )
}

// ─── Date Navigator ───────────────────────────────────────────────────────────
function DateNav({
  date,
  viewMode,
  onPrev,
  onNext,
}: {
  date: Date
  viewMode: 'Daily' | 'Weekly' | 'Monthly'
  onPrev: () => void
  onNext: () => void
}) {
  const isToday = date.toDateString() === new Date().toDateString()

  const label = () => {
    if (viewMode === 'Daily') {
      return isToday ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'long' })
    }
    if (viewMode === 'Weekly') {
      const ws = startOfWeek(date)
      const we = endOfWeek(date)
      return `${ws.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} – ${we.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`
    }
    // Monthly
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  const sublabel = () => {
    if (viewMode === 'Daily') {
      return date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
    }
    if (viewMode === 'Weekly') {
      const ws = startOfWeek(date)
      return `Week of ${ws.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
    }
    return `${date.getFullYear()}`
  }

  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={onPrev}
        className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 text-indigo-600 font-bold flex items-center justify-center hover:bg-gradient-to-br hover:from-indigo-100 hover:to-violet-100 transition-all duration-300 hover:scale-110 shadow-sm"
      >
        ‹
      </button>
      <div className="text-center min-w-[160px]">
        <div className="text-base font-bold text-gray-900">{label()}</div>
        <div className="text-xs text-gray-500">{sublabel()}</div>
      </div>
      <button
        onClick={onNext}
        className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 text-indigo-600 font-bold flex items-center justify-center hover:bg-gradient-to-br hover:from-indigo-100 hover:to-violet-100 transition-all duration-300 hover:scale-110 shadow-sm"
      >
        ›
      </button>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function AgentDashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily')

  const [agentInfo, setAgentInfo] = useState({
    id: '',
    name: 'Loading...',
    region: 'Loading...',
    monthlyTarget: 50000,
  })

  const [dashboardData, setDashboardData] = useState({
    salesTotal: 0,
    expensesTotal: 0,
    inventoryAssigned: 0,
    monthlyTargetProgress: 0,
    monthlyTarget: 50000,
    netSales: 0,
    loading: true,
  })

  // ── Fetch agent info ────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchAgentInfo = async () => {
      try {
        const agent = await agentsService.getCurrentAgent()
        if (agent) {
          setAgentInfo({
            id: agent.id || '',
            name: agent.name || 'Sales Agent',
            region: agent.region || 'Unassigned',
            monthlyTarget: agent.monthly_target || 50000,
          })
        }
      } catch (error) {
        console.error('Failed to fetch agent info:', error)
      }
    }
    fetchAgentInfo()
  }, [])

  // ── Fetch + filter dashboard data ───────────────────────────────────────────
  // Re-runs whenever selectedDate OR viewMode changes — this is what
  // makes the date navigator and view toggle actually filter the numbers.
  useEffect(() => {
    const fetchDashboardData = async () => {
      setDashboardData(prev => ({ ...prev, loading: true }))
      try {
        const [sales, expenses, inventory] = await Promise.all([
          salesService.listSales(),
          expensesService.listExpenses({}),
          inventoryService.listInventory(),
        ])

        // ── Filter sales by the active window (Daily / Weekly / Monthly) ──
        const windowSales = (sales ?? [])
          .filter(s => String(s.agent_id) === String(agentInfo.id))
          .filter(s => isInWindow(s.sale_date || s.created_at, viewMode, selectedDate))

        // ── Filter expenses by the active window ───────────────────────────
        const windowExpenses = (expenses ?? [])
          .filter(e => String(e.agent_id) === String(agentInfo.id))
          .filter(e => isInWindow(e.date || e.created_at, viewMode, selectedDate))

        const salesTotal = windowSales.reduce(
          (sum, s) => sum + (s.total_amount ?? s.amount ?? 0), 0
        )

        const expensesTotal = windowExpenses.reduce(
          (sum, e) => sum + (e.amount ?? 0), 0
        )

        const inventoryAssigned = (inventory ?? [])
          .filter(i => String(i.agent_id) === String(agentInfo.id))
          .reduce((sum, i) => sum + (i.quantity_issued ?? 0), 0)

        // Monthly target progress always tracks the calendar month of selectedDate
        const monthlyTargetProgress = (sales ?? [])
          .filter(s => String(s.agent_id) === String(agentInfo.id))
          .filter(s => {
            const saleDate = s.sale_date || s.created_at
            if (!saleDate) return false
            const d = new Date(saleDate)
            return (
              d.getMonth() === selectedDate.getMonth() &&
              d.getFullYear() === selectedDate.getFullYear()
            )
          })
          .reduce((sum, s) => sum + (s.total_amount ?? s.amount ?? 0), 0)

        const netSales = Math.max(0, salesTotal - expensesTotal)

        setDashboardData({
          salesTotal,
          expensesTotal,
          inventoryAssigned,
          monthlyTargetProgress,
          monthlyTarget: agentInfo.monthlyTarget,
          netSales,
          loading: false,
        })
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
        setDashboardData(prev => ({ ...prev, loading: false }))
      }
    }

    fetchDashboardData()
  }, [selectedDate, viewMode, agentInfo.monthlyTarget]) // ← ALL THREE dependencies wired

  // ── Navigation handlers — step size matches viewMode ───────────────────────
  const handlePrev = useCallback(() => {
    setSelectedDate(d => {
      const n = new Date(d)
      if (viewMode === 'Daily') n.setDate(n.getDate() - 1)
      else if (viewMode === 'Weekly') n.setDate(n.getDate() - 7)
      else n.setMonth(n.getMonth() - 1)
      return n
    })
  }, [viewMode])

  const handleNext = useCallback(() => {
    setSelectedDate(d => {
      const n = new Date(d)
      if (viewMode === 'Daily') n.setDate(n.getDate() + 1)
      else if (viewMode === 'Weekly') n.setDate(n.getDate() + 7)
      else n.setMonth(n.getMonth() + 1)
      return n
    })
  }, [viewMode])

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      maximumFractionDigits: 0,
    }).format(n)

  const pct =
    dashboardData.monthlyTarget > 0
      ? Math.round((dashboardData.monthlyTargetProgress / dashboardData.monthlyTarget) * 100)
      : 0

  // ── Label helpers for KPI cards ────────────────────────────────────────────
  const salesLabel =
    viewMode === 'Daily' ? 'Gross Sales Today'
    : viewMode === 'Weekly' ? 'Gross Sales This Week'
    : 'Gross Sales This Month'

  const netLabel =
    viewMode === 'Daily' ? 'Net Sales Today'
    : viewMode === 'Weekly' ? 'Net Sales This Week'
    : 'Net Sales This Month'

  const dailyMax = dashboardData.monthlyTarget / 30
  const weeklyMax = dashboardData.monthlyTarget / 4
  const kpiMax =
    viewMode === 'Daily' ? dailyMax
    : viewMode === 'Weekly' ? weeklyMax
    : dashboardData.monthlyTarget

  return (
    <div className="w-full h-full overflow-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6 lg:space-y-8 max-w-[1600px]">

        {/* ── Welcome Header ─────────────────────────────────────────────── */}
        <div className="animate-fade-in">
          <AgentHeader agentName={agentInfo.name} region={agentInfo.region} />
        </div>

        {/* ── Date Nav + View Toggle ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/80 backdrop-blur-sm rounded-3xl px-4 sm:px-6 py-4 shadow-sm border border-gray-200/50 animate-slide-up">
          <DateNav
            date={selectedDate}
            viewMode={viewMode}
            onPrev={handlePrev}
            onNext={handleNext}
          />
          <div className="flex bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl p-1.5 gap-1.5 shadow-sm">
            {(['Daily', 'Weekly', 'Monthly'] as const).map(v => (
              <button
                key={v}
                onClick={() => {
                  setViewMode(v)
                  setSelectedDate(new Date()) // reset to today on mode switch
                }}
                className={`px-4 sm:px-5 py-2 rounded-xl text-xs font-semibold transition-all duration-300
                  ${viewMode === v
                    ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-200/50'
                    : 'text-gray-600 hover:text-indigo-600 hover:bg-white/50'}`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* ── Hero KPI Row ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 animate-slide-up delay-100">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200/50 shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 transition-all duration-300 flex flex-col items-center pb-2 hover:scale-[1.02]">
            <CircularKPI
              label={salesLabel}
              value={dashboardData.salesTotal}
              max={kpiMax}
              prefix="UGX "
              color="#4F52FF"
              loading={dashboardData.loading}
            />
            <span className="text-[11px] text-indigo-600 font-semibold tracking-wide uppercase pb-2">
              {viewMode}
            </span>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200/50 shadow-sm hover:shadow-xl hover:shadow-emerald-100/50 transition-all duration-300 flex flex-col items-center pb-2 hover:scale-[1.02]">
            <CircularKPI
              label={netLabel}
              value={dashboardData.netSales}
              max={kpiMax}
              prefix="UGX "
              color="#22C55E"
              loading={dashboardData.loading}
            />
            <span className="text-[11px] text-emerald-600 font-semibold tracking-wide uppercase pb-2">After Expenses</span>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200/50 shadow-sm hover:shadow-xl hover:shadow-amber-100/50 transition-all duration-300 flex flex-col items-center pb-2 hover:scale-[1.02]">
            <CircularKPI
              label="Monthly Target"
              value={dashboardData.monthlyTargetProgress}
              max={dashboardData.monthlyTarget}
              prefix="UGX "
              color="#F59E0B"
              loading={dashboardData.loading}
            />
            <span className="text-[11px] text-amber-600 font-semibold tracking-wide uppercase pb-2">{pct}% achieved</span>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200/50 shadow-sm hover:shadow-xl hover:shadow-violet-100/50 transition-all duration-300 flex flex-col items-center pb-2 hover:scale-[1.02]">
            <CircularKPI
              label="Units Assigned"
              value={dashboardData.inventoryAssigned}
              max={500}
              color="#8B5CF6"
              loading={dashboardData.loading}
            />
            <span className="text-[11px] text-violet-600 font-semibold tracking-wide uppercase pb-2">Inventory</span>
          </div>
        </div>

        {/* ── Stat Cards Row ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 animate-slide-up delay-200">
          <StatCard
            label={`Gross Sales (${viewMode})`}
            value={fmt(dashboardData.salesTotal)}
            change={`${pct}% of monthly target`}
            up={pct >= 50}
            loading={dashboardData.loading}
          />
          <StatCard
            label="Net Sales"
            value={fmt(dashboardData.netSales)}
            change="After expenses"
            up={dashboardData.netSales > 0}
            loading={dashboardData.loading}
          />
          <StatCard
            label={`Expenses (${viewMode})`}
            value={fmt(dashboardData.expensesTotal)}
            change={dashboardData.expensesTotal > 0 ? 'Recorded this period' : undefined}
            up={false}
            loading={dashboardData.loading}
          />
          <StatCard
            label="Monthly Progress"
            value={fmt(dashboardData.monthlyTargetProgress)}
            change={`Target: ${fmt(dashboardData.monthlyTarget)}`}
            up={pct >= 50}
            loading={dashboardData.loading}
          />
        </div>

        {/* ── Quick Actions ──────────────────────────────────────────────── */}
        <div className="animate-slide-up delay-300">
          <QuickActions />
        </div>

        {/* ── Main Content Grid ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 animate-slide-up delay-400">

          {/* Sales Chart — spans 2 cols */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200/50 shadow-sm overflow-hidden hover:shadow-xl hover:shadow-indigo-100/50 transition-all duration-300 hover:scale-[1.01]">
              <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-2 flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                    Sales Performance — {viewMode}
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5 tracking-tight">
                    {dashboardData.loading ? (
                      <div className="w-24 sm:w-28 h-5 sm:h-6 bg-gray-100 rounded animate-pulse" />
                    ) : (
                      fmt(dashboardData.salesTotal)
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Monthly Target</div>
                  <div className="text-sm font-bold text-indigo-600">{fmt(dashboardData.monthlyTarget)}</div>
                </div>
              </div>
              <AgentSalesChart />
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200/50 shadow-sm overflow-hidden hover:shadow-xl hover:shadow-indigo-100/50 transition-all duration-300 hover:scale-[1.01]">
              <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-2 border-b border-gray-100">
                <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Recent Sales</div>
              </div>
              <RecentSalesList />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">

            <div className="bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 rounded-3xl p-4 sm:p-5 text-white shadow-xl shadow-indigo-200/50 hover:shadow-2xl hover:shadow-indigo-300/50 transition-all duration-300 hover:scale-[1.02]">
              <div className="text-xs font-semibold uppercase tracking-wide text-indigo-200 mb-1">Monthly Target</div>
              <div className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">{pct}%</div>
              <div className="text-sm text-indigo-200 mb-4">
                {fmt(dashboardData.monthlyTargetProgress)} of {fmt(dashboardData.monthlyTarget)}
              </div>
              <div className="w-full bg-white/20 rounded-full h-2.5 backdrop-blur-sm">
                <div
                  className="bg-white rounded-full h-2.5 transition-all duration-1000 shadow-lg"
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              <div className="mt-4 flex justify-between text-xs text-indigo-200">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200/50 shadow-sm overflow-hidden hover:shadow-xl hover:shadow-rose-100/50 transition-all duration-300 hover:scale-[1.01]">
              <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-2 border-b border-gray-100 flex items-center justify-between">
                <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Recent Expenses</div>
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-sm shadow-rose-200" />
              </div>
              <RecentExpensesList />
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200/50 shadow-sm overflow-hidden hover:shadow-xl hover:shadow-violet-100/50 transition-all duration-300 hover:scale-[1.01]">
              <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-2 border-b border-gray-100 flex items-center justify-between">
                <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Inventory</div>
                <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse shadow-sm shadow-violet-200" />
              </div>
              <InventoryList />
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
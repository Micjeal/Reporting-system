'use client'

import { useEffect, useState } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { apiGet } from '@/services/api-client'
import { listSales } from '@/services/sales.service'
import { listExpenses } from '@/services/expenses.service'
import {
  DollarSign,
  Users,
  ShoppingCart,
  Package,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { KPIs, TopAgent, SalesTrend } from '@/types'

import { KPICard } from '@/components/admin/kpi-card'
import { SalesTrendChart } from '@/components/admin/charts/sales-trend-chart'
import { RevenueChart } from '@/components/admin/charts/revenue-chart'
import { ExpenseBreakdownChart } from '@/components/admin/charts/expense-breakdown-chart'
import { RecentSalesTable } from '@/components/admin/tables/recent-sales-table'
import { PendingApprovalsTable } from '@/components/admin/tables/pending-approvals-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ManagerDashboard() {
  const { state } = useAuth()
  const [kpiData, setKpiData] = useState<KPIs | null>(null)
  const [salesTrends, setSalesTrends] = useState<SalesTrend[]>([])
  const [topAgents, setTopAgents] = useState<TopAgent[]>([])
  const [recentSales, setRecentSales] = useState<unknown[]>([])
  const [todayExpenses, setTodayExpenses] = useState<unknown[]>([])
  const [loading, setLoading] = useState(true)

  // Format today's date as ISO string (YYYY-MM-DD) for date filtering
  const today = new Date().toISOString().slice(0, 10)

  // ── Role / Authorization Check ──────────────────────────────────────────
  useEffect(() => {
    if (state.status === 'authenticated' && state.role !== 'manager') {
      redirect('/unauthorized')
    }
    if (state.status === 'idle' || state.status === 'error') {
      redirect('/login')
    }
  }, [state.status, state.role])

  // ── Data Fetching ────────────────────────────────────────────────────────
  useEffect(() => {
    if (state.status !== 'authenticated') return

    let cancelled = false

    async function fetchAllData() {
      setLoading(true)
      try {
        // KPI overview aggregated from today's transactions
        const kpiResponse = await fetch('/api/analytics/kpis')
        const kpiJson: { data: KPIs | null; error: string | null } =
          await kpiResponse.json()
        if (!cancelled && kpiJson.data) {
          setKpiData(kpiJson.data)
        }

        // Sales trend chart (last 30 days)
        const trendsResponse = await fetch('/api/analytics/sales-trends')
        const trendsJson: { data: SalesTrend[] | null; error: string | null } =
          await trendsResponse.json()
        if (!cancelled && trendsJson.data) {
          setSalesTrends(trendsJson.data)
        }

        // Top-performing agents
        // TODO: Replace with Supabase call
        //   const { data } = await supabase
        //     .from('sales')
        //     .select('agent_id, users(agent_id), name')
        //     .gte('date', ...)
        //   setTopAgents(data as TopAgent[])
        const topAgentsResponse = await apiGet<TopAgent[]>('/api/analytics/top-agents')
        if (!cancelled) {
          setTopAgents(topAgentsResponse)
        }

        //  Recent sales for today
        const salesToday = await listSales({ date_from: today })
        if (!cancelled) {
          setRecentSales(salesToday ?? [])
        }

        // Today's expenses
        const expensesToday = await listExpenses({ date_from: today })
        if (!cancelled) {
          setTodayExpenses(expensesToday ?? [])
        }
      } catch (err) {
        // Log error — API may not be fully wired yet during development
        // eslint-disable-next-line no-console
        console.error('Error fetching manager dashboard data:', err)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchAllData()

    return () => {
      cancelled = true
    }
  }, [state.status, today])

  // ── Derived Values ───────────────────────────────────────────────────────
  const totalSalesToday =
    kpiData?.total_sales_today ?? recentSales.reduce(
      (sum: number, s: unknown) =>
        sum + ((s as { amount?: number })?.amount as number) * 1.0,
      0
    )

  const totalExpensesToday =
    kpiData?.total_expenses_today ?? todayExpenses.reduce(
      (sum: number, e: unknown) =>
        sum + ((e as { amount?: number })?.amount as number) * 1.0,
      0
    )

  const activeAgentsCount = kpiData?.active_agents ?? (topAgents?.length ?? 0)
  const pendingApprovalsCount = kpiData?.pending_approvals ?? 0
  const netProfit = kpiData?.net_revenue_estimate ?? totalSalesToday - totalExpensesToday

  if (state.status !== 'authenticated' || loading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading dashboard…</div>
  }

  // Defensive defaults
  const safeTrends = Array.isArray(salesTrends) ? salesTrends : []

  return (
    <div className="space-y-6">
      {/* ── Page Title ──────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Manager Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Manage your team, monitor sales performance, and track approvals.
        </p>
      </div>

      {/* ── KPI Cards Grid ──────────────────────────────────────────────── */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <KPICard
          title="Total Sales Today"
          value={`$${totalSalesToday.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          change={0}
          icon={<DollarSign className="size-4" />}
        />

        <KPICard
          title="Total Expenses Today"
          value={`$${totalExpensesToday.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          change={0}
          icon={<ShoppingCart className="size-4" />}
        />

        <KPICard
          title="Active Agents"
          value={String(activeAgentsCount)}
          change={0}
          icon={<Users className="size-4" />}
        />

        <KPICard
          title="Pending Approvals"
          value={String(pendingApprovalsCount)}
          change={0}
          icon={<Package className="size-4" />}
        />

        <KPICard
          title="Revenue"
          value={`$${totalSalesToday.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          change={0}
          icon={<TrendingUp className="size-4" />}
        />

        <KPICard
          title="Net Profit"
          value={`$${netProfit.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          change={netProfit >= 0 ? 2.4 : -1.8}
          icon={<Wallet className="size-4" />}
        />
      </div>

      {/* ── Charts Row 1 ────────────────────────────────────────────────── */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <SalesTrendChart />
        <ExpenseBreakdownChart />
      </div>

      {/* ── Revenue Chart ────────────────────────────────────────────────── */}
      <RevenueChart />

      {/* ── Tables Row ───────────────────────────────────────────────────── */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <RecentSalesTable />

        {/* ── Top Agents Card / Mini-table ─────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Top Agents</CardTitle>
          </CardHeader>
          <CardContent>
            {topAgents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No agent data available.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 text-left font-medium text-muted-foreground">
                        Agent
                      </th>
                      <th className="py-2 text-left font-medium text-muted-foreground">
                        Region
                      </th>
                      <th className="py-2 text-right font-medium text-muted-foreground">
                        Total Sales
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {topAgents.map((agent) => (
                      <tr key={agent.agent_id} className="border-b last:border-0">
                        <td className="py-2 font-medium text-foreground">
                          {agent.agent_name ?? agent.agent_id}
                        </td>
                        <td className="py-2 text-muted-foreground">{agent.region || '—'}</td>
                        <td className="py-2 text-right font-semibold text-foreground">
                          ${agent.total_sales.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-4">
              <Link
                href="/manager/agents"
                className="text-sm font-medium text-primary hover:underline"
              >
                View all agents →
              </Link>
            </div>
          </CardContent>
        </Card>

        <PendingApprovalsTable />
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { DollarSign, Users, ShoppingCart, AlertCircle, Package, TrendingUp } from 'lucide-react'
import { KPICard } from '@/components/admin/kpi-card'
import { SalesTrendChart } from '@/components/admin/charts/sales-trend-chart'
import { ExpenseBreakdownChart } from '@/components/admin/charts/expense-breakdown-chart'
import { RevenueChart } from '@/components/admin/charts/revenue-chart'
import { RecentSalesTable } from '@/components/admin/tables/recent-sales-table'
import { PendingApprovalsTable } from '@/components/admin/tables/pending-approvals-table'
import * as salesService from '@/services/sales.service'
import * as expensesService from '@/services/expenses.service'
import * as usersService from '@/services/users.service'
import * as inventoryService from '@/services/inventory.service'

export default function AdminDashboard() {
  const [kpiData, setKpiData] = useState({
    totalSales: 0,
    activeAgents: 0,
    totalExpenses: 0,
    pendingApprovals: 0,
    inventoryUnits: 0,
    netRevenue: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [sales, expenses, users, inventory] = await Promise.all([
          salesService.listSales(),
          expensesService.listExpenses(),
          usersService.listUsers(),
          inventoryService.listInventory(),
        ])

        const totalSales = (sales ?? []).reduce((sum, s) => sum + (s.amount ?? 0), 0)
        const totalExpenses = (expenses ?? []).reduce((sum, e) => sum + (e.amount ?? 0), 0)
        const activeAgents = (users ?? []).filter(u => u.role === 'agent' && u.status === 'active').length
        const pendingApprovals = (users ?? []).filter(u => u.status === 'pending').length
        const inventoryUnits = (inventory ?? []).reduce((sum, i) => sum + i.quantity_issued, 0)
        const netRevenue = totalSales - totalExpenses

        setKpiData({
          totalSales,
          activeAgents,
          totalExpenses,
          pendingApprovals,
          inventoryUnits,
          netRevenue,
        })
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX' }).format(amount)

  return (
    <div className="min-w-0 space-y-5 md:space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Welcome back! Here's your sales performance overview.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
        <KPICard
          title="Total Sales"
          value={loading ? '...' : formatCurrency(kpiData.totalSales)}
          change={20.1}
          icon={<DollarSign className="size-4" />}
          showLive={true}
        />
        <KPICard
          title="Active Agents"
          value={loading ? '...' : kpiData.activeAgents.toString()}
          change={5.2}
          icon={<Users className="size-4" />}
        />
        <KPICard
          title="Total Expenses"
          value={loading ? '...' : formatCurrency(kpiData.totalExpenses)}
          change={-3.8}
          icon={<ShoppingCart className="size-4" />}
        />
        <KPICard
          title="Pending Approvals"
          value={loading ? '...' : kpiData.pendingApprovals.toString()}
          change={-15.3}
          icon={<AlertCircle className="size-4" />}
        />
        <KPICard
          title="Inventory Units"
          value={loading ? '...' : kpiData.inventoryUnits.toLocaleString()}
          change={12.5}
          icon={<Package className="size-4" />}
        />
        <KPICard
          title="Net Revenue"
          value={loading ? '...' : formatCurrency(kpiData.netRevenue)}
          change={18.3}
          icon={<TrendingUp className="size-4" />}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
        <SalesTrendChart />
        <ExpenseBreakdownChart />
      </div>

      {/* Revenue Chart */}
      <RevenueChart />

      {/* Tables Grid */}
      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
        <RecentSalesTable />
        <PendingApprovalsTable />
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { AnalyticsFilters } from '@/components/admin/analytics-filters'
import { AnalyticsKPICards } from '@/components/admin/analytics-kpi-cards'
import { SalesGrowthChart } from '@/components/admin/charts/sales-growth-chart'
import { TopAgentsChart } from '@/components/admin/charts/top-agents-chart'
import { RevenueExpensesChart } from '@/components/admin/charts/revenue-expenses-chart'
import { ExpenseCategoriesChart } from '@/components/admin/charts/expense-categories-chart'
import { InventoryUtilizationChart } from '@/components/admin/charts/inventory-utilization-chart'
import { Download, FileText } from 'lucide-react'
import { useAnalytics } from '@/hooks/use-analytics'

export default function AnalyticsPage() {
  const [mounted, setMounted] = useState(false)
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
  const [endDate, setEndDate] = useState(new Date())
  const [selectedRegion, setSelectedRegion] = useState<string | undefined>()
  const [selectedAgent, setSelectedAgent] = useState<string | undefined>()

  const { kpis, trends, topAgents, revenueExpenses, expenseCategories, inventoryUtilization, loading } = useAnalytics()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="p-6 text-sm text-muted-foreground">Loading analytics…</div>
  }

  const handleExportCSV = () => {
    // TODO: Implement CSV export logic
    console.log('CSV export clicked')
  }

  const handleExportPDF = () => {
    // TODO: Implement PDF export logic
    console.log('PDF export clicked')
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Track sales performance, expenses, and inventory metrics in real-time</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={handleExportPDF} className="gap-2">
            <FileText className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <AnalyticsFilters
        onDateRangeChange={(start, end) => {
          setStartDate(start)
          setEndDate(end)
        }}
        onRegionChange={setSelectedRegion}
        onAgentChange={setSelectedAgent}
        dateRange={{ start: startDate, end: endDate }}
        selectedRegion={selectedRegion}
        selectedAgent={selectedAgent}
      />

      {/* KPI Cards */}
      <AnalyticsKPICards kpis={kpis} />

      {/* Charts Grid */}
      <div className="space-y-6">
        {/* Row 1: Sales Growth (full width) */}
        <SalesGrowthChart data={trends || []} />

        {/* Row 2: Top Agents & Revenue vs Expenses */}
        <div className="grid gap-6 lg:grid-cols-2">
          <TopAgentsChart data={topAgents || []} />
          <RevenueExpensesChart data={revenueExpenses || []} />
        </div>

        {/* Row 3: Expenses & Inventory */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ExpenseCategoriesChart data={expenseCategories || []} />
          <InventoryUtilizationChart data={inventoryUtilization || []} />
        </div>
      </div>
    </div>
  )
}

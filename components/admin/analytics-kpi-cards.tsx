'use client'

import { Card } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Zap, Users, AlertCircle, Package } from 'lucide-react'
import type { KPIs } from '@/types'

interface AnalyticsKPICardsProps {
  kpis: KPIs | null
}

export function AnalyticsKPICards({ kpis }: AnalyticsKPICardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  if (!kpis) return null

  const cards = [
    {
      title: "Today's Sales",
      value: formatCurrency(kpis.total_sales_today || 0),
      icon: TrendingUp,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950',
    },
    {
      title: "Today's Expenses",
      value: formatCurrency(kpis.total_expenses_today || 0),
      icon: TrendingDown,
      color: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-950',
    },
    {
      title: "Net Revenue Est.",
      value: formatCurrency(kpis.net_revenue_estimate || 0),
      icon: Zap,
      color: 'text-amber-500',
      bgColor: 'bg-amber-50 dark:bg-amber-950',
    },
    {
      title: "Active Agents",
      value: kpis.active_agents || 0,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      title: "Pending Approvals",
      value: kpis.pending_approvals || 0,
      icon: AlertCircle,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-950',
    },
    {
      title: "Inventory Issued",
      value: kpis.inventory_issued || 0,
      icon: Package,
      color: 'text-violet-500',
      bgColor: 'bg-violet-50 dark:bg-violet-950',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.title} className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                <p className="mt-2 text-2xl font-bold">{card.value}</p>
              </div>
              <div className={`rounded-lg p-3 ${card.bgColor}`}>
                <Icon className={`h-6 w-6 ${card.color}`} />
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

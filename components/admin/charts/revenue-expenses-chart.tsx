'use client'

import { Card } from '@/components/ui/card'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useTheme } from 'next-themes'

interface RevenueExpensesChartProps {
  data: { month: string, revenue: number, expenses: number }[]
}

export function RevenueExpensesChart({ data }: RevenueExpensesChartProps) {
  const { theme } = useTheme()

  const gridColor = theme === 'dark' ? '#374151' : '#e5e7eb'
  const textColor = theme === 'dark' ? '#9ca3af' : '#6b7280'

  if (!data || data.length === 0) {
    return (
      <Card className="p-6 flex items-center justify-center h-[380px]">
        <p className="text-muted-foreground">No revenue or expense data available.</p>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h3 className="mb-6 text-lg font-semibold">Revenue vs Expenses (12 Months)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="month" stroke={textColor} style={{ fontSize: '12px' }} />
          <YAxis stroke={textColor} style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
              border: `1px solid ${gridColor}`,
              borderRadius: '8px',
            }}
            labelStyle={{ color: textColor }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="revenue"
            fill="#10b981"
            stroke="#10b981"
            fillOpacity={0.3}
            name="Revenue"
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="expenses"
            fill="#ef4444"
            stroke="#ef4444"
            fillOpacity={0.3}
            name="Expenses"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  )
}

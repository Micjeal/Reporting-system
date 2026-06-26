'use client'

import { Card } from '@/components/ui/card'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useTheme } from 'next-themes'
import type { SalesTrend } from '@/types'

interface SalesGrowthChartProps {
  data: SalesTrend[]
}

export function SalesGrowthChart({ data }: SalesGrowthChartProps) {
  const { theme } = useTheme()

  // Map to chart format and calculate 7-day rolling average
  const chartData = data.map((item, index) => {
    const start = Math.max(0, index - 6)
    const window = data.slice(start, index + 1)
    const avg = Math.round(window.reduce((sum, d) => sum + d.daily_total, 0) / window.length)
    
    // Format date nicely (e.g. 'Oct 15')
    const dateObj = new Date(item.sale_date)
    const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    
    return { date: formattedDate, sales: item.daily_total, average: avg }
  })

  const gridColor = theme === 'dark' ? '#374151' : '#e5e7eb'
  const textColor = theme === 'dark' ? '#9ca3af' : '#6b7280'

  if (!data || data.length === 0) {
    return (
      <Card className="p-6 flex items-center justify-center h-[380px]">
        <p className="text-muted-foreground">No sales data available for this period.</p>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h3 className="mb-6 text-lg font-semibold">Sales Growth Trend</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="date" stroke={textColor} style={{ fontSize: '12px' }} />
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
          <Line
            type="monotone"
            dataKey="sales"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            name="Actual Sales"
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="average"
            stroke="#9ca3af"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="7-Day Avg"
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}

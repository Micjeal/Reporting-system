'use client'

import { Card } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useTheme } from 'next-themes'

interface InventoryUtilizationChartProps {
  data: { product: string, issued: number, sold: number }[]
}

export function InventoryUtilizationChart({ data }: InventoryUtilizationChartProps) {
  const { theme } = useTheme()

  const gridColor = theme === 'dark' ? '#374151' : '#e5e7eb'
  const textColor = theme === 'dark' ? '#9ca3af' : '#6b7280'

  if (!data || data.length === 0) {
    return (
      <Card className="p-6 flex items-center justify-center h-[380px]">
        <p className="text-muted-foreground">No inventory data available.</p>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h3 className="mb-6 text-lg font-semibold">Inventory Utilization (Issued vs Sold)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="product" stroke={textColor} style={{ fontSize: '12px' }} />
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
          <Bar dataKey="issued" fill="#3b82f6" name="Issued" radius={[8, 8, 0, 0]} />
          <Bar dataKey="sold" fill="#10b981" name="Sold" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}

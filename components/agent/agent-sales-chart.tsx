'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import * as salesService from '@/services/sales.service'

interface SalesData {
  day: string
  sales: number
  target: number
}

export function AgentSalesChart() {
  const [data, setData] = useState<SalesData[]>([])
  const [loading, setLoading] = useState(true)

  // Currency formatting helper
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX' }).format(amount)

  useEffect(() => {
    async function fetchSalesData() {
      try {
        const sales = await salesService.listSales()
        
        // Group sales by day for the last 7 days
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date()
          date.setDate(date.getDate() - (6 - i))
          return date
        })

        const dailyTarget = 2500 // Default daily target
        const chartData = last7Days.map(date => {
          const dateStr = date.toISOString().split('T')[0]
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
          
          const daySales = (sales ?? [])
            .filter(s => s.created_at?.startsWith(dateStr))
            .reduce((sum, s) => sum + (s.amount ?? 0), 0)

          return {
            day: dayName,
            sales: Math.round(daySales),
            target: dailyTarget,
          }
        })

        setData(chartData)
      } catch (error) {
        console.error('Failed to fetch sales data:', error)
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchSalesData()
  }, [])

  if (loading) {
    return (
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle>Sales This Week</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            Loading...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-1 lg:col-span-2 shadow-lg hover:shadow-xl transition-shadow duration-300 border-t-4 border-t-primary">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-foreground">Sales Performance</CardTitle>
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 rounded-lg">
              <div className="h-2.5 w-2.5 rounded-full bg-primary" />
              <span className="font-medium text-primary">Actual</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/20 rounded-lg">
              <div className="h-2.5 w-2.5 rounded-full border-2 border-dashed border-muted-foreground" />
              <span className="font-medium text-muted-foreground">Target</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            No sales data available
          </div>
        ) : (
          <div className="relative">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={data} margin={{ top: 30, right: 30, left: 20, bottom: 30 }}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="var(--color-border)" 
                  vertical={false} 
                  opacity={0.3}
                />
                <XAxis 
                  dataKey="day" 
                  stroke="var(--color-muted-foreground)" 
                  axisLine={false}
                  tickLine={false}
                  dy={12}
                  tick={{ fontSize: 12, fontWeight: 500 }}
                />
                <YAxis 
                  stroke="var(--color-muted-foreground)" 
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => formatCurrency(value)}
                  tick={{ fontSize: 11, fontWeight: 500 }}
                  width={60}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '0.75rem',
                    color: 'var(--color-foreground)',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    padding: '12px',
                  }}
                  itemStyle={{
                    fontWeight: '600',
                    fontSize: '14px',
                  }}
                  labelStyle={{
                    fontWeight: '600',
                    marginBottom: '8px',
                    color: 'var(--color-primary)',
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={40}
                  iconType="circle"
                  wrapperStyle={{
                    paddingTop: '24px',
                    fontSize: '13px',
                    fontWeight: '500',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="var(--color-primary)"
                  strokeWidth={4}
                  name="Actual Sales"
                  dot={{ 
                    fill: 'var(--color-primary)', 
                    r: 6,
                    strokeWidth: 3,
                    stroke: 'var(--color-card)',
                  }}
                  activeDot={{ 
                    r: 8,
                    strokeWidth: 3,
                    stroke: 'var(--color-card)',
                    fill: 'var(--color-primary)',
                  }}
                  animationDuration={1000}
                  animationBegin={200}
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke="var(--color-muted-foreground)"
                  strokeWidth={2}
                  strokeDasharray="6 6"
                  name="Daily Target"
                  dot={false}
                  animationDuration={1000}
                  animationBegin={200}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import * as salesService from '@/services/sales.service'

interface ChartDataPoint {
  date: string
  sales: number
  target: number
}

export function SalesTrendChart() {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSalesTrend() {
      try {
        const sales = await salesService.listSales()
        
        // Group sales by date (last 7 days)
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date()
          date.setDate(date.getDate() - (6 - i))
          return date.toISOString().split('T')[0]
        })

        const salesByDate = last7Days.map(date => {
          const daySales = (sales ?? []).filter(s => s.created_at?.startsWith(date))
          const totalAmount = daySales.reduce((sum, s) => sum + (s.amount ?? 0), 0)
          const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' })
          
          return {
            date: dayName,
            sales: totalAmount,
            target: 2500, // Static target for now
          }
        })

        setChartData(salesByDate)
      } catch (error) {
        console.error('Failed to fetch sales trend:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSalesTrend()
  }, [])

  if (loading) {
    return (
      <Card className="min-w-0 overflow-hidden">
        <CardHeader>
          <CardTitle>Sales Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full flex items-center justify-center text-muted-foreground">
            Loading...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader>
        <CardTitle>Sales Trend</CardTitle>
      </CardHeader>
      <CardContent className="min-w-0">
        <div className="h-80 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                stroke="var(--color-muted-foreground)"
              />
              <YAxis 
                className="text-xs"
                stroke="var(--color-muted-foreground)"
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="var(--color-primary)"
                strokeWidth={2}
                dot={{ fill: 'var(--color-primary)', r: 4 }}
                activeDot={{ r: 6 }}
                name="Actual Sales"
              />
              <Line
                type="monotone"
                dataKey="target"
                stroke="var(--color-muted-foreground)"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: 'var(--color-muted-foreground)', r: 4 }}
                activeDot={{ r: 6 }}
                name="Target"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

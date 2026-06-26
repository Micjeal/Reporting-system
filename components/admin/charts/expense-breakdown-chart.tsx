'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import * as expensesService from '@/services/expenses.service'

interface ChartDataPoint {
  category: string
  amount: number
  budget: number
}

export function ExpenseBreakdownChart() {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchExpenseBreakdown() {
      try {
        const expenses = await expensesService.listExpenses()
        
        // Group expenses by category
        const categoryMap = new Map<string, number>()
        ;(expenses ?? []).forEach(expense => {
          const category = expense.category || 'Other'
          categoryMap.set(category, (categoryMap.get(category) || 0) + expense.amount)
        })

        // Convert to chart data with static budgets
        const budgetMap: Record<string, number> = {
          'Travel': 5000,
          'Meals': 4000,
          'Office': 2500,
          'Supplies': 3500,
          'Other': 2000,
        }

        const data = Array.from(categoryMap.entries()).map(([category, amount]) => ({
          category,
          amount,
          budget: budgetMap[category] || 3000,
        }))

        setChartData(data)
      } catch (error) {
        console.error('Failed to fetch expense breakdown:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchExpenseBreakdown()
  }, [])

  if (loading) {
    return (
      <Card className="min-w-0 overflow-hidden">
        <CardHeader>
          <CardTitle>Expense Breakdown</CardTitle>
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
        <CardTitle>Expense Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="min-w-0">
        <div className="h-80 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis 
                dataKey="category" 
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
              <Bar
                dataKey="amount"
                fill="var(--color-primary)"
                radius={[8, 8, 0, 0]}
                name="Actual"
              />
              <Bar
                dataKey="budget"
                fill="var(--color-muted)"
                radius={[8, 8, 0, 0]}
                name="Budget"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

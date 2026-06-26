'use client'

import { useState, useEffect } from 'react'
import { FileText, Receipt, Utensils, Car, Package } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import * as expensesService from '@/services/expenses.service'
import type { Expense } from '@/types/database'

const getCategoryIcon = (category: string) => {
  switch (category?.toLowerCase()) {
    case 'food':
    case 'meals':
      return <Utensils size={18} />
    case 'fuel':
    case 'travel':
      return <Car size={18} />
    case 'accommodation':
    case 'materials':
      return <Package size={18} />
    default:
      return <FileText size={18} />
  }
}

const getCategoryColor = (category: string) => {
  switch (category?.toLowerCase()) {
    case 'food':
    case 'meals':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    case 'fuel':
    case 'travel':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case 'accommodation':
    case 'materials':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  }
}

export function RecentExpensesList() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  // Currency formatting helper
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX' }).format(amount)

  useEffect(() => {
    async function fetchRecentExpenses() {
      try {
        const data = await expensesService.listExpenses({})
        const recentExpenses = (data ?? [])
          .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
          .slice(0, 5)
        setExpenses(recentExpenses)
      } catch (error) {
        console.error('Failed to fetch recent expenses:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentExpenses()
  }, [])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
    } else if (diffDays === 1) {
      return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
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
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">Recent Expenses</CardTitle>
          <span className="text-sm text-muted-foreground">
            {expenses.length} expense{expenses.length !== 1 && 's'}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {expenses.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            No recent expenses
          </div>
        ) : (
          <div className="space-y-3">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-start gap-3 p-3 sm:p-4 border border-border rounded-xl hover:bg-accent/50 hover:border-primary/30 transition-all duration-300 group"
              >
                {/* Icon */}
                <div className={`p-2 sm:p-3 rounded-xl shrink-0 ${getCategoryColor(expense.category)} group-hover:scale-110 transition-transform duration-300`}>
                  {getCategoryIcon(expense.category)}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors capitalize truncate">{expense.category}</p>
                  <p className="text-xs text-muted-foreground truncate">{expense.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(expense.created_at || '')}</p>
                </div>
                
                {/* Amount & Action */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <p className="font-bold text-sm sm:text-base text-foreground whitespace-nowrap">
                      {formatCurrency(expense.amount)}
                    </p>
                  </div>
                  {expense.receipt_url && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent shrink-0"
                      title="View receipt"
                      onClick={() => window.open(expense.receipt_url!, '_blank')}
                    >
                      <Receipt size={16} />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

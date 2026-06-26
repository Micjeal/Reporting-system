'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Printer } from 'lucide-react'

interface Sale {
  id: string
  agent_id: string
  product_id: string
  quantity: number
  amount: number
  date: string
  customer_name?: string | null
  customer_phone?: string | null
  location?: string | null
  route?: string | null
  bank_details?: string | null
  expenses_total?: number | null
  tokens_deducted?: number | null
  returns_amount?: number | null
  notes?: string | null
  created_at: string
}

interface RouteSalesReportProps {
  sales: Sale[]
  route: string
  agentName: string
}

export function RouteSalesReport({ sales, route, agentName }: RouteSalesReportProps) {
  const reportData = useMemo(() => {
    const routeSales = sales.filter((s) => s.route === route)

    const totalSales = routeSales.reduce((sum, s) => sum + s.amount, 0)
    const totalExpenses = routeSales.reduce((sum, s) => sum + (s.expenses_total || 0), 0)
    const totalTokens = routeSales.reduce((sum, s) => sum + (s.tokens_deducted || 0), 0)
    const totalReturns = routeSales.reduce((sum, s) => sum + (s.returns_amount || 0), 0)
    const netRevenue = totalSales - totalExpenses - totalTokens - totalReturns

    // Group expenses by category
    const expensesByCategory: Record<string, number> = {}
    routeSales.forEach((sale) => {
      if (sale.notes) {
        const categories = ['fuel', 'feeding', 'accommodation', 'airtime', 'parking', 'other']
        categories.forEach((cat) => {
          if (sale.notes?.toLowerCase().includes(cat)) {
            expensesByCategory[cat] = (expensesByCategory[cat] || 0) + (sale.expenses_total || 0)
          }
        })
      }
    })

    // Group banking details
    const bankingDetails: Record<string, number> = {}
    routeSales.forEach((sale) => {
      if (sale.bank_details) {
        bankingDetails[sale.bank_details] = (bankingDetails[sale.bank_details] || 0) + sale.amount
      }
    })

    return {
      routeSales,
      totalSales,
      totalExpenses,
      totalTokens,
      totalReturns,
      netRevenue,
      expensesByCategory,
      bankingDetails,
      invoiceCount: routeSales.length,
    }
  }, [sales, route])

  const handlePrint = () => {
    window.print()
  }

  const handleExport = () => {
    const csv = [
      ['ROUTE SALES SUMMARY REPORT'],
      ['Route', route],
      ['Agent', agentName],
      ['Date', new Date().toLocaleDateString()],
      [],
      ['SALES SUMMARY'],
      ['Invoice Count', reportData.invoiceCount],
      ['Total Sales', reportData.totalSales.toFixed(2)],
      ['Less: Expenses', reportData.totalExpenses.toFixed(2)],
      ['Less: Tokens', reportData.totalTokens.toFixed(2)],
      ['Less: Returns', reportData.totalReturns.toFixed(2)],
      ['Net Revenue', reportData.netRevenue.toFixed(2)],
      [],
      ['EXPENSES BREAKDOWN'],
      ...Object.entries(reportData.expensesByCategory).map(([cat, amount]) => [
        cat.charAt(0).toUpperCase() + cat.slice(1),
        amount.toFixed(2),
      ]),
      [],
      ['BANKING DETAILS'],
      ...Object.entries(reportData.bankingDetails).map(([bank, amount]) => [bank, amount.toFixed(2)]),
      [],
      ['TRANSACTIONS'],
      ['Date', 'Customer', 'Location', 'Quantity', 'Amount', 'Expenses', 'Returns'],
      ...reportData.routeSales.map((s) => [
        s.date,
        s.customer_name || '-',
        s.location || '-',
        s.quantity,
        s.amount.toFixed(2),
        (s.expenses_total || 0).toFixed(2),
        (s.returns_amount || 0).toFixed(2),
      ]),
    ]
      .map((row) => (Array.isArray(row) ? row.map((cell) => `"${cell}"`).join(',') : row))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `route-sales-report-${route}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between print:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Route Sales Summary Report</h2>
          <p className="text-muted-foreground">
            Route: <span className="font-semibold">{route}</span> | Agent: <span className="font-semibold">{agentName}</span>
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button onClick={handlePrint} variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-5 print:grid-cols-5">
        <Card className="print:border print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.invoiceCount}</div>
          </CardContent>
        </Card>
        <Card className="print:border print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${reportData.totalSales.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card className="print:border print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">${reportData.totalExpenses.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card className="print:border print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Returns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${reportData.totalReturns.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card className="print:border print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Net Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${reportData.netRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Expenses Breakdown */}
      <Card className="print:border print:shadow-none">
        <CardHeader>
          <CardTitle>Expenses Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              {Object.entries(reportData.expensesByCategory).map(([category, amount]) => (
                <div key={category} className="flex justify-between text-sm">
                  <span className="capitalize">{category}</span>
                  <span className="font-semibold">${amount.toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between font-bold">
                <span>Total Expenses</span>
                <span>${reportData.totalExpenses.toFixed(2)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Sales</span>
                <span className="font-semibold">${reportData.totalSales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Less: Tokens</span>
                <span className="font-semibold">${reportData.totalTokens.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Less: Returns</span>
                <span className="font-semibold">${reportData.totalReturns.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-green-600">
                <span>Net Revenue</span>
                <span>${reportData.netRevenue.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Banking Details */}
      {Object.keys(reportData.bankingDetails).length > 0 && (
        <Card className="print:border print:shadow-none">
          <CardHeader>
            <CardTitle>Banking Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left py-2 px-4">Bank/Account</th>
                    <th className="text-right py-2 px-4">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(reportData.bankingDetails).map(([bank, amount]) => (
                    <tr key={bank} className="border-b">
                      <td className="py-2 px-4">{bank}</td>
                      <td className="text-right py-2 px-4 font-semibold">${amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transactions Table */}
      <Card className="print:border print:shadow-none">
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>{reportData.routeSales.length} sales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left py-2 px-4">Date</th>
                  <th className="text-left py-2 px-4">Customer</th>
                  <th className="text-left py-2 px-4">Location</th>
                  <th className="text-right py-2 px-4">Qty</th>
                  <th className="text-right py-2 px-4">Amount</th>
                  <th className="text-right py-2 px-4">Expenses</th>
                  <th className="text-right py-2 px-4">Returns</th>
                </tr>
              </thead>
              <tbody>
                {reportData.routeSales.map((sale, idx) => (
                  <tr key={sale.id} className={`border-b ${idx % 2 === 0 ? 'bg-white' : 'bg-muted/30'}`}>
                    <td className="py-2 px-4">{new Date(sale.date).toLocaleDateString()}</td>
                    <td className="py-2 px-4">{sale.customer_name || '-'}</td>
                    <td className="py-2 px-4">{sale.location || '-'}</td>
                    <td className="text-right py-2 px-4">{sale.quantity}</td>
                    <td className="text-right py-2 px-4 font-semibold">${sale.amount.toFixed(2)}</td>
                    <td className="text-right py-2 px-4 text-orange-600">${(sale.expenses_total || 0).toFixed(2)}</td>
                    <td className="text-right py-2 px-4 text-red-600">${(sale.returns_amount || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Signature Section */}
      <div className="grid gap-8 md:grid-cols-3 pt-8 border-t">
        <div className="space-y-12">
          <div>
            <p className="text-sm font-semibold">Prepared by:</p>
            <div className="h-12" />
            <p className="text-xs text-muted-foreground">Signature & Date</p>
          </div>
        </div>
        <div className="space-y-12">
          <div>
            <p className="text-sm font-semibold">Received by:</p>
            <div className="h-12" />
            <p className="text-xs text-muted-foreground">Signature & Date</p>
          </div>
        </div>
        <div className="space-y-12">
          <div>
            <p className="text-sm font-semibold">Approved by:</p>
            <div className="h-12" />
            <p className="text-xs text-muted-foreground">Signature & Date</p>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { SalesReportTab } from '@/components/admin/reports/sales-report-tab'
import { ExpensesReportTab } from '@/components/admin/reports/expenses-report-tab'
import { InventoryReportTab } from '@/components/admin/reports/inventory-report-tab'

// Main Reports Page
export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('sales')

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          View comprehensive business intelligence across sales, expenses, and inventory
        </p>
      </header>

      {/* Tab Navigation */}
      <Card>
        <CardHeader>
          <CardTitle>Business Reports</CardTitle>
          <CardDescription>
            Analyze performance metrics and trends across your business
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="sales">Sales</TabsTrigger>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
            </TabsList>

            {/* Sales Report Tab */}
            <TabsContent value="sales" className="mt-6">
              <SalesReportTab />
            </TabsContent>

            {/* Expenses Report Tab */}
            <TabsContent value="expenses" className="mt-6">
              <ExpensesReportTab />
            </TabsContent>

            {/* Inventory Report Tab */}
            <TabsContent value="inventory" className="mt-6">
              <InventoryReportTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

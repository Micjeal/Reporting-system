'use client'

import { DollarSign, TrendingUp, Package, Target } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface AgentKPICardsProps {
  salesToday: number
  expensesToday: number
  inventoryAssigned: number
  monthlyTargetProgress: number
  monthlyTarget: number
  loading?: boolean
  agentName?: string
}

export function AgentKPICards({
  salesToday,
  expensesToday,
  inventoryAssigned,
  monthlyTargetProgress,
  monthlyTarget,
  loading = false,
  agentName = 'Agent',
}: AgentKPICardsProps) {
  const progressPercentage = monthlyTarget > 0 
    ? (monthlyTargetProgress / monthlyTarget) * 100 
    : 0

  // Currency formatting helper - use fixed format to avoid hydration mismatch
  const formatCurrency = (amount: number) => {
    // Use a consistent format that won't change between server and client
    // Format: UGX 50,000
    const formatted = new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
    
    // Normalize to UGX prefix (some locales might use USh)
    return formatted.replace('USh', 'UGX')
  }

  // Safe currency formatting that handles undefined/NaN
  const safeFormatCurrency = (amount: number | undefined | null) => {
    const num = typeof amount === 'number' && !isNaN(amount) ? amount : 0
    return formatCurrency(num)
  }

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Sales Today */}
        <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-t-4 border-t-primary">
          <div className="absolute top-1 left-2 z-10">
            <span className="text-[5px] sm:text-[6px] text-muted-foreground/50 font-normal truncate max-w-[50px] sm:max-w-[80px] block">{agentName}</span>
          </div>
          <div className="absolute top-0 right-0 p-2 sm:p-4 opacity-10">
            <DollarSign className="h-16 w-16 sm:h-24 sm:w-24 text-primary" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Sales Today
            </CardTitle>
            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-xl sm:text-3xl font-bold text-foreground">
              {loading ? '...' : safeFormatCurrency(salesToday)}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2">
              Today's revenue
            </p>
          </CardContent>
        </Card>

        {/* Expenses Today */}
        <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-t-4 border-t-red-500">
          <div className="absolute top-1 left-2 z-10">
            <span className="text-[5px] sm:text-[6px] text-muted-foreground/50 font-normal truncate max-w-[50px] sm:max-w-[80px] block">{agentName}</span>
          </div>
          <div className="absolute top-0 right-0 p-2 sm:p-4 opacity-10">
            <TrendingUp className="h-16 w-16 sm:h-24 sm:w-24 text-red-500" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Expenses Today
            </CardTitle>
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-xl sm:text-3xl font-bold text-foreground">
              {loading ? '...' : safeFormatCurrency(expensesToday)}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2">
              Today's costs
            </p>
          </CardContent>
        </Card>

        {/* Inventory Assigned */}
        <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-t-4 border-t-blue-500">
          <div className="absolute top-1 left-2 z-10">
            <span className="text-[5px] sm:text-[6px] text-muted-foreground/50 font-normal truncate max-w-[50px] sm:max-w-[80px] block">{agentName}</span>
          </div>
          <div className="absolute top-0 right-0 p-2 sm:p-4 opacity-10">
            <Package className="h-16 w-16 sm:h-24 sm:w-24 text-blue-500" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Inventory
            </CardTitle>
            <Package className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-xl sm:text-3xl font-bold text-foreground">
              {loading ? '...' : (inventoryAssigned || 0).toLocaleString('en-US')}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2">
              Units in stock
            </p>
          </CardContent>
        </Card>

        {/* Monthly Target Progress */}
        <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-t-4 border-t-emerald-500">
          <div className="absolute top-1 left-2 z-10">
            <span className="text-[5px] sm:text-[6px] text-muted-foreground/50 font-normal truncate max-w-[50px] sm:max-w-[80px] block">{agentName}</span>
          </div>
          <div className="absolute top-0 right-0 p-2 sm:p-4 opacity-10">
            <Target className="h-16 w-16 sm:h-24 sm:w-24 text-emerald-500" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Monthly Target
            </CardTitle>
            <Target className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="space-y-2 sm:space-y-3">
              <div>
                <div className="text-xl sm:text-3xl font-bold text-foreground">
                  {loading ? '...' : safeFormatCurrency(monthlyTargetProgress)}
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  of {safeFormatCurrency(monthlyTarget)}
                </p>
              </div>
              <Progress value={loading ? 0 : Math.min(progressPercentage, 100)} className="h-2 sm:h-2.5" />
              <p className="text-[10px] sm:text-xs font-semibold text-emerald-600">
                {loading ? '...' : `${Math.round(progressPercentage)}% Complete`}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

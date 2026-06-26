'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface KPICardProps {
  title: string
  value: string | number
  change: number // percentage
  icon: React.ReactNode
  showLive?: boolean
}

export function KPICard({ title, value, change, icon, showLive = false }: KPICardProps) {
  const isPositive = change >= 0
  const TrendIcon = isPositive ? TrendingUp : TrendingDown

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-2">
        <CardTitle className="min-w-0 truncate text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="flex flex-shrink-0 items-center gap-2">
          {showLive && (
            <div className="flex items-center gap-1 text-xs text-destructive font-medium">
              <div className="animate-pulse size-2 rounded-full bg-destructive" />
              Live
            </div>
          )}
          <div className="text-muted-foreground">{icon}</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex min-w-0 flex-col gap-2">
          <div className="truncate text-xl font-bold text-foreground sm:text-2xl">{value}</div>
          <div className="flex items-center gap-1">
            <TrendIcon
              className={cn(
                'size-4',
                isPositive
                  ? 'text-green-500 dark:text-green-400'
                  : 'text-red-500 dark:text-red-400'
              )}
            />
            <span
              className={cn(
                'truncate text-xs font-medium',
                isPositive
                  ? 'text-green-500 dark:text-green-400'
                  : 'text-red-500 dark:text-red-400'
              )}
            >
              {isPositive ? '+' : ''}{change}% from last period
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

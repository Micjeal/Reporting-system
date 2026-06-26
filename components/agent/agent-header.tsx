'use client'

import { User, MapPin, Calendar } from 'lucide-react'

interface AgentHeaderProps {
  agentName: string
  region: string
  date?: string
}

export function AgentHeader({ agentName, region, date }: AgentHeaderProps) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            Welcome back,
          </h1>
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-primary mt-1 truncate">
            {agentName}
          </h2>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base md:text-lg">
            Ready to close some deals today
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
          <div className="flex items-center gap-2 bg-card px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border border-border shadow-sm">
            <MapPin size={14} className="text-primary" />
            <span className="font-semibold truncate max-w-[100px] sm:max-w-none">{region}</span>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-card px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border border-border shadow-sm">
            <Calendar size={14} className="text-primary" />
            <span className="font-medium truncate max-w-[120px] sm:max-w-none">{today}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

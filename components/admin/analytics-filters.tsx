'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from 'lucide-react'
import { format } from 'date-fns'
import * as usersService from '@/services/users.service'

const ALL_VALUE = '__all__'

interface AnalyticsFiltersProps {
  onDateRangeChange: (startDate: Date, endDate: Date) => void
  onRegionChange: (region: string | undefined) => void
  onAgentChange: (agent: string | undefined) => void
  dateRange?: { start: Date; end: Date }
  selectedRegion?: string
  selectedAgent?: string
}

export function AnalyticsFilters({
  onDateRangeChange,
  onRegionChange,
  onAgentChange,
  dateRange,
  selectedRegion,
  selectedAgent,
}: AnalyticsFiltersProps) {
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [tempStartDate, setTempStartDate] = useState<Date>(dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
  const [tempEndDate, setTempEndDate] = useState<Date>(dateRange?.end || new Date())
  
  // Fetch real data for filters
  const [agents, setAgents] = useState<Array<{ id: string; name: string }>>([])
  const [regions, setRegions] = useState<string[]>([])

  useEffect(() => {
    async function fetchFilterData() {
      try {
        const users = await usersService.listUsers({ role: 'agent' })
        
        // Extract agents with names
        const agentsList = (users ?? [])
          .filter(u => u.name)
          .map(u => ({ id: u.id, name: u.name! }))
        setAgents(agentsList)
        
        // Extract unique regions
        const uniqueRegions = Array.from(
          new Set((users ?? []).map(u => u.region).filter(Boolean))
        ) as string[]
        setRegions(uniqueRegions.sort())
      } catch (error) {
        console.error('Failed to load filter data:', error)
        // Set empty arrays on error - filters will just be empty
        setAgents([])
        setRegions([])
      }
    }
    
    fetchFilterData()
  }, [])

  const handleApplyDateRange = () => {
    onDateRangeChange(tempStartDate, tempEndDate)
    setShowDatePicker(false)
  }

  const handleResetFilters = () => {
    const defaultStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const defaultEnd = new Date()
    onDateRangeChange(defaultStart, defaultEnd)
    onRegionChange(undefined)
    onAgentChange(undefined)
    setTempStartDate(defaultStart)
    setTempEndDate(defaultEnd)
  }

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        {/* Date Range Picker Button */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Date Range</label>
          <Button
            variant="outline"
            className="w-full lg:w-auto"
            onClick={() => setShowDatePicker(!showDatePicker)}
          >
            <Calendar className="mr-2 h-4 w-4" />
            {dateRange
              ? `${format(dateRange.start, 'MMM dd')} - ${format(dateRange.end, 'MMM dd')}`
              : 'Select dates'}
          </Button>
        </div>

        {/* Region Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Region</label>
          <Select
            value={selectedRegion ?? ALL_VALUE}
            onValueChange={(value) => onRegionChange(value === ALL_VALUE ? undefined : value)}
          >
            <SelectTrigger className="w-full lg:w-48">
              <SelectValue placeholder="All regions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>All regions</SelectItem>
              {regions.map((region) => (
                <SelectItem key={region} value={region}>
                  {region}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Agent Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Agent</label>
          <Select
            value={selectedAgent ?? ALL_VALUE}
            onValueChange={(value) => onAgentChange(value === ALL_VALUE ? undefined : value)}
          >
            <SelectTrigger className="w-full lg:w-48">
              <SelectValue placeholder="All agents" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>All agents</SelectItem>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Reset Button */}
        <Button variant="outline" onClick={handleResetFilters} className="w-full lg:w-auto">
          Reset Filters
        </Button>
      </div>

      {/* Date Range Picker Expanded */}
      {showDatePicker && (
        <div className="space-y-3 border-t border-border pt-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="start-date" className="text-sm font-medium">Start Date</label>
              <input
                id="start-date"
                type="date"
                value={format(tempStartDate, 'yyyy-MM-dd')}
                onChange={(e) => setTempStartDate(new Date(e.target.value))}
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="end-date" className="text-sm font-medium">End Date</label>
              <input
                id="end-date"
                type="date"
                value={format(tempEndDate, 'yyyy-MM-dd')}
                onChange={(e) => setTempEndDate(new Date(e.target.value))}
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleApplyDateRange} className="flex-1">
              Apply
            </Button>
            <Button variant="outline" onClick={() => setShowDatePicker(false)} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

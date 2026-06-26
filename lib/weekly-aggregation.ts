/**
 * Weekly Aggregation Utilities
 * 
 * This module provides functions for calculating week boundaries, generating week ranges,
 * and working with weekly data. All weeks start on Sunday (day 0) and end on Saturday (day 6).
 */

export type WeekOption = 
  | 'this-week'      // Current week (Sunday to today)
  | 'last-week'      // Previous complete week
  | 'last-4-weeks'   // Last 4 complete weeks
  | 'last-8-weeks'   // Last 8 complete weeks
  | 'last-12-weeks'  // Last 12 complete weeks
  | 'custom'         // User-defined date range

/**
 * Calculates the start and end dates for a given week option.
 * Weeks always start on Sunday and end on Saturday.
 * 
 * @param option - The week option to calculate boundaries for
 * @returns An object with start and end Date objects
 * 
 * @example
 * const { start, end } = getWeekBoundaries('this-week')
 * // Returns: { start: <last Sunday>, end: <today> }
 */
export function getWeekBoundaries(option: WeekOption): { start: Date; end: Date } {
  const today = new Date()
  const currentDay = today.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
  // Calculate most recent Sunday (start of current week)
  const thisSunday = new Date(today)
  thisSunday.setDate(today.getDate() - currentDay)
  thisSunday.setHours(0, 0, 0, 0)
  
  // Calculate Saturday of current week
  const thisSaturday = new Date(thisSunday)
  thisSaturday.setDate(thisSunday.getDate() + 6)
  thisSaturday.setHours(23, 59, 59, 999)
  
  switch (option) {
    case 'this-week':
      // Current week from Sunday to today
      return { start: thisSunday, end: today }
    
    case 'last-week': {
      // Previous complete week (Sunday to Saturday)
      const lastSunday = new Date(thisSunday)
      lastSunday.setDate(thisSunday.getDate() - 7)
      const lastSaturday = new Date(lastSunday)
      lastSaturday.setDate(lastSunday.getDate() + 6)
      lastSaturday.setHours(23, 59, 59, 999)
      return { start: lastSunday, end: lastSaturday }
    }
    
    case 'last-4-weeks': {
      // Last 4 complete weeks
      const start4 = new Date(thisSunday)
      start4.setDate(thisSunday.getDate() - (4 * 7))
      return { start: start4, end: thisSaturday }
    }
    
    case 'last-8-weeks': {
      // Last 8 complete weeks
      const start8 = new Date(thisSunday)
      start8.setDate(thisSunday.getDate() - (8 * 7))
      return { start: start8, end: thisSaturday }
    }
    
    case 'last-12-weeks': {
      // Last 12 complete weeks
      const start12 = new Date(thisSunday)
      start12.setDate(thisSunday.getDate() - (12 * 7))
      return { start: start12, end: thisSaturday }
    }
    
    case 'custom':
      // For custom, return current week as default
      // Actual custom dates should be provided by the caller
      return { start: thisSunday, end: thisSaturday }
    
    default:
      // Fallback to current week
      return { start: thisSunday, end: today }
  }
}

/**
 * Generates a unique key for the week containing the given date.
 * The key is the ISO date string (YYYY-MM-DD) of the Sunday that starts the week.
 * 
 * @param date - The date to get the week key for
 * @returns ISO date string of the Sunday that starts the week
 * 
 * @example
 * const key = getWeekKey(new Date('2024-01-10')) // Wednesday
 * // Returns: '2024-01-07' (the Sunday of that week)
 */
export function getWeekKey(date: Date): string {
  const sunday = new Date(date)
  sunday.setDate(date.getDate() - date.getDay())
  sunday.setHours(0, 0, 0, 0)
  return sunday.toISOString().split('T')[0]
}

/**
 * Generates an array of week ranges that fall within or overlap the given date range.
 * Each week starts on Sunday and ends on Saturday.
 * 
 * @param start - The start date of the range
 * @param end - The end date of the range
 * @returns Array of week range objects with key, start, and end ISO date strings
 * 
 * @example
 * const ranges = generateWeekRanges(new Date('2024-01-01'), new Date('2024-01-15'))
 * // Returns: [
 * //   { key: '2023-12-31', start: '2023-12-31', end: '2024-01-06' },
 * //   { key: '2024-01-07', start: '2024-01-07', end: '2024-01-13' },
 * //   { key: '2024-01-14', start: '2024-01-14', end: '2024-01-20' }
 * // ]
 */
export function generateWeekRanges(
  start: Date,
  end: Date
): Array<{ key: string; start: string; end: string }> {
  const weeks: Array<{ key: string; start: string; end: string }> = []
  const current = new Date(start)
  
  // Align to the Sunday of the week containing the start date
  current.setDate(current.getDate() - current.getDay())
  current.setHours(0, 0, 0, 0)
  
  // Generate weeks until we pass the end date
  while (current <= end) {
    const weekStart = new Date(current)
    const weekEnd = new Date(current)
    weekEnd.setDate(current.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)
    
    weeks.push({
      key: weekStart.toISOString().split('T')[0],
      start: weekStart.toISOString().split('T')[0],
      end: weekEnd.toISOString().split('T')[0],
    })
    
    // Move to next week (add 7 days)
    current.setDate(current.getDate() + 7)
  }
  
  return weeks
}

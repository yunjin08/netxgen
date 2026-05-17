import { format, formatDistanceToNow, parseISO, differenceInHours, differenceInDays } from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'

export const PH_TIMEZONE = 'Asia/Manila'

/**
 * Format a date string or Date in Philippine timezone
 */
export function formatPHDate(date: string | Date, fmt = 'MMM d, yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  const zoned = toZonedTime(d, PH_TIMEZONE)
  return format(zoned, fmt)
}

/**
 * Format date with time in Philippine timezone
 */
export function formatPHDateTime(date: string | Date): string {
  return formatPHDate(date, 'MMM d, yyyy h:mm a')
}

/**
 * Format time only in Philippine timezone
 */
export function formatPHTime(date: string | Date): string {
  return formatPHDate(date, 'h:mm a')
}

/**
 * Get relative time (e.g. "2 hours ago")
 */
export function timeAgo(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(d, { addSuffix: true })
}

/**
 * Convert a local Philippine date to UTC for Supabase storage
 */
export function phToUTC(date: Date): Date {
  return fromZonedTime(date, PH_TIMEZONE)
}

/**
 * Calculate duration in days between two dates
 */
export function durationInDays(start: string | Date, end: string | Date): number {
  const s = typeof start === 'string' ? parseISO(start) : start
  const e = typeof end === 'string' ? parseISO(end) : end
  return Math.max(1, differenceInDays(e, s))
}

/**
 * Calculate hours late past a due date
 */
export function hoursLate(dueDate: string | Date, returnDate: string | Date = new Date()): number {
  const due = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate
  const ret = typeof returnDate === 'string' ? parseISO(returnDate) : returnDate
  const hours = differenceInHours(ret, due)
  return Math.max(0, hours)
}

/**
 * Format Philippine phone number (strip +63 prefix)
 */
export function formatPHPhone(phone: string): string {
  // Strip +63 and ensure 11 digits starting with 09
  let cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('63')) cleaned = '0' + cleaned.slice(2)
  if (!cleaned.startsWith('0')) cleaned = '0' + cleaned
  return cleaned.slice(0, 11)
}

/**
 * Check if a booking is overdue
 */
export function isOverdue(endDate: string | Date): boolean {
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate
  return new Date() > end
}

/**
 * Get a short date range string (e.g. "Jan 1 - Jan 7, 2024")
 */
export function dateRangeLabel(start: string | Date, end: string | Date): string {
  const s = formatPHDate(start, 'MMM d')
  const e = formatPHDate(end, 'MMM d, yyyy')
  return `${s} – ${e}`
}

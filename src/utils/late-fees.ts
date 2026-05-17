import { parseISO } from 'date-fns'
import { hoursLate } from './dates'
import type { OrgSettings } from '@/types'

/**
 * Calculate late fee based on org settings
 */
export function calculateLateFee(
  endDate: string | Date,
  returnDate: string | Date = new Date(),
  totalRentalAmount: number,
  settings: Pick<OrgSettings, 'late_fee_type' | 'late_fee_value' | 'grace_period_hours'>
): number {
  const hours = hoursLate(endDate, returnDate)
  const gracePeriod = settings.grace_period_hours ?? 2

  if (hours <= gracePeriod) return 0

  const billableHours = hours - gracePeriod
  const daysLate = Math.ceil(billableHours / 24)

  if (settings.late_fee_type === 'percentage') {
    return Math.round((totalRentalAmount * (settings.late_fee_value / 100)) * daysLate * 100) / 100
  }

  // flat rate per day
  return settings.late_fee_value * daysLate
}

/**
 * Format late fee description for display
 */
export function lateFeeDescription(
  endDate: string | Date,
  returnDate: string | Date = new Date(),
  settings: Pick<OrgSettings, 'late_fee_type' | 'late_fee_value' | 'grace_period_hours'>
): string {
  const hours = hoursLate(endDate, returnDate)
  const gracePeriod = settings.grace_period_hours ?? 2

  if (hours <= 0) return 'Returned on time'
  if (hours <= gracePeriod) return `${hours}h late (within grace period)`

  const billableHours = hours - gracePeriod
  const daysLate = Math.ceil(billableHours / 24)

  if (settings.late_fee_type === 'percentage') {
    return `${daysLate} day(s) late @ ${settings.late_fee_value}%/day`
  }
  return `${daysLate} day(s) late @ ₱${settings.late_fee_value}/day`
}

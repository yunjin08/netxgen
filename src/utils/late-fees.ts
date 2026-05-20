import { parseISO } from 'date-fns'
import { hoursLate } from './dates'
import type { OrgSettings } from '@/types'

/**
 * Calculate late fee based on org settings
 */
type LateFeeSettings = Pick<OrgSettings, 'late_fee_type' | 'late_fee_value' | 'grace_period_hours'> &
  Partial<Pick<OrgSettings, 'late_fee_period'>>

export function calculateLateFee(
  endDate: string | Date,
  returnDate: string | Date = new Date(),
  totalRentalAmount: number,
  settings: LateFeeSettings
): number {
  const hours = hoursLate(endDate, returnDate)
  const gracePeriod = settings.grace_period_hours ?? 2

  if (hours <= gracePeriod) return 0

  const billableHours = hours - gracePeriod
  const period = settings.late_fee_period ?? 'day'
  const units = period === 'hour' ? Math.ceil(billableHours) : Math.ceil(billableHours / 24)

  if (settings.late_fee_type === 'percentage') {
    return Math.round((totalRentalAmount * (settings.late_fee_value / 100)) * units * 100) / 100
  }

  return settings.late_fee_value * units
}

/**
 * Format late fee description for display
 */
export function lateFeeDescription(
  endDate: string | Date,
  returnDate: string | Date = new Date(),
  settings: LateFeeSettings
): string {
  const hours = hoursLate(endDate, returnDate)
  const gracePeriod = settings.grace_period_hours ?? 2

  if (hours <= 0) return 'Returned on time'
  if (hours <= gracePeriod) return `${hours}h late (within grace period)`

  const billableHours = hours - gracePeriod
  const period = settings.late_fee_period ?? 'day'
  const units = period === 'hour' ? Math.ceil(billableHours) : Math.ceil(billableHours / 24)
  const unitLabel = period === 'hour' ? 'hour' : 'day'

  if (settings.late_fee_type === 'percentage') {
    return `${units} ${unitLabel}(s) late @ ${settings.late_fee_value}%/${unitLabel}`
  }
  return `${units} ${unitLabel}(s) late @ ₱${settings.late_fee_value}/${unitLabel}`
}

import { cn } from '@/utils/cn'
import type { BookingStatus, EquipmentStatus } from '@/types'

const bookingStatusConfig: Record<BookingStatus, { label: string; className: string }> = {
  draft: {
    label: 'Draft',
    className: 'bg-grey-60/30 text-grey-20 border border-grey-60/50',
  },
  confirmed: {
    label: 'Confirmed',
    className: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  },
  active: {
    label: 'Active',
    className: 'bg-green-500/20 text-green-400 border border-green-500/30',
  },
  overdue: {
    label: 'Overdue',
    className: 'bg-red-500/20 text-red-400 border border-red-500/30',
  },
  completed: {
    label: 'Completed',
    className: 'bg-grey-20/20 text-grey-20 border border-grey-20/30',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-grey-60/20 text-grey-40 border border-grey-60/30',
  },
}

const equipmentStatusConfig: Record<EquipmentStatus, { label: string; className: string }> = {
  available: {
    label: 'Available',
    className: 'bg-green-500/20 text-green-400 border border-green-500/30',
  },
  rented: {
    label: 'Rented',
    className: 'bg-gold/20 text-gold border border-gold/30',
  },
  maintenance: {
    label: 'Maintenance',
    className: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  },
  retired: {
    label: 'Retired',
    className: 'bg-grey-60/20 text-grey-40 border border-grey-60/30',
  },
  lost: {
    label: 'Lost',
    className: 'bg-red-500/20 text-red-400 border border-red-500/30',
  },
}

interface BookingStatusBadgeProps {
  status: BookingStatus
  className?: string
}

export function BookingStatusBadge({ status, className }: BookingStatusBadgeProps) {
  const config = bookingStatusConfig[status]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold font-body',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}

interface EquipmentStatusBadgeProps {
  status: EquipmentStatus
  className?: string
}

export function EquipmentStatusBadge({ status, className }: EquipmentStatusBadgeProps) {
  const config = equipmentStatusConfig[status]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold font-body',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}

import { cn } from '@/utils/cn'
import { Spinner } from './Spinner'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    label: string
  }
  className?: string
  isLoading?: boolean
  highlight?: boolean
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  className,
  isLoading,
  highlight,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'bg-grey-80 border border-grey-60 rounded-lg p-4 flex flex-col gap-3',
        highlight && 'border-gold/40 bg-gold/5',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <p className="text-sm text-grey-40 font-body font-medium">{title}</p>
        {icon && (
          <div className="text-grey-40">{icon}</div>
        )}
      </div>

      {isLoading ? (
        <Spinner size="sm" />
      ) : (
        <div>
          <p className={cn(
            'font-display text-2xl font-bold',
            highlight ? 'text-gold' : 'text-white'
          )}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-grey-40 mt-0.5">{subtitle}</p>
          )}
        </div>
      )}

      {trend && !isLoading && (
        <div className={cn(
          'flex items-center gap-1 text-xs font-medium',
          trend.value >= 0 ? 'text-green-400' : 'text-red-400'
        )}>
          <span>{trend.value >= 0 ? '+' : ''}{trend.value}%</span>
          <span className="text-grey-40">{trend.label}</span>
        </div>
      )}
    </div>
  )
}

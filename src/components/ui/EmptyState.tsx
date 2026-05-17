import { cn } from '@/utils/cn'
import { Button } from './Button'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4 py-16 text-center', className)}>
      {icon && (
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-grey-80 border border-grey-60 text-grey-40">
          {icon}
        </div>
      )}
      <div className="flex flex-col gap-1">
        <h3 className="font-display text-base text-white">{title}</h3>
        {description && (
          <p className="text-sm text-grey-40 max-w-xs">{description}</p>
        )}
      </div>
      {action && (
        <Button onClick={action.onClick} size="sm">
          {action.label}
        </Button>
      )}
    </div>
  )
}

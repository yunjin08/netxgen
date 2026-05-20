import { cn } from '@/utils/cn'

interface PageHeaderProps {
  title: string
  description?: string
  breadcrumb?: { label: string; href?: string }[]
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, breadcrumb, actions, className }: PageHeaderProps) {
  // Hide breadcrumb that's just a single item matching the title (redundant)
  const showBreadcrumb =
    breadcrumb &&
    breadcrumb.length > 0 &&
    !(breadcrumb.length === 1 && breadcrumb[0].label === title)

  return (
    <div className={cn('flex flex-col gap-1 mb-6', className)}>
      {showBreadcrumb && (
        <div className="flex items-center gap-1.5 text-xs text-grey-40 font-body italic mb-1">
          {breadcrumb!.map((item, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span>/</span>}
              {item.href ? (
                <a href={item.href} className="hover:text-grey-20 transition-colors">
                  {item.label}
                </a>
              ) : (
                <span>{item.label}</span>
              )}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-white">{title}</h1>
          {description && (
            <p className="text-sm text-grey-40 mt-0.5">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>
    </div>
  )
}

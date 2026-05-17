import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/cn'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full text-xs font-semibold font-body px-2.5 py-0.5 transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-grey-80 text-grey-20 border border-grey-60',
        gold: 'bg-gold text-grey-100',
        success: 'bg-green-500/20 text-green-400 border border-green-500/30',
        danger: 'bg-red-500/20 text-red-400 border border-red-500/30',
        warning: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
        info: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
        outline: 'border border-grey-40 text-grey-20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

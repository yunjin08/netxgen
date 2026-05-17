import * as RadixSelect from '@radix-ui/react-select'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/utils/cn'
import { forwardRef } from 'react'

const Select = RadixSelect.Root
const SelectValue = RadixSelect.Value
const SelectGroup = RadixSelect.Group

interface SelectTriggerProps extends React.ComponentProps<typeof RadixSelect.Trigger> {
  label?: string
  error?: string
}

const SelectTrigger = forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, label, error, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-grey-20 font-body">{label}</label>
      )}
      <RadixSelect.Trigger
        ref={ref}
        className={cn(
          'flex items-center justify-between input-base cursor-pointer',
          error && 'border-red-500 focus:border-red-500',
          className
        )}
        {...props}
      >
        {children}
        <RadixSelect.Icon>
          <ChevronDown className="h-4 w-4 text-grey-40" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
)
SelectTrigger.displayName = 'SelectTrigger'

const SelectContent = forwardRef<HTMLDivElement, React.ComponentProps<typeof RadixSelect.Content>>(
  ({ className, children, position = 'popper', ...props }, ref) => (
    <RadixSelect.Portal>
      <RadixSelect.Content
        ref={ref}
        className={cn(
          'relative z-50 min-w-[8rem] overflow-hidden bg-grey-80 border border-grey-60 rounded-lg shadow-xl',
          'data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out',
          position === 'popper' && 'w-[var(--radix-select-trigger-width)] mt-1',
          className
        )}
        position={position}
        {...props}
      >
        <RadixSelect.ScrollUpButton className="flex items-center justify-center h-6 text-grey-40">
          <ChevronUp className="h-4 w-4" />
        </RadixSelect.ScrollUpButton>
        <RadixSelect.Viewport className="p-1">
          {children}
        </RadixSelect.Viewport>
        <RadixSelect.ScrollDownButton className="flex items-center justify-center h-6 text-grey-40">
          <ChevronDown className="h-4 w-4" />
        </RadixSelect.ScrollDownButton>
      </RadixSelect.Content>
    </RadixSelect.Portal>
  )
)
SelectContent.displayName = 'SelectContent'

const SelectItem = forwardRef<HTMLDivElement, React.ComponentProps<typeof RadixSelect.Item>>(
  ({ className, children, ...props }, ref) => (
    <RadixSelect.Item
      ref={ref}
      className={cn(
        'relative flex items-center gap-2 rounded px-2 py-1.5 text-sm text-grey-20 cursor-pointer',
        'outline-none select-none',
        'hover:bg-grey-60 hover:text-white focus:bg-grey-60 focus:text-white',
        'data-[disabled]:opacity-40 data-[disabled]:pointer-events-none',
        className
      )}
      {...props}
    >
      <RadixSelect.ItemIndicator className="absolute right-2">
        <Check className="h-4 w-4 text-gold" />
      </RadixSelect.ItemIndicator>
      <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
    </RadixSelect.Item>
  )
)
SelectItem.displayName = 'SelectItem'

const SelectLabel = forwardRef<HTMLDivElement, React.ComponentProps<typeof RadixSelect.Label>>(
  ({ className, ...props }, ref) => (
    <RadixSelect.Label
      ref={ref}
      className={cn('px-2 py-1.5 text-xs font-semibold text-grey-40 uppercase tracking-wider', className)}
      {...props}
    />
  )
)
SelectLabel.displayName = 'SelectLabel'

const SelectSeparator = forwardRef<HTMLDivElement, React.ComponentProps<typeof RadixSelect.Separator>>(
  ({ className, ...props }, ref) => (
    <RadixSelect.Separator
      ref={ref}
      className={cn('mx-1 my-1 h-px bg-grey-60', className)}
      {...props}
    />
  )
)
SelectSeparator.displayName = 'SelectSeparator'

export {
  Select,
  SelectValue,
  SelectGroup,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectSeparator,
}

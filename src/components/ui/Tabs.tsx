import * as RadixTabs from '@radix-ui/react-tabs'
import { cn } from '@/utils/cn'

const Tabs = RadixTabs.Root

const TabsList = ({ className, ...props }: React.ComponentProps<typeof RadixTabs.List>) => (
  <RadixTabs.List
    className={cn(
      'flex items-center gap-0 border-b border-grey-60',
      className
    )}
    {...props}
  />
)
TabsList.displayName = 'TabsList'

const TabsTrigger = ({ className, ...props }: React.ComponentProps<typeof RadixTabs.Trigger>) => (
  <RadixTabs.Trigger
    className={cn(
      'relative px-4 py-2.5 text-sm font-medium text-grey-40 font-body',
      'transition-colors hover:text-grey-20',
      'data-[state=active]:text-gold',
      'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-transparent',
      'data-[state=active]:after:bg-gold',
      'focus-visible:outline-none',
      className
    )}
    {...props}
  />
)
TabsTrigger.displayName = 'TabsTrigger'

const TabsContent = ({ className, ...props }: React.ComponentProps<typeof RadixTabs.Content>) => (
  <RadixTabs.Content
    className={cn('focus-visible:outline-none', className)}
    {...props}
  />
)
TabsContent.displayName = 'TabsContent'

export { Tabs, TabsList, TabsTrigger, TabsContent }

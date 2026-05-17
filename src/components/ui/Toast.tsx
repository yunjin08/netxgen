import * as RadixToast from '@radix-ui/react-toast'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'

const ToastProvider = RadixToast.Provider
const ToastViewport = RadixToast.Viewport

function Toast({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof RadixToast.Root> & {
  variant?: 'default' | 'success' | 'error' | 'warning'
}) {
  const variantClass = {
    default: 'border-grey-60',
    success: 'border-l-4 border-l-green-400 border-grey-60',
    error: 'border-l-4 border-l-red-400 border-grey-60',
    warning: 'border-l-4 border-l-yellow-400 border-grey-60',
  }[variant]

  return (
    <RadixToast.Root
      className={cn(
        'group relative flex gap-3 items-start bg-grey-80 border rounded-lg p-4 shadow-lg',
        'data-[state=open]:animate-slide-up data-[state=closed]:animate-fade-out',
        'data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]',
        'data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]',
        variantClass,
        className
      )}
      {...props}
    />
  )
}

function ToastTitle({ className, ...props }: React.ComponentProps<typeof RadixToast.Title>) {
  return (
    <RadixToast.Title
      className={cn('text-sm font-semibold text-white font-body', className)}
      {...props}
    />
  )
}

function ToastDescription({ className, ...props }: React.ComponentProps<typeof RadixToast.Description>) {
  return (
    <RadixToast.Description
      className={cn('text-xs text-grey-40', className)}
      {...props}
    />
  )
}

function ToastClose({ className, ...props }: React.ComponentProps<typeof RadixToast.Close>) {
  return (
    <RadixToast.Close
      className={cn(
        'absolute top-2 right-2 text-grey-40 hover:text-white transition-colors p-1 rounded',
        'opacity-0 group-hover:opacity-100',
        className
      )}
      {...props}
    >
      <X className="h-3 w-3" />
    </RadixToast.Close>
  )
}

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
}

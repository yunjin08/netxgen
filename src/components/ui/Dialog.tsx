import * as RadixDialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'

const Dialog = RadixDialog.Root
const DialogTrigger = RadixDialog.Trigger
const DialogPortal = RadixDialog.Portal
const DialogClose = RadixDialog.Close

function DialogOverlay({ className, ...props }: React.ComponentProps<typeof RadixDialog.Overlay>) {
  return (
    <RadixDialog.Overlay
      className={cn(
        'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm',
        'data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out',
        className
      )}
      {...props}
    />
  )
}

interface DialogContentProps extends React.ComponentProps<typeof RadixDialog.Content> {
  side?: 'center' | 'right'
}

function DialogContent({
  className,
  children,
  side = 'right',
  ...props
}: DialogContentProps) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <RadixDialog.Content
        className={cn(
          'fixed z-50 bg-grey-80 border border-grey-60 shadow-2xl focus:outline-none flex flex-col',
          side === 'right'
            ? 'top-0 right-0 h-full w-full sm:max-w-lg data-[state=open]:animate-slide-in-right'
            : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-1.5rem)] sm:w-full sm:max-w-lg max-h-[calc(100dvh-2rem)] sm:rounded-lg data-[state=open]:animate-fade-in',
          className
        )}
        {...props}
      >
        {children}
        <DialogClose className="absolute top-4 right-4 text-grey-40 hover:text-white transition-colors rounded p-1 hover:bg-grey-60 z-10">
          <X className="h-4 w-4" />
        </DialogClose>
      </RadixDialog.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col gap-1.5 px-6 py-5 border-b border-grey-60 shrink-0', className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center justify-end gap-3 px-6 py-4 border-t border-grey-60 shrink-0', className)}
      {...props}
    />
  )
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof RadixDialog.Title>) {
  return (
    <RadixDialog.Title
      className={cn('font-display text-lg text-white', className)}
      {...props}
    />
  )
}

function DialogDescription({ className, ...props }: React.ComponentProps<typeof RadixDialog.Description>) {
  return (
    <RadixDialog.Description
      className={cn('text-sm text-grey-40', className)}
      {...props}
    />
  )
}

function DialogBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('px-6 py-5 overflow-y-auto flex-1', className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogClose,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogBody,
}

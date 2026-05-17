import { create } from 'zustand'

type ToastVariant = 'default' | 'success' | 'error' | 'warning'

interface ToastItem {
  id: string
  title?: string
  description?: string
  variant?: ToastVariant
  duration?: number
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

interface ToastStore {
  toasts: ToastItem[]
  toast: (opts: Omit<ToastItem, 'id' | 'open' | 'onOpenChange'>) => void
  dismiss: (id: string) => void
}

let toastCount = 0

export const useToast = create<ToastStore>((set, get) => ({
  toasts: [],

  toast: (opts) => {
    const id = String(++toastCount)
    const duration = opts.duration ?? 4000

    set(s => ({
      toasts: [
        ...s.toasts,
        {
          ...opts,
          id,
          open: true,
          onOpenChange: (open: boolean) => {
            if (!open) get().dismiss(id)
          },
        },
      ],
    }))

    if (duration > 0) {
      setTimeout(() => get().dismiss(id), duration)
    }
  },

  dismiss: (id: string) => {
    set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }))
  },
}))

// Convenience helpers
export const toast = {
  success: (title: string, description?: string) =>
    useToast.getState().toast({ title, description, variant: 'success' }),
  error: (title: string, description?: string) =>
    useToast.getState().toast({ title, description, variant: 'error' }),
  warning: (title: string, description?: string) =>
    useToast.getState().toast({ title, description, variant: 'warning' }),
  info: (title: string, description?: string) =>
    useToast.getState().toast({ title, description, variant: 'default' }),
}

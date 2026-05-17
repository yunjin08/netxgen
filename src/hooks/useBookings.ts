import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { toast } from './useToast'
import type { Booking, BookingStatus, BookingWithDetails } from '@/types'

export function useBookings(filters?: { status?: BookingStatus | BookingStatus[]; search?: string }) {
  const { profile, activeBranch, permissions } = useAuth()
  const orgId = profile?.organization_id
  const branchId = permissions.canManageAllBranches ? activeBranch?.id : profile?.branch_id

  return useQuery({
    queryKey: ['bookings', orgId, branchId, filters],
    enabled: !!orgId,
    queryFn: async () => {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          customers(id, full_name, phone, email),
          booking_items(*, equipment(id, name, category))
        `)
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false })

      if (branchId) query = query.eq('branch_id', branchId)

      if (filters?.status) {
        if (Array.isArray(filters.status)) {
          query = query.in('status', filters.status)
        } else {
          query = query.eq('status', filters.status)
        }
      }

      const { data, error } = await query.limit(100)
      if (error) throw error
      return data as BookingWithDetails[]
    },
  })
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: ['booking', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          customers(*),
          booking_items(*, equipment(*), pricing_tiers(*)),
          payments(*)
        `)
        .eq('id', id)
        .single()
      if (error) throw error
      return data as BookingWithDetails
    },
  })
}

export function useUpdateBookingStatus() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: BookingStatus }) => {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['bookings'] })
      qc.invalidateQueries({ queryKey: ['booking', vars.id] })
      toast.success('Booking updated')
    },
    onError: (err: Error) => {
      toast.error('Failed to update booking', err.message)
    },
  })
}

export function useCalendarBookings(year: number, month: number) {
  const { profile, activeBranch, permissions } = useAuth()
  const orgId = profile?.organization_id
  const branchId = permissions.canManageAllBranches ? activeBranch?.id : profile?.branch_id

  const start = new Date(year, month - 1, 1).toISOString()
  const end = new Date(year, month, 0, 23, 59, 59).toISOString()

  return useQuery({
    queryKey: ['calendar-bookings', orgId, branchId, year, month],
    enabled: !!orgId,
    queryFn: async () => {
      let query = supabase
        .from('bookings')
        .select('id, booking_number, status, start_date, end_date, customers(full_name)')
        .eq('organization_id', orgId!)
        .not('status', 'in', '(cancelled,no_show)')
        .lte('start_date', end)
        .gte('end_date', start)

      if (branchId) query = query.eq('branch_id', branchId)

      const { data, error } = await query
      if (error) throw error
      return ((data ?? []) as unknown) as (Booking & { customers: { full_name: string } })[]
    },
  })
}

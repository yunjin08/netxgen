import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { toast } from './useToast'
import type { Payment, PaymentFormData } from '@/types'

export function usePayments(bookingId?: string) {
  const { profile } = useAuth()
  const orgId = profile?.organization_id

  return useQuery({
    queryKey: ['payments', orgId, bookingId],
    enabled: !!orgId,
    queryFn: async () => {
      let query = supabase
        .from('payments')
        .select('*, bookings(booking_number, customers(full_name))')
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false })

      if (bookingId) query = query.eq('booking_id', bookingId)

      const { data, error } = await query.limit(100)
      if (error) throw error
      return data as Payment[]
    },
  })
}

export function useLogPayment() {
  const qc = useQueryClient()
  const { profile } = useAuth()

  return useMutation({
    mutationFn: async (data: PaymentFormData) => {
      const { data: payment, error } = await supabase
        .from('payments')
        .insert({
          ...data,
          organization_id: profile?.organization_id,
          received_by: profile?.id,
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .select()
        .single()
      if (error) throw error

      // Update amount_paid on booking
      const { data: booking } = await supabase
        .from('payments')
        .select('amount')
        .eq('booking_id', data.booking_id)
        .eq('status', 'paid')

      const totalPaid = (booking ?? []).reduce((sum, p) => sum + (p.amount ?? 0), 0)
      await supabase
        .from('bookings')
        .update({ amount_paid: totalPaid })
        .eq('id', data.booking_id)

      return payment as Payment
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['payments'] })
      qc.invalidateQueries({ queryKey: ['booking', vars.booking_id] })
      qc.invalidateQueries({ queryKey: ['bookings'] })
      toast.success('Payment logged')
    },
    onError: (err: Error) => {
      toast.error('Failed to log payment', err.message)
    },
  })
}

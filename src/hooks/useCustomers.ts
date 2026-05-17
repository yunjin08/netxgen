import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { toast } from './useToast'
import type { Customer } from '@/types'

export function useCustomers(search = '') {
  const { profile } = useAuth()
  const orgId = profile?.organization_id

  return useQuery({
    queryKey: ['customers', orgId, search],
    enabled: !!orgId,
    queryFn: async () => {
      let query = supabase
        .from('customers')
        .select('*')
        .eq('organization_id', orgId!)
        .order('full_name')

      if (search) {
        query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`)
      }

      const { data, error } = await query.limit(50)
      if (error) throw error
      return data as Customer[]
    },
  })
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ['customer', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as Customer
    },
  })
}

export function useCreateCustomer() {
  const qc = useQueryClient()
  const { profile } = useAuth()

  return useMutation({
    mutationFn: async (data: Omit<Customer, 'id' | 'created_at' | 'updated_at' | 'total_bookings' | 'total_spent'>) => {
      const { data: customer, error } = await supabase
        .from('customers')
        .insert({ ...data, organization_id: profile?.organization_id })
        .select()
        .single()
      if (error) throw error
      return customer as Customer
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      toast.success('Customer added')
    },
    onError: (err: Error) => {
      toast.error('Failed to add customer', err.message)
    },
  })
}

export function useUpdateCustomer() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Customer> & { id: string }) => {
      const { data: customer, error } = await supabase
        .from('customers')
        .update(data)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return customer as Customer
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      qc.invalidateQueries({ queryKey: ['customer', vars.id] })
      toast.success('Customer updated')
    },
    onError: (err: Error) => {
      toast.error('Failed to update customer', err.message)
    },
  })
}

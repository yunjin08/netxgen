import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { toast } from './useToast'
import type { Equipment, PricingTier } from '@/types'

export function useEquipment() {
  const { profile, activeBranch, permissions } = useAuth()
  const orgId = profile?.organization_id
  const branchId = permissions.canManageAllBranches ? activeBranch?.id : profile?.branch_id

  return useQuery({
    queryKey: ['equipment', orgId, branchId],
    enabled: !!orgId,
    queryFn: async () => {
      let query = supabase
        .from('equipment')
        .select('*, pricing_tiers(*)')
        .eq('organization_id', orgId!)
        .order('name')

      if (branchId) query = query.eq('branch_id', branchId)

      const { data, error } = await query
      if (error) throw error
      return data as (Equipment & { pricing_tiers: PricingTier[] })[]
    },
  })
}

export function useEquipmentItem(id: string) {
  const { profile } = useAuth()
  return useQuery({
    queryKey: ['equipment', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment')
        .select('*, pricing_tiers(*)')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as Equipment & { pricing_tiers: PricingTier[] }
    },
  })
}

export function useCreateEquipment() {
  const qc = useQueryClient()
  const { profile, activeBranch } = useAuth()

  return useMutation({
    mutationFn: async (data: Omit<Equipment, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: item, error } = await supabase
        .from('equipment')
        .insert(data)
        .select()
        .single()
      if (error) throw error
      return item
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['equipment'] })
      toast.success('Equipment created')
    },
    onError: (err: Error) => {
      toast.error('Failed to create equipment', err.message)
    },
  })
}

export function useUpdateEquipment() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Equipment> & { id: string }) => {
      const { data: item, error } = await supabase
        .from('equipment')
        .update(data)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return item
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['equipment'] })
      toast.success('Equipment updated')
    },
    onError: (err: Error) => {
      toast.error('Failed to update equipment', err.message)
    },
  })
}

export function useDeleteEquipment() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('equipment').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['equipment'] })
      toast.success('Equipment deleted')
    },
    onError: (err: Error) => {
      toast.error('Failed to delete equipment', err.message)
    },
  })
}

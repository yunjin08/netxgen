import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Package, Search } from 'lucide-react'
import { useEquipment, useCreateEquipment } from '@/hooks/useEquipment'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { SearchInput } from '@/components/ui/SearchInput'
import { EquipmentStatusBadge } from '@/components/ui/StatusBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from '@/components/ui/Dialog'
import { EquipmentForm } from '@/components/equipment/EquipmentForm'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { formatPeso } from '@/utils/currency'
import type { EquipmentStatus } from '@/types'

export default function EquipmentPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showCreate, setShowCreate] = useState(false)
  const { data: equipment = [], isLoading } = useEquipment()
  const createEquipment = useCreateEquipment()
  const { profile, activeBranch } = useAuth()

  const filtered = equipment.filter(item => {
    const matchesSearch = !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.category?.toLowerCase().includes(search.toLowerCase()) ||
      item.serial_number?.toLowerCase().includes(search.toLowerCase())

    const matchesStatus = statusFilter === 'all' || item.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleCreate = async (data: any) => {
    const { pricing_tiers, ...equipmentData } = data
    const item = await createEquipment.mutateAsync({
      ...equipmentData,
      organization_id: profile?.organization_id!,
      branch_id: activeBranch?.id!,
      status: 'available',
      image_urls: [],
    })

    // Create pricing tiers
    if (pricing_tiers?.length) {
      await supabase.from('pricing_tiers').insert(
        pricing_tiers.map((t: any) => ({
          ...t,
          equipment_id: item.id,
          organization_id: profile?.organization_id,
        }))
      )
    }

    setShowCreate(false)
  }

  return (
    <div>
      <PageHeader
        title="Equipment"
        description="Manage your rental inventory"
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" />
            Add Equipment
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name, category, serial..."
          className="flex-1"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="rented">Rented</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="retired">Retired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-14 rounded-lg" />
          ))}
        </div>
      ) : !filtered.length ? (
        <EmptyState
          icon={<Package className="h-8 w-8" />}
          title={search ? 'No equipment found' : 'No equipment yet'}
          description={search ? 'Try a different search term' : 'Add your first equipment item to get started'}
          action={!search ? { label: 'Add Equipment', onClick: () => setShowCreate(true) } : undefined}
        />
      ) : (
        <div className="bg-grey-80 border border-grey-60 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-grey-60">
                <th className="text-left px-4 py-3 text-xs font-semibold text-grey-40 uppercase tracking-wider">
                  Equipment
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-grey-40 uppercase tracking-wider hidden md:table-cell">
                  Category
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-grey-40 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-grey-40 uppercase tracking-wider hidden lg:table-cell">
                  Stock
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-grey-40 uppercase tracking-wider hidden lg:table-cell">
                  Daily Rate
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => {
                const defaultTier = item.pricing_tiers?.find(t => t.is_default) ?? item.pricing_tiers?.[0]
                return (
                  <tr
                    key={item.id}
                    className={`border-b border-grey-60/50 cursor-pointer hover:bg-gold/5 transition-colors ${i % 2 === 0 ? 'bg-grey-80' : 'bg-grey-100/50'}`}
                    onClick={() => navigate(`/equipment/${item.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-white">{item.name}</p>
                        {item.serial_number && (
                          <p className="text-xs text-grey-40">S/N: {item.serial_number}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm text-grey-20">{item.category ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <EquipmentStatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-grey-20">{item.stock_available}/{item.stock_total}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm font-medium text-gold">
                        {defaultTier ? formatPeso(defaultTier.price) : '—'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Equipment</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <EquipmentForm
              onSubmit={handleCreate}
              onCancel={() => setShowCreate(false)}
              isLoading={createEquipment.isPending}
            />
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  )
}

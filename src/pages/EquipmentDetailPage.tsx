import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2 } from 'lucide-react'
import { useEquipmentItem, useUpdateEquipment, useDeleteEquipment } from '@/hooks/useEquipment'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { EquipmentStatusBadge } from '@/components/ui/StatusBadge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from '@/components/ui/Dialog'
import { EquipmentForm } from '@/components/equipment/EquipmentForm'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { formatPeso } from '@/utils/currency'
import { useAuth } from '@/hooks/useAuth'
import { useQueryClient } from '@tanstack/react-query'
import type { EquipmentStatus } from '@/types'

export default function EquipmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data: item, isLoading } = useEquipmentItem(id!)
  const updateEquipment = useUpdateEquipment()
  const deleteEquipment = useDeleteEquipment()
  const { profile } = useAuth()
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-48 rounded" />
        <div className="skeleton h-64 rounded-lg" />
      </div>
    )
  }

  if (!item) return null

  const handleEdit = async (data: any) => {
    const { pricing_tiers, ...equipmentData } = data
    await updateEquipment.mutateAsync({ id: item.id, ...equipmentData })

    // Update pricing tiers: delete existing and re-insert
    await supabase.from('pricing_tiers').delete().eq('equipment_id', item.id)
    if (pricing_tiers?.length) {
      await supabase.from('pricing_tiers').insert(
        pricing_tiers.map((t: any) => ({
          ...t,
          equipment_id: item.id,
          organization_id: profile?.organization_id,
        }))
      )
    }
    qc.invalidateQueries({ queryKey: ['equipment', item.id] })
    setShowEdit(false)
  }

  const handleDelete = async () => {
    await deleteEquipment.mutateAsync(item.id)
    navigate('/equipment')
  }

  const handleStatusChange = async (status: string) => {
    await updateEquipment.mutateAsync({ id: item.id, status: status as EquipmentStatus })
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <button onClick={() => navigate('/equipment')} className="text-grey-40 hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
      </div>

      <PageHeader
        title={item.name}
        breadcrumb={[{ label: 'Equipment', href: '/equipment' }, { label: item.name }]}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowEdit(true)}>
              <Edit className="h-4 w-4" />
              Edit
            </Button>
            <Button variant="danger" size="sm" onClick={() => setShowDelete(true)}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main info */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
              <div className="flex items-center gap-3">
                <EquipmentStatusBadge status={item.status} />
                <Select value={item.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-36 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="rented">Rented</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs text-grey-40">Category</dt>
                <dd className="text-sm text-white mt-0.5">{item.category ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-grey-40">SKU</dt>
                <dd className="text-sm text-white mt-0.5">{item.sku ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-grey-40">Serial Number</dt>
                <dd className="text-sm text-white mt-0.5">{item.serial_number ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-grey-40">Replacement Cost</dt>
                <dd className="text-sm text-white mt-0.5">
                  {item.replacement_cost ? formatPeso(item.replacement_cost) : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-grey-40">Stock Available</dt>
                <dd className="text-sm text-white mt-0.5">{item.stock_available} / {item.stock_total}</dd>
              </div>
            </dl>
            {item.description && (
              <div className="mt-4 pt-4 border-t border-grey-60">
                <dt className="text-xs text-grey-40 mb-1">Description</dt>
                <dd className="text-sm text-grey-20">{item.description}</dd>
              </div>
            )}
          </Card>

          {/* Pricing tiers */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing Tiers</CardTitle>
            </CardHeader>
            {item.pricing_tiers?.length ? (
              <div className="flex flex-col gap-2">
                {item.pricing_tiers.map(tier => (
                  <div key={tier.id} className="flex items-center justify-between bg-grey-100 rounded-lg px-3 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-white">{tier.name}</p>
                      <p className="text-xs text-grey-40">Min. {tier.min_units} {tier.unit}(s)</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gold">{formatPeso(tier.price)}</p>
                      <p className="text-xs text-grey-40">per {tier.unit}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-grey-40">No pricing tiers configured</p>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-5">
          {item.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <p className="text-sm text-grey-20">{item.notes}</p>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Equipment</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <EquipmentForm
              defaultValues={item}
              onSubmit={handleEdit}
              onCancel={() => setShowEdit(false)}
              isLoading={updateEquipment.isPending}
            />
          </DialogBody>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Delete Equipment"
        description={`Are you sure you want to delete "${item.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        isLoading={deleteEquipment.isPending}
      />
    </div>
  )
}

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { useAuth } from '@/hooks/useAuth'
import type { Equipment, PricingTier } from '@/types'

const pricingTierSchema = z.object({
  name: z.string().min(1, 'Required'),
  unit: z.enum(['hour', 'day', 'week', 'month']),
  price: z.coerce.number().min(0),
  min_units: z.coerce.number().min(1),
  is_default: z.boolean().default(false),
})

const equipmentSchema = z.object({
  name: z.string().min(1, 'Equipment name is required'),
  description: z.string().optional(),
  category: z.string().optional(),
  sku: z.string().optional(),
  serial_number: z.string().optional(),
  stock_total: z.coerce.number().min(1),
  stock_available: z.coerce.number().min(0),
  replacement_cost: z.coerce.number().optional(),
  notes: z.string().optional(),
  pricing_tiers: z.array(pricingTierSchema).min(1, 'At least one pricing tier required'),
})

type FormData = z.infer<typeof equipmentSchema>

interface EquipmentFormProps {
  defaultValues?: Partial<Equipment & { pricing_tiers: PricingTier[] }>
  onSubmit: (data: FormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

const EQUIPMENT_CATEGORIES = [
  'Sound System',
  'Lighting',
  'Camera & Video',
  'Stage & Structure',
  'Power & Generator',
  'AV Equipment',
  'Tents & Events',
  'Tools & Machinery',
  'Vehicles',
  'Sports & Recreation',
  'Other',
]

export function EquipmentForm({ defaultValues, onSubmit, onCancel, isLoading }: EquipmentFormProps) {
  const { profile, activeBranch } = useAuth()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<FormData>({
    resolver: zodResolver(equipmentSchema) as any,
    defaultValues: {
      name: defaultValues?.name ?? '',
      description: defaultValues?.description ?? '',
      category: defaultValues?.category ?? '',
      sku: defaultValues?.sku ?? '',
      serial_number: defaultValues?.serial_number ?? '',
      stock_total: defaultValues?.stock_total ?? 1,
      stock_available: defaultValues?.stock_available ?? 1,
      replacement_cost: defaultValues?.replacement_cost ?? undefined,
      notes: defaultValues?.notes ?? '',
      pricing_tiers: defaultValues?.pricing_tiers?.map(t => ({
        name: t.name,
        unit: t.unit,
        price: t.price,
        min_units: t.min_units,
        is_default: t.is_default,
      })) ?? [{ name: 'Daily Rate', unit: 'day', price: 0, min_units: 1, is_default: true }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'pricing_tiers' })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleFormSubmit = handleSubmit(onSubmit as any)

  return (
    <form onSubmit={handleFormSubmit} className="flex flex-col gap-5">
      {/* Basic Info */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-grey-20 uppercase tracking-wider">Equipment Details</h3>
        <Input
          label="Equipment Name"
          placeholder="e.g. JBL SRX812P Speaker"
          error={errors.name?.message}
          required
          {...register('name')}
        />
        <Textarea
          label="Description"
          placeholder="Optional description..."
          {...register('description')}
        />
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-grey-20">Category</label>
            <Select
              value={watch('category')}
              onValueChange={v => setValue('category', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {EQUIPMENT_CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input
            label="SKU / Item Code"
            placeholder="e.g. SPK-001"
            {...register('sku')}
          />
        </div>
        <Input
          label="Serial Number"
          placeholder="Optional"
          {...register('serial_number')}
        />
      </div>

      {/* Stock */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-grey-20 uppercase tracking-wider">Stock</h3>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Total Stock"
            type="number"
            min="1"
            error={errors.stock_total?.message}
            {...register('stock_total')}
          />
          <Input
            label="Available Now"
            type="number"
            min="0"
            error={errors.stock_available?.message}
            {...register('stock_available')}
          />
        </div>
        <Input
          label="Replacement Cost (₱)"
          type="number"
          min="0"
          placeholder="If lost or damaged"
          {...register('replacement_cost')}
        />
      </div>

      {/* Pricing Tiers */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-grey-20 uppercase tracking-wider">Pricing Tiers</h3>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => append({ name: '', unit: 'day', price: 0, min_units: 1, is_default: false })}
          >
            <Plus className="h-4 w-4" />
            Add Tier
          </Button>
        </div>

        {errors.pricing_tiers?.message && (
          <p className="text-xs text-red-400">{errors.pricing_tiers.message}</p>
        )}

        {fields.map((field, i) => (
          <div key={field.id} className="bg-grey-100 border border-grey-60 rounded-lg p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-grey-40 uppercase tracking-wider">Tier {i + 1}</span>
              {fields.length > 1 && (
                <button type="button" onClick={() => remove(i)} className="text-grey-40 hover:text-red-400 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Name"
                placeholder="e.g. Daily Rate"
                error={errors.pricing_tiers?.[i]?.name?.message}
                {...register(`pricing_tiers.${i}.name`)}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-grey-20">Unit</label>
                <Select
                  value={watch(`pricing_tiers.${i}.unit`)}
                  onValueChange={v => setValue(`pricing_tiers.${i}.unit`, v as 'hour' | 'day' | 'week' | 'month')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hour">Per Hour</SelectItem>
                    <SelectItem value="day">Per Day</SelectItem>
                    <SelectItem value="week">Per Week</SelectItem>
                    <SelectItem value="month">Per Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Price (₱)"
                type="number"
                min="0"
                placeholder="0.00"
                error={errors.pricing_tiers?.[i]?.price?.message}
                {...register(`pricing_tiers.${i}.price`)}
              />
              <Input
                label="Minimum Units"
                type="number"
                min="1"
                {...register(`pricing_tiers.${i}.min_units`)}
              />
            </div>
          </div>
        ))}
      </div>

      <Textarea
        label="Internal Notes"
        placeholder="Maintenance notes, special handling instructions..."
        {...register('notes')}
      />

      <div className="flex gap-3 justify-end pt-2 border-t border-grey-60">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" isLoading={isLoading}>
          {defaultValues?.name ? 'Save Changes' : 'Add Equipment'}
        </Button>
      </div>
    </form>
  )
}

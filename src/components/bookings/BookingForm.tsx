import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, Search, ChevronRight, ChevronLeft, AlertTriangle, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useEquipment } from '@/hooks/useEquipment'
import { useCustomers, useCreateCustomer } from '@/hooks/useCustomers'
import { useAuth } from '@/hooks/useAuth'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { SearchInput } from '@/components/ui/SearchInput'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { CustomerForm } from '@/components/customers/CustomerForm'
import { toast } from '@/hooks/useToast'
import { formatPeso } from '@/utils/currency'
import { durationInDays } from '@/utils/dates'
import { cn } from '@/utils/cn'
import type { Customer, Equipment, PricingTier, BookingFormData } from '@/types'

interface BookingFormProps {
  onSubmit: (data: BookingFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  defaultCustomerId?: string
}

const steps = ['Customer', 'Equipment', 'Dates', 'Review']

export function BookingForm({ onSubmit, onCancel, isLoading, defaultCustomerId }: BookingFormProps) {
  const { profile, activeBranch, organization } = useAuth()
  const [step, setStep] = useState(0)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerSearch, setCustomerSearch] = useState('')
  const [selectedItems, setSelectedItems] = useState<{
    equipment: Equipment & { pricing_tiers: PricingTier[] }
    pricingTier: PricingTier
    quantity: number
  }[]>([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [depositAmount, setDepositAmount] = useState(0)
  const [notes, setNotes] = useState('')
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [availabilityWarning, setAvailabilityWarning] = useState<string | null>(null)
  const [showAddCustomer, setShowAddCustomer] = useState(false)

  const { data: equipment = [] } = useEquipment()
  const { data: customers = [] } = useCustomers(customerSearch)
  const createCustomer = useCreateCustomer()

  const dpPercentage = organization?.settings?.dp_percentage ?? 50

  // Calculate totals
  const subtotal = selectedItems.reduce((sum, item) => {
    const days = startDate && endDate ? durationInDays(startDate, endDate) : 1
    return sum + item.pricingTier.price * days * item.quantity
  }, 0)

  const autoDeposit = Math.round(subtotal * dpPercentage / 100)

  useEffect(() => {
    if (subtotal > 0) setDepositAmount(autoDeposit)
  }, [subtotal, autoDeposit])

  // Check availability when dates change
  useEffect(() => {
    if (!startDate || !endDate || selectedItems.length === 0) {
      setAvailabilityWarning(null)
      return
    }

    const checkAvailability = async () => {
      const equipmentIds = selectedItems.map(i => i.equipment.id)
      const { data: conflicts } = await supabase
        .from('booking_items')
        .select('equipment_id, quantity, bookings!inner(status, start_date, end_date)')
        .in('equipment_id', equipmentIds)
        .in('bookings.status', ['confirmed', 'active'])
        .lt('bookings.start_date', endDate)
        .gt('bookings.end_date', startDate)

      if (conflicts && conflicts.length > 0) {
        setAvailabilityWarning('Some equipment may have conflicting bookings. Please verify availability before confirming.')
      } else {
        setAvailabilityWarning(null)
      }
    }

    checkAvailability()
  }, [startDate, endDate, selectedItems])

  const handleFinalSubmit = async () => {
    if (!selectedCustomer) return

    const formData: BookingFormData = {
      customer_id: selectedCustomer.id,
      items: selectedItems.map(item => ({
        equipment_id: item.equipment.id,
        pricing_tier_id: item.pricingTier.id,
        quantity: item.quantity,
        unit_price: item.pricingTier.price,
        duration_units: durationInDays(startDate, endDate),
      })),
      start_date: new Date(startDate),
      end_date: new Date(endDate),
      delivery_type: deliveryType,
      delivery_address: deliveryAddress || undefined,
      deposit_amount: depositAmount,
      notes: notes || undefined,
    }

    await onSubmit(formData)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Steps indicator */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={cn(
              'flex items-center justify-center w-7 h-7 rounded-full border text-xs font-bold shrink-0 transition-all',
              i < step ? 'bg-green-500 border-green-500 text-white'
              : i === step ? 'border-gold text-gold bg-gold/10'
              : 'border-grey-60 text-grey-40'
            )}>
              {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span className={cn('text-xs hidden sm:block', i === step ? 'text-white' : 'text-grey-40')}>{s}</span>
            {i < steps.length - 1 && <div className={cn('h-px flex-1', i < step ? 'bg-green-500' : 'bg-grey-60')} />}
          </div>
        ))}
      </div>

      {/* Step 1: Select Customer */}
      {step === 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display text-base text-white">Select Customer</h3>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setShowAddCustomer(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Customer
            </Button>
          </div>
          <SearchInput
            value={customerSearch}
            onChange={setCustomerSearch}
            placeholder="Search by name or phone..."
          />
          <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
            {customers.map(c => (
              <button
                key={c.id}
                type="button"
                className={cn(
                  'flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors',
                  selectedCustomer?.id === c.id
                    ? 'bg-gold/20 border border-gold/40'
                    : 'bg-grey-100 border border-grey-60 hover:border-grey-40'
                )}
                onClick={() => setSelectedCustomer(c)}
              >
                <div>
                  <p className="text-sm font-medium text-white">{c.full_name}</p>
                  <p className="text-xs text-grey-40">{c.phone}</p>
                </div>
                {selectedCustomer?.id === c.id && <Check className="h-4 w-4 text-gold" />}
              </button>
            ))}
            {!customers.length && (
              <div className="text-center py-4">
                <p className="text-sm text-grey-40 mb-2">No customers found</p>
                <Button type="button" size="sm" variant="secondary" onClick={() => setShowAddCustomer(true)}>
                  <Plus className="h-3.5 w-3.5" />
                  Add New Customer
                </Button>
              </div>
            )}
          </div>
          <div className="flex justify-between pt-2">
            <Button variant="secondary" onClick={onCancel}>Cancel</Button>
            <Button onClick={() => setStep(1)} disabled={!selectedCustomer}>
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Inline add-customer panel */}
          {showAddCustomer && (
            <div className="border-t border-grey-60 pt-4">
              <h4 className="font-display text-sm text-white mb-3">New Customer</h4>
              <CustomerForm
                onSubmit={async data => {
                  try {
                    const newCustomer = await createCustomer.mutateAsync({
                      ...data,
                      organization_id: profile?.organization_id!,
                      email: data.email || null,
                      address: data.address || null,
                      id_type: data.id_type || null,
                      id_number: data.id_number || null,
                      id_image_url: null,
                      notes: data.notes || null,
                      is_blacklisted: false,
                    } as any)
                    setSelectedCustomer(newCustomer)
                    setShowAddCustomer(false)
                    setCustomerSearch('')
                  } catch (err) {
                    toast.error('Failed to add customer', err instanceof Error ? err.message : undefined)
                  }
                }}
                onCancel={() => setShowAddCustomer(false)}
                isLoading={createCustomer.isPending}
              />
            </div>
          )}
        </div>
      )}

      {/* Step 2: Select Equipment */}
      {step === 1 && (
        <div className="flex flex-col gap-4">
          <h3 className="font-display text-base text-white">Select Equipment</h3>
          <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
            {equipment.filter(e => e.stock_available > 0).map(item => {
              const defaultTier = item.pricing_tiers?.find(t => t.is_default) ?? item.pricing_tiers?.[0]
              const selectedItem = selectedItems.find(s => s.equipment.id === item.id)

              return (
                <div key={item.id} className="bg-grey-100 border border-grey-60 rounded-lg p-3 flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{item.name}</p>
                    <p className="text-xs text-grey-40">
                      {item.category} · Stock: {item.stock_available} · {defaultTier ? formatPeso(defaultTier.price) + '/' + defaultTier.unit : '—'}
                    </p>
                  </div>
                  {selectedItem ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="w-7 h-7 rounded bg-grey-80 text-white flex items-center justify-center hover:bg-grey-60"
                        onClick={() => {
                          if (selectedItem.quantity <= 1) {
                            setSelectedItems(prev => prev.filter(s => s.equipment.id !== item.id))
                          } else {
                            setSelectedItems(prev => prev.map(s =>
                              s.equipment.id === item.id ? { ...s, quantity: s.quantity - 1 } : s
                            ))
                          }
                        }}
                      >-</button>
                      <span className="text-sm text-white w-5 text-center">{selectedItem.quantity}</span>
                      <button
                        type="button"
                        className="w-7 h-7 rounded bg-grey-80 text-white flex items-center justify-center hover:bg-grey-60"
                        onClick={() => {
                          if (selectedItem.quantity < item.stock_available) {
                            setSelectedItems(prev => prev.map(s =>
                              s.equipment.id === item.id ? { ...s, quantity: s.quantity + 1 } : s
                            ))
                          }
                        }}
                      >+</button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        if (defaultTier) {
                          setSelectedItems(prev => [...prev, { equipment: item, pricingTier: defaultTier, quantity: 1 }])
                        }
                      }}
                    >
                      <Plus className="h-3.5 w-3.5" /> Add
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
          {selectedItems.length > 0 && (
            <div className="bg-gold/10 border border-gold/30 rounded-lg p-3">
              <p className="text-xs font-semibold text-gold mb-2">Selected ({selectedItems.length} items)</p>
              {selectedItems.map(item => (
                <div key={item.equipment.id} className="flex justify-between text-xs text-grey-20">
                  <span>{item.equipment.name} × {item.quantity}</span>
                  <span>{formatPeso(item.pricingTier.price)}/{item.pricingTier.unit}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-between pt-2">
            <Button variant="secondary" onClick={() => setStep(0)}>
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
            <Button onClick={() => setStep(2)} disabled={selectedItems.length === 0}>
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Dates & Delivery */}
      {step === 2 && (
        <div className="flex flex-col gap-4">
          <h3 className="font-display text-base text-white">Rental Dates</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date & Time"
              type="datetime-local"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              required
            />
            <Input
              label="End Date & Time"
              type="datetime-local"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              min={startDate}
              required
            />
          </div>

          {availabilityWarning && (
            <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
              <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-300">{availabilityWarning}</p>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-grey-20">Delivery Type</label>
            <div className="flex gap-3">
              {(['pickup', 'delivery'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  className={cn(
                    'flex-1 py-2 rounded-lg text-sm font-medium border transition-colors capitalize',
                    deliveryType === type
                      ? 'bg-gold/20 border-gold text-gold'
                      : 'bg-grey-100 border-grey-60 text-grey-40 hover:text-grey-20'
                  )}
                  onClick={() => setDeliveryType(type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {deliveryType === 'delivery' && (
            <Input
              label="Delivery Address"
              placeholder="123 Rizal Ave, Manila"
              value={deliveryAddress}
              onChange={e => setDeliveryAddress(e.target.value)}
            />
          )}

          <div className="flex justify-between pt-2">
            <Button variant="secondary" onClick={() => setStep(1)}>
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
            <Button onClick={() => setStep(3)} disabled={!startDate || !endDate}>
              Review <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Review & Confirm */}
      {step === 3 && (
        <div className="flex flex-col gap-4">
          <h3 className="font-display text-base text-white">Review Booking</h3>

          <div className="bg-grey-100 border border-grey-60 rounded-lg p-4 flex flex-col gap-3">
            <div className="flex justify-between text-sm">
              <span className="text-grey-40">Customer</span>
              <span className="text-white font-medium">{selectedCustomer?.full_name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-grey-40">Period</span>
              <span className="text-white">
                {startDate && endDate ? `${durationInDays(startDate, endDate)} day(s)` : '—'}
              </span>
            </div>
            <div className="border-t border-grey-60 pt-3">
              {selectedItems.map(item => (
                <div key={item.equipment.id} className="flex justify-between text-sm mb-1">
                  <span className="text-grey-20">{item.equipment.name} × {item.quantity}</span>
                  <span className="text-white">{formatPeso(item.pricingTier.price * durationInDays(startDate, endDate) * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-grey-60 pt-3 flex flex-col gap-1">
              <div className="flex justify-between text-sm">
                <span className="text-grey-40">Subtotal</span>
                <span className="text-white">{formatPeso(subtotal)}</span>
              </div>
            </div>
          </div>

          <Input
            label={`Down Payment Amount (${dpPercentage}% = ${formatPeso(autoDeposit)})`}
            type="number"
            min="0"
            value={depositAmount}
            onChange={e => setDepositAmount(Number(e.target.value))}
          />

          <Textarea
            label="Notes for Customer"
            placeholder="Rental terms, special instructions..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />

          <div className="bg-grey-100 rounded-lg p-3">
            <div className="flex justify-between text-base font-bold">
              <span className="text-grey-20">Total Amount</span>
              <span className="text-gold">{formatPeso(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-grey-40">Down Payment</span>
              <span className="text-white">{formatPeso(depositAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-grey-40">Balance Due</span>
              <span className="text-white">{formatPeso(subtotal - depositAmount)}</span>
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="secondary" onClick={() => setStep(2)}>
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
            <Button onClick={handleFinalSubmit} isLoading={isLoading}>
              Create Booking
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

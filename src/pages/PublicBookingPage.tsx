import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { publicFetch } from '@/lib/api'
import { Zap, Package, Calendar, CreditCard, Check } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { BookingStatusBadge } from '@/components/ui/StatusBadge'
import { formatPeso } from '@/utils/currency'
import { dateRangeLabel, formatPHDate } from '@/utils/dates'
import { toast } from '@/hooks/useToast'
import type { Booking, Customer, BookingItem, Equipment } from '@/types'

interface PublicBookingData {
  booking: Booking & {
    customers: Customer
    booking_items: (BookingItem & { equipment: Equipment })[]
  }
  organization: { name: string; phone: string | null; email: string | null }
}

export default function PublicBookingPage() {
  const { token } = useParams<{ token: string }>()
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [isConfirmed, setIsConfirmed] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['public-booking', token],
    enabled: !!token,
    queryFn: () => publicFetch<PublicBookingData>(`/api/bookings/${token}/public`),
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-grey-100 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !data) {
    const errMsg = error instanceof Error ? error.message : ''
    return (
      <div className="min-h-screen bg-grey-100 flex flex-col items-center justify-center gap-4 p-4">
        <Zap className="h-12 w-12 text-gold" />
        <h1 className="font-display text-2xl text-white">Booking Not Found</h1>
        <p className="text-grey-40 text-center max-w-md">
          This booking link is invalid or has expired.
        </p>
        {errMsg && (
          <p className="text-xs text-grey-60 text-center max-w-md mt-2">{errMsg}</p>
        )}
      </div>
    )
  }

  const { booking, organization } = data
  const balanceDue = booking.total_amount - booking.amount_paid

  const handleConfirm = async () => {
    try {
      await publicFetch(`/api/bookings/${token}/public`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'confirm',
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_email: customerEmail,
        }),
      })
      setIsConfirmed(true)
      toast.success('Booking confirmed!')
    } catch (err) {
      toast.error('Failed to confirm', err instanceof Error ? err.message : undefined)
    }
  }

  if (isConfirmed) {
    return (
      <div className="min-h-screen bg-grey-100 flex flex-col items-center justify-center gap-6 p-4">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
          <Check className="h-8 w-8 text-green-400" />
        </div>
        <div className="text-center">
          <h1 className="font-display text-2xl text-white mb-2">Booking Confirmed!</h1>
          <p className="text-grey-40">
            Your booking <strong className="text-white">{booking.booking_number}</strong> has been confirmed.
          </p>
          <p className="text-grey-40 mt-1">
            We'll contact you at {customerPhone} for further details.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-grey-100">
      {/* Header */}
      <div className="bg-grey-80 border-b border-grey-60 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="w-8 h-8 bg-gold rounded-lg flex items-center justify-center">
            <Zap className="h-5 w-5 text-grey-100" />
          </div>
          <div>
            <p className="font-display text-sm text-white">{organization.name}</p>
            <p className="text-xs text-grey-40">Rental Booking</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 flex flex-col gap-5 pb-20">
        {/* Booking Summary */}
        <div className="card">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-grey-40">Booking Number</p>
              <p className="font-display text-lg text-white">{booking.booking_number}</p>
            </div>
            <BookingStatusBadge status={booking.status} />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-grey-40" />
              <div>
                <p className="text-xs text-grey-40">Rental Period</p>
                <p className="text-sm text-white">{dateRangeLabel(booking.start_date, booking.end_date)}</p>
              </div>
            </div>

            {booking.booking_items?.length > 0 && (
              <div className="flex items-start gap-2">
                <Package className="h-4 w-4 text-grey-40 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-grey-40 mb-1">Equipment</p>
                  {booking.booking_items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-white">{item.equipment?.name} × {item.quantity}</span>
                      <span className="text-gold font-medium">{formatPeso(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-grey-60">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-grey-40">Total Amount</span>
              <span className="font-bold text-gold">{formatPeso(booking.total_amount)}</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-grey-40">Amount Paid</span>
              <span className="text-green-400">{formatPeso(booking.amount_paid)}</span>
            </div>
            {balanceDue > 0 && (
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-grey-40">Balance Due</span>
                <span className="text-red-400">{formatPeso(balanceDue)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {booking.notes && (
          <div className="card">
            <p className="text-xs text-grey-40 mb-1">Notes from {organization.name}</p>
            <p className="text-sm text-grey-20">{booking.notes}</p>
          </div>
        )}

        {/* Customer Confirmation */}
        {booking.status === 'draft' || booking.status === 'confirmed' ? (
          <div className="card">
            <h2 className="font-display text-base text-white mb-4">Confirm Your Details</h2>
            <div className="flex flex-col gap-3">
              <Input
                label="Full Name"
                placeholder="Juan dela Cruz"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                defaultValue={booking.customers?.full_name}
              />
              <Input
                label="Phone Number"
                placeholder="09XXXXXXXXX"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                defaultValue={booking.customers?.phone}
              />
              <Input
                label="Email"
                type="email"
                placeholder="juan@example.com"
                value={customerEmail}
                onChange={e => setCustomerEmail(e.target.value)}
                defaultValue={booking.customers?.email ?? ''}
              />
            </div>

            {balanceDue > 0 && (
              <div className="mt-4">
                <Button
                  className="w-full"
                  onClick={handleConfirm}
                  disabled={!customerName || !customerPhone}
                >
                  <CreditCard className="h-4 w-4" />
                  Confirm Booking · {formatPeso(balanceDue)} Due
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="card text-center">
            <Check className="h-8 w-8 text-green-400 mx-auto mb-2" />
            <p className="text-sm text-grey-20">
              This booking is <strong className="text-white capitalize">{booking.status}</strong>.
              {organization.phone && ` Contact us at ${organization.phone} for questions.`}
            </p>
          </div>
        )}

        {/* Contact */}
        {(organization.phone || organization.email) && (
          <div className="text-center">
            <p className="text-xs text-grey-40">Need help? Contact {organization.name}</p>
            {organization.phone && <p className="text-xs text-grey-20">{organization.phone}</p>}
            {organization.email && <p className="text-xs text-grey-20">{organization.email}</p>}
          </div>
        )}
      </div>
    </div>
  )
}

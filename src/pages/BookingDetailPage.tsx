import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CreditCard, RotateCcw, Clock, Send, Link2, Mail } from 'lucide-react'
import { useBooking, useUpdateBookingStatus } from '@/hooks/useBookings'
import { useLogPayment } from '@/hooks/usePayments'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card'
import { BookingStatusBadge } from '@/components/ui/StatusBadge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter as DFooter } from '@/components/ui/Dialog'
import { formatPeso } from '@/utils/currency'
import { dateRangeLabel, formatPHDateTime } from '@/utils/dates'
import { toast } from '@/hooks/useToast'
import { apiFetch } from '@/lib/api'
import type { PaymentMethod, PaymentType } from '@/types'

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: booking, isLoading, refetch } = useBooking(id!)
  const updateStatus = useUpdateBookingStatus()
  const logPayment = useLogPayment()
  const [showPayment, setShowPayment] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState<PaymentMethod>('cash')
  const [payType, setPayType] = useState<PaymentType>('deposit')
  const [payRef, setPayRef] = useState('')

  if (isLoading) {
    return <div className="skeleton h-64 rounded-lg" />
  }
  if (!booking) return null

  const balanceDue = booking.total_amount - booking.amount_paid

  const handlePaymentSubmit = async () => {
    await logPayment.mutateAsync({
      booking_id: booking.id,
      method: payMethod,
      type: payType,
      amount: Number(payAmount),
      reference_number: payRef || undefined,
    })
    setShowPayment(false)
    setPayAmount('')
    setPayRef('')
    refetch()
  }

  const handleSendPaymongoLink = async () => {
    try {
      const res = await apiFetch<{ checkout_url: string }>('/api/payments/paymongo/create-link', {
        method: 'POST',
        body: JSON.stringify({
          booking_id: booking.id,
          amount: balanceDue,
          description: `Payment for ${booking.booking_number}`,
        }),
      })
      window.open(res.checkout_url, '_blank')
      toast.success('Payment link opened')
    } catch (err) {
      toast.error('Failed to create payment link', err instanceof Error ? err.message : undefined)
    }
  }

  const handleCopyPublicLink = () => {
    if (!booking.public_token) {
      toast.error('No public link available for this booking')
      return
    }
    navigator.clipboard.writeText(`${window.location.origin}/booking/${booking.public_token}`)
    toast.success('Link copied to clipboard')
  }

  const handleSendReceipt = async () => {
    const customerEmail = (booking as any).customers?.email
    if (!customerEmail) {
      toast.error('Customer has no email address on file')
      return
    }
    try {
      await apiFetch('/api/payments/send-receipt', {
        method: 'POST',
        body: JSON.stringify({ booking_id: booking.id }),
      })
      toast.success(`Receipt sent to ${customerEmail}`)
    } catch (err) {
      toast.error('Failed to send receipt', err instanceof Error ? err.message : undefined)
    }
  }

  const isCancelled = booking.status === 'cancelled'

  return (
    <div>
      <PageHeader
        title={booking.booking_number}
        breadcrumb={[{ label: 'Bookings', href: '/bookings' }, { label: booking.booking_number }]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={handleCopyPublicLink}>
                <Link2 className="h-4 w-4" />
                <span className="hidden sm:inline">Share Link</span>
              </Button>
            {!isCancelled && balanceDue > 0 && (
              <Button variant="secondary" size="sm" onClick={() => setShowPayment(true)}>
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Log Payment</span>
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main info */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Booking Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <CardTitle>Booking Details</CardTitle>
                <BookingStatusBadge status={booking.status} />
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={booking.status}
                  onValueChange={v => updateStatus.mutate({ id: booking.id, status: v as any })}
                >
                  <SelectTrigger className="w-36 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs text-grey-40">Customer</dt>
                <dd className="text-sm text-white mt-0.5">
                  <button
                    className="hover:text-gold transition-colors"
                    onClick={() => navigate(`/customers/${booking.customer_id}`)}
                  >
                    {(booking as any).customers?.full_name}
                  </button>
                </dd>
                <dd className="text-xs text-grey-40">{(booking as any).customers?.phone}</dd>
              </div>
              <div>
                <dt className="text-xs text-grey-40">Rental Period</dt>
                <dd className="text-sm text-white mt-0.5">{dateRangeLabel(booking.start_date, booking.end_date)}</dd>
              </div>
              <div>
                <dt className="text-xs text-grey-40">Delivery</dt>
                <dd className="text-sm text-white mt-0.5 capitalize">{booking.delivery_type}</dd>
                {booking.delivery_address && (
                  <dd className="text-xs text-grey-40">{booking.delivery_address}</dd>
                )}
              </div>
              <div>
                <dt className="text-xs text-grey-40">Created</dt>
                <dd className="text-sm text-white mt-0.5">{formatPHDateTime(booking.created_at)}</dd>
              </div>
            </dl>
            {booking.notes && (
              <div className="mt-4 pt-4 border-t border-grey-60">
                <p className="text-xs text-grey-40 mb-1">Notes</p>
                <p className="text-sm text-grey-20">{booking.notes}</p>
              </div>
            )}
          </Card>

          {/* Equipment Items */}
          <Card noPadding>
            <CardHeader className="px-4 pt-4 pb-3 mb-0 border-b border-grey-60">
              <CardTitle>Equipment</CardTitle>
            </CardHeader>
            <div className="divide-y divide-grey-60/50">
              {(booking as any).booking_items?.map((item: any) => (
                <div key={item.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white">{item.equipment?.name}</p>
                    <p className="text-xs text-grey-40">
                      {item.quantity} × {formatPeso(item.unit_price)} × {item.duration_units} days
                    </p>
                  </div>
                  <span className="text-sm font-bold text-gold">{formatPeso(item.subtotal)}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Payments */}
          <Card noPadding>
            <CardHeader className="px-4 pt-4 pb-3 mb-0 border-b border-grey-60">
              <CardTitle>Payments</CardTitle>
              {!isCancelled && (
                <Button size="sm" onClick={() => setShowPayment(true)}>
                  <CreditCard className="h-4 w-4" />
                  Log Payment
                </Button>
              )}
            </CardHeader>
            {(booking as any).payments?.length ? (
              <div className="divide-y divide-grey-60/50">
                {(booking as any).payments.map((p: any) => (
                  <div key={p.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white capitalize">{p.type.replace('_', ' ')} · {p.method.replace('_', ' ')}</p>
                      {p.reference_number && (
                        <p className="text-xs text-grey-40">Ref: {p.reference_number}</p>
                      )}
                      <p className="text-xs text-grey-40">{formatPHDateTime(p.paid_at ?? p.created_at)}</p>
                    </div>
                    <span className="text-sm font-bold text-green-400">{formatPeso(p.amount)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-6 text-center text-sm text-grey-40">No payments logged yet</div>
            )}
          </Card>
        </div>

        {/* Financial Summary */}
        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-grey-40">Subtotal</span>
                <span className="text-white">{formatPeso(booking.subtotal)}</span>
              </div>
              {(booking as any).late_fee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-grey-40">Late Fee</span>
                  <span className="text-red-400">{formatPeso((booking as any).late_fee)}</span>
                </div>
              )}
              <div className="border-t border-grey-60 pt-2">
                <div className="flex justify-between font-bold">
                  <span className="text-white">Total</span>
                  <span className="text-gold text-lg">{formatPeso(booking.total_amount)}</span>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-grey-40">Amount Paid</span>
                <span className="text-green-400">{formatPeso(booking.amount_paid)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-grey-40">Balance Due</span>
                <span className={balanceDue > 0 ? 'text-red-400' : 'text-green-400'}>
                  {formatPeso(balanceDue)}
                </span>
              </div>
            </div>

            {!isCancelled && (
              <CardFooter className="flex-col gap-2">
                {balanceDue > 0 && (
                  <Button variant="secondary" className="w-full" onClick={handleSendPaymongoLink}>
                    <Send className="h-4 w-4" />
                    Send GCash Link
                  </Button>
                )}
                {booking.amount_paid > 0 && (
                  <Button variant="secondary" className="w-full" onClick={handleSendReceipt}>
                    <Mail className="h-4 w-4" />
                    Send Receipt to Customer
                  </Button>
                )}
              </CardFooter>
            )}
          </Card>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent side="center">
          <DialogHeader>
            <DialogTitle>Log Payment</DialogTitle>
          </DialogHeader>
          <DialogBody className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-grey-20">Payment Type</label>
              <Select value={payType} onValueChange={v => setPayType(v as PaymentType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="deposit">Down Payment</SelectItem>
                  <SelectItem value="full">Full Payment</SelectItem>
                  <SelectItem value="partial">Partial Payment</SelectItem>
                  <SelectItem value="late_fee">Late Fee</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-grey-20">Method</label>
              <Select value={payMethod} onValueChange={v => setPayMethod(v as PaymentMethod)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="gcash">GCash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="paymongo">PayMongo (Online)</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input
              label="Amount (₱)"
              type="number"
              min="0"
              step="0.01"
              placeholder={formatPeso(balanceDue)}
              value={payAmount}
              onChange={e => setPayAmount(e.target.value)}
            />
            <Input
              label="Reference Number"
              placeholder="GCash ref, bank ref, etc."
              value={payRef}
              onChange={e => setPayRef(e.target.value)}
            />
          </DialogBody>
          <DFooter>
            <Button variant="secondary" onClick={() => setShowPayment(false)}>Cancel</Button>
            <Button
              onClick={handlePaymentSubmit}
              isLoading={logPayment.isPending}
              disabled={!payAmount || Number(payAmount) <= 0}
            >
              Save Payment
            </Button>
          </DFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

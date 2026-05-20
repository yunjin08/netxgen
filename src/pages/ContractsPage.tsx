import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Printer, Eye, Search } from 'lucide-react'
import { useBookings } from '@/hooks/useBookings'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { SearchInput } from '@/components/ui/SearchInput'
import { EmptyState } from '@/components/ui/EmptyState'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/Dialog'
import { formatPeso } from '@/utils/currency'
import { dateRangeLabel, formatPHDate, formatPHDateTime } from '@/utils/dates'
import { BookingStatusBadge } from '@/components/ui/StatusBadge'
import type { BookingWithDetails } from '@/types'

export default function ContractsPage() {
  const navigate = useNavigate()
  const { organization } = useAuth()
  const { data: bookings = [], isLoading } = useBookings({
    status: ['confirmed', 'active', 'overdue', 'completed'],
  })
  const [search, setSearch] = useState('')
  const [previewBooking, setPreviewBooking] = useState<BookingWithDetails | null>(null)

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return bookings
    return bookings.filter(b => {
      const hay = `${b.booking_number} ${(b as any).customers?.full_name ?? ''}`.toLowerCase()
      return hay.includes(term)
    })
  }, [bookings, search])

  const handlePrint = () => {
    window.print()
  }

  return (
    <div>
      <PageHeader
        title="Contracts"
        description="Generate rental contracts from existing bookings"
        breadcrumb={[{ label: 'Contracts' }]}
      />

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search by booking # or customer…"
        className="mb-5 max-w-md"
      />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-lg" />
          ))}
        </div>
      ) : !filtered.length ? (
        <EmptyState
          icon={<FileText className="h-8 w-8" />}
          title={search ? 'No matches' : 'No contracts yet'}
          description={search
            ? 'No bookings match this search'
            : 'Confirmed and active bookings will appear here as contracts'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(booking => (
            <div
              key={booking.id}
              className="bg-grey-80 border border-grey-60 rounded-lg p-4 flex flex-col gap-2 hover:border-grey-40 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-mono text-white">{booking.booking_number}</p>
                  <p className="text-xs text-grey-40">{(booking as any).customers?.full_name}</p>
                </div>
                <BookingStatusBadge status={booking.status} />
              </div>
              <p className="text-xs text-grey-40">{dateRangeLabel(booking.start_date, booking.end_date)}</p>
              <p className="text-sm font-bold text-gold">{formatPeso(booking.total_amount)}</p>
              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setPreviewBooking(booking)}
                  className="flex-1"
                >
                  <Eye className="h-3.5 w-3.5" />
                  View Contract
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => navigate(`/bookings/${booking.id}`)}
                >
                  Open Booking
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Contract preview dialog */}
      <Dialog open={!!previewBooking} onOpenChange={o => !o && setPreviewBooking(null)}>
        <DialogContent side="center" className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Rental Contract · {previewBooking?.booking_number}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            {previewBooking && (
              <ContractDocument booking={previewBooking} orgName={organization?.name ?? 'RentFlow'} orgPhone={organization?.phone ?? ''} orgAddress={organization?.address ?? ''} />
            )}
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setPreviewBooking(null)}>Close</Button>
            <Button onClick={handlePrint}>
              <Printer className="h-4 w-4" />
              Print / Save PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface ContractDocumentProps {
  booking: BookingWithDetails
  orgName: string
  orgPhone: string
  orgAddress: string
}

function ContractDocument({ booking, orgName, orgPhone, orgAddress }: ContractDocumentProps) {
  const customer = (booking as any).customers
  const items = (booking as any).booking_items ?? []

  return (
    <div className="bg-white text-black p-6 rounded text-sm print:p-0 print:bg-white">
      <div className="text-center border-b border-grey-300 pb-3 mb-4">
        <h2 className="text-xl font-bold uppercase tracking-wide">{orgName}</h2>
        {orgAddress && <p className="text-xs text-grey-600">{orgAddress}</p>}
        {orgPhone && <p className="text-xs text-grey-600">{orgPhone}</p>}
        <h3 className="text-base font-semibold mt-2">Equipment Rental Agreement</h3>
        <p className="text-xs text-grey-600">Contract #{booking.booking_number}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <p className="text-xs text-grey-600 uppercase">Renter</p>
          <p className="font-semibold">{customer?.full_name}</p>
          {customer?.phone && <p className="text-xs">{customer.phone}</p>}
          {customer?.email && <p className="text-xs">{customer.email}</p>}
          {customer?.address && <p className="text-xs">{customer.address}</p>}
          {customer?.id_type && (
            <p className="text-xs">{customer.id_type}: {customer.id_number ?? '—'}</p>
          )}
        </div>
        <div>
          <p className="text-xs text-grey-600 uppercase">Rental Period</p>
          <p className="font-semibold">{dateRangeLabel(booking.start_date, booking.end_date)}</p>
          <p className="text-xs text-grey-600 mt-2 uppercase">Delivery</p>
          <p className="text-xs capitalize">{booking.delivery_type}</p>
          {booking.delivery_address && <p className="text-xs">{booking.delivery_address}</p>}
        </div>
      </div>

      <table className="w-full text-xs border-t border-b border-grey-300 my-3">
        <thead>
          <tr className="bg-grey-200">
            <th className="text-left py-1.5 px-2">Equipment</th>
            <th className="text-right py-1.5 px-2">Qty</th>
            <th className="text-right py-1.5 px-2">Rate</th>
            <th className="text-right py-1.5 px-2">Days</th>
            <th className="text-right py-1.5 px-2">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item: any) => (
            <tr key={item.id} className="border-t border-grey-200">
              <td className="py-1.5 px-2">{item.equipment?.name}</td>
              <td className="text-right py-1.5 px-2">{item.quantity}</td>
              <td className="text-right py-1.5 px-2">{formatPeso(item.unit_price)}</td>
              <td className="text-right py-1.5 px-2">{item.duration_units}</td>
              <td className="text-right py-1.5 px-2">{formatPeso(item.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end mb-4">
        <div className="w-64">
          <div className="flex justify-between text-xs py-1">
            <span>Subtotal</span>
            <span>{formatPeso(booking.subtotal)}</span>
          </div>
          <div className="flex justify-between text-xs py-1">
            <span>Down Payment</span>
            <span>{formatPeso((booking as any).dp_amount ?? 0)}</span>
          </div>
          <div className="flex justify-between text-xs py-1">
            <span>Amount Paid</span>
            <span>{formatPeso(booking.amount_paid)}</span>
          </div>
          <div className="flex justify-between font-bold border-t border-grey-300 pt-1 mt-1">
            <span>Total</span>
            <span>{formatPeso(booking.total_amount)}</span>
          </div>
        </div>
      </div>

      <div className="text-xs text-grey-700 leading-relaxed border-t border-grey-300 pt-3 mb-4">
        <p className="font-semibold mb-1">Terms &amp; Conditions:</p>
        <ol className="list-decimal pl-4 space-y-0.5">
          <li>Renter agrees to return all equipment in the condition received, normal wear and tear excepted.</li>
          <li>Renter is responsible for any damage, loss, or theft of equipment during the rental period.</li>
          <li>Late returns are subject to additional charges as per the rental shop&apos;s late fee policy.</li>
          <li>Equipment may not be sublet or used by parties not named in this agreement.</li>
          <li>The rental shop is not liable for injury or damage arising from improper use of the equipment.</li>
        </ol>
        {booking.notes && (
          <div className="mt-3">
            <p className="font-semibold">Notes:</p>
            <p>{booking.notes}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6 mt-8">
        <div>
          <div className="border-t border-black pt-1 text-xs">Renter Signature</div>
          <p className="text-xs text-grey-600 mt-1">{customer?.full_name}</p>
        </div>
        <div>
          <div className="border-t border-black pt-1 text-xs">Authorized Representative</div>
          <p className="text-xs text-grey-600 mt-1">{orgName}</p>
        </div>
      </div>

      <p className="text-[10px] text-grey-500 text-center mt-4">
        Generated on {formatPHDateTime(new Date())}
      </p>
    </div>
  )
}

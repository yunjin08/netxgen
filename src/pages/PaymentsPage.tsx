import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, Filter, Plus } from 'lucide-react'
import { usePayments, useLogPayment } from '@/hooks/usePayments'
import { useBookings } from '@/hooks/useBookings'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { SearchInput } from '@/components/ui/SearchInput'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/Dialog'
import { formatPeso } from '@/utils/currency'
import { formatPHDateTime } from '@/utils/dates'
import { toast } from '@/hooks/useToast'
import { cn } from '@/utils/cn'
import type { PaymentMethod, PaymentType } from '@/types'

const methodLabels: Record<string, string> = {
  cash: 'Cash',
  gcash: 'GCash',
  bank_transfer: 'Bank Transfer',
  paymongo: 'PayMongo (Online)',
  other: 'Other',
}

const typeLabels: Record<string, string> = {
  deposit: 'Down Payment',
  partial: 'Partial',
  full: 'Full Payment',
  late_fee: 'Late Fee',
  refund: 'Refund',
}

const statusColors: Record<string, string> = {
  paid: 'text-green-400',
  pending: 'text-yellow-400',
  failed: 'text-red-400',
  refunded: 'text-grey-40',
}

export default function PaymentsPage() {
  const navigate = useNavigate()
  const { data: payments = [], isLoading } = usePayments()
  const { data: bookings = [] } = useBookings()
  const logPayment = useLogPayment()

  const [search, setSearch] = useState('')
  const [methodFilter, setMethodFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [showLog, setShowLog] = useState(false)

  const [logBookingId, setLogBookingId] = useState<string>('')
  const [logAmount, setLogAmount] = useState('')
  const [logMethod, setLogMethod] = useState<PaymentMethod>('cash')
  const [logType, setLogType] = useState<PaymentType>('partial')
  const [logRef, setLogRef] = useState('')

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return payments.filter(p => {
      const bk = (p as any).bookings
      if (term) {
        const haystack = `${bk?.booking_number ?? ''} ${bk?.customers?.full_name ?? ''} ${p.reference_number ?? ''}`.toLowerCase()
        if (!haystack.includes(term)) return false
      }
      if (methodFilter !== 'all' && p.method !== methodFilter) return false
      if (typeFilter !== 'all' && p.type !== typeFilter) return false
      return true
    })
  }, [payments, search, methodFilter, typeFilter])

  const totalPaid = filtered.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0)

  const resetLogForm = () => {
    setLogBookingId('')
    setLogAmount('')
    setLogMethod('cash')
    setLogType('partial')
    setLogRef('')
  }

  const handleLog = async () => {
    if (!logBookingId || !logAmount) return
    try {
      await logPayment.mutateAsync({
        booking_id: logBookingId,
        method: logMethod,
        type: logType,
        amount: Number(logAmount),
        reference_number: logRef || undefined,
      })
      setShowLog(false)
      resetLogForm()
    } catch (err) {
      toast.error('Failed to log payment', err instanceof Error ? err.message : undefined)
    }
  }

  return (
    <div>
      <PageHeader
        title="Payments"
        description="All payment transactions"
        breadcrumb={[{ label: 'Payments' }]}
        actions={
          <Button onClick={() => setShowLog(true)}>
            <Plus className="h-4 w-4" />
            Log Payment
          </Button>
        }
      />

      {/* Summary */}
      <div className="bg-grey-80 border border-grey-60 rounded-lg p-4 mb-5 inline-flex flex-col gap-0.5">
        <span className="text-xs text-grey-40">{search || methodFilter !== 'all' || typeFilter !== 'all' ? 'Filtered Total' : 'Total Collected'}</span>
        <span className="font-display text-2xl text-gold">{formatPeso(totalPaid)}</span>
        <span className="text-xs text-grey-40">{filtered.filter(p => p.status === 'paid').length} transactions</span>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search booking, customer, or reference…"
          className="flex-1"
        />
        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="All Methods" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            {Object.entries(methodLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(typeLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-14 rounded-lg" />
          ))}
        </div>
      ) : !filtered.length ? (
        <EmptyState
          icon={<CreditCard className="h-8 w-8" />}
          title={search || methodFilter !== 'all' || typeFilter !== 'all' ? 'No matches' : 'No payments yet'}
          description={search || methodFilter !== 'all' || typeFilter !== 'all'
            ? 'Try a different filter or search term'
            : 'Payments will appear here when logged'}
        />
      ) : (
        <div className="bg-grey-80 border border-grey-60 rounded-lg overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-grey-60">
                <th className="text-left px-4 py-3 text-xs font-semibold text-grey-40 uppercase tracking-wider">Booking</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-grey-40 uppercase tracking-wider hidden md:table-cell">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-grey-40 uppercase tracking-wider">Method</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-grey-40 uppercase tracking-wider hidden lg:table-cell">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-grey-40 uppercase tracking-wider hidden lg:table-cell">Date</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-grey-40 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((payment, i) => (
                <tr
                  key={payment.id}
                  className={`border-b border-grey-60/50 cursor-pointer hover:bg-gold/5 transition-colors ${i % 2 === 0 ? 'bg-grey-80' : 'bg-grey-100/50'}`}
                  onClick={() => navigate(`/bookings/${payment.booking_id}`)}
                >
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-white font-mono">
                      {(payment as any).bookings?.booking_number ?? '—'}
                    </p>
                    <p className="text-xs text-grey-40">
                      {(payment as any).bookings?.customers?.full_name}
                    </p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-sm text-grey-20 capitalize">{typeLabels[payment.type] ?? payment.type}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-grey-20">{methodLabels[payment.method] ?? payment.method}</span>
                    {payment.reference_number && (
                      <p className="text-xs text-grey-40">Ref: {payment.reference_number}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className={cn('text-sm capitalize font-medium', statusColors[payment.status])}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-xs text-grey-40">
                      {formatPHDateTime(payment.paid_at ?? payment.created_at)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-bold text-green-400">{formatPeso(payment.amount)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Manual log dialog */}
      <Dialog open={showLog} onOpenChange={o => { setShowLog(o); if (!o) resetLogForm() }}>
        <DialogContent side="center">
          <DialogHeader>
            <DialogTitle>Log Payment</DialogTitle>
          </DialogHeader>
          <DialogBody className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-grey-20">Booking</label>
              <Select value={logBookingId} onValueChange={setLogBookingId}>
                <SelectTrigger><SelectValue placeholder="Select a booking…" /></SelectTrigger>
                <SelectContent>
                  {bookings
                    .filter(b => b.status !== 'cancelled' && b.status !== 'draft')
                    .slice(0, 50)
                    .map(b => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.booking_number} · {(b as any).customers?.full_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-grey-20">Payment Type</label>
              <Select value={logType} onValueChange={v => setLogType(v as PaymentType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(typeLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-grey-20">Method</label>
              <Select value={logMethod} onValueChange={v => setLogMethod(v as PaymentMethod)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(methodLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              label="Amount (₱)"
              type="number"
              min="0"
              step="0.01"
              value={logAmount}
              onChange={e => setLogAmount(e.target.value)}
            />
            <Input
              label="Reference Number"
              placeholder="GCash ref, bank ref, etc."
              value={logRef}
              onChange={e => setLogRef(e.target.value)}
            />
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowLog(false)}>Cancel</Button>
            <Button
              onClick={handleLog}
              isLoading={logPayment.isPending}
              disabled={!logBookingId || !logAmount || Number(logAmount) <= 0}
            >
              Save Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

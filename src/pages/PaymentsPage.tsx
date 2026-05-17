import { usePayments } from '@/hooks/usePayments'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { CreditCard } from 'lucide-react'
import { formatPeso } from '@/utils/currency'
import { formatPHDateTime } from '@/utils/dates'
import { cn } from '@/utils/cn'
import { useNavigate } from 'react-router-dom'

const methodLabels: Record<string, string> = {
  cash: 'Cash',
  gcash: 'GCash',
  bank_transfer: 'Bank Transfer',
  card: 'Card',
  paymongo_gcash: 'GCash (Online)',
  paymongo_card: 'Card (Online)',
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

  const totalPaid = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0)

  return (
    <div>
      <PageHeader
        title="Payments"
        description="All payment transactions"
        breadcrumb={[{ label: 'Payments' }]}
      />

      {/* Summary */}
      <div className="bg-grey-80 border border-grey-60 rounded-lg p-4 mb-5 inline-flex flex-col gap-0.5">
        <span className="text-xs text-grey-40">Total Collected</span>
        <span className="font-display text-2xl text-gold">{formatPeso(totalPaid)}</span>
        <span className="text-xs text-grey-40">{payments.filter(p => p.status === 'paid').length} transactions</span>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-14 rounded-lg" />
          ))}
        </div>
      ) : !payments.length ? (
        <EmptyState
          icon={<CreditCard className="h-8 w-8" />}
          title="No payments yet"
          description="Payments will appear here when logged from a booking"
        />
      ) : (
        <div className="bg-grey-80 border border-grey-60 rounded-lg overflow-hidden">
          <table className="w-full">
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
              {payments.map((payment, i) => (
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
                    <span className="text-sm text-grey-20 capitalize">{payment.type.replace('_', ' ')}</span>
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
    </div>
  )
}

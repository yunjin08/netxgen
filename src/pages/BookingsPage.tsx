import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, BookOpen } from 'lucide-react'
import { useBookings } from '@/hooks/useBookings'
import { useAuth } from '@/hooks/useAuth'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { BookingStatusBadge } from '@/components/ui/StatusBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from '@/components/ui/Dialog'
import { BookingForm } from '@/components/bookings/BookingForm'
import { formatPeso } from '@/utils/currency'
import { formatPHDate, dateRangeLabel } from '@/utils/dates'
import { toast } from '@/hooks/useToast'
import type { BookingStatus, BookingFormData, BookingWithDetails } from '@/types'

const TABS: { value: string; label: string; statuses: BookingStatus[] | undefined }[] = [
  { value: 'active', label: 'Active', statuses: ['active', 'overdue'] },
  { value: 'confirmed', label: 'Confirmed', statuses: ['confirmed'] },
  { value: 'draft', label: 'Drafts', statuses: ['draft'] },
  { value: 'completed', label: 'Completed', statuses: ['completed'] },
  { value: 'cancelled', label: 'Cancelled', statuses: ['cancelled', 'no_show'] },
  { value: 'all', label: 'All', statuses: undefined },
]

export default function BookingsPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('active')
  const [showCreate, setShowCreate] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const { profile, activeBranch } = useAuth()

  const currentTab = TABS.find(t => t.value === activeTab)!
  const { data: bookings = [], isLoading } = useBookings({ status: currentTab.statuses as any })

  const handleCreate = async (data: BookingFormData) => {
    setIsCreating(true)
    try {
      await apiFetch('/api/bookings/create', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          branch_id: activeBranch?.id,
          organization_id: profile?.organization_id,
          start_date: data.start_date.toISOString(),
          end_date: data.end_date.toISOString(),
        }),
      })
      toast.success('Booking created!')
      setShowCreate(false)
      navigate('/bookings')
    } catch (err) {
      toast.error('Failed to create booking', err instanceof Error ? err.message : undefined)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Bookings"
        description="Manage all your rental bookings"
        breadcrumb={[{ label: 'Bookings' }]}
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" />
            New Booking
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-5">
          {TABS.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map(tab => (
          <TabsContent key={tab.value} value={tab.value}>
            <BookingTable
              bookings={bookings}
              isLoading={isLoading}
              onRowClick={id => navigate(`/bookings/${id}`)}
              onCreateNew={() => setShowCreate(true)}
            />
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Booking</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <BookingForm
              onSubmit={handleCreate}
              onCancel={() => setShowCreate(false)}
              isLoading={isCreating}
            />
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface BookingTableProps {
  bookings: BookingWithDetails[]
  isLoading: boolean
  onRowClick: (id: string) => void
  onCreateNew: () => void
}

function BookingTable({ bookings, isLoading, onRowClick, onCreateNew }: BookingTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-14 rounded-lg" />
        ))}
      </div>
    )
  }

  if (!bookings.length) {
    return (
      <EmptyState
        icon={<BookOpen className="h-8 w-8" />}
        title="No bookings found"
        description="Create your first booking to get started"
        action={{ label: 'New Booking', onClick: onCreateNew }}
      />
    )
  }

  return (
    <div className="bg-grey-80 border border-grey-60 rounded-lg overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-grey-60">
            <th className="text-left px-4 py-3 text-xs font-semibold text-grey-40 uppercase tracking-wider">Booking</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-grey-40 uppercase tracking-wider hidden md:table-cell">Customer</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-grey-40 uppercase tracking-wider">Status</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-grey-40 uppercase tracking-wider hidden lg:table-cell">Period</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-grey-40 uppercase tracking-wider">Amount</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking, i) => (
            <tr
              key={booking.id}
              className={`border-b border-grey-60/50 cursor-pointer hover:bg-gold/5 transition-colors ${i % 2 === 0 ? 'bg-grey-80' : 'bg-grey-100/50'}`}
              onClick={() => onRowClick(booking.id)}
            >
              <td className="px-4 py-3">
                <p className="text-sm font-medium text-white font-mono">{booking.booking_number}</p>
                <p className="text-xs text-grey-40">{formatPHDate(booking.created_at)}</p>
              </td>
              <td className="px-4 py-3 hidden md:table-cell">
                <p className="text-sm text-grey-20">{(booking as any).customers?.full_name}</p>
                <p className="text-xs text-grey-40">{(booking as any).customers?.phone}</p>
              </td>
              <td className="px-4 py-3">
                <BookingStatusBadge status={booking.status} />
              </td>
              <td className="px-4 py-3 hidden lg:table-cell">
                <p className="text-xs text-grey-20">{dateRangeLabel(booking.start_date, booking.end_date)}</p>
              </td>
              <td className="px-4 py-3 text-right">
                <p className="text-sm font-bold text-gold">{formatPeso(booking.total_amount)}</p>
                {booking.amount_paid < booking.total_amount && (
                  <p className="text-xs text-grey-40">Paid: {formatPeso(booking.amount_paid)}</p>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

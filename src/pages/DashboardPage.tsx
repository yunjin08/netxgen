import { useQuery } from '@tanstack/react-query'
import {
  BookOpen,
  TrendingUp,
  Package,
  AlertTriangle,
  Clock,
  CheckCircle2,
  CreditCard,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { BookingStatusBadge } from '@/components/ui/StatusBadge'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { formatPeso } from '@/utils/currency'
import { formatPHDate, formatPHDateTime } from '@/utils/dates'
import { useNavigate } from 'react-router-dom'
import type { Booking } from '@/types'

function useDashboardStats(orgId: string | null, branchId: string | null) {
  return useQuery({
    queryKey: ['dashboard-stats', orgId, branchId],
    enabled: !!orgId,
    queryFn: async () => {
      const now = new Date().toISOString()

      let query = supabase
        .from('bookings')
        .select('id, status, total_amount, amount_paid, start_date, end_date')
        .eq('organization_id', orgId!)

      if (branchId) query = query.eq('branch_id', branchId)

      const { data: bookingsRaw } = await query
      const bookings = bookingsRaw ?? []

      const active = bookings.filter(b => b.status === 'active').length
      const overdue = bookings.filter(b => b.status === 'overdue').length
      const today = new Date().toDateString()
      const todayBookings = bookings.filter(
        b => new Date(b.start_date).toDateString() === today
      ).length

      // Revenue this month
      const firstOfMonth = new Date()
      firstOfMonth.setDate(1)
      firstOfMonth.setHours(0, 0, 0, 0)
      const monthRevenue = bookings
        .filter(b => b.status === 'completed' && new Date(b.end_date) >= firstOfMonth)
        .reduce((sum, b) => sum + (b.amount_paid ?? 0), 0)

      // Equipment stats
      const { count: availableEquipment } = await supabase
        .from('equipment')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId!)
        .eq('status', 'available')

      return {
        active,
        overdue,
        todayBookings,
        monthRevenue,
        availableEquipment: availableEquipment ?? 0,
        totalBookings: bookings.length,
      }
    },
  })
}

function useRecentPayments(orgId: string | null, branchId: string | null) {
  return useQuery({
    queryKey: ['recent-payments', orgId, branchId],
    enabled: !!orgId,
    queryFn: async () => {
      let query = supabase
        .from('payments')
        .select(`
          id, amount, method, type, status, paid_at, created_at,
          bookings!inner(booking_number, branch_id, customers(full_name))
        `)
        .eq('organization_id', orgId!)
        .eq('status', 'paid')
        .order('created_at', { ascending: false })
        .limit(6)

      if (branchId) query = query.eq('bookings.branch_id', branchId)

      const { data } = await query
      return (data ?? []) as any[]
    },
  })
}

function useRecentBookings(orgId: string | null, branchId: string | null) {
  return useQuery({
    queryKey: ['recent-bookings', orgId, branchId],
    enabled: !!orgId,
    queryFn: async () => {
      let query = supabase
        .from('bookings')
        .select(`
          id, booking_number, status, start_date, end_date, total_amount,
          customers(full_name, phone)
        `)
        .eq('organization_id', orgId!)
        .in('status', ['active', 'confirmed', 'overdue'])
        .order('start_date', { ascending: false })
        .limit(8)

      if (branchId) query = query.eq('branch_id', branchId)

      const { data } = await query
      return ((data ?? []) as unknown) as (Booking & { customers: { full_name: string; phone: string } })[]
    },
  })
}

export default function DashboardPage() {
  const { organization, activeBranch, permissions, profile } = useAuth()
  const navigate = useNavigate()
  const orgId = profile?.organization_id ?? null
  const branchId = permissions.canManageAllBranches ? activeBranch?.id ?? null : profile?.branch_id ?? null

  const stats = useDashboardStats(orgId, branchId)
  const recent = useRecentBookings(orgId, branchId)
  const recentPayments = useRecentPayments(orgId, branchId)

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div>
      <PageHeader
        title={`${greeting()}, ${profile?.full_name?.split(' ')[0] ?? 'there'}`}
        description={`${organization?.name} · ${activeBranch?.name ?? 'All Branches'}`}
        actions={
          <Button onClick={() => navigate('/bookings')} size="sm">
            <BookOpen className="h-4 w-4" />
            New Booking
          </Button>
        }
      />

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Active Rentals"
          value={stats.data?.active ?? 0}
          icon={<Clock className="h-4 w-4" />}
          isLoading={stats.isLoading}
          highlight
        />
        <StatCard
          title="Overdue"
          value={stats.data?.overdue ?? 0}
          icon={<AlertTriangle className="h-4 w-4" />}
          isLoading={stats.isLoading}
        />
        <StatCard
          title="Revenue This Month"
          value={formatPeso(stats.data?.monthRevenue ?? 0, { compact: true })}
          icon={<TrendingUp className="h-4 w-4" />}
          isLoading={stats.isLoading}
        />
        <StatCard
          title="Available Equipment"
          value={stats.data?.availableEquipment ?? 0}
          icon={<Package className="h-4 w-4" />}
          isLoading={stats.isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent bookings */}
        <Card noPadding>
          <CardHeader className="px-4 pt-4 mb-0 pb-3 border-b border-grey-60">
            <CardTitle>Active & Upcoming Rentals</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/bookings')}>
              View all
            </Button>
          </CardHeader>

          {recent.isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-12 rounded" />
              ))}
            </div>
          ) : !recent.data?.length ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <CheckCircle2 className="h-8 w-8 text-grey-40" />
              <p className="text-sm text-grey-40">No active rentals</p>
            </div>
          ) : (
            <div className="divide-y divide-grey-60/50">
              {recent.data.slice(0, 6).map(booking => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-grey-60/20 cursor-pointer transition-colors"
                  onClick={() => navigate(`/bookings/${booking.id}`)}
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">{booking.booking_number}</span>
                      <BookingStatusBadge status={booking.status} />
                    </div>
                    <span className="text-xs text-grey-40 truncate">
                      {(booking as any).customers?.full_name} · {formatPHDate(booking.start_date)} – {formatPHDate(booking.end_date)}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gold shrink-0 ml-3">
                    {formatPeso(booking.total_amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent payments */}
        <Card noPadding>
          <CardHeader className="px-4 pt-4 mb-0 pb-3 border-b border-grey-60">
            <CardTitle>Recent Payments</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/payments')}>
              View all
            </Button>
          </CardHeader>

          {recentPayments.isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-12 rounded" />
              ))}
            </div>
          ) : !recentPayments.data?.length ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <CreditCard className="h-8 w-8 text-grey-40" />
              <p className="text-sm text-grey-40">No payments yet</p>
            </div>
          ) : (
            <div className="divide-y divide-grey-60/50">
              {recentPayments.data.map(p => (
                <div
                  key={p.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-grey-60/20 cursor-pointer transition-colors"
                  onClick={() => navigate(`/payments`)}
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-medium text-white truncate">
                      {p.bookings?.booking_number} · {p.bookings?.customers?.full_name}
                    </span>
                    <span className="text-xs text-grey-40 capitalize truncate">
                      {p.type.replace('_', ' ')} · {p.method.replace('_', ' ')} · {formatPHDateTime(p.paid_at ?? p.created_at)}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-green-400 shrink-0 ml-3">
                    {formatPeso(p.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

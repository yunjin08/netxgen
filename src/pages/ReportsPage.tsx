import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { formatPeso } from '@/utils/currency'
import { Download, BarChart3 } from 'lucide-react'

interface BranchReport {
  branch_id: string
  branch_name: string
  period: string
  total_bookings: number
  active_bookings: number
  completed_bookings: number
  cancelled_bookings: number
  overdue_bookings: number
  total_revenue: number
  avg_booking_value: number
  completion_rate: number
  cancellation_rate: number
  top_equipment: { equipment_id: string; equipment_name: string; total_bookings: number; total_revenue: number }[]
  revenue_by_day: { date: string; label: string; revenue: number; bookings: number }[]
  status_breakdown: { status: string; count: number }[]
}

const STATUS_COLORS: Record<string, string> = {
  Completed: '#22c55e',
  Active:    '#F2B630',
  Confirmed: '#3b82f6',
  Overdue:   '#ef4444',
  Cancelled: '#6b7280',
  Draft:     '#4A4A4A',
}

export default function ReportsPage() {
  const { activeBranch, branches, permissions } = useAuth()
  const [selectedBranch, setSelectedBranch] = useState(activeBranch?.id ?? '')
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d')

  // Sync when activeBranch loads after mount (auth initializes asynchronously)
  useEffect(() => {
    if (activeBranch?.id && !selectedBranch) {
      setSelectedBranch(activeBranch.id)
    }
  }, [activeBranch?.id])

  const effectiveBranch = selectedBranch || activeBranch?.id || ''

  const { data: report, isLoading } = useQuery({
    queryKey: ['branch-report', effectiveBranch, period],
    enabled: !!effectiveBranch,
    queryFn: () => apiFetch<BranchReport>(`/api/reports/branch/${effectiveBranch}?period=${period}`),
  })

  const handleExportCSV = () => {
    if (!report) return
    const rows = [
      ['Metric', 'Value'],
      ['Total Revenue', report.total_revenue],
      ['Total Bookings', report.total_bookings],
      ['Completed', report.completed_bookings],
      ['Active', report.active_bookings],
      ['Overdue', report.overdue_bookings],
      ['Cancelled', report.cancelled_bookings],
      ['Avg Booking Value', report.avg_booking_value],
      ['Completion Rate', `${Math.round(report.completion_rate * 100)}%`],
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const a = document.createElement('a')
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    a.download = `rentflow-report-${period}.csv`
    a.click()
  }

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Performance analytics and insights"
        breadcrumb={[{ label: 'Reports' }]}
        actions={
          <Button variant="secondary" size="sm" onClick={handleExportCSV} disabled={!report}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        {permissions.canManageAllBranches && (
          <Select value={effectiveBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select branch" />
            </SelectTrigger>
            <SelectContent>
              {branches.map(b => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="flex gap-1 bg-grey-80 border border-grey-60 rounded-lg p-1">
          {(['7d', '30d', '90d'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                period === p ? 'bg-gold text-grey-100' : 'text-grey-40 hover:text-white'
              }`}
            >
              {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Revenue"     value={formatPeso(report?.total_revenue ?? 0, { compact: true })} isLoading={isLoading} highlight />
        <StatCard title="Total Bookings"    value={report?.total_bookings ?? 0}                               isLoading={isLoading} />
        <StatCard title="Completion Rate"   value={`${Math.round((report?.completion_rate ?? 0) * 100)}%`}   isLoading={isLoading} />
        <StatCard title="Avg Booking Value" value={formatPeso(report?.avg_booking_value ?? 0)}                isLoading={isLoading} />
      </div>

      {report ? (
        <div className="flex flex-col gap-5">
          {/* Revenue over time */}
          {report.revenue_by_day?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Revenue Over Time</CardTitle>
              </CardHeader>
              <div className="h-56 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={report.revenue_by_day} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4A4A4A" />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: '#7A7A7A', fontSize: 11 }}
                      tickLine={false}
                      interval={period === '7d' ? 0 : period === '30d' ? 4 : 9}
                    />
                    <YAxis
                      tick={{ fill: '#7A7A7A', fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={v => v >= 1000 ? `₱${(v / 1000).toFixed(0)}k` : `₱${v}`}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#2C2C2C', border: '1px solid #4A4A4A', borderRadius: 8 }}
                      labelStyle={{ color: '#BFBFBF', fontSize: 12 }}
                      itemStyle={{ color: '#F2B630' }}
                      formatter={(v) => [`₱${Number(v).toLocaleString()}`, 'Revenue']}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#F2B630" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#F2B630' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Booking status breakdown */}
            {report.status_breakdown?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Bookings by Status</CardTitle>
                </CardHeader>
                <div className="h-48 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.status_breakdown} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#4A4A4A" vertical={false} />
                      <XAxis dataKey="status" tick={{ fill: '#7A7A7A', fontSize: 11 }} tickLine={false} />
                      <YAxis tick={{ fill: '#7A7A7A', fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#2C2C2C', border: '1px solid #4A4A4A', borderRadius: 8 }}
                        labelStyle={{ color: '#BFBFBF', fontSize: 12 }}
                        itemStyle={{ color: '#F2B630' }}
                        formatter={(v) => [Number(v), 'Bookings']}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {report.status_breakdown.map(entry => (
                          <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#4A4A4A'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}

            {/* Top Equipment */}
            {report.top_equipment?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Top Equipment</CardTitle>
                </CardHeader>
                <table className="w-full mt-2">
                  <thead>
                    <tr className="border-b border-grey-60">
                      <th className="text-left pb-2 text-xs font-semibold text-grey-40 uppercase tracking-wider">#</th>
                      <th className="text-left pb-2 text-xs font-semibold text-grey-40 uppercase tracking-wider">Equipment</th>
                      <th className="text-left pb-2 text-xs font-semibold text-grey-40 uppercase tracking-wider">Bkgs</th>
                      <th className="text-right pb-2 text-xs font-semibold text-grey-40 uppercase tracking-wider">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.top_equipment.map((item, i) => (
                      <tr key={item.equipment_id} className="border-b border-grey-60/40">
                        <td className="py-2.5 text-sm text-grey-40">#{i + 1}</td>
                        <td className="py-2.5 text-sm text-white">{item.equipment_name}</td>
                        <td className="py-2.5 text-sm text-grey-20">{item.total_bookings}</td>
                        <td className="py-2.5 text-sm font-bold text-gold text-right">{formatPeso(item.total_revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </div>

          {/* Summary stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-grey-80 border border-grey-60 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-400">{report.completed_bookings}</p>
              <p className="text-xs text-grey-40 mt-1">Completed</p>
            </div>
            <div className="bg-grey-80 border border-grey-60 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-gold">{report.active_bookings}</p>
              <p className="text-xs text-grey-40 mt-1">Active</p>
            </div>
            <div className="bg-grey-80 border border-grey-60 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-red-400">{report.overdue_bookings}</p>
              <p className="text-xs text-grey-40 mt-1">Overdue</p>
            </div>
            <div className="bg-grey-80 border border-grey-60 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-grey-20">{report.cancelled_bookings}</p>
              <p className="text-xs text-grey-40 mt-1">Cancelled</p>
            </div>
          </div>
        </div>
      ) : !isLoading && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <BarChart3 className="h-12 w-12 text-grey-40" />
          <p className="text-grey-40">No data available for this period</p>
        </div>
      )}
    </div>
  )
}

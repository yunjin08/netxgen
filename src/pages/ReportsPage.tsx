import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { formatPeso } from '@/utils/currency'
import { Download, BarChart3 } from 'lucide-react'
import type { BranchReport, RevenueDataPoint } from '@/types'

export default function ReportsPage() {
  const { activeBranch, branches, permissions } = useAuth()
  const [selectedBranch, setSelectedBranch] = useState(activeBranch?.id ?? '')
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d')

  const { data: report, isLoading } = useQuery({
    queryKey: ['branch-report', selectedBranch, period],
    enabled: !!selectedBranch,
    queryFn: () => apiFetch<BranchReport>(`/api/reports/branch/${selectedBranch}?period=${period}`),
  })

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Performance analytics and insights"
        breadcrumb={[{ label: 'Reports' }]}
        actions={
          <Button variant="secondary" size="sm">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        {permissions.canManageAllBranches && (
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
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
        <StatCard title="Total Revenue" value={formatPeso(report?.total_revenue ?? 0, { compact: true })} isLoading={isLoading} highlight />
        <StatCard title="Total Bookings" value={report?.total_bookings ?? 0} isLoading={isLoading} />
        <StatCard title="Completion Rate" value={`${Math.round((report?.completion_rate ?? 0) * 100)}%`} isLoading={isLoading} />
        <StatCard title="Avg Booking Value" value={formatPeso(report?.avg_booking_value ?? 0)} isLoading={isLoading} />
      </div>

      {/* Top Equipment */}
      {report?.top_equipment?.length ? (
        <Card className="mb-5">
          <CardHeader>
            <CardTitle>Top Equipment</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-grey-60">
                  <th className="text-left py-2 text-xs font-semibold text-grey-40 uppercase tracking-wider">#</th>
                  <th className="text-left py-2 text-xs font-semibold text-grey-40 uppercase tracking-wider">Equipment</th>
                  <th className="text-left py-2 text-xs font-semibold text-grey-40 uppercase tracking-wider">Bookings</th>
                  <th className="text-right py-2 text-xs font-semibold text-grey-40 uppercase tracking-wider">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {report.top_equipment.slice(0, 5).map((item, i) => (
                  <tr key={item.equipment_id} className="border-b border-grey-60/50">
                    <td className="py-2.5 text-sm text-grey-40">#{i + 1}</td>
                    <td className="py-2.5 text-sm text-white">{item.equipment_name}</td>
                    <td className="py-2.5 text-sm text-grey-20">{item.total_bookings}</td>
                    <td className="py-2.5 text-sm font-bold text-gold text-right">{formatPeso(item.total_revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      {!report && !isLoading && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <BarChart3 className="h-12 w-12 text-grey-40" />
          <p className="text-grey-40">Select a branch to view reports</p>
        </div>
      )}
    </div>
  )
}

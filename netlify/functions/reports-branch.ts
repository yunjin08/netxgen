import type { Context } from '@netlify/functions'
import { requireRole, AuthError } from './_shared/auth'
import { supabaseAdmin } from './_shared/supabase-admin'
import { json, error, handleOptions } from './_shared/cors'

export default async function handler(request: Request, context: Context): Promise<Response> {
  const origin = request.headers.get('origin')

  if (request.method === 'OPTIONS') return handleOptions(request)
  if (request.method !== 'GET') return error('Method not allowed', 405, origin)

  try {
    const ctx = await requireRole(request, ['owner', 'branch_manager'])
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const branchId = pathParts[pathParts.findIndex(p => p === 'branch') + 1]
    const period = url.searchParams.get('period') ?? '30d'

    if (!branchId) return error('Missing branch ID', 400, origin)

    // Verify branch access
    const { data: branch } = await supabaseAdmin
      .from('branches')
      .select('id, name, organization_id')
      .eq('id', branchId)
      .eq('organization_id', ctx.profile.organization_id)
      .single()

    if (!branch) return error('Branch not found', 404, origin)

    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
    const since = new Date()
    since.setDate(since.getDate() - days)

    // Fetch bookings in period
    const { data: bookings = [] } = await supabaseAdmin
      .from('bookings')
      .select('id, status, total_amount, amount_paid, created_at, start_date, end_date')
      .eq('branch_id', branchId)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: true })

    const total = bookings.length
    const active = bookings.filter(b => b.status === 'active').length
    const completed = bookings.filter(b => b.status === 'completed').length
    const cancelled = bookings.filter(b => b.status === 'cancelled').length
    const overdue = bookings.filter(b => b.status === 'overdue').length
    const totalRevenue = bookings
      .filter(b => ['completed', 'active', 'confirmed'].includes(b.status))
      .reduce((sum, b) => sum + Number(b.amount_paid ?? 0), 0)
    const avgValue = total > 0 ? totalRevenue / Math.max(1, completed + active) : 0
    const completionRate = total > 0 ? completed / total : 0
    const cancellationRate = total > 0 ? cancelled / total : 0

    // Build daily revenue breakdown for chart
    const revenueByDay: Record<string, number> = {}
    const bookingsByDay: Record<string, number> = {}

    // Pre-fill all days in the period with 0
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      revenueByDay[key] = 0
      bookingsByDay[key] = 0
    }

    for (const b of bookings) {
      const key = new Date(b.created_at).toISOString().slice(0, 10)
      if (key in bookingsByDay) {
        bookingsByDay[key] = (bookingsByDay[key] ?? 0) + 1
        if (['completed', 'active', 'confirmed'].includes(b.status)) {
          revenueByDay[key] = (revenueByDay[key] ?? 0) + Number(b.amount_paid ?? 0)
        }
      }
    }

    const revenueData = Object.entries(revenueByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({
        date,
        label: new Date(date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }),
        revenue,
        bookings: bookingsByDay[date] ?? 0,
      }))

    // Top equipment
    const { data: topItems = [] } = await supabaseAdmin
      .from('booking_items')
      .select(`
        equipment_id, quantity, subtotal,
        equipment(name),
        bookings!inner(branch_id, status, created_at)
      `)
      .eq('bookings.branch_id', branchId)
      .in('bookings.status', ['completed', 'active', 'confirmed'])
      .gte('bookings.created_at', since.toISOString())

    const equipmentMap = new Map<string, { name: string; bookings: number; revenue: number }>()
    for (const item of topItems as any[]) {
      const id = item.equipment_id
      const existing = equipmentMap.get(id) ?? { name: item.equipment?.name ?? '', bookings: 0, revenue: 0 }
      existing.bookings += 1
      existing.revenue += Number(item.subtotal ?? 0)
      equipmentMap.set(id, existing)
    }

    const topEquipment = Array.from(equipmentMap.entries())
      .map(([equipment_id, data]) => ({
        equipment_id,
        equipment_name: data.name,
        total_bookings: data.bookings,
        total_revenue: data.revenue,
        utilization_rate: data.bookings / Math.max(1, days),
      }))
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, 5)

    // Booking status breakdown for bar chart
    const statusBreakdown = [
      { status: 'Completed', count: completed },
      { status: 'Active',    count: active },
      { status: 'Confirmed', count: bookings.filter(b => b.status === 'confirmed').length },
      { status: 'Overdue',   count: overdue },
      { status: 'Cancelled', count: cancelled },
      { status: 'Draft',     count: bookings.filter(b => b.status === 'draft').length },
    ].filter(s => s.count > 0)

    const report = {
      branch_id: branchId,
      branch_name: branch.name,
      period,
      total_bookings: total,
      active_bookings: active,
      completed_bookings: completed,
      cancelled_bookings: cancelled,
      overdue_bookings: overdue,
      total_revenue: totalRevenue,
      avg_booking_value: avgValue,
      utilization_rate: 0,
      completion_rate: completionRate,
      cancellation_rate: cancellationRate,
      top_equipment: topEquipment,
      revenue_by_day: revenueData,
      status_breakdown: statusBreakdown,
    }

    return json(report, 200, origin)
  } catch (err) {
    if (err instanceof AuthError) return error(err.message, err.statusCode, origin)
    console.error('reports-branch error:', err)
    return error('Internal server error', 500, origin)
  }
}

export const config = { path: '/api/reports/branch/:id' }

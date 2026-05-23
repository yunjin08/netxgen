import type { Context } from '@netlify/functions'
import { requireAuth, AuthError } from './_shared/auth'
import { supabaseAdmin } from './_shared/supabase-admin'
import { json, error, handleOptions } from './_shared/cors'
import { randomBytes } from 'crypto'

export default async function handler(request: Request, context: Context): Promise<Response> {
  const origin = request.headers.get('origin')

  if (request.method === 'OPTIONS') return handleOptions(request)
  if (request.method !== 'POST') return error('Method not allowed', 405, origin)

  try {
    const ctx = await requireAuth(request)
    const body = await request.json()

    const {
      customer_id,
      branch_id,
      items,
      start_date,
      end_date,
      delivery_type = 'pickup',
      delivery_address,
      deposit_amount = 0,
      notes,
    } = body

    if (!customer_id || !branch_id || !items?.length || !start_date || !end_date) {
      return error('Missing required fields: customer_id, branch_id, items, start_date, end_date', 400, origin)
    }

    const orgId = ctx.profile.organization_id

    // Verify branch belongs to org
    const { data: branch } = await supabaseAdmin
      .from('branches')
      .select('id')
      .eq('id', branch_id)
      .eq('organization_id', orgId)
      .single()

    if (!branch) return error('Invalid branch', 400, origin)

    // Check availability for each equipment item
    const equipmentIds = items.map((i: any) => i.equipment_id)
    const { data: conflicts } = await supabaseAdmin
      .from('booking_items')
      .select(`
        equipment_id,
        quantity,
        bookings!inner(status, start_date, end_date, branch_id)
      `)
      .in('equipment_id', equipmentIds)
      .eq('bookings.branch_id', branch_id)
      .in('bookings.status', ['confirmed', 'active'])
      .lt('bookings.start_date', end_date)
      .gt('bookings.end_date', start_date)

    // Check stock for each item
    const { data: equipment } = await supabaseAdmin
      .from('equipment')
      .select('id, name, stock_available')
      .in('id', equipmentIds)

    const stockWarnings: string[] = []
    for (const item of items) {
      const eq = equipment?.find(e => e.id === item.equipment_id)
      if (!eq) {
        return error(`Equipment not found: ${item.equipment_id}`, 400, origin)
      }
      const reserved = conflicts
        ?.filter(c => c.equipment_id === item.equipment_id)
        .reduce((sum: number, c: any) => sum + (c.quantity ?? 0), 0) ?? 0
      const available = eq.stock_available - reserved
      if (item.quantity > available) {
        stockWarnings.push(`${eq.name}: only ${available} available`)
      }
    }

    if (stockWarnings.length > 0) {
      return error(`Availability conflict: ${stockWarnings.join('; ')}`, 409, origin)
    }

    // Calculate subtotal
    const subtotal = items.reduce((sum: number, item: any) => {
      const days = Math.max(1, Math.ceil((new Date(end_date).getTime() - new Date(start_date).getTime()) / (1000 * 60 * 60 * 24)))
      return sum + (item.unit_price * item.quantity * days)
    }, 0)

    const publicToken = randomBytes(16).toString('hex')

    // Generate booking number
    const bookingNumber = `BK-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`

    // Create booking
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .insert({
        organization_id: orgId,
        branch_id,
        customer_id,
        created_by: ctx.profile.id,
        booking_number: bookingNumber,
        status: 'confirmed',
        delivery_type,
        delivery_address: delivery_address || null,
        start_date,
        end_date,
        subtotal,
        dp_amount: deposit_amount,
        late_fee: 0,
        total_amount: subtotal,
        amount_paid: 0,
        notes: notes || null,
        public_token: publicToken,
        source: 'admin',
      })
      .select()
      .single()

    if (bookingError) throw bookingError

    // Create booking items
    const days = Math.max(1, Math.ceil(
      (new Date(end_date).getTime() - new Date(start_date).getTime()) / (1000 * 60 * 60 * 24)
    ))

    const { error: itemsError } = await supabaseAdmin
      .from('booking_items')
      .insert(
        items.map((item: any) => ({
          booking_id: booking.id,
          equipment_id: item.equipment_id,
          pricing_tier_id: item.pricing_tier_id || null,
          quantity: item.quantity,
          unit: 'day',
          unit_price: item.unit_price,
          units_count: item.duration_units ?? days,
          subtotal: item.unit_price * item.quantity * (item.duration_units ?? days),
        }))
      )

    if (itemsError) {
      // Rollback booking
      await supabaseAdmin.from('bookings').delete().eq('id', booking.id)
      throw itemsError
    }

    // Log audit (non-critical, don't fail booking if this errors)
    try {
      await supabaseAdmin.from('audit_logs').insert({
        organization_id: orgId,
        actor_id: ctx.profile.id,
        actor_role: ctx.profile.role ?? null,
        table_name: 'bookings',
        record_id: booking.id,
        action: 'created',
        new_data: { status: 'confirmed', subtotal, customer_id, branch_id },
      })
    } catch {
      console.warn('audit_logs insert failed, skipping')
    }

    // Send confirmation notification (fire-and-forget)
    fetch(`${process.env.URL}/.netlify/functions/send-sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        booking_id: booking.id,
        event: 'booking_confirmed',
        internal: true,
      }),
    }).catch(() => {})

    return json({ booking, public_link: `${process.env.APP_URL}/booking/${publicToken}` }, 201, origin)
  } catch (err) {
    if (err instanceof AuthError) {
      return error(err.message, err.statusCode, origin)
    }
    console.error('bookings-create error:', err)
    return error('Internal server error', 500, origin)
  }
}

export const config = { path: '/api/bookings/create' }

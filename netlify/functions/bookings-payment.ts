import type { Context } from '@netlify/functions'
import { requireAuth, AuthError } from './_shared/auth'
import { supabaseAdmin } from './_shared/supabase-admin'
import { json, error, handleOptions } from './_shared/cors'

export default async function handler(request: Request, context: Context): Promise<Response> {
  const origin = request.headers.get('origin')

  if (request.method === 'OPTIONS') return handleOptions(request)
  if (request.method !== 'POST') return error('Method not allowed', 405, origin)

  try {
    const ctx = await requireAuth(request)
    const body = await request.json()

    const { booking_id, method, type, amount, reference_number, notes } = body

    if (!booking_id || !method || !amount) {
      return error('Missing required fields: booking_id, method, amount', 400, origin)
    }

    // Verify booking belongs to org
    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('id, total_amount, amount_paid, organization_id')
      .eq('id', booking_id)
      .eq('organization_id', ctx.profile.organization_id)
      .single()

    if (!booking) return error('Booking not found', 404, origin)

    // Log payment
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        booking_id,
        organization_id: ctx.profile.organization_id,
        received_by: ctx.profile.id,
        method,
        type: type ?? 'partial',
        status: 'paid',
        amount,
        reference_number: reference_number || null,
        notes: notes || null,
        paid_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (paymentError) throw paymentError

    // Update amount_paid on booking
    const newAmountPaid = (booking.amount_paid ?? 0) + amount
    await supabaseAdmin
      .from('bookings')
      .update({ amount_paid: newAmountPaid })
      .eq('id', booking_id)

    return json({ payment }, 201, origin)
  } catch (err) {
    if (err instanceof AuthError) return error(err.message, err.statusCode, origin)
    console.error('bookings-payment error:', err)
    return error('Internal server error', 500, origin)
  }
}

export const config = { path: '/api/bookings/:id/payment' }

import type { Context } from '@netlify/functions'
import { supabaseAdmin } from './_shared/supabase-admin'
import { json, error, handleOptions } from './_shared/cors'

export default async function handler(request: Request, context: Context): Promise<Response> {
  const origin = request.headers.get('origin')
  const url = new URL(request.url)

  // Extract token from path: /api/bookings/:token/public
  const pathParts = url.pathname.split('/')
  const tokenIndex = pathParts.findIndex(p => p === 'bookings') + 1
  const token = pathParts[tokenIndex]

  if (!token) return error('Missing booking token', 400, origin)

  if (request.method === 'OPTIONS') return handleOptions(request)

  if (request.method === 'GET') {
    // Fetch booking by public_token
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select(`
        id, booking_number, status, start_date, end_date,
        total_amount, amount_paid, dp_amount,
        delivery_type, delivery_address, notes, public_token,
        customers(id, full_name, phone, email),
        booking_items(
          id, quantity, unit_price, duration_units, subtotal,
          equipment(id, name, category, image_urls)
        ),
        branches(organization_id,
          organizations(name, phone, email)
        )
      `)
      .eq('public_token', token)
      .single()

    if (bookingError || !booking) {
      return error('Booking not found', 404, origin)
    }

    const org = (booking as any).branches?.organizations

    return json({
      booking: {
        ...booking,
        branches: undefined,
      },
      organization: {
        name: org?.name ?? 'RentFlow Shop',
        phone: org?.phone ?? null,
        email: org?.email ?? null,
      },
    }, 200, origin)
  }

  if (request.method === 'POST') {
    // Customer confirms / updates their info
    const body = await request.json()
    const { action, customer_name, customer_phone, customer_email } = body

    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('id, customer_id, status')
      .eq('public_token', token)
      .single()

    if (!booking) return error('Booking not found', 404, origin)

    if (action === 'confirm') {
      // Update customer info if provided
      if (customer_phone && booking.customer_id) {
        await supabaseAdmin
          .from('customers')
          .update({
            full_name: customer_name,
            phone: customer_phone,
            email: customer_email || null,
          })
          .eq('id', booking.customer_id)
      }

      return json({ success: true, booking_id: booking.id }, 200, origin)
    }

    return error('Unknown action', 400, origin)
  }

  return error('Method not allowed', 405, origin)
}

export const config = { path: '/api/bookings/:token/public' }

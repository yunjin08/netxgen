import type { Context } from '@netlify/functions'
import { requireAuth, AuthError } from './_shared/auth'
import { supabaseAdmin } from './_shared/supabase-admin'
import { json, error, handleOptions } from './_shared/cors'
function toCentavosLocal(pesos: number): number {
  return Math.round(pesos * 100)
}

export default async function handler(request: Request, context: Context): Promise<Response> {
  const origin = request.headers.get('origin')

  if (request.method === 'OPTIONS') return handleOptions(request)
  if (request.method !== 'POST') return error('Method not allowed', 405, origin)

  try {
    const ctx = await requireAuth(request)
    const body = await request.json()
    const { booking_id, amount, description } = body

    if (!booking_id || !amount) {
      return error('Missing booking_id or amount', 400, origin)
    }

    // Verify booking
    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('id, booking_number, organization_id')
      .eq('id', booking_id)
      .eq('organization_id', ctx.profile.organization_id)
      .single()

    if (!booking) return error('Booking not found', 404, origin)

    const secretKey = process.env.PAYMONGO_SECRET_KEY
    if (!secretKey) return error('PayMongo not configured', 500, origin)

    // Create PayMongo payment link
    const res = await fetch('https://api.paymongo.com/v1/links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(secretKey + ':').toString('base64')}`,
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: toCentavosLocal(amount),
            description: description ?? `Payment for ${booking.booking_number}`,
            remarks: booking.booking_number,
          },
        },
      }),
    })

    if (!res.ok) {
      const payErr = await res.json()
      console.error('PayMongo error:', payErr)
      return error('Failed to create payment link', 502, origin)
    }

    const payData = await res.json()
    const linkId = payData.data?.id
    const checkoutUrl = payData.data?.attributes?.checkout_url

    // Record pending payment
    await supabaseAdmin.from('payments').insert({
      booking_id,
      organization_id: ctx.profile.organization_id,
      received_by: ctx.profile.id,
      method: 'paymongo',
      type: 'partial',
      status: 'pending',
      amount,
      paymongo_link_id: linkId,
      checkout_url: checkoutUrl,
    })

    return json({ checkout_url: checkoutUrl, link_id: linkId }, 200, origin)
  } catch (err) {
    if (err instanceof AuthError) return error(err.message, err.statusCode, origin)
    console.error('paymongo-create-link error:', err)
    return error('Internal server error', 500, origin)
  }
}

export const config = { path: '/api/payments/paymongo/create-link' }

import type { Context } from '@netlify/functions'
import { createHmac, timingSafeEqual } from 'crypto'
import { supabaseAdmin } from './_shared/supabase-admin'

export default async function handler(request: Request, context: Context): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const rawBody = await request.text()
  const signature = request.headers.get('Paymongo-Signature')

  if (!signature) {
    return new Response('Missing signature', { status: 400 })
  }

  // Verify HMAC-SHA256 signature
  const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('PAYMONGO_WEBHOOK_SECRET not configured')
    return new Response('Server error', { status: 500 })
  }

  const expectedSig = createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex')

  const actualSig = Buffer.from(signature)
  const expectedSigBuf = Buffer.from(expectedSig)

  if (actualSig.length !== expectedSigBuf.length || !timingSafeEqual(actualSig, expectedSigBuf)) {
    return new Response('Invalid signature', { status: 401 })
  }

  // Parse event
  let event: any
  try {
    event = JSON.parse(rawBody)
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const eventType = event?.data?.attributes?.type

  if (eventType === 'payment.paid') {
    const paymentData = event.data.attributes.data
    const paymongoPaymentId = paymentData?.id
    const paymongoLinkId = paymentData?.attributes?.payment_intent_id ?? paymentData?.attributes?.source?.id

    // Find the corresponding payment record
    const { data: payment } = await supabaseAdmin
      .from('payments')
      .select('id, booking_id, amount, status')
      .eq('paymongo_link_id', paymongoLinkId)
      .single()

    if (payment && payment.status !== 'paid') {
      // Mark as paid
      await supabaseAdmin
        .from('payments')
        .update({
          status: 'paid',
          paymongo_payment_id: paymongoPaymentId,
          paid_at: new Date().toISOString(),
        })
        .eq('id', payment.id)

      // Update booking amount_paid
      const { data: booking } = await supabaseAdmin
        .from('bookings')
        .select('amount_paid, total_amount')
        .eq('id', payment.booking_id)
        .single()

      if (booking) {
        const newAmountPaid = (booking.amount_paid ?? 0) + payment.amount
        const isFullyPaid = newAmountPaid >= booking.total_amount

        await supabaseAdmin
          .from('bookings')
          .update({
            amount_paid: newAmountPaid,
            ...(isFullyPaid ? { status: 'confirmed' } : {}),
          })
          .eq('id', payment.booking_id)
      }

      // Log notification
      await supabaseAdmin.from('notifications').insert({
        organization_id: '00000000-0000-0000-0000-000000000000', // Will be updated
        booking_id: payment.booking_id,
        channel: 'sms',
        status: 'pending',
        recipient: '',
        body: 'Payment received via GCash/Card',
        template_key: 'payment_received',
      })
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

export const config = { path: '/api/payments/paymongo/webhook' }

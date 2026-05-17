import type { Context } from '@netlify/functions'
import { supabaseAdmin } from './_shared/supabase-admin'
import { json, error, handleOptions } from './_shared/cors'

const SEMAPHORE_API = 'https://api.semaphore.co/api/v4/messages'

const DEFAULT_TEMPLATES: Record<string, string> = {
  booking_confirmed:
    'Hi {customer_name}! Your booking {booking_number} at {shop_name} is confirmed. Rental: {start_date} to {end_date}. Total: {total_amount}.',
  payment_received:
    'Hi {customer_name}! We received your payment for booking {booking_number}. Thank you!',
  reminder_start:
    'Hi {customer_name}! Reminder: Your rental {booking_number} starts tomorrow. Please coordinate with us.',
  reminder_return:
    'Hi {customer_name}! Reminder: Please return the equipment for booking {booking_number} tomorrow.',
  overdue:
    'Hi {customer_name}! Booking {booking_number} is now overdue. Please return immediately or contact {shop_name}.',
  return_processed:
    'Hi {customer_name}! Thank you for returning the equipment for booking {booking_number}. Hope to see you again!',
}

function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`)
}

export default async function handler(request: Request, context: Context): Promise<Response> {
  const origin = request.headers.get('origin')

  if (request.method === 'OPTIONS') return handleOptions(request)
  if (request.method !== 'POST') return error('Method not allowed', 405, origin)

  try {
    const body = await request.json()
    const { booking_id, event, phone, message: customMessage } = body

    const apiKey = process.env.SEMAPHORE_API_KEY
    const senderName = process.env.SEMAPHORE_SENDER_NAME ?? 'RENTFLOW'

    if (!apiKey) return error('SMS not configured', 500, origin)

    let recipient = phone
    let message = customMessage
    let orgId: string | undefined
    let notificationBookingId = booking_id

    // If booking_id is provided, fetch booking details for template
    if (booking_id && !customMessage) {
      const { data: booking } = await supabaseAdmin
        .from('bookings')
        .select(`
          booking_number, total_amount, start_date, end_date,
          customers(full_name, phone),
          branches(organizations(name, settings))
        `)
        .eq('id', booking_id)
        .single()

      if (booking) {
        const customer = (booking as any).customers
        const org = (booking as any).branches?.organizations
        orgId = undefined

        const template = org?.settings?.sms_templates?.[event] ?? DEFAULT_TEMPLATES[event] ?? '{booking_number}'
        recipient = recipient ?? customer?.phone
        message = fillTemplate(template, {
          customer_name: customer?.full_name ?? '',
          booking_number: booking.booking_number,
          shop_name: org?.name ?? 'RentFlow',
          start_date: new Date(booking.start_date).toLocaleDateString('en-PH'),
          end_date: new Date(booking.end_date).toLocaleDateString('en-PH'),
          total_amount: `₱${booking.total_amount?.toLocaleString()}`,
        })
      }
    }

    if (!recipient || !message) {
      return error('Missing recipient phone or message', 400, origin)
    }

    // Normalize PH phone number
    let normalizedPhone = recipient.replace(/\D/g, '')
    if (normalizedPhone.startsWith('63')) normalizedPhone = '0' + normalizedPhone.slice(2)
    if (!normalizedPhone.startsWith('0')) normalizedPhone = '0' + normalizedPhone
    normalizedPhone = normalizedPhone.slice(0, 11)

    // Send SMS
    const smsRes = await fetch(SEMAPHORE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apikey: apiKey,
        number: normalizedPhone,
        message,
        sendername: senderName,
      }),
    })

    const smsData = await smsRes.json()
    const success = smsRes.ok

    // Log notification
    if (booking_id) {
      await supabaseAdmin.from('notifications').insert({
        organization_id: orgId ?? '00000000-0000-0000-0000-000000000000',
        booking_id: notificationBookingId,
        channel: 'sms',
        status: success ? 'sent' : 'failed',
        recipient: normalizedPhone,
        body: message,
        template_key: event ?? null,
        provider_id: smsData?.[0]?.message_id ?? null,
        error_message: success ? null : JSON.stringify(smsData),
        sent_at: success ? new Date().toISOString() : null,
      })
    }

    if (!success) return error('SMS send failed', 502, origin)

    return json({ success: true, message_id: smsData?.[0]?.message_id }, 200, origin)
  } catch (err) {
    console.error('send-sms error:', err)
    return error('Internal server error', 500, origin)
  }
}

export const config = { path: '/api/notifications/send-sms' }

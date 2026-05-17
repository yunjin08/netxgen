import type { Context } from '@netlify/functions'
import { supabaseAdmin } from './_shared/supabase-admin'
import { json, error, handleOptions } from './_shared/cors'

const RESEND_API = 'https://api.resend.com/emails'

function buildEmailHtml(booking: any, org: any, event: string): string {
  const customer = booking.customers
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><title>Booking Update</title></head>
    <body style="margin:0;padding:0;background:#121212;font-family:'DM Sans',sans-serif;color:#BFBFBF;">
      <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
        <div style="background:#2C2C2C;border:1px solid #4A4A4A;border-radius:12px;overflow:hidden;">
          <!-- Header -->
          <div style="background:#F2B630;padding:20px 24px;">
            <h1 style="margin:0;font-size:20px;font-weight:700;color:#121212;">${org?.name ?? 'RentFlow'}</h1>
            <p style="margin:4px 0 0;font-size:12px;color:#121212;opacity:0.7;">Equipment Rental</p>
          </div>
          <!-- Body -->
          <div style="padding:24px;">
            <p style="margin:0 0 16px;font-size:16px;color:#ffffff;">Hi ${customer?.full_name ?? 'there'},</p>
            ${getEmailBody(event, booking)}
            <!-- Booking Summary -->
            <div style="background:#121212;border-radius:8px;padding:16px;margin:20px 0;">
              <table style="width:100%;border-collapse:collapse;">
                <tr>
                  <td style="padding:4px 0;font-size:12px;color:#7A7A7A;">Booking #</td>
                  <td style="padding:4px 0;font-size:12px;color:#ffffff;text-align:right;font-family:monospace;">${booking.booking_number}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;font-size:12px;color:#7A7A7A;">Period</td>
                  <td style="padding:4px 0;font-size:12px;color:#ffffff;text-align:right;">
                    ${new Date(booking.start_date).toLocaleDateString('en-PH')} – ${new Date(booking.end_date).toLocaleDateString('en-PH')}
                  </td>
                </tr>
                <tr>
                  <td style="padding:4px 0;font-size:12px;color:#7A7A7A;">Total</td>
                  <td style="padding:4px 0;font-size:14px;color:#F2B630;text-align:right;font-weight:700;">₱${booking.total_amount?.toLocaleString()}</td>
                </tr>
              </table>
            </div>
            ${org?.phone ? `<p style="font-size:12px;color:#7A7A7A;">Questions? Contact us at ${org.phone}</p>` : ''}
          </div>
          <!-- Footer -->
          <div style="padding:16px 24px;border-top:1px solid #4A4A4A;text-align:center;">
            <p style="margin:0;font-size:11px;color:#4A4A4A;">Powered by RentFlow · Equipment Rental Management</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

function getEmailBody(event: string, booking: any): string {
  const messages: Record<string, string> = {
    booking_confirmed: `<p style="font-size:14px;color:#BFBFBF;">Your booking has been <strong style="color:#22C55E;">confirmed</strong>. We look forward to serving you!</p>`,
    payment_received: `<p style="font-size:14px;color:#BFBFBF;">We've received your payment of <strong style="color:#F2B630;">₱${booking.amount_paid?.toLocaleString()}</strong>. Thank you!</p>`,
    overdue: `<p style="font-size:14px;color:#BFBFBF;">Your rental is <strong style="color:#EF4444;">overdue</strong>. Please return the equipment as soon as possible to avoid additional fees.</p>`,
    return_processed: `<p style="font-size:14px;color:#BFBFBF;">Your equipment return has been processed. Thank you for choosing us!</p>`,
    reminder_start: `<p style="font-size:14px;color:#BFBFBF;">Your rental starts <strong>tomorrow</strong>. Please prepare for pickup/delivery.</p>`,
    reminder_return: `<p style="font-size:14px;color:#BFBFBF;">Your rental is due for return <strong>tomorrow</strong>. Please coordinate with us for the return.</p>`,
  }
  return messages[event] ?? `<p style="font-size:14px;color:#BFBFBF;">Update on your booking.</p>`
}

const EMAIL_SUBJECTS: Record<string, string> = {
  booking_confirmed: 'Your Booking is Confirmed ✓',
  payment_received: 'Payment Received ✓',
  overdue: '⚠️ Rental Overdue',
  return_processed: 'Return Processed ✓',
  reminder_start: 'Rental Starts Tomorrow',
  reminder_return: 'Rental Due Tomorrow',
}

export default async function handler(request: Request, context: Context): Promise<Response> {
  const origin = request.headers.get('origin')

  if (request.method === 'OPTIONS') return handleOptions(request)
  if (request.method !== 'POST') return error('Method not allowed', 405, origin)

  try {
    const body = await request.json()
    const { booking_id, event, to: customTo, subject: customSubject, html: customHtml } = body

    const apiKey = process.env.RESEND_API_KEY
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'noreply@rentflow.ph'
    const fromName = process.env.RESEND_FROM_NAME ?? 'RentFlow'

    if (!apiKey) return error('Email not configured', 500, origin)

    let toEmail = customTo
    let subject = customSubject
    let html = customHtml

    if (booking_id && !customHtml) {
      const { data: booking } = await supabaseAdmin
        .from('bookings')
        .select(`
          booking_number, total_amount, amount_paid, start_date, end_date,
          customers(full_name, email),
          branches(organizations(name, phone))
        `)
        .eq('id', booking_id)
        .single()

      if (booking) {
        const customer = (booking as any).customers
        const org = (booking as any).branches?.organizations

        toEmail = toEmail ?? customer?.email
        subject = subject ?? EMAIL_SUBJECTS[event] ?? 'Booking Update'
        html = html ?? buildEmailHtml(booking, org, event)
      }
    }

    if (!toEmail || !html) {
      return error('Missing to email or html content', 400, origin)
    }

    const emailRes = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [toEmail],
        subject,
        html,
      }),
    })

    const emailData = await emailRes.json()

    if (!emailRes.ok) {
      console.error('Resend error:', emailData)
      return error('Email send failed', 502, origin)
    }

    return json({ success: true, email_id: emailData.id }, 200, origin)
  } catch (err) {
    console.error('send-email error:', err)
    return error('Internal server error', 500, origin)
  }
}

export const config = { path: '/api/notifications/send-email' }

import type { Context } from '@netlify/functions'
import { requireAuth, AuthError } from './_shared/auth'
import { supabaseAdmin } from './_shared/supabase-admin'
import { json, error, handleOptions } from './_shared/cors'

const RESEND_API = 'https://api.resend.com/emails'

function buildReceiptHtml(booking: any, payments: any[], org: any): string {
  const customer = booking.customers
  const items = booking.booking_items ?? []
  const totalPaid = payments.reduce((sum: number, p: any) => sum + (p.amount ?? 0), 0)
  const balance = (booking.total_amount ?? 0) - totalPaid

  const formatPeso = (n: number) =>
    '₱' + (n ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })

  const itemRows = items
    .map(
      (item: any) => `
      <tr>
        <td style="padding:6px 0;font-size:13px;color:#BFBFBF;">${item.equipment?.name ?? '—'}</td>
        <td style="padding:6px 0;font-size:13px;color:#BFBFBF;text-align:center;">${item.quantity} × ${item.duration_units}d</td>
        <td style="padding:6px 0;font-size:13px;color:#ffffff;text-align:right;">${formatPeso(item.subtotal)}</td>
      </tr>`
    )
    .join('')

  const paymentRows = payments
    .map(
      (p: any) => `
      <tr>
        <td style="padding:4px 0;font-size:12px;color:#7A7A7A;text-transform:capitalize;">${p.type?.replace(/_/g, ' ')} · ${p.method?.replace(/_/g, ' ')}</td>
        <td style="padding:4px 0;font-size:12px;color:#7A7A7A;">${formatDate(p.paid_at ?? p.created_at)}</td>
        <td style="padding:4px 0;font-size:12px;color:#22C55E;text-align:right;">${formatPeso(p.amount)}</td>
      </tr>`
    )
    .join('')

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><title>Payment Receipt</title></head>
    <body style="margin:0;padding:0;background:#121212;font-family:'DM Sans',Arial,sans-serif;color:#BFBFBF;">
      <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
        <div style="background:#2C2C2C;border:1px solid #4A4A4A;border-radius:12px;overflow:hidden;">

          <!-- Header -->
          <div style="background:#F2B630;padding:20px 24px;display:flex;align-items:center;justify-content:space-between;">
            <div>
              <h1 style="margin:0;font-size:20px;font-weight:700;color:#121212;">${org?.name ?? 'RentFlow'}</h1>
              <p style="margin:4px 0 0;font-size:12px;color:#121212;opacity:0.7;">Equipment Rental</p>
            </div>
            <div style="text-align:right;">
              <p style="margin:0;font-size:11px;color:#121212;opacity:0.6;text-transform:uppercase;letter-spacing:1px;">Receipt</p>
              <p style="margin:2px 0 0;font-size:14px;font-weight:700;color:#121212;font-family:monospace;">${booking.booking_number}</p>
            </div>
          </div>

          <!-- Body -->
          <div style="padding:24px;">
            <p style="margin:0 0 4px;font-size:16px;color:#ffffff;">Hi ${customer?.full_name ?? 'there'},</p>
            <p style="margin:0 0 20px;font-size:14px;color:#BFBFBF;">Here is your payment receipt for booking <strong style="color:#F2B630;font-family:monospace;">${booking.booking_number}</strong>.</p>

            <!-- Booking Info -->
            <div style="background:#121212;border-radius:8px;padding:16px;margin-bottom:16px;">
              <table style="width:100%;border-collapse:collapse;">
                <tr>
                  <td style="padding:4px 0;font-size:12px;color:#7A7A7A;">Rental Period</td>
                  <td style="padding:4px 0;font-size:12px;color:#ffffff;text-align:right;">
                    ${formatDate(booking.start_date)} – ${formatDate(booking.end_date)}
                  </td>
                </tr>
                <tr>
                  <td style="padding:4px 0;font-size:12px;color:#7A7A7A;">Delivery</td>
                  <td style="padding:4px 0;font-size:12px;color:#ffffff;text-align:right;text-transform:capitalize;">${booking.delivery_type ?? 'pickup'}</td>
                </tr>
              </table>
            </div>

            <!-- Equipment Items -->
            ${
              items.length
                ? `
            <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#7A7A7A;text-transform:uppercase;letter-spacing:1px;">Items Rented</p>
            <div style="background:#121212;border-radius:8px;padding:16px;margin-bottom:16px;">
              <table style="width:100%;border-collapse:collapse;">
                ${itemRows}
                <tr style="border-top:1px solid #4A4A4A;">
                  <td colspan="2" style="padding:8px 0 4px;font-size:13px;color:#7A7A7A;">Subtotal</td>
                  <td style="padding:8px 0 4px;font-size:13px;color:#ffffff;text-align:right;">${formatPeso(booking.subtotal ?? booking.total_amount)}</td>
                </tr>
                ${
                  (booking.discount_amount ?? 0) > 0
                    ? `<tr>
                  <td colspan="2" style="padding:2px 0;font-size:12px;color:#7A7A7A;">Discount</td>
                  <td style="padding:2px 0;font-size:12px;color:#EF4444;text-align:right;">-${formatPeso(booking.discount_amount)}</td>
                </tr>`
                    : ''
                }
                ${
                  (booking.late_fee_amount ?? 0) > 0
                    ? `<tr>
                  <td colspan="2" style="padding:2px 0;font-size:12px;color:#7A7A7A;">Late Fee</td>
                  <td style="padding:2px 0;font-size:12px;color:#EF4444;text-align:right;">${formatPeso(booking.late_fee_amount)}</td>
                </tr>`
                    : ''
                }
                <tr>
                  <td colspan="2" style="padding:6px 0 2px;font-size:14px;font-weight:700;color:#ffffff;">Total</td>
                  <td style="padding:6px 0 2px;font-size:16px;font-weight:700;color:#F2B630;text-align:right;">${formatPeso(booking.total_amount)}</td>
                </tr>
              </table>
            </div>`
                : ''
            }

            <!-- Payment History -->
            ${
              payments.length
                ? `
            <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#7A7A7A;text-transform:uppercase;letter-spacing:1px;">Payments Received</p>
            <div style="background:#121212;border-radius:8px;padding:16px;margin-bottom:16px;">
              <table style="width:100%;border-collapse:collapse;">
                ${paymentRows}
                <tr style="border-top:1px solid #4A4A4A;">
                  <td colspan="2" style="padding:8px 0 2px;font-size:13px;font-weight:600;color:#ffffff;">Total Paid</td>
                  <td style="padding:8px 0 2px;font-size:14px;font-weight:700;color:#22C55E;text-align:right;">${formatPeso(totalPaid)}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding:2px 0;font-size:13px;color:#7A7A7A;">Balance Due</td>
                  <td style="padding:2px 0;font-size:14px;font-weight:700;color:${balance > 0 ? '#EF4444' : '#22C55E'};text-align:right;">${formatPeso(balance)}</td>
                </tr>
              </table>
            </div>`
                : ''
            }

            ${org?.phone ? `<p style="font-size:12px;color:#7A7A7A;margin:0;">Questions? Contact us at <strong style="color:#BFBFBF;">${org.phone}</strong></p>` : ''}
            ${org?.email ? `<p style="font-size:12px;color:#7A7A7A;margin:4px 0 0;">or email <strong style="color:#BFBFBF;">${org.email}</strong></p>` : ''}
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

export default async function handler(request: Request, _context: Context): Promise<Response> {
  const origin = request.headers.get('origin')

  if (request.method === 'OPTIONS') return handleOptions(request)
  if (request.method !== 'POST') return error('Method not allowed', 405, origin)

  try {
    const ctx = await requireAuth(request)
    const body = await request.json()
    const { booking_id } = body

    if (!booking_id) return error('Missing booking_id', 400, origin)

    // Fetch booking with all details
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select(`
        id, booking_number, status, start_date, end_date,
        subtotal, total_amount, amount_paid, discount_amount, late_fee_amount,
        delivery_type, delivery_address,
        customers(id, full_name, email, phone),
        booking_items(id, quantity, unit_price, duration_units, subtotal, equipment(id, name)),
        branches(organizations(name, phone, email))
      `)
      .eq('id', booking_id)
      .eq('organization_id', ctx.profile.organization_id)
      .single()

    if (bookingError || !booking) return error('Booking not found', 404, origin)

    const customer = (booking as any).customers
    const org = (booking as any).branches?.organizations

    if (!customer?.email) {
      return error('Customer has no email address on file', 422, origin)
    }

    // Fetch all paid payments for this booking
    const { data: payments } = await supabaseAdmin
      .from('payments')
      .select('id, amount, method, type, paid_at, created_at, reference_number')
      .eq('booking_id', booking_id)
      .eq('status', 'paid')
      .order('paid_at', { ascending: true })

    const apiKey = process.env.RESEND_API_KEY
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'noreply@rentflow.ph'
    const fromName = process.env.RESEND_FROM_NAME ?? 'RentFlow'

    if (!apiKey) return error('Email not configured', 500, origin)

    const html = buildReceiptHtml(booking, payments ?? [], org)
    const subject = `Payment Receipt – ${(booking as any).booking_number}`

    const emailRes = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [customer.email],
        subject,
        html,
      }),
    })

    const emailData = await emailRes.json()

    if (!emailRes.ok) {
      console.error('Resend error:', emailData)
      return error('Failed to send receipt email', 502, origin)
    }

    // Log to audit (non-critical)
    try {
      await supabaseAdmin.from('audit_logs').insert({
        organization_id: ctx.profile.organization_id,
        user_id: ctx.profile.id,
        entity_type: 'booking',
        entity_id: booking_id,
        action: 'receipt_sent',
        new_values: { to: customer.email, email_id: emailData.id },
      })
    } catch {
      // non-critical
    }

    return json({ success: true, sent_to: customer.email }, 200, origin)
  } catch (err) {
    if (err instanceof AuthError) return error(err.message, err.statusCode, origin)
    console.error('payments-send-receipt error:', err)
    return error('Internal server error', 500, origin)
  }
}

export const config = { path: '/api/payments/send-receipt' }

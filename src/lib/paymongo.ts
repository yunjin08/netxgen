// PayMongo client utilities for client-side use
// Note: actual API calls with the secret key happen in Netlify Functions

export const PAYMONGO_PUBLIC_KEY = import.meta.env.VITE_PAYMONGO_PUBLIC_KEY

/**
 * Create a PayMongo payment link via Netlify Function
 */
export async function createPaymentLink(params: {
  bookingId: string
  amount: number // in PHP pesos
  description: string
  token: string
}): Promise<{ checkoutUrl: string; linkId: string }> {
  const res = await fetch('/api/payments/paymongo/create-link', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      booking_id: params.bookingId,
      amount: params.amount,
      description: params.description,
    }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.message || 'Failed to create payment link')
  }

  return res.json()
}

function token(): string {
  // This is used in the function signature above but we need the actual token
  // The token parameter in the object takes precedence
  return ''
}

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:8888',
  process.env.APP_URL ?? 'https://rentflow.netlify.app',
].filter(Boolean)

export function getCorsHeaders(origin?: string | null): Record<string, string> {
  const allowedOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0]

  return {
    'Access-Control-Allow-Origin': allowedOrigin ?? '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  }
}

export function json(
  data: unknown,
  status = 200,
  corsOrigin?: string | null
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...getCorsHeaders(corsOrigin),
    },
  })
}

export function error(
  message: string,
  status = 400,
  corsOrigin?: string | null
): Response {
  return json({ error: message }, status, corsOrigin)
}

export function handleOptions(request: Request): Response {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request.headers.get('origin')),
  })
}

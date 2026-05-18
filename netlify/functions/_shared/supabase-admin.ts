import { createClient } from '@supabase/supabase-js'
import ws from 'ws'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing Supabase server environment variables')
}

// Service role client — bypasses RLS, use only in server-side functions
// ws is required for Node 20 which lacks native WebSocket support
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  realtime: {
    transport: ws,
  },
  global: {
    fetch: fetch.bind(globalThis),
  },
})

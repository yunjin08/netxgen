import { supabaseAdmin } from './supabase-admin'

export interface AuthContext {
  user: {
    id: string
    email: string | undefined
  }
  profile: {
    id: string
    organization_id: string
    branch_id: string | null
    role: string
    full_name: string
  }
}

/**
 * Validate JWT from Authorization header and return user + profile
 * Throws if not authenticated or unauthorized
 */
export async function requireAuth(request: Request): Promise<AuthContext> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthError('Missing or invalid authorization header', 401)
  }

  const token = authHeader.slice(7)
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

  if (authError || !user) {
    throw new AuthError('Invalid or expired token', 401)
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, organization_id, branch_id, role, full_name')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    throw new AuthError('User profile not found', 403)
  }

  if (!profile.organization_id) {
    throw new AuthError('User has no organization', 403)
  }

  return {
    user: { id: user.id, email: user.email },
    profile: profile as AuthContext['profile'],
  }
}

/**
 * Require specific roles
 */
export async function requireRole(request: Request, roles: string[]): Promise<AuthContext> {
  const ctx = await requireAuth(request)
  if (!roles.includes(ctx.profile.role)) {
    throw new AuthError(`Required role: ${roles.join(' or ')}`, 403)
  }
  return ctx
}

export class AuthError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message)
    this.name = 'AuthError'
  }
}

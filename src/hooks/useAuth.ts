import { useAuthStore } from '@/store/auth.store'
import { getPermissions } from '@/utils/permissions'

export function useAuth() {
  const store = useAuthStore()
  const permissions = getPermissions(store.profile?.role)

  return {
    user: store.user,
    session: store.session,
    profile: store.profile,
    organization: store.organization,
    branches: store.branches,
    activeBranch: store.activeBranch,
    isLoading: store.isLoading,
    isInitialized: store.isInitialized,
    isAuthenticated: !!store.user,
    hasOrg: !!store.profile?.organization_id,
    role: store.profile?.role ?? null,
    permissions,
    setActiveBranch: store.setActiveBranch,
    signOut: store.signOut,
    refreshProfile: store.refreshProfile,
  }
}

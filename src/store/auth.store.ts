import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile, Organization, Branch } from '@/types'

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  organization: Organization | null
  branches: Branch[]
  activeBranch: Branch | null
  isLoading: boolean
  isInitialized: boolean

  // Actions
  initialize: () => Promise<void>
  setActiveBranch: (branch: Branch) => void
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

let initPromise: Promise<void> | null = null

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  organization: null,
  branches: [],
  activeBranch: null,
  isLoading: true,
  isInitialized: false,

  initialize: async () => {
    // Guard against double-invocation (React StrictMode runs effects twice in dev,
    // and onAuthStateChange would otherwise be subscribed twice).
    if (initPromise) return initPromise

    initPromise = (async () => {
      set({ isLoading: true })

      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          await loadUserData(session, set)
        } else {
          set({ user: null, session: null, isLoading: false, isInitialized: true })
        }

        // Subscribe to auth changes
        supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_IN' && session) {
            await loadUserData(session, set)
          } else if (event === 'SIGNED_OUT') {
            set({
              user: null,
              session: null,
              profile: null,
              organization: null,
              branches: [],
              activeBranch: null,
              isLoading: false,
            })
          } else if (event === 'TOKEN_REFRESHED' && session) {
            set({ session })
          }
        })
      } catch (err) {
        console.error('Auth initialization error:', err)
        set({ isLoading: false, isInitialized: true })
      }
    })()

    return initPromise
  },

  setActiveBranch: (branch: Branch) => {
    set({ activeBranch: branch })
  },

  signOut: async () => {
    await supabase.auth.signOut()
  },

  refreshProfile: async () => {
    const { session } = get()
    if (session) await loadUserData(session, set)
  },
}))

async function loadUserData(
  session: Session,
  set: (state: Partial<AuthState>) => void
) {
  set({ user: session.user, session })

  try {
    // Load profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (profileError || !profile) {
      set({ isLoading: false, isInitialized: true })
      return
    }

    set({ profile })

    if (!profile.organization_id) {
      set({ isLoading: false, isInitialized: true })
      return
    }

    // Load organization
    const { data: organization } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', profile.organization_id)
      .single()

    // Load branches
    const { data: branchesData } = await supabase
      .from('branches')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
    const branches = (branchesData ?? []) as Branch[]

    // Determine active branch
    let activeBranch: Branch | null = null
    if (profile.role === 'owner') {
      activeBranch = branches.find(b => b.is_default) ?? branches[0] ?? null
    } else if (profile.branch_id) {
      activeBranch = branches.find(b => b.id === profile.branch_id) ?? null
    }

    set({
      organization: organization ?? null,
      branches: branches as Branch[],
      activeBranch,
      isLoading: false,
      isInitialized: true,
    })
  } catch (err) {
    console.error('Error loading user data:', err)
    set({ isLoading: false, isInitialized: true })
  }
}

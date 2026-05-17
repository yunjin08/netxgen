import { createBrowserRouter, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { Spinner } from '@/components/ui/Spinner'

// Lazy imports for pages
import { lazy, Suspense } from 'react'

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const SignupPage = lazy(() => import('@/pages/auth/SignupPage'))
const OnboardingPage = lazy(() => import('@/pages/auth/OnboardingPage'))
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const BookingsPage = lazy(() => import('@/pages/BookingsPage'))
const BookingDetailPage = lazy(() => import('@/pages/BookingDetailPage'))
const CalendarPage = lazy(() => import('@/pages/CalendarPage'))
const EquipmentPage = lazy(() => import('@/pages/EquipmentPage'))
const EquipmentDetailPage = lazy(() => import('@/pages/EquipmentDetailPage'))
const CustomersPage = lazy(() => import('@/pages/CustomersPage'))
const CustomerDetailPage = lazy(() => import('@/pages/CustomerDetailPage'))
const PaymentsPage = lazy(() => import('@/pages/PaymentsPage'))
const ReportsPage = lazy(() => import('@/pages/ReportsPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const PublicBookingPage = lazy(() => import('@/pages/PublicBookingPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))
const AppShell = lazy(() => import('@/components/layout/AppShell'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-grey-100">
      <Spinner size="lg" />
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized, isLoading, hasOrg } = useAuthStore(s => ({
    isAuthenticated: !!s.user,
    isInitialized: s.isInitialized,
    isLoading: s.isLoading,
    hasOrg: !!s.profile?.organization_id,
  }))

  if (!isInitialized || isLoading) return <PageLoader />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!hasOrg) return <Navigate to="/onboarding" replace />

  return <>{children}</>
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized, isLoading, hasOrg } = useAuthStore(s => ({
    isAuthenticated: !!s.user,
    isInitialized: s.isInitialized,
    isLoading: s.isLoading,
    hasOrg: !!s.profile?.organization_id,
  }))

  if (!isInitialized || isLoading) return <PageLoader />
  if (isAuthenticated && hasOrg) return <Navigate to="/" replace />

  return <>{children}</>
}

function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized, isLoading } = useAuthStore(s => ({
    isAuthenticated: !!s.user,
    isInitialized: s.isInitialized,
    isLoading: s.isLoading,
  }))

  if (!isInitialized || isLoading) return <PageLoader />
  if (!isAuthenticated) return <Navigate to="/login" replace />

  return <>{children}</>
}

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

export const router = createBrowserRouter([
  // Auth routes
  {
    path: '/login',
    element: (
      <SuspenseWrapper>
        <AuthRoute>
          <LoginPage />
        </AuthRoute>
      </SuspenseWrapper>
    ),
  },
  {
    path: '/signup',
    element: (
      <SuspenseWrapper>
        <AuthRoute>
          <SignupPage />
        </AuthRoute>
      </SuspenseWrapper>
    ),
  },
  {
    path: '/onboarding',
    element: (
      <SuspenseWrapper>
        <OnboardingRoute>
          <OnboardingPage />
        </OnboardingRoute>
      </SuspenseWrapper>
    ),
  },

  // App routes (protected, within AppShell)
  {
    path: '/',
    element: (
      <SuspenseWrapper>
        <ProtectedRoute>
          <AppShell />
        </ProtectedRoute>
      </SuspenseWrapper>
    ),
    children: [
      {
        index: true,
        element: (
          <SuspenseWrapper>
            <DashboardPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'bookings',
        element: (
          <SuspenseWrapper>
            <BookingsPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'bookings/:id',
        element: (
          <SuspenseWrapper>
            <BookingDetailPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'calendar',
        element: (
          <SuspenseWrapper>
            <CalendarPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'equipment',
        element: (
          <SuspenseWrapper>
            <EquipmentPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'equipment/:id',
        element: (
          <SuspenseWrapper>
            <EquipmentDetailPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'customers',
        element: (
          <SuspenseWrapper>
            <CustomersPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'customers/:id',
        element: (
          <SuspenseWrapper>
            <CustomerDetailPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'payments',
        element: (
          <SuspenseWrapper>
            <PaymentsPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'reports',
        element: (
          <SuspenseWrapper>
            <ReportsPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'settings',
        element: (
          <SuspenseWrapper>
            <SettingsPage />
          </SuspenseWrapper>
        ),
      },
    ],
  },

  // Public route (no auth)
  {
    path: '/booking/:token',
    element: (
      <SuspenseWrapper>
        <PublicBookingPage />
      </SuspenseWrapper>
    ),
  },

  // 404
  {
    path: '*',
    element: (
      <SuspenseWrapper>
        <NotFoundPage />
      </SuspenseWrapper>
    ),
  },
])

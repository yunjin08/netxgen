import { useRef, Suspense } from 'react'
import { Outlet, useNavigation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'
import { TopBar } from './TopBar'
import { Spinner } from '@/components/ui/Spinner'

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[40vh]">
      <Spinner size="lg" />
    </div>
  )
}

export default function AppShell() {
  const navigation = useNavigation()
  // Only show progress bar after first idle — skip the initial page load
  const hasBeenIdle = useRef(false)
  if (navigation.state === 'idle') hasBeenIdle.current = true
  const isNavigating = hasBeenIdle.current && navigation.state === 'loading'

  return (
    <div className="flex h-screen bg-grey-100 overflow-hidden">
      {/* Sidebar — desktop */}
      <Sidebar />

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Progress bar for data-loader navigations */}
        <div className={`h-0.5 w-full transition-opacity duration-200 ${isNavigating ? 'opacity-100' : 'opacity-0'}`}>
          <div className={`h-full bg-gold ${isNavigating ? 'animate-progress-bar' : ''}`} />
        </div>

        <TopBar />
        {/* Suspense here catches React.lazy() chunk loading and shows spinner immediately */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 lg:pb-6">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      {/* Bottom nav — mobile */}
      <MobileNav />
    </div>
  )
}

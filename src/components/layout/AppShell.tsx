import { Outlet, useNavigation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'
import { TopBar } from './TopBar'

export default function AppShell() {
  const navigation = useNavigation()
  const isNavigating = navigation.state === 'loading'

  return (
    <div className="flex h-screen bg-grey-100 overflow-hidden">
      {/* Sidebar — desktop */}
      <Sidebar />

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Navigation progress bar */}
        <div className={`h-0.5 w-full transition-opacity duration-200 ${isNavigating ? 'opacity-100' : 'opacity-0'}`}>
          <div className={`h-full bg-gold ${isNavigating ? 'animate-progress-bar' : ''}`} />
        </div>

        <TopBar />
        <main className={`flex-1 overflow-y-auto p-4 sm:p-6 pb-24 lg:pb-6 transition-opacity duration-150 ${isNavigating ? 'opacity-60' : 'opacity-100'}`}>
          <Outlet />
        </main>
      </div>

      {/* Bottom nav — mobile */}
      <MobileNav />
    </div>
  )
}

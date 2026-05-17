import { Bell } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export function TopBar() {
  const { organization, activeBranch } = useAuth()

  return (
    <header className="h-14 bg-grey-80 border-b border-grey-60 flex items-center justify-between px-6 lg:hidden">
      <div className="flex flex-col">
        <span className="font-display text-sm text-white">{organization?.name}</span>
        {activeBranch && (
          <span className="text-xs text-grey-40">{activeBranch.name}</span>
        )}
      </div>
      <button className="p-2 rounded text-grey-40 hover:text-white hover:bg-grey-60 transition-colors">
        <Bell className="h-5 w-5" />
      </button>
    </header>
  )
}

import { useAuth } from '@/hooks/useAuth'
import { ActivityMenu } from './ActivityMenu'

export function TopBar() {
  const { organization, activeBranch } = useAuth()

  return (
    <header className="h-14 bg-grey-80 border-b border-grey-60 flex items-center justify-between px-6 lg:hidden">
      <div className="flex flex-col min-w-0">
        <span className="font-display text-sm text-white truncate">{organization?.name}</span>
        {activeBranch && (
          <span className="text-xs text-grey-40 truncate">{activeBranch.name}</span>
        )}
      </div>
      <ActivityMenu />
    </header>
  )
}

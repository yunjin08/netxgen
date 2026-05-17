import { LogOut, User, Settings } from 'lucide-react'
import * as Dropdown from '@radix-ui/react-dropdown-menu'
import * as Avatar from '@radix-ui/react-avatar'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/utils/cn'
import { toast } from '@/hooks/useToast'

export function UserMenu() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  const initials = profile?.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? '??'

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch {
      toast.error('Failed to sign out')
    }
  }

  return (
    <Dropdown.Root>
      <Dropdown.Trigger className={cn(
        'w-full flex items-center gap-3 px-2 py-2 rounded text-left',
        'hover:bg-grey-60/50 transition-colors focus:outline-none'
      )}>
        <Avatar.Root className="h-8 w-8 rounded-full shrink-0">
          <Avatar.Image
            src={profile?.avatar_url ?? undefined}
            alt={profile?.full_name}
            className="h-full w-full rounded-full object-cover"
          />
          <Avatar.Fallback className="h-8 w-8 rounded-full bg-gold flex items-center justify-center text-xs font-bold text-grey-100">
            {initials}
          </Avatar.Fallback>
        </Avatar.Root>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-grey-20 truncate">{profile?.full_name}</p>
          <p className="text-xs text-grey-40 capitalize">{profile?.role?.replace('_', ' ')}</p>
        </div>
      </Dropdown.Trigger>

      <Dropdown.Portal>
        <Dropdown.Content
          className="z-50 min-w-[180px] bg-grey-80 border border-grey-60 rounded-lg shadow-xl p-1 mb-1"
          sideOffset={4}
          align="start"
          side="top"
        >
          <Dropdown.Item
            className="flex items-center gap-2 px-2 py-1.5 rounded text-sm text-grey-20 hover:bg-grey-60 hover:text-white cursor-pointer outline-none transition-colors"
            onSelect={() => navigate('/settings')}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Dropdown.Item>
          <Dropdown.Separator className="h-px bg-grey-60 my-1" />
          <Dropdown.Item
            className="flex items-center gap-2 px-2 py-1.5 rounded text-sm text-red-400 hover:bg-red-500/10 cursor-pointer outline-none transition-colors"
            onSelect={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Dropdown.Item>
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  )
}

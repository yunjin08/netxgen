import { ChevronDown, Building2 } from 'lucide-react'
import * as Dropdown from '@radix-ui/react-dropdown-menu'
import { cn } from '@/utils/cn'
import { useAuth } from '@/hooks/useAuth'

export function BranchSwitcher() {
  const { activeBranch, branches, permissions, setActiveBranch, profile } = useAuth()

  if (!activeBranch) return null

  // Branch managers see their branch name only (no switching)
  if (!permissions.canManageAllBranches || branches.length <= 1) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5">
        <Building2 className="h-3.5 w-3.5 text-grey-40 shrink-0" />
        <span className="text-xs text-grey-20 font-body truncate">{activeBranch.name}</span>
      </div>
    )
  }

  return (
    <Dropdown.Root>
      <Dropdown.Trigger className={cn(
        'w-full flex items-center gap-2 px-2 py-1.5 rounded text-left',
        'hover:bg-grey-60/50 transition-colors focus:outline-none'
      )}>
        <Building2 className="h-3.5 w-3.5 text-grey-40 shrink-0" />
        <span className="text-xs text-grey-20 font-body truncate flex-1">{activeBranch.name}</span>
        <ChevronDown className="h-3 w-3 text-grey-40 shrink-0" />
      </Dropdown.Trigger>

      <Dropdown.Portal>
        <Dropdown.Content
          className="z-50 min-w-[200px] bg-grey-80 border border-grey-60 rounded-lg shadow-xl p-1"
          sideOffset={4}
          align="start"
        >
          <p className="px-2 py-1 text-xs text-grey-40 font-semibold uppercase tracking-wider">
            Switch Branch
          </p>
          {branches.map(branch => (
            <Dropdown.Item
              key={branch.id}
              className={cn(
                'flex items-center gap-2 px-2 py-1.5 rounded text-sm cursor-pointer outline-none',
                'transition-colors',
                branch.id === activeBranch.id
                  ? 'text-gold bg-gold/10'
                  : 'text-grey-20 hover:bg-grey-60 hover:text-white'
              )}
              onSelect={() => setActiveBranch(branch)}
            >
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              {branch.name}
            </Dropdown.Item>
          ))}
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  )
}

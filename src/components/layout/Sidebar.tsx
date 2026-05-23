import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarDays,
  Package,
  Users,
  BookOpen,
  CreditCard,
  BarChart3,
  Settings,
  Zap,
  FileText,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useAuth } from '@/hooks/useAuth'
import { BranchSwitcher } from './BranchSwitcher'
import { UserMenu } from './UserMenu'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/bookings', icon: BookOpen, label: 'Bookings' },
  { to: '/calendar', icon: CalendarDays, label: 'Calendar' },
  { to: '/equipment', icon: Package, label: 'Equipment' },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/contracts', icon: FileText, label: 'Contracts' },
  { to: '/payments', icon: CreditCard, label: 'Payments' },
]

const ownerItems = [
  { to: '/reports', icon: BarChart3, label: 'Reports' },
]

export function Sidebar() {
  const { permissions, profile } = useAuth()

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-grey-80 border-r border-grey-60 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-grey-60">
        <div className="flex items-center justify-center w-8 h-8 bg-gold rounded-lg">
          <Zap className="h-5 w-5 text-grey-100" />
        </div>
        <span className="font-display text-xl text-white">RentFlow</span>
      </div>

      {/* Branch switcher */}
      <div className="px-3 py-3 border-b border-grey-60">
        <BranchSwitcher />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        <div className="flex flex-col gap-0.5">
          {navItems.map(item => (
            <SidebarLink key={item.to} {...item} />
          ))}
        </div>

        {permissions.canViewReports && (
          <>
            <div className="mx-2 my-3 h-px bg-grey-60" />
            <div className="flex flex-col gap-0.5">
              {ownerItems.map(item => (
                <SidebarLink key={item.to} {...item} />
              ))}
            </div>
          </>
        )}
      </nav>

      {/* Settings + User */}
      <div className="px-3 py-3 border-t border-grey-60 flex flex-col gap-1">
        <SidebarLink to="/settings" icon={Settings} label="Settings" />
        <UserMenu />
      </div>
    </aside>
  )
}

interface SidebarLinkProps {
  to: string
  icon: React.ElementType
  label: string
  exact?: boolean
}

function SidebarLink({ to, icon: Icon, label, exact }: SidebarLinkProps) {
  return (
    <NavLink
      to={to}
      end={exact}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2 rounded text-sm font-body font-medium transition-colors',
          'relative',
          isActive
            ? 'text-gold bg-gold/10 before:absolute before:left-0 before:top-1 before:bottom-1 before:w-0.5 before:bg-gold before:rounded-full'
            : 'text-grey-40 hover:text-grey-20 hover:bg-grey-60/50'
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </NavLink>
  )
}

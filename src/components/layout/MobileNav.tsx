import { NavLink } from 'react-router-dom'
import { LayoutDashboard, BookOpen, Package, Users, Settings } from 'lucide-react'
import { cn } from '@/utils/cn'

const mobileNavItems = [
  { to: '/', icon: LayoutDashboard, label: 'Home', exact: true },
  { to: '/bookings', icon: BookOpen, label: 'Bookings' },
  { to: '/equipment', icon: Package, label: 'Equipment' },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export function MobileNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-grey-80 border-t border-grey-60 flex z-40">
      {mobileNavItems.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.exact}
          className={({ isActive }) =>
            cn(
              'flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-body font-medium transition-colors',
              isActive ? 'text-gold' : 'text-grey-40'
            )
          }
        >
          {({ isActive }) => (
            <>
              <item.icon className={cn('h-5 w-5', isActive && 'text-gold')} />
              {item.label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

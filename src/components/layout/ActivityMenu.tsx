import { Bell, FileText, CreditCard, Package, Users } from 'lucide-react'
import * as Dropdown from '@radix-ui/react-dropdown-menu'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { formatPHDateTime } from '@/utils/dates'

const iconForTable: Record<string, React.ComponentType<{ className?: string }>> = {
  bookings: FileText,
  payments: CreditCard,
  equipment: Package,
  customers: Users,
}

function pathForLog(log: any): string {
  if (log.record_id && log.table_name === 'bookings') return `/bookings/${log.record_id}`
  if (log.record_id && log.table_name === 'customers') return `/customers/${log.record_id}`
  if (log.record_id && log.table_name === 'equipment') return `/equipment/${log.record_id}`
  if (log.table_name === 'payments') return '/payments'
  return ''
}

function actionLabel(action: string, table: string): string {
  const what = table.replace(/s$/, '')
  return `${what} ${action}`
}

export function ActivityMenu() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const orgId = profile?.organization_id

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['activity-logs', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from('audit_logs')
        .select('id, action, table_name, record_id, new_data, created_at')
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false })
        .limit(15)
      return data ?? []
    },
    staleTime: 30 * 1000,
  })

  return (
    <Dropdown.Root>
      <Dropdown.Trigger className="p-2 rounded text-grey-40 hover:text-white hover:bg-grey-60 transition-colors focus:outline-none relative">
        <Bell className="h-5 w-5" />
        {logs.length > 0 && (
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-gold rounded-full" />
        )}
      </Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content
          className="z-50 w-[min(90vw,22rem)] max-h-[70vh] overflow-y-auto bg-grey-80 border border-grey-60 rounded-lg shadow-xl"
          sideOffset={4}
          align="end"
        >
          <div className="px-4 py-3 border-b border-grey-60 flex items-center justify-between">
            <span className="font-display text-sm text-white">Recent Activity</span>
            <span className="text-xs text-grey-40">{logs.length} item{logs.length === 1 ? '' : 's'}</span>
          </div>
          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-10 rounded" />
              ))}
            </div>
          ) : !logs.length ? (
            <div className="px-4 py-8 text-center text-sm text-grey-40">
              No activity yet
            </div>
          ) : (
            <div className="divide-y divide-grey-60/50">
              {logs.map(log => {
                const Icon = iconForTable[log.table_name] ?? FileText
                const path = pathForLog(log)
                return (
                  <Dropdown.Item
                    key={log.id}
                    className="flex items-start gap-3 px-4 py-2.5 cursor-pointer outline-none hover:bg-grey-60/30 transition-colors"
                    onSelect={() => path && navigate(path)}
                  >
                    <Icon className="h-4 w-4 text-grey-40 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white capitalize truncate">{actionLabel(log.action, log.table_name)}</p>
                      <p className="text-xs text-grey-40">{formatPHDateTime(log.created_at)}</p>
                    </div>
                  </Dropdown.Item>
                )
              })}
            </div>
          )}
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  )
}

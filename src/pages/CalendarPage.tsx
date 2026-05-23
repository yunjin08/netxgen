import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCalendarBookings } from '@/hooks/useBookings'
import { useEquipment } from '@/hooks/useEquipment'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { cn } from '@/utils/cn'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function CalendarPage() {
  const navigate = useNavigate()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [equipmentFilter, setEquipmentFilter] = useState('all')

  const { data: bookings = [] } = useCalendarBookings(year, month)
  const { data: equipmentList = [] } = useEquipment()

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  // Filter bookings by selected equipment
  const filteredBookings = equipmentFilter === 'all'
    ? bookings
    : bookings.filter(b =>
        (b as any).booking_items?.some(
          (item: any) => item.equipment?.id === equipmentFilter
        )
      )

  // Build calendar grid
  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const calendarDays: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (calendarDays.length % 7 !== 0) calendarDays.push(null)

  const getBookingsForDay = (day: number) => {
    const date = new Date(year, month - 1, day)
    return filteredBookings.filter(b => {
      const start = new Date(b.start_date)
      const end = new Date(b.end_date)
      return date >= new Date(start.getFullYear(), start.getMonth(), start.getDate()) &&
        date <= new Date(end.getFullYear(), end.getMonth(), end.getDate())
    })
  }

  const statusColors: Record<string, string> = {
    active: 'bg-green-500/30 text-green-300',
    confirmed: 'bg-blue-500/30 text-blue-300',
    overdue: 'bg-red-500/30 text-red-300',
    draft: 'bg-grey-60/30 text-grey-40',
    completed: 'bg-grey-20/20 text-grey-40',
  }

  const selectedEquipment = equipmentList.find(e => e.id === equipmentFilter)

  return (
    <div>
      <PageHeader
        title="Calendar"
        description={
          selectedEquipment
            ? `Showing bookings for ${selectedEquipment.name}`
            : 'Monthly overview of all bookings'
        }
        actions={
          <Select value={equipmentFilter} onValueChange={setEquipmentFilter}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="All Equipment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Equipment</SelectItem>
              {equipmentList.map(eq => (
                <SelectItem key={eq.id} value={eq.id}>
                  {eq.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-5">
        <Button variant="secondary" size="sm" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="font-display text-lg sm:text-xl text-white">
          {MONTHS[month - 1]} {year}
        </h2>
        <Button variant="secondary" size="sm" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(day => (
          <div key={day} className="py-2 text-center text-xs font-semibold text-grey-40 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 border-l border-t border-grey-60">
        {calendarDays.map((day, i) => {
          const dayBookings = day ? getBookingsForDay(day) : []
          const isToday = day && year === now.getFullYear() && month === now.getMonth() + 1 && day === now.getDate()

          return (
            <div
              key={i}
              className={cn(
                'border-r border-b border-grey-60 min-h-[100px] p-1.5',
                !day && 'bg-grey-100/30',
                day && 'hover:bg-grey-60/20 transition-colors'
              )}
            >
              {day && (
                <>
                  <div className={cn(
                    'text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mb-1',
                    isToday ? 'bg-gold text-grey-100 font-bold' : 'text-grey-20'
                  )}>
                    {day}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {dayBookings.slice(0, 3).map(b => (
                      <button
                        key={b.id}
                        className={cn(
                          'text-[10px] px-1.5 py-0.5 rounded truncate text-left w-full leading-4',
                          statusColors[b.status] ?? 'bg-grey-60/30 text-grey-40'
                        )}
                        onClick={() => navigate(`/bookings/${b.id}`)}
                        title={`${b.booking_number} · ${(b as any).customers?.full_name ?? ''}`}
                      >
                        {(b as any).customers?.full_name ?? b.booking_number}
                      </button>
                    ))}
                    {dayBookings.length > 3 && (
                      <p className="text-[10px] text-grey-40 px-1">+{dayBookings.length - 3} more</p>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4">
        {[
          { status: 'active', label: 'Active' },
          { status: 'confirmed', label: 'Confirmed' },
          { status: 'overdue', label: 'Overdue' },
          { status: 'draft', label: 'Draft' },
        ].map(item => (
          <div key={item.status} className="flex items-center gap-1.5">
            <div className={cn('w-3 h-3 rounded', statusColors[item.status])} />
            <span className="text-xs text-grey-40">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

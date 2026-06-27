import { createClient } from '@/lib/supabase/server'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isSameMonth, isToday } from 'date-fns'
import { ko } from 'date-fns/locale'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { EVENT_TYPE_LABELS, EVENT_TYPE_COLORS } from '@/types'
import CalendarNav from './CalendarNav'
import CalendarBadgeClear from './CalendarBadgeClear'
import UpcomingEvents from './UpcomingEvents'
import CalendarMobile from './CalendarMobile'
import { cookies } from 'next/headers'

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ month?: string; year?: string }> }) {
  const params = await searchParams
  const now = new Date()
  const year = parseInt(params.year || String(now.getFullYear()))
  const month = parseInt(params.month || String(now.getMonth() + 1))
  const currentMonth = new Date(year, month - 1, 1)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)

  const { data: events } = await supabase
    .from('events')
    .select('*, attendances(status, user_id)')
    .gte('event_date', monthStart.toISOString())
    .lte('event_date', monthEnd.toISOString())
    .order('event_date', { ascending: true })

  const { data: upcomingEvents } = await supabase
    .from('events')
    .select('*, creator:profiles!created_by(name), attendances(status, user_id)')
    .gte('event_date', now.toISOString())
    .order('event_date', { ascending: true })
    .limit(10)

  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const firstDayOfWeek = getDay(monthStart)
  const totalCells = Math.ceil((firstDayOfWeek + days.length) / 7) * 7

  const getEventsForDay = (day: Date) =>
    events?.filter(e => isSameDay(new Date(e.event_date), day)) ?? []

  const typeColors: Record<string, string> = {
    run: 'bg-blue-500',
    ddayrun: 'bg-purple-500',
    event: 'bg-green-500',
    race: 'bg-red-500',
    social: 'bg-yellow-500',
  }

  const dotColors: Record<string, string> = {
    run: 'bg-blue-500',
    ddayrun: 'bg-purple-500',
    event: 'bg-green-500',
    race: 'bg-red-500',
    social: 'bg-yellow-500',
  }

  const cookieStore = await cookies()
  const lastVisited = cookieStore.get('calendar_last_visited')?.value ?? null

  // 모바일용 이벤트 데이터 직렬화
  const serializedEvents = events?.map(e => ({
    id: e.id,
    title: e.title,
    event_date: e.event_date,
    event_type: e.event_type,
  })) ?? []

  return (
    <div className="space-y-6">
      <CalendarBadgeClear />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">뛰꼬양 캘린더</h1>
          <p className="text-gray-500 mt-1">모임 일정을 확인하고 참여 여부를 알려주세요</p>
        </div>
        <Link href="/calendar/new">
          <button className="btn-primary flex items-center gap-2 whitespace-nowrap text-sm px-4 py-2"><Plus size={16} />모임 만들기</button>
        </Link>
      </div>

      <div className="card p-0 overflow-hidden">
        <CalendarNav year={year} month={month} />
        <div className="grid grid-cols-7 border-b border-gray-100">
          {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
            <div key={d} className={`text-center text-xs font-medium py-2 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-500'}`}>{d}</div>
          ))}
        </div>

        {/* 모바일: 도트 방식 */}
        <div className="md:hidden">
          <CalendarMobile
            events={serializedEvents}
            year={year}
            month={month}
            days={days.map(d => d.toISOString())}
            firstDayOfWeek={firstDayOfWeek}
            totalCells={totalCells}
          />
        </div>

        {/* PC: 텍스트 방식 */}
        <div className="hidden md:block">
          <div className="grid grid-cols-7">
            {Array.from({ length: totalCells }).map((_, idx) => {
              const dayIdx = idx - firstDayOfWeek
              const day = dayIdx >= 0 && dayIdx < days.length ? days[dayIdx] : null
              const dayEvents = day ? getEventsForDay(day) : []
              const isCurrentMonth = day ? isSameMonth(day, currentMonth) : false
              const dayOfWeek = idx % 7
              return (
                <div key={idx} className={`min-h-20 border-b border-r border-gray-50 p-1 ${!isCurrentMonth ? 'bg-gray-50/50' : ''}`}>
                  {day && (
                    <>
                      <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday(day) ? 'bg-[#e94560] text-white' :
                        dayOfWeek === 0 ? 'text-red-400' :
                        dayOfWeek === 6 ? 'text-blue-400' : 'text-gray-700'
                      }`}>
                        {format(day, 'd')}
                      </div>
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 2).map(event => (
                          <Link key={event.id} href={`/calendar/${event.id}`}>
                            <div className={`text-white text-xs px-1 py-0.5 rounded truncate ${typeColors[event.event_type] || 'bg-gray-400'}`}>
                              {event.title}
                            </div>
                          </Link>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-gray-400 pl-1">+{dayEvents.length - 2}개</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 px-4 py-3 border-t border-gray-100">
          {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-full ${dotColors[key] || 'bg-gray-400'}`}></div>
              <span className="text-xs text-gray-500">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">다가오는 모임</h2>
        <UpcomingEvents
          events={upcomingEvents ?? []}
          userId={user?.id ?? ''}
          lastVisited={lastVisited}
        />
      </div>
    </div>
  )
}

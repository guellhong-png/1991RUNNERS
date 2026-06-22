import { createClient } from '@/lib/supabase/server'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isSameMonth, isToday } from 'date-fns'
import { ko } from 'date-fns/locale'
import Link from 'next/link'
import { Plus, MapPin, Clock, Users, Calendar } from 'lucide-react'
import { EVENT_TYPE_LABELS, EVENT_TYPE_COLORS } from '@/types'
import CalendarNav from './CalendarNav'

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

  const getMyStatus = (event: any) =>
    event.attendances?.find((a: any) => a.user_id === user?.id)?.status ?? null

  const typeColors: Record<string, string> = {
    run: 'bg-blue-500',
    ddayrun: 'bg-purple-500',
    event: 'bg-green-500',
    race: 'bg-red-500',
    social: 'bg-yellow-500',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">뛰꼬양 캘린더</h1>
          <p className="text-gray-500 mt-1">모임 일정을 확인하고 참여 여부를 알려주세요</p>
        </div>
        <Link href="/calendar/new">
          <button className="btn-primary flex items-center gap-2"><Plus size={18} />모임 만들기</button>
        </Link>
      </div>

      {/* 달력 */}
      <div className="card p-0 overflow-hidden">
        <CalendarNav year={year} month={month} />

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
            <div key={d} className={`text-center text-xs font-medium py-2 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-500'}`}>{d}</div>
          ))}
        </div>

        {/* 날짜 셀 */}
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

        {/* 범례 */}
        <div className="flex flex-wrap gap-3 px-4 py-3 border-t border-gray-100">
          {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-full ${typeColors[key] || 'bg-gray-400'}`}></div>
              <span className="text-xs text-gray-500">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 다가오는 모임 리스트 */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">다가오는 모임</h2>
        {(!upcomingEvents || upcomingEvents.length === 0) ? (
          <div className="text-center py-12 text-gray-400">
            <Calendar className="mx-auto mb-3 opacity-30" size={40} />
            <p>예정된 모임이 없습니다</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {upcomingEvents.map(event => {
              const attendingCount = event.attendances?.filter((a: any) => a.status === 'attending').length ?? 0
              const myStatus = getMyStatus(event)
              return (
                <Link key={event.id} href={`/calendar/${event.id}`}>
                  <div className="card hover:shadow-md transition-all cursor-pointer border-l-4 border-[#e94560] py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`badge ${EVENT_TYPE_COLORS[event.event_type as keyof typeof EVENT_TYPE_COLORS] || 'bg-gray-100 text-gray-600'}`}>
                            {EVENT_TYPE_LABELS[event.event_type as keyof typeof EVENT_TYPE_LABELS] || event.event_type}
                          </span>
                          {myStatus === 'attending' && <span className="badge bg-green-100 text-green-700">✓ 참여</span>}
                          {myStatus === 'not_attending' && <span className="badge bg-gray-100 text-gray-500">✗ 불참</span>}
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">{event.title}</h3>
                        <div className="flex flex-wrap gap-3">
                          <div className="flex items-center gap-1 text-xs text-gray-500"><Clock size={12} />{format(new Date(event.event_date), 'M월 d일 (E) HH:mm', { locale: ko })}</div>
                          <div className="flex items-center gap-1 text-xs text-gray-500"><MapPin size={12} />{event.location}</div>
                          <div className="flex items-center gap-1 text-xs text-gray-500"><Users size={12} />참여 {attendingCount}명</div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-2xl font-bold text-[#e94560]">{format(new Date(event.event_date), 'd')}</p>
                        <p className="text-xs text-gray-400">{format(new Date(event.event_date), 'M월', { locale: ko })}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

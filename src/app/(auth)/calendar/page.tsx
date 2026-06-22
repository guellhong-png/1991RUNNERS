import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import Link from 'next/link'
import { Plus, MapPin, Clock, Users, Calendar } from 'lucide-react'
import { EVENT_TYPE_LABELS, EVENT_TYPE_COLORS } from '@/types'

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: events } = await supabase.from('events').select('*, creator:profiles!created_by(name), attendances(status, user_id)').order('event_date', { ascending: true })

  const upcoming = events?.filter(e => new Date(e.event_date) >= new Date()) ?? []
  const past = events?.filter(e => new Date(e.event_date) < new Date()) ?? []

  const EventCard = ({ event }: { event: any }) => {
    const attendingCount = event.attendances?.filter((a: any) => a.status === 'attending').length ?? 0
    const myStatus = event.attendances?.find((a: any) => a.user_id === user?.id)?.status ?? null
    return (
      <Link href={`/calendar/${event.id}`}>
        <div className="card hover:shadow-md transition-all cursor-pointer border-l-4 border-[#e94560]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className={`badge ${EVENT_TYPE_COLORS[event.event_type as keyof typeof EVENT_TYPE_COLORS]}`}>{EVENT_TYPE_LABELS[event.event_type as keyof typeof EVENT_TYPE_LABELS]}</span>
                {myStatus === 'attending' && <span className="badge bg-green-100 text-green-700">✓ 참여</span>}
                {myStatus === 'not_attending' && <span className="badge bg-gray-100 text-gray-500">✗ 불참</span>}
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{event.title}</h3>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-sm text-gray-500"><Clock size={14} />{format(new Date(event.event_date), 'M월 d일 (E) HH:mm', { locale: ko })}</div>
                <div className="flex items-center gap-1.5 text-sm text-gray-500"><MapPin size={14} />{event.location}</div>
                <div className="flex items-center gap-1.5 text-sm text-gray-500"><Users size={14} />참여 {attendingCount}명</div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-3xl font-bold text-[#e94560]">{format(new Date(event.event_date), 'd')}</p>
              <p className="text-xs text-gray-400">{format(new Date(event.event_date), 'M월', { locale: ko })}</p>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">캘린더</h1>
          <p className="text-gray-500 mt-1">모임 일정을 확인하고 참여 여부를 알려주세요</p>
        </div>
        <Link href="/calendar/new"><button className="btn-primary flex items-center gap-2"><Plus size={18} />모임 만들기</button></Link>
      </div>
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">다가오는 모임 <span className="text-sm font-normal text-gray-400">({upcoming.length}개)</span></h2>
        {upcoming.length === 0 ? (
          <div className="text-center py-12 text-gray-400"><Calendar className="mx-auto mb-3 opacity-30" size={40} /><p>예정된 모임이 없습니다</p></div>
        ) : (
          <div className="grid gap-4">{upcoming.map((event) => <EventCard key={event.id} event={event} />)}</div>
        )}
      </div>
      {past.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-400 mb-4">지난 모임 <span className="text-sm font-normal">({past.length}개)</span></h2>
          <div className="grid gap-3 opacity-60">{past.slice(0, 5).map((event) => <EventCard key={event.id} event={event} />)}</div>
        </div>
      )}
    </div>
  )
}

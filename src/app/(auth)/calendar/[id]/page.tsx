import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { notFound } from 'next/navigation'
import { MapPin, Clock, User, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { EVENT_TYPE_LABELS, EVENT_TYPE_COLORS } from '@/types'
import AttendanceButtons from './AttendanceButtons'
import DeleteEventButton from './DeleteEventButton'

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  const { data: event } = await supabase.from('events').select('*, creator:profiles!created_by(id, name), attendances(id, status, user_id, profile:profiles!user_id(id, name))').eq('id', id).single()
  if (!event) notFound()

  const attending = event.attendances?.filter((a: any) => a.status === 'attending') ?? []
  const notAttending = event.attendances?.filter((a: any) => a.status === 'not_attending') ?? []
  const myAttendance = event.attendances?.find((a: any) => a.user_id === user?.id)
  const canDelete = profile?.role === 'admin' || event.created_by === user?.id
  const isPast = new Date(event.event_date) < new Date()

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/calendar" className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></Link>
        <h1 className="text-2xl font-bold text-gray-900 flex-1">{event.title}</h1>
        {canDelete && <DeleteEventButton eventId={event.id} />}
      </div>
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <span className={`badge ${EVENT_TYPE_COLORS[event.event_type as keyof typeof EVENT_TYPE_COLORS] || 'bg-gray-100 text-gray-600'}`}>{EVENT_TYPE_LABELS[event.event_type as keyof typeof EVENT_TYPE_LABELS] || event.event_type}</span>
        </div>
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 text-gray-700">
            <Clock size={18} className="text-gray-400 shrink-0" />
            <span>{format(new Date(event.event_date), 'yyyy년 M월 d일 (E) HH:mm', { locale: ko })}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-700">
            <MapPin size={18} className="text-gray-400 shrink-0" />
            {event.location_url ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span>{event.location}</span>
                <a href={event.location_url} target="_blank" rel="noopener noreferrer"
                  className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full hover:bg-yellow-200 transition-colors">
                  카카오맵
                </a>
                <a href={`https://map.naver.com/v5/search/${encodeURIComponent(event.location)}`} target="_blank" rel="noopener noreferrer"
                  className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors">
                  네이버지도
                </a>
              </div>
            ) : (
              <span>{event.location}</span>
            )}
          </div>
          <div className="flex items-center gap-3 text-gray-700">
            <User size={18} className="text-gray-400 shrink-0" />
            <span>주최: {event.creator?.name ?? '알 수 없음'}</span>
          </div>
        </div>
        {event.description && <div className="border-t border-gray-100 pt-4"><p className="text-gray-600 whitespace-pre-wrap">{event.description}</p></div>}
        {!isPast && (
          <div className="border-t border-gray-100 pt-4 mt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">참여 여부를 알려주세요</p>
            <AttendanceButtons eventId={event.id} userId={user!.id} currentStatus={myAttendance?.status ?? null} attendanceId={myAttendance?.id ?? null} />
          </div>
        )}
      </div>
      <div className="card">
        <h2 className="font-bold text-gray-900 mb-4">출석부</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3"><span className="w-2 h-2 rounded-full bg-green-400"></span><span className="text-sm font-medium text-gray-700">참여 ({attending.length}명)</span></div>
            <div className="space-y-2">
              {attending.length === 0 && <p className="text-xs text-gray-400">아직 없어요</p>}
              {attending.map((a: any) => (
                <div key={a.id} className="flex items-center gap-2 bg-green-50 rounded-lg px-3 py-2">
                  <div className="w-6 h-6 rounded-full bg-green-200 flex items-center justify-center text-xs font-medium text-green-700">{a.profile?.name[0]}</div>
                  <span className="text-sm text-gray-700">{a.profile?.name}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-3"><span className="w-2 h-2 rounded-full bg-gray-300"></span><span className="text-sm font-medium text-gray-700">불참 ({notAttending.length}명)</span></div>
            <div className="space-y-2">
              {notAttending.length === 0 && <p className="text-xs text-gray-400">아직 없어요</p>}
              {notAttending.map((a: any) => (
                <div key={a.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-500">{a.profile?.name[0]}</div>
                  <span className="text-sm text-gray-500">{a.profile?.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

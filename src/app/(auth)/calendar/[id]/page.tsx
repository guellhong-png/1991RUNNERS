import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { notFound } from 'next/navigation'
import { MapPin, Clock, User, ArrowLeft, Pencil } from 'lucide-react'
import Link from 'next/link'
import { EVENT_TYPE_LABELS, EVENT_TYPE_COLORS } from '@/types'
import { RichText } from '@/lib/richtext'
import AttendanceButtons from './AttendanceButtons'
import DeleteEventButton from './DeleteEventButton'
import KakaoShareButton from './KakaoShareButton'

// 서버(Vercel)의 시스템 타임존이 UTC라서, new Date(...)를 그대로 format()하면
// 한국 시간이 아니라 UTC로 표시되는 문제가 있다. DB에는 UTC로 저장돼 있으므로
// 항상 KST(UTC+9)로 9시간을 더한 뒤 포맷하도록 보정한다.
function formatKst(isoString: string, pattern: string) {
  const utcDate = new Date(isoString)
  const kstDate = new Date(utcDate.getTime() + 9 * 60 * 60 * 1000)
  // getTime()으로 보정된 시각의 UTC 필드를 그대로 로컬 시각처럼 사용하기 위해
  // Date.UTC 기반 값을 다시 로컬 필드로 읽되, format()은 시스템 로컬 기준으로 동작하므로
  // UTC 표기 함수를 직접 사용해 안전하게 포맷한다.
  const y = kstDate.getUTCFullYear()
  const m = kstDate.getUTCMonth()
  const d = kstDate.getUTCDate()
  const h = kstDate.getUTCHours()
  const min = kstDate.getUTCMinutes()
  const s = kstDate.getUTCSeconds()
  const safeLocalDate = new Date(y, m, d, h, min, s)
  return format(safeLocalDate, pattern, { locale: ko })
}
import EventActions from './EventActions'
import QRButton from './QRButton'

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  const { data: event } = await supabase.from('events').select('*, creator:profiles!created_by(id, name, avatar_url), attendances(id, status, afterparty_status, user_id, profile:profiles!user_id(id, name, avatar_url))').eq('id', id).single()
  if (!event) notFound()

  const { data: eventComments } = await supabase
    .from('event_comments')
    .select('*, author:profiles!author_id(id, name, avatar_url)')
    .eq('event_id', id)
    .order('created_at', { ascending: true })

  const attending = event.attendances?.filter((a: any) => a.status === 'attending') ?? []
  const notAttending = event.attendances?.filter((a: any) => a.status === 'not_attending') ?? []
  const afterpartyAttending = event.attendances?.filter((a: any) => a.afterparty_status === 'attending') ?? []
  const myAttendance = event.attendances?.find((a: any) => a.user_id === user?.id)
  const canDelete = profile?.role === 'admin' || event.created_by === user?.id
  const canEdit = profile?.role === 'admin' || event.created_by === user?.id
  const isPast = new Date(event.event_date) < new Date()
  const rsvpDeadlineClosed = event.rsvp_deadline ? new Date(event.rsvp_deadline) < new Date() : false
  const quotaFull = event.max_attendees != null && attending.length >= event.max_attendees
  const rsvpClosed = rsvpDeadlineClosed || quotaFull

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/calendar" className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></Link>
        <h1 className="text-2xl font-bold text-gray-900 flex-1">{event.title}</h1>
        
        {canEdit && (
          <Link href={`/calendar/${id}/edit`} className="text-gray-400 hover:text-gray-600">
            <Pencil size={18} />
          </Link>
        )}
        {canEdit && <QRButton eventId={event.id} eventTitle={event.title} />}
        {canDelete && <DeleteEventButton eventId={event.id} />}
      </div>

      {/* 모임 기본 정보 */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className={`badge ${EVENT_TYPE_COLORS[event.event_type as keyof typeof EVENT_TYPE_COLORS] || 'bg-gray-100 text-gray-600'}`}>
              {EVENT_TYPE_LABELS[event.event_type as keyof typeof EVENT_TYPE_LABELS] || event.event_type}
            </span>
            {event.has_afterparty && (
              <span className="badge bg-red-50 text-red-500">🍺 뒷풀이 있음</span>
            )}
          </div>
          <KakaoShareButton
            title={event.title}
            description={`${formatKst(event.event_date, 'M월 d일 (E) HH:mm')} · ${event.location}`}
            imageUrl={event.image_url}
            eventId={id}
          />
        </div>

        {event.image_url && (
          <div className="mb-4 rounded-lg overflow-hidden flex justify-center bg-gray-50">
            <img src={event.image_url} alt={event.title} className="max-h-[500px] object-contain" />
          </div>
        )}

        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 text-gray-700">
            <Clock size={18} className="text-gray-400 shrink-0" />
            <span>{formatKst(event.event_date, 'yyyy년 M월 d일 (E) HH:mm')}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-700">
            <MapPin size={18} className="text-gray-400 shrink-0" />
            {event.location_url ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span>{event.location}</span>
                <div className="flex items-center gap-1">
                  <a href={event.location_url}
                    className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full hover:bg-yellow-200 transition-colors">
                    카카오맵
                  </a>
                  <a href={`https://map.naver.com/v5/search/${encodeURIComponent(event.location)}`}
                    className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors">
                    네이버지도
                  </a>
                </div>
              </div>
            ) : (
              <span>{event.location}</span>
            )}
          </div>
          <div className="flex items-center gap-3 text-gray-700">
            <User size={18} className="text-gray-400 shrink-0" />
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#c0392b] flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                {event.creator?.avatar_url
                  ? <img src={event.creator.avatar_url} className="w-full h-full object-cover" />
                  : event.creator?.name?.[0]}
              </div>
              <span>주최: {event.creator?.name ?? '알 수 없음'}</span>
            </div>
          </div>
        </div>

        {event.description && (
          <div className="border-t border-gray-100 pt-4">
            <RichText content={event.description} className="text-gray-600" />
          </div>
        )}

        {/* 참여 여부 */}
        {!isPast && (
          <div className="border-t border-gray-100 pt-4 mt-4">
            <div className="mb-3">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <p className="text-sm font-medium text-gray-700 whitespace-nowrap">참석 여부를 알려주세요</p>
                {event.max_attendees && (
                  <span className={`text-xs font-normal whitespace-nowrap ${quotaFull ? 'text-red-500' : 'text-gray-400'}`}>
                    ({attending.length}/{event.max_attendees}명)
                  </span>
                )}
              </div>
              {event.rsvp_deadline && !quotaFull && (
                <span className={`text-xs ${rsvpDeadlineClosed ? 'text-red-500' : 'text-gray-400'}`}>
                  {rsvpDeadlineClosed ? '투표 마감됨' : `${formatKst(event.rsvp_deadline, 'M월 d일 HH:mm')}까지 투표`}
                </span>
              )}
            </div>
            {rsvpClosed ? (
              <p className="text-sm text-gray-400 bg-gray-50 rounded-lg px-4 py-3">
                {quotaFull ? '정원이 마감되어 참석 투표가 종료됐어요' : '투표 마감 시간이 지나 참여 여부를 변경할 수 없어요'}
              </p>
            ) : (
              <AttendanceButtons
                eventId={event.id}
                userId={user!.id}
                currentStatus={myAttendance?.status ?? null}
                attendanceId={myAttendance?.id ?? null}
                hasAfterparty={event.has_afterparty ?? false}
                currentAfterpartyStatus={myAttendance?.afterparty_status ?? null}
              />
            )}
          </div>
        )}
      </div>

      {/* 출석 현황 */}
      <div className="card">
        <h2 className="font-bold text-gray-900 mb-4">출석 현황</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-green-400"></span>
              <span className="text-sm font-medium text-gray-700">참석 ({attending.length}명)</span>
            </div>
            <div className="space-y-2">
              {attending.length === 0 && <p className="text-xs text-gray-400">아직 없어요</p>}
              {attending.map((a: any) => (
                <div key={a.id} className="flex items-center gap-2 bg-green-50 rounded-lg px-3 py-2">
                  <div className="w-6 h-6 rounded-full bg-green-200 flex items-center justify-center text-xs font-medium text-green-700 overflow-hidden">
                    {a.profile?.avatar_url
                      ? <img src={a.profile.avatar_url} className="w-full h-full object-cover" />
                      : a.profile?.name?.[0]}
                  </div>
                  <span className="text-sm text-gray-700 flex-1">{a.profile?.name}</span>
                  {event.has_afterparty && a.afterparty_status === 'attending' && (
                    <span className="text-xs">🍺</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-gray-300"></span>
              <span className="text-sm font-medium text-gray-700">불참 ({notAttending.length}명)</span>
            </div>
            <div className="space-y-2">
              {notAttending.length === 0 && <p className="text-xs text-gray-400">아직 없어요</p>}
              {notAttending.map((a: any) => (
                <div key={a.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-500 overflow-hidden">
                    {a.profile?.avatar_url
                      ? <img src={a.profile.avatar_url} className="w-full h-full object-cover" />
                      : a.profile?.name?.[0]}
                  </div>
                  <span className="text-sm text-gray-500">{a.profile?.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 뒷풀이 현황 */}
        {event.has_afterparty && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium text-gray-700">🍺 뒷풀이 참석 ({afterpartyAttending.length}명)</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {afterpartyAttending.length === 0 && <p className="text-xs text-gray-400">아직 없어요</p>}
              {afterpartyAttending.map((a: any) => (
                <div key={a.id} className="flex items-center gap-1.5 bg-red-50 rounded-lg px-3 py-1.5">
                  <div className="w-5 h-5 rounded-full bg-red-200 flex items-center justify-center text-xs font-medium text-red-700 overflow-hidden">
                    {a.profile?.avatar_url
                      ? <img src={a.profile.avatar_url} className="w-full h-full object-cover" />
                      : a.profile?.name?.[0]}
                  </div>
                  <span className="text-xs text-gray-700">{a.profile?.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <EventActions
        event={event}
        currentUserId={user!.id}
        currentUserRole={profile?.role ?? 'member'}
        initialComments={eventComments ?? []}
        canEdit={canEdit}
      />
    </div>
  )
}

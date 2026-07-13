export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import AttendanceTable from './AttendanceTable'
import EventTable from './EventTable'

const OFFICIAL_TYPES = ['run', 'ddayrun', 'event', 'race']

function getCurrentPeriod() {
  // Vercel 서버는 UTC라서 KST(UTC+9) 기준으로 계산
  const now = new Date()
  const kstMonth = new Date(now.getTime() + 9 * 60 * 60 * 1000).getUTCMonth()
  const kstYear = new Date(now.getTime() + 9 * 60 * 60 * 1000).getUTCFullYear()
  const half = kstMonth < 6 ? 'H1' : 'H2'
  return `${kstYear}-${half}`
}

export default async function AttendancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: myProfile } = await supabase.from('profiles').select('role').eq('id', user?.id ?? '').single()
  const isAdmin = myProfile?.role === 'admin'

  const { data: profiles } = await supabase.from('profiles').select('id, name, role, grade, avatar_url')
    .in('role', ['member', 'admin']).order('name')

  const { data: officialEvents } = await supabase.from('events').select('id, title, event_date, event_type')
    .in('event_type', OFFICIAL_TYPES)
    .order('event_date', { ascending: false })

  const { data: allEvents } = await supabase.from('events').select('id, title, event_date, event_type')
    .lt('event_date', new Date().toISOString())
    .order('event_date', { ascending: false }).limit(20)

  // 공식 활동 참석 조건: 사전 참석 표시(status: attending) + QR 체크인(checked_in: true) 둘 다 필수
  const { data: checkinAttendances } = await supabase.from('attendances').select('event_id, user_id, status')
    .eq('checked_in', true)
    .eq('status', 'attending')

  const { data: allAttendances } = await supabase.from('attendances').select('event_id, user_id, status')
    .eq('status', 'attending')

  const currentPeriod = getCurrentPeriod()
  const { data: fees } = await supabase.from('membership_fees').select('user_id, paid')
    .eq('period', currentPeriod)
  const feeMap: Record<string, boolean> = {}
  fees?.forEach(f => { feeMap[f.user_id] = f.paid })

  const officialEventIds = new Set(officialEvents?.map(e => e.id) ?? [])
  const checkinMap: Record<string, string[]> = {}
  checkinAttendances?.forEach(a => {
    if (!officialEventIds.has(a.event_id)) return
    if (!checkinMap[a.user_id]) checkinMap[a.user_id] = []
    checkinMap[a.user_id].push(a.event_id)
  })

  const attendanceMap: Record<string, string[]> = {}
  allAttendances?.forEach(a => {
    if (!attendanceMap[a.user_id]) attendanceMap[a.user_id] = []
    attendanceMap[a.user_id].push(a.event_id)
  })

  const officialEventTypeMap: Record<string, string> = {}
  officialEvents?.forEach(e => { officialEventTypeMap[e.id] = e.event_type })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">뛰꼬양 출석표</h1>
        <p className="text-gray-500 mt-1">모임 참여 현황을 확인하세요</p>
      </div>
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">공식 활동 출석 현황</h2>
        <p className="text-xs text-gray-400 mb-3 -mt-2">QR 체크인 기준 · 정기런, 뛰꼬양데이, 행사, 대회 · 회비는 {currentPeriod} 기준</p>
        <AttendanceTable
          profiles={profiles ?? []}
          attendanceMap={checkinMap}
          eventTypeMap={officialEventTypeMap}
          feeMap={feeMap}
          currentPeriod={currentPeriod}
          isAdmin={isAdmin}
        />
      </div>
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">내가 참여한 모임들</h2>
        <EventTable
          profiles={profiles ?? []}
          events={allEvents ?? []}
          attendanceMap={attendanceMap}
        />
      </div>
    </div>
  )
}

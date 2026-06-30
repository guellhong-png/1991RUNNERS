import { createClient } from '@/lib/supabase/server'
import AttendanceTable from './AttendanceTable'
import EventTable from './EventTable'

const OFFICIAL_TYPES = ['run', 'ddayrun', 'event', 'race']

function getCurrentPeriod() {
  const now = new Date()
  const half = now.getMonth() < 6 ? 'H1' : 'H2'
  return `${now.getFullYear()}-${half}`
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
    .order('event_date', { ascending: false }).limit(20)

  const { data: checkinAttendances } = await supabase.from('attendances').select('event_id, user_id, status')
    .eq('checked_in', true)

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

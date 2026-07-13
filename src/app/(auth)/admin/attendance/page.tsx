export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EventTable from '../attendance/EventTable'
import AttendanceTable from '../attendance/AttendanceTable'

const OFFICIAL_TYPES = ['run', 'ddayrun', 'event', 'race']

function getCurrentPeriod() {
  const now = new Date()
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  const half = kst.getUTCMonth() < 6 ? 'H1' : 'H2'
  return `${kst.getUTCFullYear()}-${half}`
}

export default async function AdminAttendancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: myProfile } = await supabase.from('profiles').select('role').eq('id', user?.id ?? '').single()
  if (myProfile?.role !== 'admin') redirect('/dashboard')

  const { data: profiles } = await supabase.from('profiles').select('id, name, role, grade, avatar_url')
    .in('role', ['member', 'admin']).order('name')

  const { data: officialEvents } = await supabase.from('events').select('id, title, event_date, event_type')
    .in('event_type', OFFICIAL_TYPES)
    .lt('event_date', new Date().toISOString())
    .order('event_date', { ascending: false }).limit(20)

  const { data: checkinAttendances } = await supabase.from('attendances').select('event_id, user_id')
    .eq('checked_in', true).eq('status', 'attending')

  const currentPeriod = getCurrentPeriod()
  const { data: fees } = await supabase.from('membership_fees').select('user_id, paid').eq('period', currentPeriod)
  const feeMap: Record<string, boolean> = {}
  fees?.forEach(f => { feeMap[f.user_id] = f.paid })

  const officialEventIds = new Set(officialEvents?.map(e => e.id) ?? [])
  const checkinMap: Record<string, string[]> = {}
  checkinAttendances?.forEach(a => {
    if (!officialEventIds.has(a.event_id)) return
    if (!checkinMap[a.user_id]) checkinMap[a.user_id] = []
    checkinMap[a.user_id].push(a.event_id)
  })

  const officialEventTypeMap: Record<string, string> = {}
  officialEvents?.forEach(e => { officialEventTypeMap[e.id] = e.event_type })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">공식 활동 출석부</h1>
        <p className="text-gray-500 mt-1">QR 체크인 기준 · 정기런, 뛰꼬양데이, 행사, 대회</p>
      </div>
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">출석 현황 요약</h2>
        <p className="text-xs text-gray-400 mb-3">회비는 {currentPeriod} 기준</p>
        <AttendanceTable
          profiles={profiles ?? []}
          attendanceMap={checkinMap}
          eventTypeMap={officialEventTypeMap}
          feeMap={feeMap}
          currentPeriod={currentPeriod}
          isAdmin={true}
        />
      </div>
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">모임별 출석 상세</h2>
        <p className="text-xs text-gray-400 mb-3">셀 클릭 → 확인 팝업 후 참석/취소 수정 가능</p>
        <EventTable
          profiles={profiles ?? []}
          events={officialEvents ?? []}
          attendanceMap={checkinMap}
          isAdmin={true}
        />
      </div>
    </div>
  )
}

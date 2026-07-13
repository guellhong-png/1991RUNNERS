export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import EventTable from './EventTable'

const OFFICIAL_TYPES = ['run', 'ddayrun', 'event', 'race']

export default async function AttendancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: myProfile } = await supabase.from('profiles').select('role').eq('id', user?.id ?? '').single()
  const isAdmin = myProfile?.role === 'admin'

  const { data: profiles } = await supabase.from('profiles').select('id, name, role, grade, avatar_url')
    .in('role', ['member', 'admin']).order('name')

  // 지난 공식 모임만 (벙개 제외)
  const { data: allEvents } = await supabase.from('events').select('id, title, event_date, event_type')
    .in('event_type', OFFICIAL_TYPES)
    .lt('event_date', new Date().toISOString())
    .order('event_date', { ascending: false }).limit(20)

  const { data: allAttendances } = await supabase.from('attendances').select('event_id, user_id, status')
    .eq('status', 'attending')
    .eq('checked_in', true)

  const attendanceMap: Record<string, string[]> = {}
  allAttendances?.forEach(a => {
    if (!attendanceMap[a.user_id]) attendanceMap[a.user_id] = []
    attendanceMap[a.user_id].push(a.event_id)
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">뛰꼬양 출석표</h1>
        <p className="text-gray-500 mt-1">공식 모임 참여 현황을 확인하세요</p>
      </div>
      <EventTable
        profiles={profiles ?? []}
        events={allEvents ?? []}
        attendanceMap={attendanceMap}
        isAdmin={isAdmin}
      />
    </div>
  )
}

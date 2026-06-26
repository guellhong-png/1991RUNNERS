import { createClient } from '@/lib/supabase/server'
import AttendanceTable from './AttendanceTable'
import EventTable from './EventTable'

export default async function AttendancePage() {
  const supabase = await createClient()
  const { data: profiles } = await supabase.from('profiles').select('id, name, role, grade, avatar_url')
    .in('role', ['member', 'admin']).order('name')
  const { data: events } = await supabase.from('events').select('id, title, event_date, event_type')
    .order('event_date', { ascending: false }).limit(20)
  const { data: attendances } = await supabase.from('attendances').select('event_id, user_id, status')
    .eq('status', 'attending')

  const attendanceMap: Record<string, string[]> = {}
  attendances?.forEach(a => {
    if (!attendanceMap[a.user_id]) attendanceMap[a.user_id] = []
    attendanceMap[a.user_id].push(a.event_id)
  })

  const eventTypeMap: Record<string, string> = {}
  events?.forEach(e => { eventTypeMap[e.id] = e.event_type })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">뛰꼬양 출석표</h1>
        <p className="text-gray-500 mt-1">모임 참여 현황을 확인하세요</p>
      </div>
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">출석부 현황</h2>
        <AttendanceTable
          profiles={profiles ?? []}
          attendanceMap={attendanceMap}
          eventTypeMap={eventTypeMap}
        />
      </div>
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">내가 참여한 모임들</h2>
        <EventTable
          profiles={profiles ?? []}
          events={events ?? []}
          attendanceMap={attendanceMap}
        />
      </div>
    </div>
  )
}

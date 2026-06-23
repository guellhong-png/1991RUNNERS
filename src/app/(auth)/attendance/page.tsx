import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

const TYPE_LABELS: Record<string, string> = {
  run: '정기런', ddayrun: '뛰꼬양데이', event: '행사', race: '대회', social: '벙개',
}
const TYPE_COLORS: Record<string, string> = {
  run: 'bg-blue-100 text-blue-700', ddayrun: 'bg-purple-100 text-purple-700',
  event: 'bg-green-100 text-green-700', race: 'bg-red-100 text-red-700',
  social: 'bg-yellow-100 text-yellow-700',
}
const TYPE_KEYS = ['run', 'ddayrun', 'event', 'race', 'social']

export default async function AttendancePage() {
  const supabase = await createClient()
  const { data: profiles } = await supabase.from('profiles').select('id, name, role, grade')
    .in('role', ['member', 'admin']).order('name')
  const { data: events } = await supabase.from('events').select('id, title, event_date, event_type')
    .order('event_date', { ascending: false }).limit(20)
  const { data: attendances } = await supabase.from('attendances').select('event_id, user_id, status')
    .eq('status', 'attending')

  // 유저별 참여한 event_id set
  const attendanceMap = new Map<string, Set<string>>()
  attendances?.forEach(a => {
    if (!attendanceMap.has(a.user_id)) attendanceMap.set(a.user_id, new Set())
    attendanceMap.get(a.user_id)!.add(a.event_id)
  })

  // event_id -> event_type 맵
  const eventTypeMap = new Map<string, string>()
  events?.forEach(e => eventTypeMap.set(e.id, e.event_type))

  // 유저별 타입별 카운트
  const getTypeCount = (userId: string, type: string) => {
    const attended = attendanceMap.get(userId)
    if (!attended) return 0
    return [...attended].filter(eid => eventTypeMap.get(eid) === type).length
  }
  const getCount = (userId: string) => attendanceMap.get(userId)?.size ?? 0

  // 총합 기준 내림차순 정렬
  const sortedProfiles = [...(profiles ?? [])].sort((a, b) => getCount(b.id) - getCount(a.id))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">뛰꼬양 출석표</h1>
        <p className="text-gray-500 mt-1">모임 참여 현황을 확인하세요</p>
      </div>

      {/* 출석부 현황 */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">출석부 현황</h2>
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="sticky left-0 bg-gray-50 text-left px-4 py-3 font-medium text-gray-600 min-w-24 z-10">이름</th>
                  <th className="px-3 py-3 font-medium text-gray-600 text-center min-w-12">총합</th>
                  {TYPE_KEYS.map(type => (
                    <th key={type} className="px-3 py-3 font-medium text-gray-600 text-center min-w-16">
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-xs ${TYPE_COLORS[type]}`}>
                        {TYPE_LABELS[type]}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sortedProfiles.map(profile => (
                  <tr key={profile.id} className="hover:bg-gray-50">
                    <td className="sticky left-0 bg-white hover:bg-gray-50 px-4 py-3 font-medium text-gray-900 z-10">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#c0392b] flex items-center justify-center text-white text-xs font-bold shrink-0">{profile.name[0]}</div>
                        {profile.name}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center font-bold text-[#c0392b]">{getCount(profile.id)}</td>
                    {TYPE_KEYS.map(type => (
                      <td key={type} className="px-3 py-3 text-center font-medium text-gray-700">
                        {getTypeCount(profile.id, type) || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 내가 참여한 모임들 */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">내가 참여한 모임들</h2>
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="sticky left-0 bg-gray-50 text-left px-4 py-3 font-medium text-gray-600 min-w-24 z-10">이름</th>
                  <th className="px-3 py-3 font-medium text-gray-600 text-center min-w-12">총</th>
                  {events?.map(event => (
                    <th key={event.id} className="px-2 py-3 font-medium text-gray-600 text-center min-w-16">
                      <div className={`inline-flex px-1.5 py-0.5 rounded text-xs mb-1 ${TYPE_COLORS[event.event_type] || 'bg-gray-100 text-gray-600'}`}>
                        {TYPE_LABELS[event.event_type] || event.event_type}
                      </div>
                      <div className="text-gray-400 font-normal">{format(new Date(event.event_date), 'M/d', { locale: ko })}</div>
                      <div className="text-gray-500 truncate max-w-14">{event.title}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sortedProfiles.map(profile => (
                  <tr key={profile.id} className="hover:bg-gray-50">
                    <td className="sticky left-0 bg-white hover:bg-gray-50 px-4 py-3 font-medium text-gray-900 z-10">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#c0392b] flex items-center justify-center text-white text-xs font-bold shrink-0">{profile.name[0]}</div>
                        {profile.name}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center font-bold text-[#c0392b]">{getCount(profile.id)}</td>
                    {events?.map(event => {
                      const attended = attendanceMap.get(profile.id)?.has(event.id)
                      return (
                        <td key={event.id} className="px-2 py-3 text-center">
                          {attended ? <span className="text-green-500 font-bold">✓</span> : <span className="text-gray-200">-</span>}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

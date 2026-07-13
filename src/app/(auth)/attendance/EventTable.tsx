'use client'
import { useState } from 'react'
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
const PAGE_SIZE = 20

interface Profile { id: string; name: string; avatar_url?: string }
interface Event { id: string; title: string; event_date: string; event_type: string }

const Avatar = ({ profile }: { profile: Profile }) => (
  <div className="w-6 h-6 rounded-full bg-[#c0392b] flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
    {profile.avatar_url
      ? <img src={profile.avatar_url} className="w-full h-full object-cover" alt={profile.name} />
      : profile.name[0]}
  </div>
)

export default function EventTable({ profiles, events, attendanceMap, isAdmin }: {
  profiles: Profile[]
  events: Event[]
  attendanceMap: Record<string, string[]>
  isAdmin?: boolean
}) {
  const [page, setPage] = useState(0)

  const getCount = (userId: string) => attendanceMap[userId]?.length ?? 0
  const sorted = [...profiles].sort((a, b) => getCount(b.id) - getCount(a.id))
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <div>
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="sticky left-0 bg-gray-50 text-left px-4 py-3 font-medium text-gray-600 min-w-24 z-10">이름</th>
                <th className="px-3 py-3 font-medium text-gray-600 text-center min-w-12">총</th>
                {events.map(event => (
                  <th key={event.id} className="px-2 py-3 font-medium text-gray-600 text-center min-w-16">
                    <div className={`inline-flex px-1.5 py-0.5 rounded text-xs mb-1 whitespace-nowrap ${TYPE_COLORS[event.event_type] || 'bg-gray-100 text-gray-600'}`}>
                      {TYPE_LABELS[event.event_type] || event.event_type}
                    </div>
                    <div className="text-gray-400 font-normal">{format(new Date(event.event_date), 'M/d', { locale: ko })}</div>
                    <div className="text-gray-500 truncate max-w-14">{event.title}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paged.map(profile => (
                <tr key={profile.id} className="hover:bg-gray-50">
                  <td className="sticky left-0 bg-white hover:bg-gray-50 px-4 py-3 font-medium text-gray-900 z-10">
                    <div className="flex items-center gap-2">
                      <Avatar profile={profile} />
                      {profile.name}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center font-bold text-[#c0392b]">{getCount(profile.id)}</td>
                  {events.map(event => {
                    const attended = (attendanceMap[profile.id] ?? []).includes(event.id)
                    return (
                      <td key={event.id} className="px-2 py-3 text-center">
                        {attended
                          ? <span className="text-green-500 font-bold">✓</span>
                          : <span className="text-gray-200">-</span>}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 px-1">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-30">← 이전</button>
          <span className="text-xs text-gray-400">{page + 1} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
            className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-30">다음 →</button>
        </div>
      )}
    </div>
  )
}

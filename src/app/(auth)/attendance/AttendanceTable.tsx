'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'

const TYPE_LABELS: Record<string, string> = {
  run: '정기런', ddayrun: '뛰꼬양데이', event: '행사', race: '대회', social: '벙개',
}
const TYPE_COLORS: Record<string, string> = {
  run: 'bg-blue-100 text-blue-700', ddayrun: 'bg-purple-100 text-purple-700',
  event: 'bg-green-100 text-green-700', race: 'bg-red-100 text-red-700',
  social: 'bg-yellow-100 text-yellow-700',
}
const TYPE_KEYS = ['run', 'ddayrun', 'event', 'race']
const PAGE_SIZE = 20

interface Profile { id: string; name: string; avatar_url?: string }

const Avatar = ({ profile }: { profile: Profile }) => (
  <div className="w-6 h-6 rounded-full bg-[#c0392b] flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
    {profile.avatar_url
      ? <img src={profile.avatar_url} className="w-full h-full object-cover" alt={profile.name} />
      : profile.name[0]}
  </div>
)

export default function AttendanceTable({
  profiles,
  attendanceMap,
  eventTypeMap,
  feeMap,
  currentPeriod,
  isAdmin,
}: {
  profiles: Profile[]
  attendanceMap: Record<string, string[]>
  eventTypeMap: Record<string, string>
  feeMap?: Record<string, boolean>
  currentPeriod?: string
  isAdmin?: boolean
}) {
  const router = useRouter()
  const supabase = createClient()
  const [page, setPage] = useState(0)
  const [localFeeMap, setLocalFeeMap] = useState<Record<string, boolean>>(feeMap ?? {})
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)

  const getCount = (userId: string) => attendanceMap[userId]?.length ?? 0
  const getTypeCount = (userId: string, type: string) =>
    (attendanceMap[userId] ?? []).filter(eid => eventTypeMap[eid] === type).length

  const sorted = [...profiles].sort((a, b) => getCount(b.id) - getCount(a.id))
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const toggleFee = async (userId: string) => {
    if (!isAdmin || !currentPeriod) return
    const next = !localFeeMap[userId]
    setLocalFeeMap(prev => ({ ...prev, [userId]: next }))
    await supabase.from('membership_fees').upsert(
      { user_id: userId, period: currentPeriod, paid: next, paid_at: next ? new Date().toISOString() : null },
      { onConflict: 'user_id,period' }
    )
  }

  const toggleSelect = (userId: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  const toggleSelectAllOnPage = () => {
    const pageIds = paged.map(p => p.id)
    const allSelected = pageIds.every(id => selected.has(id))
    setSelected(prev => {
      const next = new Set(prev)
      if (allSelected) pageIds.forEach(id => next.delete(id))
      else pageIds.forEach(id => next.add(id))
      return next
    })
  }

  const applyBulkFee = async (paid: boolean) => {
    if (!isAdmin || !currentPeriod || selected.size === 0) return
    setSaving(true)
    const rows = Array.from(selected).map(userId => ({
      user_id: userId,
      period: currentPeriod,
      paid,
      paid_at: paid ? new Date().toISOString() : null,
    }))
    await supabase.from('membership_fees').upsert(rows, { onConflict: 'user_id,period' })
    setLocalFeeMap(prev => {
      const next = { ...prev }
      selected.forEach(id => { next[id] = paid })
      return next
    })
    setSelected(new Set())
    setSaving(false)
    router.refresh()
  }

  const pageIds = paged.map(p => p.id)
  const allPageSelected = pageIds.length > 0 && pageIds.every(id => selected.has(id))

  return (
    <div>
      {isAdmin && selected.size > 0 && (
        <div className="flex items-center gap-2 mb-3 px-1">
          <span className="text-xs text-gray-500">{selected.size}명 선택됨</span>
          <button
            onClick={() => applyBulkFee(true)}
            disabled={saving}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg disabled:opacity-50"
          >
            <Check size={12} />일괄 납부 완료
          </button>
          <button
            onClick={() => applyBulkFee(false)}
            disabled={saving}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-medium rounded-lg disabled:opacity-50"
          >
            일괄 미납 처리
          </button>
        </div>
      )}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {isAdmin && (
                  <th className="px-2 py-3 text-center w-8">
                    <input type="checkbox" checked={allPageSelected} onChange={toggleSelectAllOnPage} className="cursor-pointer" />
                  </th>
                )}
                <th className="sticky left-0 bg-gray-50 text-left px-4 py-3 font-medium text-gray-600 min-w-24 z-10">이름</th>
                <th className="px-3 py-3 font-medium text-gray-600 text-center min-w-12">총합</th>
                {TYPE_KEYS.map(type => (
                  <th key={type} className="px-3 py-3 font-medium text-gray-600 text-center min-w-16">
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-xs whitespace-nowrap ${TYPE_COLORS[type]}`}>
                      {TYPE_LABELS[type]}
                    </span>
                  </th>
                ))}
                {currentPeriod && (
                  <th className="px-3 py-3 font-medium text-gray-600 text-center min-w-20">
                    회비납부<br /><span className="text-[10px] text-gray-400">({currentPeriod})</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paged.map(profile => (
                <tr key={profile.id} className="hover:bg-gray-50">
                  {isAdmin && (
                    <td className="px-2 py-3 text-center">
                      <input type="checkbox" checked={selected.has(profile.id)} onChange={() => toggleSelect(profile.id)} className="cursor-pointer" />
                    </td>
                  )}
                  <td className="sticky left-0 bg-white hover:bg-gray-50 px-4 py-3 font-medium text-gray-900 z-10">
                    <div className="flex items-center gap-2">
                      <Avatar profile={profile} />
                      {profile.name}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center font-bold text-[#c0392b]">{getCount(profile.id)}</td>
                  {TYPE_KEYS.map(type => (
                    <td key={type} className="px-3 py-3 text-center font-medium text-gray-700">
                      {getTypeCount(profile.id, type) || '-'}
                    </td>
                  ))}
                  {currentPeriod && (
                    <td className="px-3 py-3 text-center">
                      {isAdmin ? (
                        <button
                          onClick={() => toggleFee(profile.id)}
                          className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${localFeeMap[profile.id] ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-300 hover:bg-gray-200'}`}
                        >
                          <Check size={14} />
                        </button>
                      ) : (
                        localFeeMap[profile.id]
                          ? <span className="text-green-500 font-bold">✓</span>
                          : <span className="text-gray-300">-</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 px-1">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-30"
          >← 이전</button>
          <span className="text-xs text-gray-400">{page + 1} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-30"
          >다음 →</button>
        </div>
      )}
    </div>
  )
}

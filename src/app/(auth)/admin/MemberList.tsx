'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Check } from 'lucide-react'
import MemberActions from './MemberActions'

interface Profile {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  role: string
  grade?: string
  [key: string]: unknown
}

const RoleBadge = ({ role, grade }: { role: string; grade?: string }) => {
  if (role === 'admin') return <span className="badge bg-yellow-100 text-yellow-800">운영진</span>
  if (grade === '정회원') return <span className="badge bg-green-100 text-green-800">정회원</span>
  return <span className="badge bg-gray-100 text-gray-600">준회원</span>
}

export default function MemberList({ profiles }: { profiles: Profile[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const allSelected = profiles.length > 0 && profiles.every(p => selected.has(p.id))

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(profiles.map(p => p.id)))
  }

  const toggleOne = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const applyBulkGrade = async (grade: string, role?: string) => {
    if (selected.size === 0) return
    setSaving(true)
    const updates: { grade: string; role?: string } = { grade }
    if (role) updates.role = role
    const ids = Array.from(selected)
    await Promise.all(ids.map(id => supabase.from('profiles').update(updates).eq('id', id)))
    setSelected(new Set())
    setSaving(false)
    router.refresh()
  }

  const filteredMembers = profiles.filter(m => m.name?.includes(search))

  return (
    <div>
      <div className="relative mb-3">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="이름 검색..." style={{ fontSize: '16px' }}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#c0392b]" />
      </div>
      <div className="flex items-center gap-2 flex-wrap mb-3 px-1">
        <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
          <input type="checkbox" checked={allSelected} onChange={toggleAll} className="cursor-pointer" />
          전체 선택
        </label>
        {selected.size > 0 && (
          <>
            <span className="text-xs text-gray-400">{selected.size}명 선택됨</span>
            <button onClick={() => applyBulkGrade('운영진', 'admin')} disabled={saving}
              className="flex items-center gap-1 px-3 py-1.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 text-xs font-medium rounded-lg disabled:opacity-50">
              <Check size={12} />일괄 운영진
            </button>
            <button onClick={() => applyBulkGrade('정회원', 'member')} disabled={saving}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 text-xs font-medium rounded-lg disabled:opacity-50">
              <Check size={12} />일괄 정회원
            </button>
            <button onClick={() => applyBulkGrade('준회원', 'member')} disabled={saving}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-medium rounded-lg disabled:opacity-50">
              <Check size={12} />일괄 준회원
            </button>
          </>
        )}
      </div>
      <div className="card p-0 overflow-hidden">
        <div className="divide-y divide-gray-50">
          {filteredMembers.map((p) => (
            <div key={p.id} className="flex flex-col gap-2 px-6 py-4">
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={selected.has(p.id)}
                  onChange={() => toggleOne(p.id)}
                  className="cursor-pointer shrink-0"
                />
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold shrink-0 ${p.role === 'admin' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                  {p.name?.[0] ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 truncate">{p.name ?? '이름 없음'}</p>
                    <RoleBadge role={p.role} grade={p.grade} />
                  </div>
                  <p className="text-sm text-gray-500 truncate">{p.email}</p>
                  {p.phone && <p className="text-xs text-gray-400">{String(p.phone)}</p>}
                </div>
              </div>
              <MemberActions profileId={p.id} currentRole={p.role} profile={p} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

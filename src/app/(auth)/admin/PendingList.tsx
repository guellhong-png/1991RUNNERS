'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Check } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import MemberActions from './MemberActions'

interface Profile {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  role: string
  created_at: string
  [key: string]: unknown
}

export default function PendingList({ profiles }: { profiles: Profile[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)

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

  const applyBulkApprove = async () => {
    if (selected.size === 0) return
    setSaving(true)
    const ids = Array.from(selected)
    await Promise.all(ids.map(id =>
      supabase.from('profiles').update({ role: 'member', grade: '준회원' }).eq('id', id)
    ))
    setSelected(new Set())
    setSaving(false)
    router.refresh()
  }

  return (
    <div>
      <div className="flex items-center gap-2 flex-wrap mb-3 px-1">
        <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
          <input type="checkbox" checked={allSelected} onChange={toggleAll} className="cursor-pointer" />
          전체 선택
        </label>
        {selected.size > 0 && (
          <>
            <span className="text-xs text-gray-400">{selected.size}명 선택됨</span>
            <button
              onClick={applyBulkApprove}
              disabled={saving}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg disabled:opacity-50"
            >
              <Check size={12} />일괄 승인
            </button>
          </>
        )}
      </div>
      <div className="card p-0 overflow-hidden border-orange-100">
        <div className="divide-y divide-gray-50">
          {profiles.map((p) => (
            <div key={p.id} className="flex flex-col gap-3 px-6 py-4">
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={selected.has(p.id)}
                  onChange={() => toggleOne(p.id)}
                  className="cursor-pointer shrink-0"
                />
                <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center font-bold text-orange-600 shrink-0">
                  {p.name?.[0] ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{p.name ?? '이름 없음'}</p>
                  <p className="text-sm text-gray-500 truncate">{p.email}</p>
                  {p.phone && <p className="text-xs text-gray-400">{String(p.phone)}</p>}
                  <p className="text-xs text-gray-400 mt-0.5">
                    신청: {format(new Date(p.created_at), 'M월 d일 HH:mm', { locale: ko })}
                  </p>
                </div>
              </div>
              <MemberActions profileId={p.id} currentRole={p.role} showApprove profile={p} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

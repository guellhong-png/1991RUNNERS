'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { XCircle, Pencil, X, Check, ChevronDown } from 'lucide-react'

interface Props { profileId: string; currentRole: string; showApprove?: boolean; profile?: any }

export default function MemberActions({ profileId, currentRole, showApprove, profile }: Props) {
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [gradeOpen, setGradeOpen] = useState(false)
  const [form, setForm] = useState({
    name: profile?.name ?? '',
    email: profile?.email ?? '',
    phone: profile?.phone ?? '',
    birthday: profile?.birthday ?? '',
    instagram: profile?.instagram ?? '',
    pb_full: profile?.pb_full ?? '',
    pb_10k: profile?.pb_10k ?? '',
    grade: profile?.grade ?? '',
    bio: profile?.bio ?? '',
  })
  const router = useRouter()
  const supabase = createClient()

  const handleReject = async () => {
    if (!confirm('가입 신청을 거절하겠습니까?')) return
    setLoading(true)
    await supabase.from('profiles').delete().eq('id', profileId)
    router.refresh()
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!confirm('정말 이 회원을 탈퇴 처리하겠습니까?')) return
    setLoading(true)
    await supabase.from('profiles').update({ role: 'pending' }).eq('id', profileId)
    router.refresh()
    setLoading(false)
  }

  const handleApprove = async () => {
    setLoading(true)
    await supabase.from('profiles').update({ role: 'member', grade: '준회원', joined_at: new Date().toISOString() }).eq('id', profileId)
    router.refresh()
    setLoading(false)
  }

  const handleGradeChange = async (newGrade: string, newRole?: string) => {
    setLoading(true)
    setGradeOpen(false)
    const updates: any = { grade: newGrade }
    if (newRole) updates.role = newRole
    await supabase.from('profiles').update(updates).eq('id', profileId)
    router.refresh()
    setLoading(false)
  }

  const handleSave = async () => {
    setLoading(true)
    await supabase.from('profiles').update(form).eq('id', profileId)
    setEditing(false)
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="w-full">
      {editing ? (
        <div className="mt-3 p-4 bg-gray-50 rounded-lg space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: '이름', key: 'name' },
              { label: '이메일', key: 'email' },
              { label: '전화번호', key: 'phone' },
              { label: '생일 (YYYY-MM-DD)', key: 'birthday' },
              { label: '인스타그램', key: 'instagram' },
              { label: '풀마라톤 PB', key: 'pb_full' },
              { label: '10K PB', key: 'pb_10k' },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                <input
                  value={(form as any)[key]}
                  onChange={e => setForm({ ...form, [key]: e.target.value })}
                  className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[#c0392b]"
                />
              </div>
            ))}
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">자기소개</label>
            <textarea
              value={form.bio}
              onChange={e => setForm({ ...form, bio: e.target.value })}
              className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[#c0392b] resize-none"
              rows={2}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setEditing(false)} className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700">
              <X size={14} />취소
            </button>
            <button onClick={handleSave} disabled={loading} className="flex items-center gap-1 px-3 py-1.5 bg-[#c0392b] text-white text-sm rounded-lg hover:bg-[#a93226] disabled:opacity-50">
              <Check size={14} />저장
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          {showApprove ? (
            <>
              <button onClick={handleApprove} disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50">
                <Check size={14} />승인
              </button>
              <button onClick={handleReject} disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-600 text-xs font-medium rounded-lg transition-colors disabled:opacity-50">
                <XCircle size={14} />거절
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-medium rounded-lg transition-colors">
                <Pencil size={14} />수정
              </button>
              <div className="relative">
                <button
                  onClick={() => setGradeOpen(!gradeOpen)}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  등급 변경 <ChevronDown size={12} />
                </button>
                {gradeOpen && (
                  <div className="absolute bottom-8 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-28 overflow-hidden">
                    <button onClick={() => handleGradeChange('운영진', 'admin')} className="w-full text-left px-3 py-1 text-xs hover:bg-gray-50 text-yellow-700 font-medium">운영진</button>
                    <button onClick={() => handleGradeChange('정회원', 'member')} className="w-full text-left px-3 py-1 text-xs hover:bg-gray-50 text-green-700 font-medium">정회원</button>
                    <button onClick={() => handleGradeChange('준회원', 'member')} className="w-full text-left px-3 py-1 text-xs hover:bg-gray-50 text-gray-600 font-medium">준회원</button>
                  </div>
                )}
              </div>
              <button onClick={handleDelete} disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-600 text-xs font-medium rounded-lg transition-colors disabled:opacity-50">
                <XCircle size={14} />탈퇴
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

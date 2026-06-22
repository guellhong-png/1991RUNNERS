'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, Shield, UserMinus, XCircle, Pencil, X, Check } from 'lucide-react'

interface Props { profileId: string; currentRole: string; showApprove?: boolean; profile?: any }

export default function MemberActions({ profileId, currentRole, showApprove, profile }: Props) {
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
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

  const updateRole = async (role: string) => {
    setLoading(true)
    const updates: any = { role }
    if (role === 'member' && currentRole === 'pending') updates.joined_at = new Date().toISOString()
    await supabase.from('profiles').update(updates).eq('id', profileId)
    router.refresh()
    setLoading(false)
  }

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
              { label: '등급', key: 'grade' },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                <input
                  value={(form as any)[key]}
                  onChange={e => setForm({ ...form, [key]: e.target.value })}
                  className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[#e94560]"
                />
              </div>
            ))}
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">자기소개</label>
            <textarea
              value={form.bio}
              onChange={e => setForm({ ...form, bio: e.target.value })}
              className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-[#e94560] resize-none"
              rows={2}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setEditing(false)} className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700">
              <X size={14} />취소
            </button>
            <button onClick={handleSave} disabled={loading} className="flex items-center gap-1 px-3 py-1.5 bg-[#e94560] text-white text-sm rounded-lg hover:bg-[#d63651] disabled:opacity-50">
              <Check size={14} />저장
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          {showApprove && (
            <>
              <button onClick={() => updateRole('member')} disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50">
                <CheckCircle size={14} />승인
              </button>
              <button onClick={handleReject} disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-600 text-xs font-medium rounded-lg transition-colors disabled:opacity-50">
                <XCircle size={14} />거절
              </button>
            </>
          )}
          {!showApprove && (
            <>
              <button onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-medium rounded-lg transition-colors">
                <Pencil size={14} />수정
              </button>
              {currentRole !== 'admin' && (
                <button onClick={() => updateRole('admin')} disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50">
                  <Shield size={14} />운영진
                </button>
              )}
              {currentRole !== 'member' && (
                <button onClick={() => updateRole('member')} disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50">
                  <CheckCircle size={14} />회원
                </button>
              )}
              <button onClick={handleDelete} disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-600 text-xs font-medium rounded-lg transition-colors disabled:opacity-50">
                <UserMinus size={14} />탈퇴
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

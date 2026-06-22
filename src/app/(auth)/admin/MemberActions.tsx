'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, Shield, UserMinus, ChevronDown } from 'lucide-react'

interface Props { profileId: string; currentRole: string; showApprove?: boolean }

export default function MemberActions({ profileId, currentRole, showApprove }: Props) {
  const [loading, setLoading] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const updateRole = async (role: string) => {
    setLoading(true); setShowMenu(false)
    const updates: any = { role }
    if (role === 'member' && currentRole === 'pending') updates.joined_at = new Date().toISOString()
    await supabase.from('profiles').update(updates).eq('id', profileId)
    router.refresh(); setLoading(false)
  }

  const handleDelete = async () => {
    if (!confirm('정말 이 회원을 탈퇴 처리하겠습니까?')) return
    setLoading(true)
    await supabase.from('profiles').update({ role: 'pending' }).eq('id', profileId)
    router.refresh(); setLoading(false)
  }

  return (
    <div className="relative flex items-center gap-2">
      {showApprove && (
        <button onClick={() => updateRole('member')} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50">
          <CheckCircle size={14} />승인
        </button>
      )}
      <div className="relative">
        <button onClick={() => setShowMenu(!showMenu)} disabled={loading} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"><ChevronDown size={16} /></button>
        {showMenu && (
          <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10 min-w-32">
            {currentRole !== 'admin' && <button onClick={() => updateRole('admin')} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"><Shield size={14} className="text-yellow-500" />운영진으로</button>}
            {currentRole !== 'member' && <button onClick={() => updateRole('member')} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"><CheckCircle size={14} className="text-green-500" />일반회원으로</button>}
            <button onClick={handleDelete} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 text-left border-t border-gray-100 mt-1"><UserMinus size={14} />탈퇴 처리</button>
          </div>
        )}
      </div>
    </div>
  )
}

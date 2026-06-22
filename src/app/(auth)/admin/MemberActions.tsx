'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, Shield, UserMinus, XCircle } from 'lucide-react'
interface Props { profileId: string; currentRole: string; showApprove?: boolean }
export default function MemberActions({ profileId, currentRole, showApprove }: Props) {
  const [loading, setLoading] = useState(false)
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
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {showApprove && (
        <>
          <button onClick={() => updateRole('member')} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50">
            <CheckCircle size={14} />승인

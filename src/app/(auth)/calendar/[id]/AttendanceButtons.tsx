'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AttendanceStatus } from '@/types'
import { Check, X } from 'lucide-react'

interface Props {
  eventId: string
  userId: string
  currentStatus: AttendanceStatus | null
  attendanceId: string | null
  hasAfterparty: boolean
  currentAfterpartyStatus: string | null
}

export default function AttendanceButtons({ eventId, userId, currentStatus, attendanceId, hasAfterparty, currentAfterpartyStatus }: Props) {
  const [status, setStatus] = useState<AttendanceStatus | null>(currentStatus)
  const [afterpartyStatus, setAfterpartyStatus] = useState<string | null>(currentAfterpartyStatus)
  const [loading, setLoading] = useState(false)
  const [currentId, setCurrentId] = useState<string | null>(attendanceId)
  const router = useRouter()
  const supabase = createClient()

  const handleAttendance = async (newStatus: AttendanceStatus) => {
    setLoading(true)
    if (status === newStatus) {
      if (currentId) await supabase.from('attendances').delete().eq('id', currentId)
      setStatus(null); setCurrentId(null); setAfterpartyStatus(null)
    } else if (currentId) {
      await supabase.from('attendances').update({ status: newStatus }).eq('id', currentId)
      setStatus(newStatus)
    } else {
      const { data } = await supabase.from('attendances').insert({ event_id: eventId, user_id: userId, status: newStatus }).select().single()
      setStatus(newStatus); setCurrentId(data?.id ?? null)
    }
    setLoading(false); router.refresh()
  }

  const handleAfterparty = async (newStatus: string) => {
    setLoading(true)
    if (!currentId) {
      setLoading(false); return
    }
    if (afterpartyStatus === newStatus) {
      await supabase.from('attendances').update({ afterparty_status: null }).eq('id', currentId)
      setAfterpartyStatus(null)
    } else {
      await supabase.from('attendances').update({ afterparty_status: newStatus }).eq('id', currentId)
      setAfterpartyStatus(newStatus)
    }
    setLoading(false); router.refresh()
  }

  return (
    <div className="space-y-4">
      {/* 본행사 참석 여부 */}
      <div>
        <p className="text-xs text-gray-500 mb-2 font-medium">본행사</p>
        <div className="flex gap-3">
          <button onClick={() => handleAttendance('attending')} disabled={loading}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all disabled:opacity-50 ${status === 'attending' ? 'bg-green-500 text-white shadow-md' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
            <Check size={16} />{status === 'attending' ? '참여 확정 ✓' : '참석'}
          </button>
          <button onClick={() => handleAttendance('not_attending')} disabled={loading}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all disabled:opacity-50 ${status === 'not_attending' ? 'bg-gray-500 text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
            <X size={16} />{status === 'not_attending' ? '불참 확정 ✗' : '불참'}
          </button>
        </div>
      </div>

      {/* 뒷풀이 참석 여부 */}
      {hasAfterparty && (
        <div>
          <p className="text-xs text-gray-500 mb-2 font-medium">🍺 뒷풀이</p>
          {!currentId || status === 'not_attending' ? (
            <p className="text-xs text-gray-400">본행사 참석 시 뒷풀이 여부를 선택할 수 있어요</p>
          ) : (
            <div className="flex gap-3">
              <button onClick={() => handleAfterparty('attending')} disabled={loading}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all disabled:opacity-50 ${afterpartyStatus === 'attending' ? 'bg-[#c0392b] text-white shadow-md' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}>
                🍺 {afterpartyStatus === 'attending' ? '참여 확정 ✓' : '참석'}
              </button>
              <button onClick={() => handleAfterparty('not_attending')} disabled={loading}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all disabled:opacity-50 ${afterpartyStatus === 'not_attending' ? 'bg-gray-500 text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                <X size={16} />{afterpartyStatus === 'not_attending' ? '불참 확정 ✗' : '불참'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

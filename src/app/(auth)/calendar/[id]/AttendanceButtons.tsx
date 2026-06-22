'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AttendanceStatus } from '@/types'
import { Check, X } from 'lucide-react'

interface Props { eventId: string; userId: string; currentStatus: AttendanceStatus | null; attendanceId: string | null }

export default function AttendanceButtons({ eventId, userId, currentStatus, attendanceId }: Props) {
  const [status, setStatus] = useState<AttendanceStatus | null>(currentStatus)
  const [loading, setLoading] = useState(false)
  const [currentId, setCurrentId] = useState<string | null>(attendanceId)
  const router = useRouter()
  const supabase = createClient()

  const handleAttendance = async (newStatus: AttendanceStatus) => {
    setLoading(true)
    if (status === newStatus) {
      if (currentId) await supabase.from('attendances').delete().eq('id', currentId)
      setStatus(null); setCurrentId(null)
    } else if (currentId) {
      await supabase.from('attendances').update({ status: newStatus }).eq('id', currentId)
      setStatus(newStatus)
    } else {
      const { data } = await supabase.from('attendances').insert({ event_id: eventId, user_id: userId, status: newStatus }).select().single()
      setStatus(newStatus); setCurrentId(data?.id ?? null)
    }
    setLoading(false); router.refresh()
  }

  return (
    <div className="flex gap-3">
      <button onClick={() => handleAttendance('attending')} disabled={loading} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all disabled:opacity-50 ${status === 'attending' ? 'bg-green-500 text-white shadow-md' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
        <Check size={16} />{status === 'attending' ? '참여 확정 ✓' : '참여할게요'}
      </button>
      <button onClick={() => handleAttendance('not_attending')} disabled={loading} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all disabled:opacity-50 ${status === 'not_attending' ? 'bg-gray-500 text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
        <X size={16} />{status === 'not_attending' ? '불참 확정 ✗' : '못 갈 것 같아요'}
      </button>
    </div>
  )
}

'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { QrCode } from 'lucide-react'

export default function QRButton({ eventId }: { eventId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleQR = async () => {
    setLoading(true)
    const { data: event } = await supabase.from('events').select('checkin_token').eq('id', eventId).single()
    let token = event?.checkin_token
    if (!token) {
      token = crypto.randomUUID()
      await supabase.from('events').update({ checkin_token: token }).eq('id', eventId)
    }
    router.push(`/calendar/${eventId}/qr`)
    setLoading(false)
  }

  return (
    <button onClick={handleQR} disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50">
      <QrCode size={16} />
      {loading ? '생성 중...' : 'QR 체크인'}
    </button>
  )
}

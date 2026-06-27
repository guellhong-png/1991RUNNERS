import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import QRDisplay from './QRDisplay'

export default async function QRPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: event } = await supabase.from('events').select('*').eq('id', id).single()
  if (!event) notFound()

  let token = event.checkin_token
  if (!token) {
    token = crypto.randomUUID()
    await supabase.from('events').update({ checkin_token: token }).eq('id', id)
  }

  const checkinUrl = `https://1991-runners.vercel.app/calendar/checkin/${token}`

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">{event.title}</h1>
        <p className="text-gray-400">{format(new Date(event.event_date), 'M월 d일 (E) HH:mm', { locale: ko })}</p>
      </div>
      <QRDisplay url={checkinUrl} />
      <p className="text-gray-500 text-sm mt-8 text-center">
        QR을 스캔하면 자동으로 출석 체크됩니다
      </p>
    </div>
  )
}

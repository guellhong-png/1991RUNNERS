import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Check, X } from 'lucide-react'

export default async function CheckinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: event } = await supabase.from('events').select('*').eq('checkin_token', token).single()
  if (!event) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <X size={32} className="text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">유효하지 않은 QR</h1>
        <p className="text-gray-400">올바른 QR코드가 아닙니다</p>
      </div>
    )
  }

  const { data: attendance } = await supabase.from('attendances')
    .select('*').eq('event_id', event.id).eq('user_id', user.id).single()

  let message = ''
  let isSuccess = true

  if (attendance?.checked_in) {
    message = '이미 체크인 되었습니다'
    isSuccess = false
  } else if (attendance) {
    await supabase.from('attendances').update({
      checked_in: true,
      checked_in_at: new Date().toISOString(),
      status: 'attending',
    }).eq('id', attendance.id)
    message = '출석 체크 완료!'
  } else {
    await supabase.from('attendances').insert({
      event_id: event.id,
      user_id: user.id,
      status: 'attending',
      checked_in: true,
      checked_in_at: new Date().toISOString(),
    })
    message = '출석 체크 완료!'
  }

  const { data: profile } = await supabase.from('profiles').select('name').eq('id', user.id).single()

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isSuccess ? 'bg-green-100' : 'bg-yellow-100'}`}>
        <Check size={32} className={isSuccess ? 'text-green-500' : 'text-yellow-500'} />
      </div>
      <h1 className="text-xl font-bold text-white mb-2">{message}</h1>
      <p className="text-gray-300 text-lg mb-1">{profile?.name}님</p>
      <p className="text-gray-400 mb-6">{event.title}</p>
      <p className="text-gray-500 text-sm">
        {format(new Date(event.event_date), 'M월 d일 (E) HH:mm', { locale: ko })}
      </p>
      <a href="/calendar" className="mt-8 px-6 py-3 bg-white text-black font-medium rounded-xl text-sm">
        캘린더로 돌아가기
      </a>
    </div>
  )
}

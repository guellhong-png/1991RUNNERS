import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function PendingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role === 'member' || profile?.role === 'admin') {
      redirect('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center p-4">
      <div className="max-w-md text-center">
        <div className="text-6xl mb-6">⏳</div>
        <h1 className="text-2xl font-bold text-white mb-4">승인 대기 중</h1>
        <p className="text-gray-400 mb-2">가입 신청이 완료되었습니다.</p>
        <p className="text-gray-400 mb-8">운영진이 확인 후 승인하면 서비스를 이용할 수 있어요. 보통 1-2일 내로 처리됩니다.</p>
        <p className="text-sm text-gray-500 bg-white/5 rounded-lg px-4 py-3 mb-6">{user?.email}</p>
        <Link href="/login" className="text-gray-400 hover:text-white text-sm underline">로그아웃 후 재로그인</Link>
      </div>
    </div>
  )
}

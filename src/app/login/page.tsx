'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.replace('/dashboard')
      } else {
        setChecking(false)
      }
    } catch {
      setChecking(false)
    }
  }

  // 3초 후에도 로딩 중이면 강제로 로그인 화면 표시
  const timeout = setTimeout(() => setChecking(false), 3000)
  checkSession().finally(() => clearTimeout(timeout))

  return () => clearTimeout(timeout)
}, [])

  const handleKakaoLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'profile_nickname profile_image',
      },
    })
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <img
          src="https://kvotmnyktvgqlplfbuqh.supabase.co/storage/v1/object/public/club-images/1991.jpeg"
          alt="1991RUNNERS"
          className="w-24 h-24 rounded-2xl animate-pulse"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-xs">
        <div className="text-center mb-8">
          <img
            src="https://kvotmnyktvgqlplfbuqh.supabase.co/storage/v1/object/public/club-images/1991.jpeg"
            alt="1991RUNNERS"
            className="w-24 h-24 mx-auto mb-4 rounded-2xl"
          />
          <h1 className="text-3xl font-bold text-white">뛰꼬양</h1>
          <p className="text-gray-400 mt-2">러닝 클럽 회원 전용 페이지</p>
        </div>
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">로그인</h2>
          <button
            onClick={handleKakaoLogin}
            className="w-full py-3 bg-[#FEE500] hover:bg-[#F5DC00] text-[#191919] font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3C6.477 3 2 6.477 2 11c0 2.897 1.698 5.417 4.268 6.933L5.5 21l3.75-2.25C10.007 19.578 11 19.75 12 19.75c5.523 0 10-3.477 10-7.75S17.523 3 12 3z"/>
            </svg>
            카카오톡으로 로그인
          </button>
        </div>
      </div>
    </div>
  )
}

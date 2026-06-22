'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { name: form.name, phone: form.phone } },
      })
      if (error) {
        setError(JSON.stringify(error) || error.message || '알 수 없는 오류')
        setLoading(false)
        return
      }
      if (data.user) {
        await supabase.from('profiles').update({
          name: form.name,
          phone: form.phone || null,
        }).eq('id', data.user.id)
      }
      router.push('/pending')
    } catch (err: any) {
      setError(err?.message || '오류가 발생했습니다. 다시 시도해주세요.')
      setLoading(false)
    }
  }
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="https://kvotmnyktvgqlplfbuqh.supabase.co/storage/v1/object/public/club-images/1991.jpeg" alt="1991RUNNERS" className="w-24 h-24 mx-auto mb-4 rounded-2xl" />
          <h1 className="text-3xl font-bold text-white">뛰꼬양</h1>
          <p className="text-gray-400 mt-2">가입 신청 후 운영진 승인이 필요합니다</p>
        </div>
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-gray-800 mb-6">가입 신청</h2>
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="input" placeholder="홍길동" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이메일 *</label>
              <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="input" placeholder="example@email.com" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 *</label>
              <input type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} className="input" placeholder="8자 이상" minLength={8} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="input" placeholder="010-0000-0000" />
            </div>
            {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <button type="submit" disabled={loading} className="w-full py-3 bg-[#c0392b] hover:bg-[#a93226] text-white font-medium rounded-lg transition-colors disabled:opacity-50">{loading ? '신청 중...' : '가입 신청'}</button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="text-[#c0392b] font-medium hover:underline">로그인</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

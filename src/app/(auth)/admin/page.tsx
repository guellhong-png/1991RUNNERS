import { createClient } from '@/lib/supabase/server'
import { Users, Clock } from 'lucide-react'
import MemberList from './MemberList'
import PendingList from './PendingList'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: allProfiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
  const pending = allProfiles?.filter(p => p.role === 'pending') ?? []
  const members = allProfiles?.filter(p => p.role === 'member') ?? []
  const admins = allProfiles?.filter(p => p.role === 'admin') ?? []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">관리자 페이지</h1>
        <div className="flex gap-4 mt-3">
          <span className="text-sm text-gray-500">전체 {allProfiles?.length}명</span>
          <span className="text-sm text-orange-500">대기 {pending.length}명</span>
          <span className="text-sm text-green-600">회원 {members.length}명</span>
          <span className="text-sm text-yellow-600">운영진 {admins.length}명</span>
        </div>
      </div>

      {pending.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock size={18} className="text-orange-500" />
            <h2 className="font-semibold text-gray-900">가입 승인 대기 ({pending.length}명)</h2>
          </div>
          <PendingList profiles={pending} />
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Users size={18} className="text-blue-500" />
          <h2 className="font-semibold text-gray-900">전체 회원</h2>
        </div>
        <MemberList profiles={[...admins, ...members]} />
      </div>
    </div>
  )
}

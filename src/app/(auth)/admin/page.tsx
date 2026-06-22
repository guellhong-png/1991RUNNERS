import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Users, Clock } from 'lucide-react'
import MemberActions from './MemberActions'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: allProfiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
  const pending = allProfiles?.filter(p => p.role === 'pending') ?? []
  const members = allProfiles?.filter(p => p.role === 'member') ?? []
  const admins = allProfiles?.filter(p => p.role === 'admin') ?? []

  const RoleBadge = ({ role }: { role: string }) => (
    <span className={`badge ${role === 'admin' ? 'bg-yellow-100 text-yellow-800' : role === 'member' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
      {role === 'admin' ? '운영진' : role === 'member' ? '회원' : '대기'}
    </span>
  )

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
          <div className="flex items-center gap-2 mb-4"><Clock size={18} className="text-orange-500" /><h2 className="font-semibold text-gray-900">가입 승인 대기 ({pending.length}명)</h2></div>
          <div className="card p-0 overflow-hidden border-orange-100">
            <div className="divide-y divide-gray-50">
              {pending.map((p) => (
                <div key={p.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center font-bold text-orange-600 shrink-0">{p.name[0]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{p.name}</p>
                    <p className="text-sm text-gray-500">{p.email}</p>
                    {p.phone && <p className="text-xs text-gray-400">{p.phone}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">신청: {format(new Date(p.created_at), 'M월 d일 HH:mm', { locale: ko })}</p>
                  </div>
                  <MemberActions profileId={p.id} currentRole={p.role} showApprove />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <div>
        <div className="flex items-center gap-2 mb-4"><Users size={18} className="text-blue-500" /><h2 className="font-semibold text-gray-900">전체 회원</h2></div>
        <div className="card p-0 overflow-hidden">
          <div className="divide-y divide-gray-50">
            {[...admins, ...members].map((p) => (
              <div key={p.id} className="flex items-center gap-4 px-6 py-4">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold shrink-0 ${p.role === 'admin' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>{p.name[0]}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2"><p className="font-medium text-gray-900">{p.name}</p><RoleBadge role={p.role} /></div>
                  <p className="text-sm text-gray-500">{p.email}</p>
                  {p.phone && <p className="text-xs text-gray-400">{p.phone}</p>}
                </div>
                <MemberActions profileId={p.id} currentRole={p.role} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

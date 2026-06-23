import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import Link from 'next/link'
import { AtSign, Edit } from 'lucide-react'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: currentProfile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['member', 'admin'])
    .order('role', { ascending: false })
    .order('name', { ascending: true })

  const GradeBadge = ({ grade, role }: { grade?: string; role: string }) => {
    const label = role === 'admin' ? '운영진' : (grade || '준회원')
    const color = role === 'admin' ? 'bg-yellow-100 text-yellow-800' :
      label === '정회원' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
    return <span className={`badge ${color}`}>{label}</span>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">회원 프로필</h1>
          <p className="text-gray-500 mt-1">총 {profiles?.length ?? 0}명의 회원</p>
        </div>
        <Link href="/profile/edit">
          <button className="btn-secondary flex items-center gap-2 text-sm">
            <Edit size={16} />내 프로필 수정
          </button>
        </Link>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600 min-w-28">이름</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">등급</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">가입일</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">생일</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">PB (풀)</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">PB (10K)</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">인스타</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {profiles?.map((p) => (
                <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${p.id === user?.id ? 'bg-blue-50/50' : ''}`}>
                 <td className="px-4 py-3 min-w-28">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <div className="w-7 h-7 rounded-full bg-[#e94560] flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden">
                        {(p as any).avatar_url
                          ? <img src={(p as any).avatar_url} className="w-full h-full object-cover" alt={p.name} />
                          : p.name[0]}
                      </div>
                      <span className="font-medium text-gray-900">{p.name}</span>
                      {p.id === user?.id && <span className="text-xs text-blue-500">(나)</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3"><GradeBadge grade={p.grade} role={p.role} /></td>
                  <td className="px-4 py-3 text-gray-500">
                    {p.joined_at ? format(new Date(p.joined_at), 'yyyy.MM.dd', { locale: ko }) : '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {p.birthday ? format(new Date(p.birthday), 'MM/dd') : '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-700 font-medium">{p.pb_full || '-'}</td>
                  <td className="px-4 py-3 text-gray-700 font-medium">{p.pb_10k || '-'}</td>
                  <td className="px-4 py-3">
                    {p.instagram ? (
                      <a href={`https://instagram.com/${p.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                         className="flex items-center gap-1 text-pink-500 hover:text-pink-600">
                        <AtSign size={14} />
                        <span className="text-xs">{p.instagram}</span>
                      </a>
                    ) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

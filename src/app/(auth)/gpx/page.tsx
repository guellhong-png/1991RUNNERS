import { createClient } from '@/lib/supabase/server'
import GpxFeed from './GpxFeed'

export default async function GpxPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id ?? '')
    .single()

  const { data: routes } = await supabase
    .from('gpx_routes')
    .select('*, author:profiles(id, name, avatar_url), likes:gpx_likes(user_id), comments:gpx_comments(id)')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">GPX 코스 모음</h1>
        <p className="text-gray-500 mt-1">멤버들의 러닝 코스를 공유하고 다운로드하세요</p>
      </div>
      <GpxFeed routes={routes ?? []} userId={user?.id ?? ''} userRole={profile?.role ?? ''} />
    </div>
  )
}

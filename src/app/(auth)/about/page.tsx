import { createClient } from '@/lib/supabase/server'
import AboutClient from './AboutClient'

export default async function AboutPage() {
  const supabase = await createClient()
  const { data: profile } = await supabase.auth.getUser().then(async ({ data: { user } }) => {
    if (!user) return { data: null }
    return supabase.from('profiles').select('role').eq('id', user.id).single()
  })
  const { data: clubInfo } = await supabase.from('club_info').select('*').eq('id', 1).single()

  return (
    <AboutClient
      isAdmin={profile?.role === 'admin'}
      initialDescription={clubInfo?.description ?? ''}
      initialBannerUrl={clubInfo?.banner_url ?? null}
    />
  )
}

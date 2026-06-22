import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Image, Clock } from 'lucide-react'

export default async function ArchivePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">뛰꼬양 자료실</h1><p className="text-gray-500 mt-1">로고, 히스토리 등 자료를 확인하세요</p></div>
      </div>

      {/* 로고 모음 */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><Image size={20} className="text-[#e94560]" />뛰꼬양 로고 모음</h2>
        <div className="card">
          <p className="text-gray-400 text-center py-8">로고 파일을 업로드해주세요 (운영진 문의)</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* 로고 이미지들은 나중에 추가 */}
          </div>
        </div>
      </div>

      {/* 히스토리 */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><Clock size={20} className="text-[#e94560]" />뛰꼬양 히스토리</h2>
        <div className="card">
          <div className="space-y-6">
            {[
              { year: '2024', events: ['뛰꼬양 창단'] },
            ].map(({ year, events }) => (
              <div key={year} className="flex gap-4">
                <div className="text-lg font-bold text-[#e94560] w-16 shrink-0">{year}</div>
                <div className="flex-1 space-y-2">
                  {events.map((event, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#e94560] mt-1.5 shrink-0"></span>
                      <p className="text-gray-700 text-sm">{event}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-6 text-center">* 히스토리 내용은 운영진이 업데이트합니다</p>
        </div>
      </div>
    </div>
  )
}

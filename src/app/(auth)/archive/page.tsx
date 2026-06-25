'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Image, Clock, Plus, Trash2, X } from 'lucide-react'

export default function ArchivePage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [logos, setLogos] = useState<any[]>([])
  const [histories, setHistories] = useState<any[]>([])
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoTitle, setLogoTitle] = useState('')
  const [showLogoForm, setShowLogoForm] = useState(false)
  const [showHistoryForm, setShowHistoryForm] = useState(false)
  const [historyForm, setHistoryForm] = useState({ year: '', content: '', image_url: '' })
  const [historyUploading, setHistoryUploading] = useState(false)
  const logoFileRef = useRef<HTMLInputElement>(null)
  const historyFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      setProfile(p)
      const { data: l } = await supabase.from('logos').select('*').order('created_at', { ascending: false })
      setLogos(l ?? [])
      const { data: h } = await supabase.from('histories').select('*').order('year', { ascending: false })
      setHistories(h ?? [])
    }
    load()
  }, [])

  const isAdmin = profile?.role === 'admin'

  const uploadLogoImage = async (file: File) => {
    const ext = file.name.split('.').pop()
    const path = `logos/${Date.now()}.${ext}`
    await supabase.storage.from('archive-images').upload(path, file)
    const { data } = supabase.storage.from('archive-images').getPublicUrl(path)
    return data.publicUrl
  }

  const handleLogoSubmit = async () => {
    if (!logoTitle || !logoFileRef.current?.files?.[0]) return
    setLogoUploading(true)
    const url = await uploadLogoImage(logoFileRef.current.files[0])
    await supabase.from('logos').insert({ title: logoTitle, image_url: url })
    const { data } = await supabase.from('logos').select('*').order('created_at', { ascending: false })
    setLogos(data ?? [])
    setLogoTitle('')
    setShowLogoForm(false)
    setLogoUploading(false)
  }

  const handleLogoDelete = async (id: string, imageUrl: string) => {
    if (!confirm('삭제할까요?')) return
    await supabase.from('logos').delete().eq('id', id)
    setLogos(logos.filter(l => l.id !== id))
  }

  const handleHistoryImageUpload = async (file: File) => {
    setHistoryUploading(true)
    const ext = file.name.split('.').pop()
    const path = `histories/${Date.now()}.${ext}`
    await supabase.storage.from('archive-images').upload(path, file)
    const { data } = supabase.storage.from('archive-images').getPublicUrl(path)
    setHistoryForm(f => ({ ...f, image_url: data.publicUrl }))
    setHistoryUploading(false)
  }

  const handleHistorySubmit = async () => {
    if (!historyForm.year || !historyForm.content) return
    const { error } = await supabase.from('histories').insert({
      year: historyForm.year,
      content: historyForm.content,
      image_url: historyForm.image_url || null,
    })
    if (error) {
      alert('저장 실패: ' + error.message)
      return
    }
    const { data } = await supabase.from('histories').select('*').order('year', { ascending: false })
    setHistories(data ?? [])
    setHistoryForm({ year: '', content: '', image_url: '' })
    setShowHistoryForm(false)
  }

  const handleHistoryDelete = async (id: string) => {
    if (!confirm('삭제할까요?')) return
    await supabase.from('histories').delete().eq('id', id)
    setHistories(histories.filter(h => h.id !== id))
  }

  const groupedHistories = histories.reduce((acc, h) => {
    if (!acc[h.year]) acc[h.year] = []
    acc[h.year].push(h)
    return acc
  }, {} as Record<string, any[]>)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">뛰꼬양 자료실</h1>
        <p className="text-gray-500 mt-1">로고, 히스토리 등 자료를 확인하세요</p>
      </div>

      {/* 히스토리 (위로 이동) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Clock size={20} className="text-[#e94560]" />뛰꼬양 히스토리
          </h2>
          {isAdmin && (
            <button onClick={() => setShowHistoryForm(true)} className="flex items-center gap-1 text-sm text-[#e94560] hover:underline">
              <Plus size={16} />추가
            </button>
          )}
        </div>

        {showHistoryForm && (
          <div className="card mb-4 space-y-3">
            <input
              placeholder="연도 (예: 2024)"
              value={historyForm.year}
              onChange={e => setHistoryForm(f => ({ ...f, year: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#c0392b]"
            />
            <input
              placeholder="내용"
              value={historyForm.content}
              onChange={e => setHistoryForm(f => ({ ...f, content: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#c0392b]"
            />
            <div>
              <p className="text-xs text-gray-500 mb-1">사진 첨부 (선택)</p>
              <input
                type="file"
                accept="image/*"
                ref={historyFileRef}
                onChange={e => e.target.files?.[0] && handleHistoryImageUpload(e.target.files[0])}
                className="text-sm text-gray-600"
              />
              {historyUploading && <p className="text-xs text-gray-400 mt-1">업로드 중...</p>}
              {historyForm.image_url && <img src={historyForm.image_url} className="mt-2 h-24 rounded-lg object-cover" />}
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setShowHistoryForm(false); setHistoryForm({ year: '', content: '', image_url: '' }) }} className="text-sm text-gray-400 px-3 py-1.5">취소</button>
              <button onClick={handleHistorySubmit} className="text-sm bg-[#c0392b] text-white px-4 py-1.5 rounded-lg">저장</button>
            </div>
          </div>
        )}

        <div className="card">
          {Object.keys(groupedHistories).length === 0 ? (
            <p className="text-gray-400 text-center py-8">등록된 히스토리가 없습니다</p>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedHistories).map(([year, items]) => (
                <div key={year} className="flex gap-4">
                  <div className="text-lg font-bold text-[#e94560] w-16 shrink-0">{year}</div>
                  <div className="flex-1 space-y-3">
                    {(items as any[]).map((item) => (
                      <div key={item.id} className="relative group">
                        <div className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#e94560] mt-1.5 shrink-0"></span>
                          <div className="flex-1">
                            <p className="text-gray-700 text-sm">{item.content}</p>
                            {item.image_url && (
                              <img src={item.image_url} alt="" className="mt-2 rounded-lg w-full object-contain" />
                            )}
                          </div>
                        </div>
                        {isAdmin && (
                          <button
                            onClick={() => handleHistoryDelete(item.id)}
                            className="absolute top-0 right-0 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 로고 모음 (아래로 이동) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Image size={20} className="text-[#e94560]" />뛰꼬양 로고 모음
          </h2>
          {isAdmin && (
            <button onClick={() => setShowLogoForm(true)} className="flex items-center gap-1 text-sm text-[#e94560] hover:underline">
              <Plus size={16} />추가
            </button>
          )}
        </div>

        {showLogoForm && (
          <div className="card mb-4 space-y-3">
            <input
              placeholder="로고 이름"
              value={logoTitle}
              onChange={e => setLogoTitle(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#c0392b]"
            />
            <input type="file" accept="image/*" ref={logoFileRef} className="text-sm text-gray-600" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowLogoForm(false)} className="text-sm text-gray-400 px-3 py-1.5">취소</button>
              <button onClick={handleLogoSubmit} disabled={logoUploading} className="text-sm bg-[#c0392b] text-white px-4 py-1.5 rounded-lg disabled:opacity-50">
                {logoUploading ? '업로드 중...' : '저장'}
              </button>
            </div>
          </div>
        )}

        <div className="card">
          {logos.length === 0 ? (
            <p className="text-gray-400 text-center py-8">등록된 로고가 없습니다</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {logos.map(logo => (
                <div key={logo.id} className="relative group">
                  <img src={logo.image_url} alt={logo.title} className="w-full aspect-square object-contain bg-gray-50 rounded-lg border border-gray-100 p-2" />
                  <p className="text-xs text-center text-gray-600 mt-1 truncate">{logo.title}</p>
                  {isAdmin && (
                    <button
                      onClick={() => handleLogoDelete(logo.id, logo.image_url)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

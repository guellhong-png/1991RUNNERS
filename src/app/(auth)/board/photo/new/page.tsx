'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Image as ImageIcon, X } from 'lucide-react'
import Link from 'next/link'
import { RichTextEditor } from '@/lib/RichTextEditor'

export default function NewPhotoPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ title: '', content: '' })
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const valid = files.filter((f) => f.size <= 1024 * 1024)
    if (valid.length < files.length) alert('1MB가 넘는 이미지는 제외되었습니다.')
    setImageFiles((prev) => [...prev, ...valid])
    setImagePreviews((prev) => [...prev, ...valid.map((f) => URL.createObjectURL(f))])
  }

  const removeImage = (idx: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== idx))
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    const uploadedUrls: string[] = []
    for (const file of imageFiles) {
      const ext = file.name.split('.').pop()
      const path = `photo/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage.from('event-images').upload(path, file)
      if (!uploadError) {
        const { data } = supabase.storage.from('event-images').getPublicUrl(path)
        uploadedUrls.push(data.publicUrl)
      }
    }

    const imageBlock = uploadedUrls.map((url) => `![](${url})`).join('\n')
    const finalContent = imageBlock ? `${form.content}\n\n${imageBlock}` : form.content

    await supabase.from('posts').insert({ title: form.title, content: finalContent, category: 'photo', is_pinned: false, author_id: user?.id })
    router.push('/board/photo')
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/board/photo" className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></Link>
        <h1 className="text-2xl font-bold text-gray-900">사진 자료실 작성</h1>
      </div>
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">제목 *</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
            <RichTextEditor value={form.content} onChange={(v) => setForm({ ...form, content: v })} rows={6} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">사진 (각 1MB 이하, 여러 장 가능)</label>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-200 rounded-lg py-8 flex flex-col items-center gap-2 text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors">
              <ImageIcon size={24} />
              <span className="text-sm">사진 추가</span>
            </button>
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                {imagePreviews.map((src, i) => (
                  <div key={i} className="relative">
                    <img src={src} className="w-full h-24 object-cover rounded-lg" />
                    <button type="button" onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white rounded-full p-1">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <Link href="/board/photo" className="btn-secondary flex-1 text-center py-3">취소</Link>
            <button type="submit" disabled={loading} className="btn-primary flex-1 py-3 disabled:opacity-50">{loading ? '등록 중...' : '등록'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Paperclip, X, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'
import { RichTextEditor } from '@/lib/RichTextEditor'

interface AttachedFile {
  file: File
  name: string
  preview: string | null
}

const IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg']

function getExt(name: string) {
  return name.split('.').pop()?.toLowerCase() ?? ''
}

export default function NewArchivePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ title: '', content: '' })
  const [attachments, setAttachments] = useState<AttachedFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newAttachments: AttachedFile[] = files.map(file => {
      const ext = getExt(file.name)
      const isImage = IMAGE_EXTS.includes(ext)
      return {
        file,
        name: file.name,
        preview: isImage ? URL.createObjectURL(file) : null,
      }
    })
    setAttachments(prev => [...prev, ...newAttachments])
    e.target.value = ''
  }

  const removeAttachment = (idx: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    // 파일 업로드 → content에 마크다운 형식으로 추가
    const fileLines: string[] = []
    for (const att of attachments) {
      const ext = getExt(att.name)
      const path = `archive/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('event-images').upload(path, att.file)
      if (!error) {
        const { data } = supabase.storage.from('event-images').getPublicUrl(path)
        fileLines.push(`[${att.name}](${data.publicUrl})`)
      }
    }

    const finalContent = fileLines.length > 0
      ? `${form.content}\n\n${fileLines.join('\n')}`
      : form.content

    await supabase.from('posts').insert({
      title: form.title,
      content: finalContent,
      category: 'archive',
      is_pinned: false,
      author_id: user?.id,
    })
    router.push('/board/archive')
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/board/archive" className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></Link>
        <h1 className="text-2xl font-bold text-gray-900">자료실 작성</h1>
      </div>
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">제목 *</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
            <RichTextEditor value={form.content} onChange={(v) => setForm({ ...form, content: v })} rows={8} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">파일 첨부</label>
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              <Paperclip size={16} />
              파일 추가 (이미지, PDF, AI 등 모든 형식)
            </button>

            {attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachments.map((att, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    {att.preview ? (
                      <img src={att.preview} alt={att.name} className="w-12 h-12 object-cover rounded" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xs font-bold text-gray-500 uppercase">
                        {getExt(att.name)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 truncate">{att.name}</p>
                      <p className="text-xs text-gray-400">{(att.file.size / 1024).toFixed(0)} KB</p>
                    </div>
                    <button type="button" onClick={() => removeAttachment(i)} className="text-gray-400 hover:text-red-500">
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <Link href="/board/archive" className="btn-secondary flex-1 text-center py-3">취소</Link>
            <button type="submit" disabled={loading} className="btn-primary flex-1 py-3 disabled:opacity-50">
              {loading ? '등록 중...' : '등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

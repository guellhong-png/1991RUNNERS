'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Paperclip, X, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import Link from 'next/link'
import { RichTextEditor } from '@/lib/RichTextEditor'

interface AttachedFile {
  file: File
  name: string
  preview: string | null
  status: 'pending' | 'uploading' | 'done' | 'error'
  url?: string
}

const IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg']

function getExt(name: string) {
  return name.split('.').pop()?.toLowerCase() ?? ''
}

function NewNoticeForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ title: searchParams.get('title') || '', content: '', is_pinned: true })
  const [attachments, setAttachments] = useState<AttachedFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newAttachments: AttachedFile[] = files.map(file => ({
      file,
      name: file.name,
      preview: IMAGE_EXTS.includes(getExt(file.name)) ? URL.createObjectURL(file) : null,
      status: 'pending',
    }))
    setAttachments(prev => [...prev, ...newAttachments])
    e.target.value = ''
  }

  const removeAttachment = (idx: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx))
  }

  const uploadFile = async (att: AttachedFile, idx: number): Promise<string | null> => {
    setAttachments(prev => prev.map((a, i) => i === idx ? { ...a, status: 'uploading' } : a))
    const ext = getExt(att.name)
    const path = `archive/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('event-images').upload(path, att.file, { cacheControl: '3600', upsert: false })
    if (error) {
      setAttachments(prev => prev.map((a, i) => i === idx ? { ...a, status: 'error' } : a))
      return null
    }
    const { data } = supabase.storage.from('event-images').getPublicUrl(path)
    setAttachments(prev => prev.map((a, i) => i === idx ? { ...a, status: 'done', url: data.publicUrl } : a))
    return data.publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    const fileLines: string[] = []
    for (let i = 0; i < attachments.length; i++) {
      const att = attachments[i]
      if (att.status === 'done' && att.url) {
        fileLines.push(`[${att.name}](${att.url})`)
        continue
      }
      const url = await uploadFile(att, i)
      if (url) fileLines.push(`[${att.name}](${url})`)
    }

    const finalContent = fileLines.length > 0
      ? `${form.content}\n\n${fileLines.join('\n')}`
      : form.content

    await supabase.from('posts').insert({
      title: form.title,
      content: finalContent,
      category: 'notice',
      is_pinned: form.is_pinned,
      author_id: user?.id,
    })
    router.push('/board/notice')
    router.refresh()
    setLoading(false)
  }

  const totalCount = attachments.length
  const doneCount = attachments.filter(a => a.status === 'done').length
  const errorCount = attachments.filter(a => a.status === 'error').length
  const isUploading = attachments.some(a => a.status === 'uploading')

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/board/notice" className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></Link>
        <h1 className="text-2xl font-bold text-gray-900">필독사항 작성</h1>
      </div>
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">제목 *</label>
            <input value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} className="input" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">내용 *</label>
            <RichTextEditor value={form.content} onChange={(v) => setForm({ ...form, content: v })} rows={10} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">파일 첨부</label>
              {loading && totalCount > 0 && (
                <span className="text-xs text-gray-400">{doneCount}/{totalCount} 업로드 완료 {errorCount > 0 && `· ${errorCount}개 실패`}</span>
              )}
            </div>
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              <Paperclip size={16} />
              파일 추가 (이미지, PDF, AI 등 모든 형식)
            </button>
            {attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachments.map((att, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${
                    att.status === 'error' ? 'bg-red-50 border-red-100' :
                    att.status === 'done' ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'
                  }`}>
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
                    <div className="shrink-0">
                      {att.status === 'uploading' && <Loader size={16} className="text-blue-400 animate-spin" />}
                      {att.status === 'done' && <CheckCircle size={16} className="text-green-500" />}
                      {att.status === 'error' && <AlertCircle size={16} className="text-red-500" />}
                      {att.status === 'pending' && (
                        <button type="button" onClick={() => removeAttachment(i)} className="text-gray-400 hover:text-red-500">
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {errorCount > 0 && !loading && (
                  <p className="text-xs text-red-500">⚠ 일부 파일 업로드 실패. 등록 버튼을 다시 누르면 재시도해요.</p>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="pinned" checked={form.is_pinned} onChange={(e) => setForm({...form, is_pinned: e.target.checked})} className="w-4 h-4" />
            <label htmlFor="pinned" className="text-sm text-gray-600">📌 상단 고정</label>
          </div>
          <div className="flex gap-3 pt-2">
            <Link href="/board/notice" className="btn-secondary flex-1 text-center py-3">취소</Link>
            <button type="submit" disabled={loading || isUploading} className="btn-primary flex-1 py-3 disabled:opacity-50">
              {loading ? `업로드 중 (${doneCount}/${totalCount})` : '등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function NewNoticePage() {
  return <Suspense><NewNoticeForm /></Suspense>
}

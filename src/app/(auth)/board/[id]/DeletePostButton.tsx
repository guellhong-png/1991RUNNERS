'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Trash2 } from 'lucide-react'

export default function DeletePostButton({ postId }: { postId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const handleDelete = async () => {
    if (!confirm('이 게시글을 삭제할까요?')) return
    setLoading(true)
    await supabase.from('posts').delete().eq('id', postId)
    router.push('/board'); router.refresh()
  }
  return <button onClick={handleDelete} disabled={loading} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
}

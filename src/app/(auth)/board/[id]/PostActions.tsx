'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Pencil, Check, X, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { RichText } from '@/lib/richtext'
import { RichTextEditor } from '@/lib/RichTextEditor'

interface Comment {
  id: string
  content: string
  is_edited: boolean
  created_at: string
  author: { id: string; name: string; avatar_url?: string }
}

interface Props {
  post: any
  currentUserId: string
  currentUserRole: string
  initialComments: Comment[]
}

export default function PostActions({ post, currentUserId, currentUserRole, initialComments }: Props) {
  const supabase = createClient()
  const router = useRouter()

  // 글 수정
  const [editingPost, setEditingPost] = useState(false)
  const [postContent, setPostContent] = useState(post.content)
  const [postSaving, setPostSaving] = useState(false)
  const [isPostEdited, setIsPostEdited] = useState(post.is_edited ?? false)

  // 댓글
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [newComment, setNewComment] = useState('')
  const [commentSaving, setCommentSaving] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingCommentContent, setEditingCommentContent] = useState('')

  const canEditPost = currentUserRole === 'admin' || post.author_id === currentUserId

  const handlePostSave = async () => {
    setPostSaving(true)
    await supabase.from('posts').update({ content: postContent, is_edited: true }).eq('id', post.id)
    setIsPostEdited(true)
    setEditingPost(false)
    setPostSaving(false)
    router.refresh()
  }

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return
    setCommentSaving(true)
    const { data } = await supabase
      .from('comments')
      .insert({ post_id: post.id, author_id: currentUserId, content: newComment.trim() })
      .select('*, author:profiles!author_id(id, name, avatar_url)')
      .single()
    if (data) setComments([...comments, data])
    setNewComment('')
    setCommentSaving(false)
  }

  const handleCommentEdit = async (commentId: string) => {
    if (!editingCommentContent.trim()) return
    await supabase.from('comments').update({ content: editingCommentContent.trim(), is_edited: true, updated_at: new Date().toISOString() }).eq('id', commentId)
    setComments(comments.map(c => c.id === commentId ? { ...c, content: editingCommentContent.trim(), is_edited: true } : c))
    setEditingCommentId(null)
  }

  const handleCommentDelete = async (commentId: string) => {
    if (!confirm('댓글을 삭제할까요?')) return
    await supabase.from('comments').delete().eq('id', commentId)
    setComments(comments.filter(c => c.id !== commentId))
  }

  return (
    <div className="space-y-4">
      {/* 글 내용 */}
      <div className="card">
        <div className="flex items-center justify-between text-sm text-gray-500 border-b border-gray-100 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#c0392b] flex items-center justify-center text-xs font-bold text-white overflow-hidden">
              {post.author?.avatar_url
                ? <img src={post.author.avatar_url} className="w-full h-full object-cover" />
                : post.author?.name?.[0]}
            </div>
            <span>{post.author?.name ?? '알 수 없음'}</span>
          </div>
          <div className="flex items-center gap-2">
            {isPostEdited && <span className="text-xs text-gray-400">(수정됨)</span>}
            <span>{format(new Date(post.created_at), 'yyyy년 M월 d일 HH:mm', { locale: ko })}</span>
            {canEditPost && !editingPost && (
              <button onClick={() => setEditingPost(true)} className="text-gray-400 hover:text-gray-600">
                <Pencil size={14} />
              </button>
            )}
          </div>
        </div>

        {editingPost ? (
          <div className="space-y-3">
            <RichTextEditor value={postContent} onChange={setPostContent} rows={8} />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditingPost(false)} className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700">
                <X size={14} />취소
              </button>
              <button onClick={handlePostSave} disabled={postSaving} className="flex items-center gap-1 px-3 py-1.5 bg-[#c0392b] text-white text-sm rounded-lg hover:bg-[#a93226] disabled:opacity-50">
                <Check size={14} />{postSaving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        ) : (
          <RichText content={postContent} className="text-gray-700 leading-relaxed" />
        )}
      </div>

      {/* 댓글 */}
      <div className="card space-y-4">
        <h3 className="font-bold text-gray-900">댓글 {comments.length}개</h3>
        <div className="space-y-4">
          {comments.length === 0 && <p className="text-sm text-gray-400">첫 댓글을 남겨보세요!</p>}
          {comments.map(comment => (
            <div key={comment.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[#c0392b] flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden">
                {comment.author?.avatar_url
                  ? <img src={comment.author.avatar_url} className="w-full h-full object-cover" />
                  : comment.author?.name?.[0]}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900">{comment.author?.name}</span>
                  <span className="text-xs text-gray-400">{format(new Date(comment.created_at), 'M/d HH:mm', { locale: ko })}</span>
                  {comment.is_edited && <span className="text-xs text-gray-400">(수정됨)</span>}
                  {(currentUserRole === 'admin' || comment.author?.id === currentUserId) && (
                    <div className="flex items-center gap-1 ml-auto">
                      <button
                        onClick={() => { setEditingCommentId(comment.id); setEditingCommentContent(comment.content) }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => handleCommentDelete(comment.id)} className="text-gray-400 hover:text-red-500">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
                {editingCommentId === comment.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editingCommentContent}
                      onChange={e => setEditingCommentContent(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg p-2 text-sm text-gray-700 resize-none focus:outline-none focus:border-[#c0392b]"
                      rows={2}
                    />
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setEditingCommentId(null)} className="text-xs text-gray-400 px-2 py-1">취소</button>
                      <button onClick={() => handleCommentEdit(comment.id)} className="text-xs bg-[#c0392b] text-white px-3 py-1 rounded-lg">저장</button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 댓글 입력 */}
        <div className="border-t border-gray-100 pt-4">
          <div className="flex gap-3">
            <textarea
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="댓글을 입력하세요..."
              className="flex-1 border border-gray-200 rounded-lg p-3 text-sm text-gray-700 resize-none focus:outline-none focus:border-[#c0392b]"
              rows={2}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleCommentSubmit()
                }
              }}
            />
            <button
              onClick={handleCommentSubmit}
              disabled={commentSaving || !newComment.trim()}
              className="px-4 py-2 bg-[#c0392b] text-white text-sm rounded-lg hover:bg-[#a93226] disabled:opacity-50 shrink-0 self-end"
            >
              등록
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

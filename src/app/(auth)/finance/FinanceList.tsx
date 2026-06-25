'use client'
import { useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp, Pencil, X, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { FINANCE_CATEGORIES } from '@/types'

interface Finance {
  id: string
  type: 'income' | 'expense'
  amount: number
  description: string
  category: string | null
  transaction_date: string
  balance_after: number | null
  image_url: string | null
  is_edited: boolean
  created_by: string
  creator: { name: string } | null
}

export default function FinanceList({ finances, isAdmin }: { finances: Finance[]; isAdmin: boolean }) {
  const supabase = createClient()
  const router = useRouter()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  const handleEdit = (item: Finance) => {
    setEditingId(item.id)
    setEditForm({
      type: item.type,
      amount: String(item.amount),
      description: item.description,
      category: item.category ?? '',
      transaction_date: item.transaction_date,
      balance_after: item.balance_after != null ? String(item.balance_after) : '',
    })
  }

  const handleSave = async (id: string) => {
    setSaving(true)
    const { error } = await supabase.from('finances').update({
      type: editForm.type,
      amount: parseInt(editForm.amount),
      description: editForm.description,
      category: editForm.category || null,
      transaction_date: editForm.transaction_date,
      balance_after: editForm.balance_after ? parseInt(editForm.balance_after) : null,
      is_edited: true,
    }).eq('id', id)
    if (error) alert('저장 실패: ' + error.message)
    else { setEditingId(null); router.refresh() }
    setSaving(false)
  }

  return (
    <>
      <div className="divide-y divide-gray-50">
        {finances.map((item) => (
          <div key={item.id}>
            {editingId === item.id ? (
              /* 수정 폼 */
              <div className="px-6 py-4 bg-gray-50 space-y-3">
                <div className="flex gap-3">
                  {(['income', 'expense'] as const).map((t) => (
                    <button key={t} type="button" onClick={() => setEditForm({ ...editForm, type: t })}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${editForm.type === t ? (t === 'income' ? 'bg-green-500 text-white' : 'bg-red-500 text-white') : 'bg-gray-100 text-gray-600'}`}>
                      {t === 'income' ? '💰 수입' : '💸 지출'}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">금액 (원)</label>
                    <input type="number" value={editForm.amount} onChange={e => setEditForm({ ...editForm, amount: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c0392b]" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">날짜</label>
                    <input type="date" value={editForm.transaction_date} onChange={e => setEditForm({ ...editForm, transaction_date: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c0392b]" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">설명</label>
                  <input value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c0392b]" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">카테고리</label>
                    <select value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c0392b]">
                      <option value="">선택 안 함</option>
                      {FINANCE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">거래 후 잔액</label>
                    <input type="number" value={editForm.balance_after} onChange={e => setEditForm({ ...editForm, balance_after: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c0392b]" placeholder="선택 사항" />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setEditingId(null)} className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700">
                    <X size={14} />취소
                  </button>
                  <button onClick={() => handleSave(item.id)} disabled={saving}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#c0392b] text-white text-sm rounded-lg hover:bg-[#a93226] disabled:opacity-50">
                    <Check size={14} />저장
                  </button>
                </div>
              </div>
            ) : (
              /* 일반 행 */
              <div>
                <div
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => item.image_url ? setExpandedId(expandedId === item.id ? null : item.id) : null}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${item.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                    {item.type === 'income' ? <TrendingUp size={15} className="text-green-600" /> : <TrendingDown size={15} className="text-red-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">{item.description}</p>
                      {item.is_edited && <span className="text-xs text-gray-400">수정됨</span>}
                    </div>
                    <p className="text-xs text-gray-400">
                      {item.category && <span className="mr-2">{item.category}</span>}
                      {format(new Date(item.transaction_date), 'yyyy.M.d', { locale: ko })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className={`font-semibold ${item.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                        {item.type === 'income' ? '+' : '-'}{item.amount.toLocaleString()}원
                      </p>
                      {item.balance_after != null && <p className="text-xs text-gray-400">잔액 {item.balance_after.toLocaleString()}원</p>}
                    </div>
                    {isAdmin && (
                      <button
                        onClick={e => { e.stopPropagation(); handleEdit(item) }}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                    {item.image_url && (
                      <div className="text-gray-400">
                        {expandedId === item.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    )}
                  </div>
                </div>

                {/* 사진 펼치기 */}
                {item.image_url && expandedId === item.id && (
                  <div className="px-6 pb-4">
                    <img
                      src={item.image_url}
                      alt="증빙"
                      onClick={() => setLightboxUrl(item.image_url)}
                      className="rounded-lg max-h-64 object-contain border border-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 라이트박스 */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setLightboxUrl(null)}>
          <button className="absolute top-4 right-4 text-white hover:text-gray-300" onClick={() => setLightboxUrl(null)}>
            <X size={32} />
          </button>
          <img src={lightboxUrl} alt="증빙" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </>
  )
}

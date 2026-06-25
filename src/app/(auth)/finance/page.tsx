import { createClient } from '@/lib/supabase/server'
import { Plus, TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import Link from 'next/link'
import FinanceList from './FinanceList'

export default async function FinancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  const { data: finances } = await supabase
    .from('finances')
    .select('*, creator:profiles!created_by(name)')
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false })

  const totalIncome = finances?.filter(f => f.type === 'income').reduce((sum, f) => sum + f.amount, 0) ?? 0
  const totalExpense = finances?.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.amount, 0) ?? 0
  const balance = finances?.[0]?.balance_after ?? (totalIncome - totalExpense)
  const isAdmin = profile?.role === 'admin'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">회비 내역</h1>
          <p className="text-gray-500 mt-1">투명하게 공개되는 클럽 재정</p>
        </div>
        {isAdmin && (
          <Link href="/finance/new">
            <button className="btn-primary flex items-center gap-2"><Plus size={18} />내역 추가</button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card bg-blue-50 border-blue-100">
          <div className="flex items-center gap-2 mb-2"><Wallet size={18} className="text-blue-500" /><span className="text-sm text-blue-600 font-medium">현재 잔액</span></div>
          <p className="text-2xl font-bold text-blue-700">{balance.toLocaleString()}원</p>
        </div>
        <div className="card bg-green-50 border-green-100">
          <div className="flex items-center gap-2 mb-2"><TrendingUp size={18} className="text-green-500" /><span className="text-sm text-green-600 font-medium">총 수입</span></div>
          <p className="text-2xl font-bold text-green-700">{totalIncome.toLocaleString()}원</p>
        </div>
        <div className="card bg-red-50 border-red-100">
          <div className="flex items-center gap-2 mb-2"><TrendingDown size={18} className="text-red-500" /><span className="text-sm text-red-600 font-medium">총 지출</span></div>
          <p className="text-2xl font-bold text-red-700">{totalExpense.toLocaleString()}원</p>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100"><h2 className="font-semibold text-gray-900">거래 내역</h2></div>
        {(!finances || finances.length === 0) ? (
          <div className="text-center py-16 text-gray-400"><p className="text-4xl mb-3">💰</p><p>등록된 내역이 없습니다</p></div>
        ) : (
          <FinanceList finances={finances} isAdmin={isAdmin} />
        )}
      </div>
    </div>
  )
}

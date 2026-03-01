import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, PlusCircle } from 'lucide-react'

export default async function TransactionsPage({
    searchParams
}: {
    searchParams: { month?: string }
}) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const adminClient = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: profile } = await adminClient
        .from('profiles')
        .select('household_id')
        .eq('id', user.id)
        .single()

    if (!profile?.household_id) redirect('/setup')

    const householdId = profile.household_id

    // Determine Target Month
    const now = new Date()
    let targetYear = now.getFullYear()
    let targetMonth = now.getMonth() + 1

    if (searchParams.month) {
        const [y, m] = searchParams.month.split('-')
        if (y && m) {
            targetYear = parseInt(y)
            targetMonth = parseInt(m)
        }
    }

    const startDate = new Date(targetYear, targetMonth - 1, 1)
    const endDate = new Date(targetYear, targetMonth, 0) // last day

    const prevMonth = format(new Date(targetYear, targetMonth - 2, 1), 'yyyy-MM')
    const nextMonth = format(new Date(targetYear, targetMonth, 1), 'yyyy-MM')

    // Fetch transactions (use admin client to bypass RLS)
    const { data: transactions } = await adminClient
        .from('transactions')
        .select(`
      id, type, amount, date, description, note,
      categories(main_category, sub_category),
      payment_methods(name)
    `)
        .eq('household_id', householdId)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'))
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })

    // Calculate summaries
    let totalIncome = 0
    let totalExpense = 0
    let totalTransfer = 0

    // Group by date
    interface TransactionItem {
        id: string
        type: string
        amount: number
        date: string
        description: string
        note: string
        categories: { main_category: string, sub_category: string } | null
        payment_methods: { name: string } | null
    }

    const grouped: Record<string, TransactionItem[]> = {}

    if (transactions) {
        transactions.forEach((t) => {
            const amt = Number(t.amount)
            if (t.type === 'income') totalIncome += amt
            if (t.type === 'expense') totalExpense += amt
            if (t.type === 'transfer') totalTransfer += amt

            if (!grouped[t.date]) grouped[t.date] = []

            // Handle array vs object payload from Supabase
            const categoriesObj = Array.isArray(t.categories) ? t.categories[0] : t.categories
            const paymentsObj = Array.isArray(t.payment_methods) ? t.payment_methods[0] : t.payment_methods

            grouped[t.date].push({
                ...t,
                categories: categoriesObj as { main_category: string, sub_category: string } | null,
                payment_methods: paymentsObj as { name: string } | null
            } as TransactionItem)
        })
    }

    const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

    return (
        <div className="flex flex-col min-h-full bg-gray-50 pb-20">

            {/* Month Navigation */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-100 sticky top-0 z-10">
                <Link href={`/transactions?month=${prevMonth}`} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                </Link>
                <span className="text-lg font-bold text-gray-900">
                    {targetYear}년 {targetMonth}월
                </span>
                <Link href={`/transactions?month=${nextMonth}`} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                    <ChevronRight className="w-5 h-5" />
                </Link>
            </div>

            {/* Monthly Summary */}
            <div className="bg-white px-6 py-5 mx-4 mt-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between mb-4 pb-4 border-b border-gray-50">
                    <div className="text-center">
                        <p className="text-xs text-blue-600 font-medium mb-1">수입</p>
                        <p className="text-sm font-bold text-blue-600">+{formatCurrency(totalIncome)}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-red-500 font-medium mb-1">지출</p>
                        <p className="text-sm font-bold text-red-500">-{formatCurrency(totalExpense)}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-gray-500 font-medium mb-1">이체</p>
                        <p className="text-sm font-bold text-gray-600">{formatCurrency(totalTransfer)}</p>
                    </div>
                </div>
                <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600 font-medium">잔여예산 (수입-지출)</p>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(totalIncome - totalExpense)}원</p>
                </div>
            </div>

            {/* Transaction List */}
            <div className="px-4 mt-6 space-y-6">
                {sortedDates.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 flex flex-col items-center">
                        <p className="mb-4">거래 내역이 없습니다.</p>
                        <Link
                            href="/transactions/new"
                            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-medium inline-flex items-center gap-2 hover:bg-blue-100 transition-colors"
                        >
                            <PlusCircle className="w-4 h-4" /> 첫 거래 입력하기
                        </Link>
                    </div>
                ) : (
                    sortedDates.map((date) => {
                        const d = parseISO(date)
                        const dayItems = grouped[date]

                        // Daily summary
                        const dailyIncome = dayItems.filter(i => i.type === 'income').reduce((s, i) => s + Number(i.amount), 0)
                        const dailyExpense = dayItems.filter(i => i.type === 'expense').reduce((s, i) => s + Number(i.amount), 0)

                        return (
                            <div key={date} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                {/* Date Header */}
                                <div className="flex justify-between items-center px-4 py-3 bg-gray-50/50 border-b border-gray-50">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-gray-900">{format(d, 'd')}일</span>
                                        <span className="text-xs text-gray-500">{format(d, 'EEEE', { locale: ko })}</span>
                                    </div>
                                    <div className="text-xs flex gap-2">
                                        {dailyIncome > 0 && <span className="text-blue-600">+{formatCurrency(dailyIncome)}</span>}
                                        {dailyExpense > 0 && <span className="text-red-500">-{formatCurrency(dailyExpense)}</span>}
                                    </div>
                                </div>

                                {/* Items */}
                                <div className="divide-y divide-gray-50">
                                    {dayItems.map((item) => (
                                        <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                {/* Type Indicator */}
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold
                          ${item.type === 'expense' ? 'bg-red-50 text-red-500' :
                                                        item.type === 'income' ? 'bg-blue-50 text-blue-600' :
                                                            'bg-gray-100 text-gray-600'}`}>
                                                    {item.categories?.main_category?.slice(0, 2) || (item.type === 'transfer' ? '이체' : '기타')}
                                                </div>

                                                <div>
                                                    <p className="font-medium text-gray-900 text-sm">{item.description}</p>
                                                    <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-500">
                                                        <span>{item.categories?.sub_category || '미분류'}</span>
                                                        {item.payment_methods?.name && (
                                                            <>
                                                                <span className="w-0.5 h-0.5 rounded-full bg-gray-300"></span>
                                                                <span>{item.payment_methods.name}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className={`font-bold text-sm text-right
                        ${item.type === 'expense' ? 'text-gray-900' :
                                                    item.type === 'income' ? 'text-blue-600' :
                                                        'text-gray-600'}`}>
                                                {item.type === 'expense' ? '-' : item.type === 'income' ? '+' : ''}
                                                {formatCurrency(Number(item.amount))}원
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

        </div>
    )
}

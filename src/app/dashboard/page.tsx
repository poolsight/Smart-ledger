import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import DashboardCharts from './DashboardCharts'

export default async function DashboardPage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Use admin client to bypass RLS infinite recursion on profiles table
    const adminClient = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. Get user profile to find household_id
    const { data: profile } = await adminClient
        .from('profiles')
        .select('household_id')
        .eq('id', user.id)
        .single()

    if (!profile?.household_id) {
        redirect('/setup')
    }
    const householdId = profile.household_id

    // 2. Compute date ranges
    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0) // last day of prev month

    // 3. Fetch current month expenses
    const { data: currentExpensesRaw } = await adminClient
        .from('transactions')
        .select('amount, is_fixed, category_id, categories(main_category)')
        .eq('household_id', householdId)
        .eq('type', 'expense')
        .gte('date', currentMonthStart.toISOString())

    const currentMonthExpenseTotal = (currentExpensesRaw || []).reduce((sum, t) => sum + Number(t.amount), 0)
    const fixedExpenseTotal = (currentExpensesRaw || []).filter(t => t.is_fixed).reduce((sum, t) => sum + Number(t.amount), 0)
    const variableExpenseTotal = currentMonthExpenseTotal - fixedExpenseTotal

    // 4. Fetch previous month expenses (for comparison)
    const { data: previousExpensesRaw } = await adminClient
        .from('transactions')
        .select('amount')
        .eq('household_id', householdId)
        .eq('type', 'expense')
        .gte('date', previousMonthStart.toISOString())
        .lte('date', previousMonthEnd.toISOString())

    const previousMonthExpenseTotal = (previousExpensesRaw || []).reduce((sum, t) => sum + Number(t.amount), 0)

    const expenseDiff = currentMonthExpenseTotal - previousMonthExpenseTotal
    const diffPrefix = expenseDiff > 0 ? '+' : ''

    // 5. Aggregate category data for pie chart (Current Month)
    const categoryMap: Record<string, number> = {}
    currentExpensesRaw?.forEach(t => {
        // Handling nested join from Supabase
        // @ts-expect-error: Suppress generic type mismatch
        const catName = t.categories?.main_category || '기타'
        categoryMap[catName] = (categoryMap[catName] || 0) + Number(t.amount)
    })

    const pieData = Object.entries(categoryMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)

    // 6. Fetch last 6 months income/expense for Bar Chart
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    const { data: sixMonthTxs } = await adminClient
        .from('transactions')
        .select('type, amount, date')
        .eq('household_id', householdId)
        .in('type', ['income', 'expense'])
        .gte('date', sixMonthsAgo.toISOString())

    const monthlyDataMap: Record<string, { name: string, 수입: number, 지출: number }> = {}

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const label = `${d.getMonth() + 1}월`
        const sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        monthlyDataMap[sortKey] = { name: label, 수입: 0, 지출: 0 }
    }

    sixMonthTxs?.forEach(t => {
        const d = new Date(t.date)
        const sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        if (monthlyDataMap[sortKey]) {
            if (t.type === 'income') monthlyDataMap[sortKey].수입 += Number(t.amount)
            if (t.type === 'expense') monthlyDataMap[sortKey].지출 += Number(t.amount)
        }
    })

    const barData = Object.keys(monthlyDataMap).sort().map(k => monthlyDataMap[k])

    return (
        <div className="p-4 space-y-6">

            {/* 1. 요약 카드 */}
            <section>
                <Card className="bg-blue-600 text-white border-none shadow-md">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-blue-100">이번 달 총 지출</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{formatCurrency(currentMonthExpenseTotal)}원</div>
                        <p className="text-xs text-blue-200 mt-2">
                            전월 대비 {diffPrefix}{formatCurrency(expenseDiff)}원
                        </p>
                    </CardContent>
                </Card>
            </section>

            {/* 2. 고정비 vs 변동비 비율 바 */}
            <section>
                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm">고정비 / 변동비 비율</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex w-full h-4 bg-gray-100 rounded-full overflow-hidden mb-2">
                            {currentMonthExpenseTotal > 0 ? (
                                <>
                                    <div
                                        style={{ width: `${(fixedExpenseTotal / currentMonthExpenseTotal) * 100}%` }}
                                        className="bg-indigo-500 h-full transition-all"
                                    />
                                    <div
                                        style={{ width: `${(variableExpenseTotal / currentMonthExpenseTotal) * 100}%` }}
                                        className="bg-sky-400 h-full transition-all"
                                    />
                                </>
                            ) : (
                                <div className="bg-gray-200 w-full h-full" />
                            )}
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                고정비 {formatCurrency(fixedExpenseTotal)}원
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                                변동비 {formatCurrency(variableExpenseTotal)}원
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Client Component for Charts */}
            <DashboardCharts barData={barData} pieData={pieData} />

        </div>
    )
}

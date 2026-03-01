import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import FixedSettingForm from './FixedSettingForm'
import FixedSettingsList from './FixedSettingsList'

export default async function FixedSettingsPage() {
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

    // 1. Fetch fixed settings (use admin client to bypass RLS)
    const { data: settings } = await adminClient
        .from('fixed_settings')
        .select(`
      id, type, amount, day_of_month, description, is_active,
      categories(main_category, sub_category),
      payment_methods(name)
    `)
        .eq('household_id', householdId)
        .order('day_of_month', { ascending: true })

    // 2. Fetch dependencies for the form (use admin client to bypass RLS on categories/payment_methods)
    const { data: categories } = await adminClient
        .from('categories')
        .select('*')
        .or(`household_id.is.null,household_id.eq.${householdId}`)
        .order('main_category', { ascending: true })

    const { data: paymentMethods } = await adminClient
        .from('payment_methods')
        .select('*')
        .or(`household_id.is.null,household_id.eq.${householdId}`)
        .order('name', { ascending: true })

    // Summary
    const totalFixedIncome = (settings || [])
        .filter(s => s.type === 'income' && s.is_active)
        .reduce((s, i) => s + Number(i.amount), 0)

    const totalFixedExpense = (settings || [])
        .filter(s => s.type === 'expense' && s.is_active)
        .reduce((s, i) => s + Number(i.amount), 0)

    return (
        <div className="flex flex-col min-h-full bg-gray-50 pb-20">
            <div className="bg-white px-4 py-4 border-b border-gray-100 flex justify-between items-center sticky top-0 z-10">
                <h1 className="text-xl font-bold text-gray-900">고정비 관리</h1>
            </div>

            {/* 요약 카드 */}
            <div className="bg-white px-6 py-5 mx-4 mt-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between">
                <div>
                    <p className="text-xs text-blue-600 font-medium mb-1">월 고정 수입</p>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(totalFixedIncome)}원</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-red-500 font-medium mb-1">월 고정 지출</p>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(totalFixedExpense)}원</p>
                </div>
            </div>

            <div className="px-4 mt-6">
                <h2 className="text-sm font-bold text-gray-700 mb-3 ml-1">새 항목 추가</h2>
                <FixedSettingForm
                    categories={categories || []}
                    paymentMethods={paymentMethods || []}
                />
            </div>

            <div className="px-4 mt-8 pb-8">
                <h2 className="text-sm font-bold text-gray-700 mb-3 ml-1">등록된 고정비 목록</h2>
                <FixedSettingsList settings={(settings || []).map(s => ({
                    ...s,
                    categories: Array.isArray(s.categories) ? s.categories[0] : s.categories,
                    payment_methods: Array.isArray(s.payment_methods) ? s.payment_methods[0] : s.payment_methods
                })) as {
                    id: string
                    description: string
                    day_of_month: number
                    amount: number
                    type: string
                    is_active: boolean
                    categories: { main_category: string, sub_category: string } | null
                    payment_methods: { name: string } | null
                }[]} />
            </div>

        </div>
    )
}

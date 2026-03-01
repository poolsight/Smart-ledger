import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import NewTransactionForm from './NewTransactionForm'

export default async function NewTransactionPage() {
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

    // Fetch categories (global + household specific) - use admin client to bypass RLS
    const { data: categories } = await adminClient
        .from('categories')
        .select('*')
        .or(`household_id.is.null,household_id.eq.${householdId}`)
        .order('main_category', { ascending: true })

    // Fetch payment methods - use admin client to bypass RLS
    const { data: paymentMethods } = await adminClient
        .from('payment_methods')
        .select('*')
        .or(`household_id.is.null,household_id.eq.${householdId}`)
        .order('name', { ascending: true })

    return (
        <NewTransactionForm
            categories={categories || []}
            paymentMethods={paymentMethods || []}
        />
    )
}

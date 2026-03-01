"use server"

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

function getAdminClient() {
    return createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

export async function createFixedSetting(formData: FormData) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return redirect('/login')

    const adminClient = getAdminClient()
    const { data: profile } = await adminClient
        .from('profiles')
        .select('household_id')
        .eq('id', user.id)
        .single()

    if (!profile?.household_id) return redirect('/setup')

    const type = formData.get('type') as string
    const amount = formData.get('amount') as string
    const day_of_month = formData.get('day_of_month') as string
    const category_id = formData.get('category_id') as string
    const payment_method_id = formData.get('payment_method_id') as string | null
    const description = formData.get('description') as string

    const parsedAmount = Number(amount.replace(/,/g, ''))
    const parsedDay = parseInt(day_of_month)

    const insertData: Record<string, unknown> = {
        household_id: profile.household_id,
        type,
        amount: parsedAmount,
        day_of_month: parsedDay,
        category_id: category_id === 'none' ? null : category_id,
        description,
        is_active: true
    }

    if (payment_method_id && payment_method_id !== 'none') {
        insertData.payment_method_id = payment_method_id
    }

    const { error } = await adminClient
        .from('fixed_settings')
        .insert([insertData])

    if (error) {
        console.error("Failed to insert fixed setting:", error)
        return { error: error.message }
    }

    revalidatePath('/fixed')
}

export async function toggleFixedSetting(id: string, isActive: boolean) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const adminClient = getAdminClient()
    await adminClient
        .from('fixed_settings')
        .update({ is_active: !isActive })
        .eq('id', id)

    revalidatePath('/fixed')
}

export async function deleteFixedSetting(id: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const adminClient = getAdminClient()
    await adminClient
        .from('fixed_settings')
        .delete()
        .eq('id', id)

    revalidatePath('/fixed')
}

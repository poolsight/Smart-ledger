"use server"

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createTransaction(formData: FormData) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return redirect('/login')

    const adminClient = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: profile } = await adminClient
        .from('profiles')
        .select('household_id')
        .eq('id', user.id)
        .single()

    if (!profile?.household_id) return redirect('/setup')

    const type = formData.get('type') as string
    const amount = formData.get('amount') as string
    const date = formData.get('date') as string
    const category_id = formData.get('category_id') as string
    const payment_method_id = formData.get('payment_method_id') as string | null
    const description = formData.get('description') as string
    const note = formData.get('note') as string

    const parsedAmount = Number(amount.replace(/,/g, ''))

    const insertData: Record<string, unknown> = {
        household_id: profile.household_id,
        type,
        amount: parsedAmount,
        date,
        category_id: category_id === 'none' ? null : category_id,
        description,
        note,
    }

    if (payment_method_id && payment_method_id !== 'none') {
        insertData.payment_method_id = payment_method_id
    }

    const { error } = await adminClient
        .from('transactions')
        .insert([insertData])

    if (error) {
        console.error("Failed to insert transaction:", error)
        return { error: error.message }
    }

    revalidatePath('/dashboard')
    revalidatePath('/transactions')
    redirect('/transactions')
}

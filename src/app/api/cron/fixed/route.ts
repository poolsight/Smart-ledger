import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
    // 1. Verify cron secret (security)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    // 2. Initialize Supabase Admin Client
    // Using service role to bypass RLS and read all households' settings
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )

    const today = new Date()
    const currentDay = today.getDate()
    const currentDateStr = today.toISOString().split('T')[0] // YYYY-MM-DD

    try {
        // 3. Find active fixed settings for today's day_of_month
        const { data: settings, error: fetchError } = await supabaseAdmin
            .from('fixed_settings')
            .select('*')
            .eq('is_active', true)
            .eq('day_of_month', currentDay)

        if (fetchError) throw fetchError

        if (!settings || settings.length === 0) {
            return NextResponse.json({ message: 'No fixed expenses for today.' })
        }

        // 4. Prepare transactions to insert
        const insertData = settings.map(setting => ({
            household_id: setting.household_id,
            type: setting.type,
            amount: setting.amount,
            date: currentDateStr,
            category_id: setting.category_id,
            payment_method_id: setting.payment_method_id,
            description: `[고정] ${setting.description}`,
            is_fixed: true,
            note: '자동 등록'
        }))

        // 5. Insert transactions
        const { error: insertError } = await supabaseAdmin
            .from('transactions')
            .insert(insertData)

        if (insertError) throw insertError

        return NextResponse.json({
            success: true,
            processed: insertData.length
        })

    } catch (error: unknown) {
        console.error('Cron job failed:', error)
        const errObj = error as Error
        return NextResponse.json({ error: errObj.message }, { status: 500 })
    }
}

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

async function createHousehold(formData: FormData) {
    'use server'
    const name = formData.get('name') as string

    // Use regular client just to verify authentication
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return redirect('/login')

    // Use service role client to bypass RLS for initial setup
    // (households and profiles don't exist yet, so RLS would block regular inserts)
    const adminClient = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. Generate UUID so we can reference it immediately
    const householdId = crypto.randomUUID()

    // 2. Create household
    const { error: hError } = await adminClient
        .from('households')
        .insert([{ id: householdId, name }])

    if (hError) {
        console.error('household error:', hError)
        return redirect('/setup?message=Failed to create household')
    }

    // 3. Create or update profile linked to household
    const { error: pError } = await adminClient
        .from('profiles')
        .upsert([{
            id: user.id,
            household_id: householdId,
            email: user.email
        }], { onConflict: 'id' })

    if (pError) {
        console.error('profile error:', pError)
        return redirect('/setup?message=Failed to create profile')
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export default async function SetupPage({
    searchParams,
}: {
    searchParams: { message: string }
}) {
    // Use regular client just to verify authentication
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Use admin client to read profile to avoid RLS infinite recursion
    const adminClient = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: profile } = await adminClient
        .from('profiles')
        .select('household_id')
        .eq('id', user.id)
        .single()

    if (profile?.household_id) {
        redirect('/dashboard')
    }

    return (
        <div className="flex-1 flex flex-col w-full px-8 justify-center min-h-screen bg-gray-50 items-center">
            <div className="w-full max-w-sm flex flex-col gap-4 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">환영합니다!</h1>
                    <p className="text-sm text-gray-500 mt-1">사용할 가계부 이름을 정해주세요.</p>
                </div>

                <form action={createHousehold} className="animate-in flex-1 flex flex-col w-full justify-center gap-2 text-foreground">
                    <label className="text-sm font-medium text-gray-700" htmlFor="name">
                        가계부 이름
                    </label>
                    <input
                        className="rounded-md px-4 py-2 bg-inherit border border-gray-300 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        name="name"
                        placeholder="예: 우리가족 튼튼 통장"
                        required
                        type="text"
                    />
                    <button
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center justify-center"
                    >
                        시작하기
                    </button>

                    {searchParams?.message && (
                        <p className="mt-4 p-4 bg-red-50 text-red-600 text-center text-sm rounded-md">
                            {searchParams.message}
                        </p>
                    )}
                </form>
            </div>
        </div>
    )
}

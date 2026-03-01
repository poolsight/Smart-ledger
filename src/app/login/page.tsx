import { login, signup } from './actions'

export default function LoginPage({
    searchParams,
}: {
    searchParams: { message: string }
}) {
    return (
        <div className="flex-1 flex flex-col w-full px-8 justify-center min-h-screen bg-gray-50 items-center">
            <div className="w-full max-w-sm flex flex-col gap-4 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">스마트 가계부</h1>
                    <p className="text-sm text-gray-500 mt-1">부부 공동 자산 관리의 시작</p>
                </div>

                <form className="animate-in flex-1 flex flex-col w-full justify-center gap-2 text-foreground">
                    <label className="text-sm font-medium text-gray-700" htmlFor="email">
                        이메일
                    </label>
                    <input
                        className="rounded-md px-4 py-2 bg-inherit border border-gray-300 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        name="email"
                        placeholder="you@example.com"
                        required
                        type="email"
                    />
                    <label className="text-sm font-medium text-gray-700" htmlFor="password">
                        비밀번호
                    </label>
                    <input
                        className="rounded-md px-4 py-2 bg-inherit border border-gray-300 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        type="password"
                        name="password"
                        placeholder="••••••••"
                        required
                    />
                    <button
                        formAction={login}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center justify-center"
                    >
                        로그인
                    </button>
                    <button
                        formAction={signup}
                        className="border border-gray-300 hover:bg-gray-50 text-gray-900 rounded-md px-4 py-3 text-sm font-medium mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center justify-center"
                    >
                        회원가입
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

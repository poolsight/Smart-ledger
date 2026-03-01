import { logout } from "@/app/login/actions"
import { LogOut } from "lucide-react"

export function TopBar() {
    return (
        <header className="w-full flex justify-between items-center px-4 py-3 bg-white border-b border-gray-100">
            <h1 className="text-lg font-bold text-gray-900">스마트 가계부</h1>
            <form action={logout}>
                <button type="submit" className="text-gray-500 hover:text-gray-900 transition-colors p-1" title="로그아웃">
                    <LogOut className="w-5 h-5" />
                </button>
            </form>
        </header>
    )
}

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { List, PlusCircle, Settings, PieChart } from "lucide-react"
import { cn } from "@/lib/utils"
import { TopBar } from "./TopBar"

export function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()

    const hideNavOnBottom = ["/login", "/setup"]
    const hideNavOnTop = ["/login"]

    const shouldHideBottomNav = hideNavOnBottom.some(path => pathname.startsWith(path))
    const shouldHideTopNav = hideNavOnTop.some(path => pathname.startsWith(path))

    const navItems = [
        { name: "입력", href: "/transactions/new", icon: PlusCircle },
        { name: "내역", href: "/transactions", icon: List },
        { name: "대시보드", href: "/dashboard", icon: PieChart },
        { name: "고정비", href: "/fixed", icon: Settings },
    ]

    return (
        <div className="flex justify-center min-h-screen bg-gray-50 text-slate-900">
            <div className="w-full max-w-lg bg-white min-h-screen relative flex flex-col shadow-xl">
                {!shouldHideTopNav && <TopBar />}
                {/* Main Content Area */}
                <main className={cn("flex-1 overflow-y-auto", !shouldHideBottomNav && "pb-16")}>
                    {children}
                </main>

                {/* Bottom Navigation */}
                {!shouldHideBottomNav && (
                    <nav className="absolute bottom-0 w-full bg-white border-t border-gray-100 flex justify-around items-center h-16 px-2 z-50">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                                        isActive ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
                                    )}
                                >
                                    <item.icon className="w-6 h-6" />
                                    <span className="text-[10px] font-medium">{item.name}</span>
                                </Link>
                            )
                        })}
                    </nav>
                )}
            </div>
        </div>
    )
}

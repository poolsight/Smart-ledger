"use client"

import { useState } from 'react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { createTransaction } from './actions'

interface Category {
    id: string
    type: string
    main_category: string
    sub_category: string
}

interface PaymentMethod {
    id: string
    name: string
}

interface Props {
    categories: Category[]
    paymentMethods: PaymentMethod[]
}

export default function NewTransactionForm({ categories, paymentMethods }: Props) {
    const [type, setType] = useState<'expense' | 'income' | 'transfer'>('expense')
    const [amount, setAmount] = useState('')

    const filteredCategories = categories.filter(c => c.type === type)

    // Group categories by main_category
    const groupedCategories = filteredCategories.reduce((acc, cat) => {
        if (!acc[cat.main_category]) acc[cat.main_category] = []
        acc[cat.main_category].push(cat)
        return acc
    }, {} as Record<string, Category[]>)

    // 기타는 항상 맨 마지막에 표시
    const sortedGroupKeys = Object.keys(groupedCategories).sort((a, b) => {
        if (a === '기타') return 1
        if (b === '기타') return -1
        return a.localeCompare(b)
    })

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Remove non-digits
        const rawValue = e.target.value.replace(/\D/g, '')
        if (!rawValue) {
            setAmount('')
            return
        }
        // Format with commas
        setAmount(Number(rawValue).toLocaleString('ko-KR'))
    }

    return (
        <div className="p-4 h-full flex flex-col max-w-lg mx-auto bg-white">
            <h1 className="text-xl font-bold mb-6 text-gray-900">내역 추가</h1>

            {/* Tabs */}
            <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
                <button
                    type="button"
                    onClick={() => setType('expense')}
                    className={cn(
                        "flex-1 py-2 text-sm font-medium rounded-md transition-all",
                        type === 'expense' ? "bg-white text-red-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    )}
                >
                    지출
                </button>
                <button
                    type="button"
                    onClick={() => setType('income')}
                    className={cn(
                        "flex-1 py-2 text-sm font-medium rounded-md transition-all",
                        type === 'income' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    )}
                >
                    수입
                </button>
                <button
                    type="button"
                    onClick={() => setType('transfer')}
                    className={cn(
                        "flex-1 py-2 text-sm font-medium rounded-md transition-all",
                        type === 'transfer' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    )}
                >
                    이체
                </button>
            </div>

            <form action={async (formData) => {
                const result = await createTransaction(formData);
                if (result && 'error' in result) {
                    alert('내역 추가 실패: ' + result.error);
                }
            }} className="flex-1 flex flex-col gap-5">
                <input type="hidden" name="type" value={type} />

                {/* 날짜 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">날짜</label>
                    <input
                        type="date"
                        name="date"
                        defaultValue={format(new Date(), 'yyyy-MM-dd')}
                        required
                        className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>

                {/* 금액 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">금액</label>
                    <div className="relative">
                        <input
                            type="text"
                            name="amount"
                            inputMode="numeric"
                            value={amount}
                            onChange={handleAmountChange}
                            placeholder="0"
                            required
                            className="w-full h-14 px-4 text-right text-2xl font-bold rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">원</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* 분류 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">분류</label>
                        <select
                            name="category_id"
                            required
                            defaultValue=""
                            className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        >
                            <option value="" disabled>선택</option>
                            {sortedGroupKeys.map(mainCat => (
                                <optgroup key={mainCat} label={mainCat}>
                                    {groupedCategories[mainCat].map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.sub_category}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </div>

                    {/* 결제 수단 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">결제수단</label>
                        <select
                            name="payment_method_id"
                            className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        >
                            <option value="none">선택 (또는 없음)</option>
                            {paymentMethods.map(pm => (
                                <option key={pm.id} value={pm.id}>{pm.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* 내역 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">사용처 / 내역</label>
                    <input
                        type="text"
                        name="description"
                        placeholder="예: 스타벅스, 월급 등"
                        required
                        className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>

                {/* 메모 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">메모 (선택)</label>
                    <input
                        type="text"
                        name="note"
                        placeholder="추가 기록사항"
                        className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>

                <div className="mt-8">
                    <button
                        type="submit"
                        className="w-full h-14 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl shadow-sm transition-all text-lg"
                    >
                        저장하기
                    </button>
                </div>
            </form>
        </div>
    )
}

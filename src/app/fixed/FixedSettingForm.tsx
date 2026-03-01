"use client"

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { createFixedSetting } from './actions'

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

export default function FixedSettingForm({ categories, paymentMethods }: Props) {
    const [type, setType] = useState<'expense' | 'income'>('expense')
    const [amount, setAmount] = useState('')
    const [isOpen, setIsOpen] = useState(false)

    const filteredCategories = categories.filter(c => c.type === type)
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
        const rawValue = e.target.value.replace(/\D/g, '')
        if (!rawValue) {
            setAmount('')
            return
        }
        setAmount(Number(rawValue).toLocaleString('ko-KR'))
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="w-full bg-white border border-gray-200 border-dashed rounded-xl py-4 text-sm text-gray-500 hover:bg-gray-50 hover:border-blue-300 transition-colors"
            >
                + 새로운 고정비 항목 등록하기
            </button>
        )
    }

    return (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-900">항목 등록</h3>
                <button onClick={() => setIsOpen(false)} className="text-sm text-gray-400 hover:text-gray-700">취소</button>
            </div>

            <form action={async (formData) => {
                await createFixedSetting(formData)
                setIsOpen(false)
                setAmount('')
            }} className="flex flex-col gap-4">

                <input type="hidden" name="type" value={type} />

                <div className="flex rounded-lg bg-gray-100 p-1">
                    <button
                        type="button"
                        onClick={() => setType('expense')}
                        className={cn(
                            "flex-1 py-1.5 text-xs font-medium rounded-md transition-all",
                            type === 'expense' ? "bg-white text-red-600 shadow-sm" : "text-gray-500"
                        )}
                    >
                        지출 (매월 발생)
                    </button>
                    <button
                        type="button"
                        onClick={() => setType('income')}
                        className={cn(
                            "flex-1 py-1.5 text-xs font-medium rounded-md transition-all",
                            type === 'income' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"
                        )}
                    >
                        수입 (급여 등)
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">발생일 (매월)</label>
                        <select name="day_of_month" required className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 bg-gray-50">
                            {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                                <option key={d} value={d}>{d}일</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">금액</label>
                        <input
                            type="text"
                            name="amount"
                            inputMode="numeric"
                            value={amount}
                            onChange={handleAmountChange}
                            placeholder="0" required
                            className="w-full h-10 px-3 text-right text-sm font-bold rounded-lg border border-gray-200 bg-gray-50"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs text-gray-500 mb-1">항목명 / 내역</label>
                    <input type="text" name="description" placeholder="예: 월세, 관리비, 넷플릭스" required className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 bg-gray-50" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">분류</label>
                        <select name="category_id" required defaultValue="" className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 bg-gray-50">
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
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">결제수단</label>
                        <select name="payment_method_id" defaultValue="none" className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 bg-gray-50">
                            <option value="none">없음</option>
                            {paymentMethods.map(pm => (
                                <option key={pm.id} value={pm.id}>{pm.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <button type="submit" className="w-full h-10 bg-blue-600 text-white rounded-lg text-sm font-bold mt-2">
                    저장
                </button>
            </form>
        </div>
    )
}

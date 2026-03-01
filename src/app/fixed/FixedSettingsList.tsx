"use client"

import { formatCurrency } from '@/lib/utils'
import { toggleFixedSetting, deleteFixedSetting } from './actions'

interface SettingsItem {
    id: string
    description: string
    day_of_month: number
    amount: number
    type: string
    is_active: boolean
    categories: {
        main_category: string
        sub_category: string
    } | null
    payment_methods: {
        name: string
    } | null
}

interface Props {
    settings: SettingsItem[]
}

export default function FixedSettingsList({ settings }: Props) {
    if (settings.length === 0) {
        return (
            <div className="text-center py-10 text-gray-400 text-sm">
                등록된 고정비가 없습니다.
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {settings.map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">

                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-gray-900 text-sm">{item.description}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
                                매월 {item.day_of_month}일
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <span>{item.categories?.main_category} &gt; {item.categories?.sub_category}</span>
                            {item.payment_methods && (
                                <>
                                    <span className="w-0.5 h-0.5 rounded-full bg-gray-300"></span>
                                    <span>{item.payment_methods.name}</span>
                                </>
                            )}
                        </div>
                        <div className={`mt-1.5 font-bold text-sm ${item.type === 'expense' ? 'text-gray-900' : 'text-blue-600'}`}>
                            {item.type === 'expense' ? '-' : '+'}{formatCurrency(item.amount)}원
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-3 ml-4">
                        {/* Toggle Switch */}
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={item.is_active}
                                onChange={() => toggleFixedSetting(item.id, item.is_active)}
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>

                        <button
                            onClick={() => {
                                if (confirm('정말 삭제하시겠습니까?')) {
                                    deleteFixedSetting(item.id)
                                }
                            }}
                            className="text-xs text-red-500 hover:text-red-700 underline underline-offset-2"
                        >
                            삭제
                        </button>
                    </div>

                </div>
            ))}
        </div>
    )
}

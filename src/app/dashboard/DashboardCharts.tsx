"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    BarChart,
    Bar,
    XAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface DashboardChartsProps {
    barData: {
        name: string;
        수입: number;
        지출: number;
    }[];
    pieData: {
        name: string;
        value: number;
    }[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b']

export default function DashboardCharts({ barData, pieData }: DashboardChartsProps) {
    return (
        <div className="space-y-6">
            {/* 3. 최근 6개월 추이 (Bar Chart) */}
            <section>
                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm">최근 6개월 수입/지출 추이</CardTitle>
                    </CardHeader>
                    <CardContent className="h-64 px-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#6B7280' }}
                                    dy={10}
                                />
                                <Tooltip
                                    formatter={(value: number | string | Array<number | string> | undefined, name: number | string | undefined) => [value ? `${formatCurrency(Number(value))}원` : '0원', name]}
                                    labelStyle={{ color: '#374151', fontWeight: 600, marginBottom: '4px' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    cursor={{ fill: '#F3F4F6' }}
                                />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                <Bar dataKey="수입" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                <Bar dataKey="지출" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </section>

            {/* 4. 이번 달 카테고리별 지출 (Pie Chart) */}
            <section>
                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm">이번 달 지출 분류</CardTitle>
                    </CardHeader>
                    <CardContent className="h-64 px-4 flex flex-col justify-center items-center">
                        {pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={2}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: number | string | Array<number | string> | undefined, name: number | string | undefined) => [value ? `${formatCurrency(Number(value))}원` : '0원', name]}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend
                                        layout="vertical"
                                        verticalAlign="middle"
                                        align="right"
                                        iconType="circle"
                                        wrapperStyle={{ fontSize: '12px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-sm text-gray-400">지출 내역이 없습니다.</div>
                        )}
                    </CardContent>
                </Card>
            </section>
        </div>
    )
}

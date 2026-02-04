'use client';

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Payment } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface SalaryStatsChartProps {
    payments: Payment[];
}

export default function SalaryStatsChart({ payments }: SalaryStatsChartProps) {
    const { t } = useLanguage();

    const chartData = useMemo(() => {
        if (!payments || payments.length === 0) return [];

        const days = 30;
        const data: {
            date: string;
            amount: number;
        }[] = [];

        for (let i = days - 1; i >= 0; i--) {
            const currentDate = new Date();
            currentDate.setDate(currentDate.getDate() - i);
            currentDate.setHours(0, 0, 0, 0);

            const nextDate = new Date(currentDate);
            nextDate.setDate(nextDate.getDate() + 1);

            const dailyPayments = payments.filter(p => {
                const date = new Date(p.date);
                return date >= currentDate && date < nextDate;
            });

            const amount = dailyPayments.reduce((sum, p) => sum + p.amount, 0);

            data.push({
                date: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                amount,
            });
        }

        return data;
    }, [payments]);

    if (chartData.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                <p className="text-gray-500">{t('chart.no_data')}</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">{t('chart.salary_trends')}</h2>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                        dataKey="date"
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                    />
                    <YAxis
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            padding: '8px 12px'
                        }}
                    />
                    <Legend wrapperStyle={{ fontSize: '14px' }} />
                    <Line
                        type="monotone"
                        dataKey="amount"
                        stroke="#10b981"
                        strokeWidth={2}
                        name={t('chart.total_paid')}
                        dot={{ fill: '#10b981', r: 3 }}
                        activeDot={{ r: 5 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

'use client';

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Contract } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface ContractsLineChartProps {
    contracts: Contract[];
}

export default function ContractsLineChart({ contracts }: ContractsLineChartProps) {
    const { t } = useLanguage();

    // Process contracts data to group by date and status
    const chartData = useMemo(() => {
        if (!contracts || contracts.length === 0) return [];

        // Get last 30 days
        const days = 30;
        const data: {
            date: string;
            pending: number;
            in_progress: number;
            completed: number;
            total: number;
        }[] = [];

        for (let i = days - 1; i >= 0; i--) {
            const currentDate = new Date();
            currentDate.setDate(currentDate.getDate() - i);
            currentDate.setHours(0, 0, 0, 0);

            const nextDate = new Date(currentDate);
            nextDate.setDate(nextDate.getDate() + 1);

            // Count contracts created up to this date (cumulative)
            const contractsUpToDate = contracts.filter(c => {
                const createDate = new Date(c.createdAt);
                return createDate < nextDate;
            });

            const pending = contractsUpToDate.filter(c => c.status === 'pending').length;
            const in_progress = contractsUpToDate.filter(c => c.status === 'in_progress').length;
            const completed = contractsUpToDate.filter(c => c.status === 'completed').length;

            data.push({
                date: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                pending,
                in_progress,
                completed,
                total: pending + in_progress + completed,
            });
        }

        return data;
    }, [contracts]);

    if (chartData.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                <p className="text-gray-500">{t('chart.no_data')}</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">{t('chart.contract_trends')}</h2>
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
                    <Legend
                        wrapperStyle={{ fontSize: '14px' }}
                    />
                    <Line
                        type="monotone"
                        dataKey="in_progress"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name={t('chart.in_progress')}
                        dot={{ fill: '#3b82f6', r: 3 }}
                        activeDot={{ r: 5 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="pending"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        name={t('chart.pending')}
                        dot={{ fill: '#f59e0b', r: 3 }}
                        activeDot={{ r: 5 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="completed"
                        stroke="#10b981"
                        strokeWidth={2}
                        name={t('chart.completed')}
                        dot={{ fill: '#10b981', r: 3 }}
                        activeDot={{ r: 5 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="total"
                        stroke="#6366f1"
                        strokeWidth={2}
                        name={t('chart.total_contracts')}
                        dot={{ fill: '#6366f1', r: 3 }}
                        activeDot={{ r: 5 }}
                        strokeDasharray="5 5"
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

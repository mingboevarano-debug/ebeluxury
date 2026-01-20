'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Contract } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface ContractStatsBarChartProps {
    contracts: Contract[];
}

export default function ContractStatsBarChart({ contracts }: ContractStatsBarChartProps) {
    const { t } = useLanguage();
    const chartData = useMemo(() => {
        if (!contracts || contracts.length === 0) return [];

        const pending = contracts.filter(c => c.status === 'pending').length;
        const in_progress = contracts.filter(c => c.status === 'in_progress').length;
        const completed = contracts.filter(c => c.status === 'completed').length;

        return [
            { status: t('chart.pending'), count: pending, color: '#f59e0b' },
            { status: t('chart.in_progress'), count: in_progress, color: '#3b82f6' },
            { status: t('chart.completed'), count: completed, color: '#10b981' },
        ];
    }, [contracts, t]);

    if (chartData.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                <p className="text-gray-500">{t('chart.no_data')}</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">{t('chart.contract_distribution')}</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                        dataKey="status"
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
                    <Bar dataKey="count" name={t('chart.contracts')} radius={[8, 8, 0, 0]}>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

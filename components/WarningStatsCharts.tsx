'use client';

import { useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Warning } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface WarningStatsChartsProps {
    warnings: Warning[];
}

export default function WarningStatsCharts({ warnings }: WarningStatsChartsProps) {
    const { t } = useLanguage();
    // Bar chart data - status distribution
    const barChartData = useMemo(() => {
        if (!warnings || warnings.length === 0) return [];

        const pending = warnings.filter(w => w.status === 'pending').length;
        const resolved = warnings.filter(w => w.status === 'resolved').length;

        return [
            { status: t('chart.pending'), count: pending, color: '#ef4444' },
            { status: t('chart.resolved'), count: resolved, color: '#10b981' },
        ];
    }, [warnings, t]);

    // Line chart data - warnings over time (last 30 days)
    const lineChartData = useMemo(() => {
        if (!warnings || warnings.length === 0) return [];

        const days = 30;
        const data: { date: string; warnings: number }[] = [];

        for (let i = days - 1; i >= 0; i--) {
            const currentDate = new Date();
            currentDate.setDate(currentDate.getDate() - i);
            currentDate.setHours(0, 0, 0, 0);

            const nextDate = new Date(currentDate);
            nextDate.setDate(nextDate.getDate() + 1);

            const dayWarnings = warnings.filter(w => {
                const warnDate = new Date(w.createdAt);
                return warnDate >= currentDate && warnDate < nextDate;
            });

            data.push({
                date: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                warnings: dayWarnings.length,
            });
        }

        return data;
    }, [warnings]);

    if (warnings.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                <p className="text-gray-500">{t('chart.no_data')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Bar Chart - Status Distribution */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">{t('chart.warning_distribution')}</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={barChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                        <Bar dataKey="count" name={t('chart.warnings')} radius={[8, 8, 0, 0]}>
                            {barChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Line Chart - Warnings Over Time */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">{t('chart.warning_trends')}</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={lineChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                            dataKey="warnings"
                            stroke="#ef4444"
                            strokeWidth={3}
                            name={t('chart.daily_warnings')}
                            dot={{ fill: '#ef4444', r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

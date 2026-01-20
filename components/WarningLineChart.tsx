'use client';

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Warning } from '@/types';

interface WarningLineChartProps {
    warnings: Warning[];
}

export default function WarningLineChart({ warnings }: WarningLineChartProps) {
    // Process warnings data to group by date
    const chartData = useMemo(() => {
        if (!warnings || warnings.length === 0) return [];

        // Get last 30 days
        const days = 30;
        const data: { date: string; pending: number; resolved: number; total: number }[] = [];

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

            const pending = dayWarnings.filter(w => w.status === 'pending').length;
            const resolved = dayWarnings.filter(w => w.status === 'resolved').length;

            data.push({
                date: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                pending,
                resolved,
                total: pending + resolved,
            });
        }

        return data;
    }, [warnings]);

    if (chartData.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No warning data available</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Warning Projects - Last 30 Days</h2>
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
                        dataKey="total"
                        stroke="#6366f1"
                        strokeWidth={2}
                        name="Total Warnings"
                        dot={{ fill: '#6366f1', r: 3 }}
                        activeDot={{ r: 5 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="pending"
                        stroke="#ef4444"
                        strokeWidth={2}
                        name="Pending"
                        dot={{ fill: '#ef4444', r: 3 }}
                        activeDot={{ r: 5 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="resolved"
                        stroke="#10b981"
                        strokeWidth={2}
                        name="Resolved"
                        dot={{ fill: '#10b981', r: 3 }}
                        activeDot={{ r: 5 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

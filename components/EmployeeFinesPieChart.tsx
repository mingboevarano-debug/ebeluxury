'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Fine } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface EmployeeFinesPieChartProps {
    fines: Fine[];
}

// Color palette for pie chart slices (red tones for fines)
const COLORS = [
    '#ef4444', // red
    '#dc2626', // red-600
    '#b91c1c', // red-700
    '#991b1b', // red-800
    '#f87171', // red-400
    '#fca5a5', // red-300
    '#fecaca', // red-200
    '#fee2e2', // red-100
    '#f59e0b', // amber
    '#eab308', // yellow
    '#f97316', // orange
    '#dc2626', // red-600
];

export default function EmployeeFinesPieChart({ fines }: EmployeeFinesPieChartProps) {
    const { t } = useLanguage();

    const chartData = useMemo(() => {
        if (!fines || fines.length === 0) {
            console.log('EmployeeFinesPieChart: No fines provided');
            return [];
        }

        console.log('EmployeeFinesPieChart: Processing fines', fines.length);

        // Group fines by user and sum amounts
        const finesByUser = fines.reduce((acc, fine) => {
            const userId = fine.userId;
            const userName = fine.userName || `User ${userId}`;
            
            if (!acc[userId]) {
                acc[userId] = {
                    userId,
                    userName,
                    totalAmount: 0,
                    count: 0,
                };
            }
            
            acc[userId].totalAmount += fine.amount || 0;
            acc[userId].count += 1;
            
            return acc;
        }, {} as Record<string, { userId: string; userName: string; totalAmount: number; count: number }>);

        // Convert to array and filter out users with no fines
        const employeesWithFines = Object.values(finesByUser)
            .filter(({ totalAmount }) => totalAmount > 0)
            .map(({ userName, totalAmount, count }, index) => ({
                name: userName,
                value: totalAmount,
                count,
                color: COLORS[index % COLORS.length],
            }))
            .sort((a, b) => b.value - a.value); // Sort by fine amount descending

        console.log('EmployeeFinesPieChart: Employees with fines', employeesWithFines.length);
        console.log('EmployeeFinesPieChart: Chart data', employeesWithFines);

        return employeesWithFines;
    }, [fines]);

    const totalFines = useMemo(() => {
        return chartData.reduce((sum, item) => sum + item.value, 0);
    }, [chartData]);

    if (chartData.length === 0) {
        const totalFinesCount = fines?.length || 0;
        
        return (
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {t('chart.employee_fines_distribution') || 'Employee Fines Distribution'}
                    </h2>
                </div>
                <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <p className="text-gray-500 text-lg mb-2">{t('chart.no_data')}</p>
                    <p className="text-gray-400 text-sm text-center px-4">
                        {t('chart.no_fines_data') || 'No fines data found.'}
                    </p>
                    {totalFinesCount > 0 && (
                        <p className="text-gray-400 text-xs mt-2">
                            Total fines records: {totalFinesCount}
                        </p>
                    )}
                </div>
            </div>
        );
    }

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0];
            const percentage = totalFines > 0 ? ((data.value / totalFines) * 100).toFixed(1) : '0';
            return (
                <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                    <p className="font-semibold text-gray-900">{data.payload.name}</p>
                    <p className="text-sm font-medium text-red-600">
                        {data.value.toLocaleString()} UZS
                    </p>
                    <p className="text-xs text-gray-500">
                        {data.payload.count} {data.payload.count === 1 ? 'fine' : 'fines'}
                    </p>
                    <p className="text-xs text-gray-500">{percentage}% {t('chart.of_total') || 'of total'}</p>
                </div>
            );
        }
        return null;
    };

    const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
        if (percent < 0.05) return null; // Don't show label for slices smaller than 5%
        
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text
                x={x}
                y={y}
                fill="white"
                textAnchor={x > cx ? 'start' : 'end'}
                dominantBaseline="central"
                fontSize={12}
                fontWeight="bold"
            >
                {name.length > 10 ? name.substring(0, 10) + '...' : name}
            </text>
        );
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                    {t('chart.employee_fines_distribution') || 'Employee Fines Distribution'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                    {t('chart.total_fines') || 'Total Fines'}: <span className="font-semibold text-red-600">{totalFines.toLocaleString()} UZS</span>
                </p>
            </div>
            <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={CustomLabel}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                        formatter={(value, entry: any) => {
                            const data = chartData.find(d => d.name === value);
                            if (!data) return value;
                            const percentage = totalFines > 0 ? ((data.value / totalFines) * 100).toFixed(1) : '0';
                            return `${value} (${percentage}%)`;
                        }}
                    />
                </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                {chartData.slice(0, 6).map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                        />
                        <span className="text-gray-700 truncate">{item.name}</span>
                        <span className="text-gray-500 font-medium">
                            {((item.value / totalFines) * 100).toFixed(1)}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}












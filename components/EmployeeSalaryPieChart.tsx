'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { User } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface EmployeeSalaryPieChartProps {
    users: User[];
}

// Color palette for pie chart slices
const COLORS = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#f97316', // orange
    '#6366f1', // indigo
    '#14b8a6', // teal
    '#a855f7', // violet
];

export default function EmployeeSalaryPieChart({ users }: EmployeeSalaryPieChartProps) {
    const { t } = useLanguage();

    const chartData = useMemo(() => {
        if (!users || users.length === 0) {
            console.log('EmployeeSalaryPieChart: No users provided');
            return [];
        }

        console.log('EmployeeSalaryPieChart: Processing users', users.length);
        console.log('EmployeeSalaryPieChart: Sample user data', users.slice(0, 3).map(u => ({
            name: u.name,
            salary: u.salary,
            salaryType: typeof u.salary,
        })));

        // Filter users with salary and create chart data
        // Handle undefined, null, string, number, and array types
        const employeesWithSalary = users
            .map(user => {
                // Convert salary to number, handling all edge cases
                let salaryValue = 0;
                if (user.salary !== undefined && user.salary !== null) {
                    if (typeof user.salary === 'string') {
                        salaryValue = parseFloat(user.salary) || 0;
                    } else if (typeof user.salary === 'number') {
                        salaryValue = user.salary;
                    } else if (Array.isArray(user.salary)) {
                        // If salary is an array, sum all values or use the last value
                        salaryValue = user.salary.reduce((sum, val) => {
                            const numVal = typeof val === 'string' ? parseFloat(val) : (val || 0);
                            return sum + (isNaN(numVal) ? 0 : numVal);
                        }, 0);
                    }
                }
                return {
                    user,
                    salaryValue,
                };
            })
            .filter(({ salaryValue }) => salaryValue > 0) // Only include users with salary > 0
            .map(({ user, salaryValue }, index) => ({
                name: user.name,
                value: salaryValue,
                role: user.role,
                color: COLORS[index % COLORS.length],
            }))
            .sort((a, b) => b.value - a.value); // Sort by salary descending

        console.log('EmployeeSalaryPieChart: Employees with salary', employeesWithSalary.length);
        console.log('EmployeeSalaryPieChart: Chart data', employeesWithSalary);

        return employeesWithSalary;
    }, [users]);

    const totalSalary = useMemo(() => {
        return chartData.reduce((sum, item) => sum + item.value, 0);
    }, [chartData]);

    if (chartData.length === 0) {
        const totalUsers = users?.length || 0;
        const usersWithSalary = users?.filter(u => {
            let salary = 0;
            if (u.salary !== undefined && u.salary !== null) {
                if (typeof u.salary === 'string') {
                    salary = parseFloat(u.salary) || 0;
                } else if (typeof u.salary === 'number') {
                    salary = u.salary;
                } else if (Array.isArray(u.salary)) {
                    salary = u.salary.reduce((sum, val) => {
                        const numVal = typeof val === 'string' ? parseFloat(val) : (val || 0);
                        return sum + (isNaN(numVal) ? 0 : numVal);
                    }, 0);
                }
            }
            return salary > 0;
        }).length || 0;
        
        return (
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {t('chart.employee_salary_distribution') || 'Employee Salary Distribution'}
                    </h2>
                </div>
                <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <p className="text-gray-500 text-lg mb-2">{t('chart.no_data')}</p>
                    <p className="text-gray-400 text-sm text-center px-4">
                        {t('chart.no_salary_data') || 'No employees with salary data found. Please set salaries in HR dashboard.'}
                    </p>
                    {totalUsers > 0 && (
                        <p className="text-gray-400 text-xs mt-2">
                            Total users: {totalUsers} | Users with salary: {usersWithSalary}
                        </p>
                    )}
                </div>
            </div>
        );
    }

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0];
            const percentage = totalSalary > 0 ? ((data.value / totalSalary) * 100).toFixed(1) : '0';
            return (
                <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                    <p className="font-semibold text-gray-900">{data.payload.name}</p>
                    <p className="text-sm text-gray-600">{t(`role.${data.payload.role}` as any)}</p>
                    <p className="text-sm font-medium text-indigo-600">
                        {data.value.toLocaleString()} UZS
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
                    {t('chart.employee_salary_distribution') || 'Employee Salary Distribution'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                    {t('chart.total_salary')}: <span className="font-semibold text-indigo-600">{totalSalary.toLocaleString()} UZS</span>
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
                            const percentage = totalSalary > 0 ? ((data.value / totalSalary) * 100).toFixed(1) : '0';
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
                            {((item.value / totalSalary) * 100).toFixed(1)}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}


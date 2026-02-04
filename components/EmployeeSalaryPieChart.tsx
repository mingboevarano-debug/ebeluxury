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

type ChartItem = {
  name: string;
  value: number;
  role?: string;
  color: string;
};

function toSalaryNumber(salary: any): number {
  let salaryValue = 0;

  if (salary !== undefined && salary !== null) {
    if (typeof salary === 'string') {
      salaryValue = parseFloat(salary) || 0;
    } else if (typeof salary === 'number') {
      salaryValue = salary;
    } else if (Array.isArray(salary)) {
      salaryValue = salary.reduce((sum, val) => {
        const numVal = typeof val === 'string' ? parseFloat(val) : (val || 0);
        return sum + (Number.isFinite(numVal) ? numVal : 0);
      }, 0);
    }
  }

  return Number.isFinite(salaryValue) ? salaryValue : 0;
}

export default function EmployeeSalaryPieChart({ users }: EmployeeSalaryPieChartProps) {
  const { t } = useLanguage();

  // Escape hatch for strict typed i18n keys (prevents build failure on missing keys)
  const tt = (key: string, fallback?: string) => {
    const value = (t as unknown as (k: string) => string)(key);
    if (typeof value === 'string' && value.trim().length > 0) return value;
    return fallback ?? key;
  };

  const chartData = useMemo<ChartItem[]>(() => {
    if (!users || users.length === 0) return [];

    const employeesWithSalary = users
      .map((user) => {
        const salaryValue = toSalaryNumber((user as any).salary);
        return { user, salaryValue };
      })
      .filter(({ salaryValue }) => salaryValue > 0)
      .map(({ user, salaryValue }, index) => ({
        name: user.name,
        value: salaryValue,
        role: (user as any).role,
        color: COLORS[index % COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);

    return employeesWithSalary;
  }, [users]);

  const totalSalary = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.value, 0);
  }, [chartData]);

  if (chartData.length === 0) {
    const totalUsers = users?.length || 0;
    const usersWithSalary =
      users?.filter((u) => toSalaryNumber((u as any).salary) > 0).length || 0;

    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {tt('chart.employee_salary_distribution', 'Employee Salary Distribution')}
          </h2>
        </div>

        <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500 text-lg mb-2">{tt('chart.no_data', 'No data')}</p>
          <p className="text-gray-400 text-sm text-center px-4">
            {tt(
              'chart.no_salary_data',
              'No employees with salary data found. Please set salaries in HR dashboard.'
            )}
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
      const percentage =
        totalSalary > 0 ? ((Number(data.value) / totalSalary) * 100).toFixed(1) : '0';

      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900">{data.payload.name}</p>
          <p className="text-sm text-gray-600">
            {tt(`role.${data.payload.role}`, String(data.payload.role ?? ''))}
          </p>
          <p className="text-sm font-medium text-indigo-600">
            {Number(data.value).toLocaleString()} UZS
          </p>
          <p className="text-xs text-gray-500">
            {percentage}% {tt('chart.of_total', 'of total')}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
    if (percent < 0.05) return null;

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
        {typeof name === 'string' && name.length > 10 ? name.substring(0, 10) + '...' : name}
      </text>
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          {tt('chart.employee_salary_distribution', 'Employee Salary Distribution')}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {tt('chart.total_salary', 'Total salary')}:&nbsp;
          <span className="font-semibold text-indigo-600">{totalSalary.toLocaleString()} UZS</span>
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
            formatter={(value: any) => {
              const name = String(value);
              const data = chartData.find((d) => d.name === name);
              if (!data) return name;

              const percentage =
                totalSalary > 0 ? ((data.value / totalSalary) * 100).toFixed(1) : '0';

              return `${name} (${percentage}%)`;
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
        {chartData.slice(0, 6).map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-gray-700 truncate">{item.name}</span>
            <span className="text-gray-500 font-medium">
              {totalSalary > 0 ? ((item.value / totalSalary) * 100).toFixed(1) : '0.0'}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';

import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Profit, Expense } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { FaArrowUp, FaArrowDown, FaChartPie, FaChartBar } from 'react-icons/fa';

interface FinanceStatisticsProps {
  profits: Profit[];
  expenses: Expense[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

export default function FinanceStatistics({ profits, expenses }: FinanceStatisticsProps) {
  const { t } = useLanguage();

  // Escape hatch for strict typed i18n keys (prevents build failures)
  const tt = (key: string, fallback?: string) => {
    const value = (t as unknown as (k: string) => string)(key);
    if (typeof value === 'string' && value.trim().length > 0) return value;
    return fallback ?? key;
  };

  const stats = useMemo(() => {
    // Group Profits by Category
    const profitByCategory: Record<string, number> = {};
    profits.forEach((p) => {
      const name = p.categoryName || tt('finance.uncategorized', 'Uncategorized');
      profitByCategory[name] = (profitByCategory[name] || 0) + (p.amount || 0);
    });

    // Group Expenses by Category
    const expenseByCategory: Record<string, number> = {};
    expenses.forEach((e) => {
      const name = e.categoryName || tt('finance.uncategorized', 'Uncategorized');
      expenseByCategory[name] = (expenseByCategory[name] || 0) + (e.amount || 0);
    });

    // Find Max
    let maxProfitCategory = '';
    let maxProfitAmount = 0;
    Object.entries(profitByCategory).forEach(([cat, amount]) => {
      if (amount > maxProfitAmount) {
        maxProfitAmount = amount;
        maxProfitCategory = cat;
      }
    });

    let maxExpenseCategory = '';
    let maxExpenseAmount = 0;
    Object.entries(expenseByCategory).forEach(([cat, amount]) => {
      if (amount > maxExpenseAmount) {
        maxExpenseAmount = amount;
        maxExpenseCategory = cat;
      }
    });

    // Group by Month for Combined Chart
    const monthlyStats: Record<string, { profit: number; expense: number; date: Date }> = {};

    profits.forEach((p) => {
      const date = new Date(p.createdAt as any);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (!monthlyStats[key]) {
        monthlyStats[key] = { profit: 0, expense: 0, date };
      }
      monthlyStats[key].profit += p.amount || 0;
    });

    expenses.forEach((e) => {
      const date = new Date(e.createdAt as any);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (!monthlyStats[key]) {
        monthlyStats[key] = { profit: 0, expense: 0, date };
      }
      monthlyStats[key].expense += e.amount || 0;
    });

    const monthlyChartData = Object.values(monthlyStats)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map((item) => ({
        name: item.date.toLocaleDateString('default', { month: 'short', year: 'numeric' }),
        profit: item.profit,
        expense: item.expense
      }))
      .slice(-6);

    // Chart Data
    const profitChartData = Object.entries(profitByCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const expenseChartData = Object.entries(expenseByCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Calculate Totals
    const totalProfit = profits.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalExpense = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    return {
      maxProfitCategory,
      maxProfitAmount,
      maxExpenseCategory,
      maxExpenseAmount,
      profitChartData,
      expenseChartData,
      monthlyChartData,
      totalProfit,
      totalExpense
    };
  }, [profits, expenses]);

  const formatCurrency = (val: number) => {
    return `${Number(val || 0).toLocaleString()} UZS`;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Profit Source */}
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                {tt('finance.profit', 'Profit')}
              </p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.maxProfitCategory || '-'}</h3>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <FaArrowUp className="text-green-600 text-xl" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-green-600">{formatCurrency(stats.maxProfitAmount)}</p>
            <p className="text-sm text-gray-500 mt-1">{tt('finance.total', 'Total')}</p>
          </div>
        </div>

        {/* Top Expense Source */}
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                {tt('finance.expense', 'Expense')}
              </p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.maxExpenseCategory || '-'}</h3>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <FaArrowDown className="text-red-600 text-xl" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-red-600">{formatCurrency(stats.maxExpenseAmount)}</p>
            <p className="text-sm text-gray-500 mt-1">{tt('finance.total', 'Total')}</p>
          </div>
        </div>
      </div>

      {/* Combined Overview Chart (Pie) */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="flex items-center space-x-2 mb-6 border-b pb-4">
          <FaChartPie className="text-blue-600" />
          <h3 className="text-lg font-bold text-gray-800">
            {tt('finance.stats.financial_overview', 'Financial Overview')}
          </h3>
        </div>

        <div className="h-80 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={[
                  { name: tt('finance.tab.profit', 'Profit'), value: stats.totalProfit },
                  { name: tt('finance.tab.expense', 'Expense'), value: stats.totalExpense }
                ]}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                <Cell fill="#10B981" />
                <Cell fill="#EF4444" />
              </Pie>

              <Tooltip
                formatter={(value: any) => formatCurrency(Number(value))}
                contentStyle={{
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend layout="vertical" align="right" verticalAlign="middle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Breakdown Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profit Chart */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center space-x-2 mb-6 border-b pb-4">
            <FaChartBar className="text-green-600" />
            <h3 className="text-lg font-bold text-gray-800">{tt('finance.tab.profit', 'Profit')}</h3>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.profitChartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: any) => formatCurrency(Number(value))}
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="value" fill="#10B981" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Chart */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center space-x-2 mb-6 border-b pb-4">
            <FaChartPie className="text-red-600" />
            <h3 className="text-lg font-bold text-gray-800">{tt('finance.tab.expense', 'Expense')}</h3>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.expenseChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.expenseChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>

                <Tooltip
                  formatter={(value: any) => formatCurrency(Number(value))}
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend layout="vertical" align="right" verticalAlign="middle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

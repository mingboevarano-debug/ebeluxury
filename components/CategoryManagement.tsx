'use client';

import React, { useState, useMemo } from 'react';
import { FaEdit, FaTrash, FaPlus, FaChartLine, FaDollarSign, FaTag } from 'react-icons/fa';
import { FinanceCategory, Profit, Expense } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatNumberWithSpaces } from '@/lib/formatNumber';

interface CategoryManagementProps {
  categories: FinanceCategory[];
  type: 'profit' | 'expense';
  profits?: Profit[];
  expenses?: Expense[];
  onAdd: () => void;
  onEdit: (category: FinanceCategory) => void;
  onDelete: (id: string) => void;
}

const CATEGORY_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16', // Lime
  '#6366F1', // Indigo
];

const CATEGORY_ICONS = [
  'FaDollarSign',
  'FaChartLine',
  'FaTag',
  'FaShoppingCart',
  'FaHome',
  'FaCar',
  'FaUtensils',
  'FaBriefcase',
  'FaGift',
  'FaHeart',
];

export default function CategoryManagement({
  categories,
  type,
  profits = [],
  expenses = [],
  onAdd,
  onEdit,
  onDelete
}: CategoryManagementProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'usage' | 'amount'>('name');

  // Calculate statistics for each category
  const categoriesWithStats = useMemo(() => {
    return categories.map(category => {
      const transactions = type === 'profit' 
        ? (profits || []).filter(p => p.categoryId === category.id)
        : (expenses || []).filter(e => e.categoryId === category.id);
      
      const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
      const usageCount = transactions.length;
      
      return {
        ...category,
        usageCount,
        totalAmount,
        lastUsed: transactions.length > 0 
          ? new Date(Math.max(...transactions.map(t => t.createdAt.getTime())))
          : null
      };
    });
  }, [categories, profits, expenses, type]);

  // Filter and sort categories
  const filteredAndSorted = useMemo(() => {
    let filtered = categoriesWithStats.filter(cat => {
      if (!cat.isActive && cat.isActive !== undefined) return false;
      const query = searchQuery.toLowerCase();
      return cat.name.toLowerCase().includes(query) ||
             (cat.description && cat.description.toLowerCase().includes(query));
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'usage':
          return b.usageCount - a.usageCount;
        case 'amount':
          return b.totalAmount - a.totalAmount;
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return filtered;
  }, [categoriesWithStats, searchQuery, sortBy]);

  const totalCategories = categoriesWithStats.length;
  const activeCategories = categoriesWithStats.filter(c => c.isActive !== false).length;
  const totalUsage = categoriesWithStats.reduce((sum, c) => sum + c.usageCount, 0);
  const totalAmount = categoriesWithStats.reduce((sum, c) => sum + c.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className={`bg-gradient-to-r ${type === 'profit' ? 'from-indigo-600 to-purple-600' : 'from-red-600 to-pink-600'} rounded-xl p-6 text-white shadow-lg`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">
              {type === 'profit' ? t('finance.profit_categories') : t('finance.expense_categories')}
            </h2>
            <p className={`${type === 'profit' ? 'text-indigo-100' : 'text-red-100'} mt-1`}>
              {t('finance.category_management_subtitle')}
            </p>
          </div>
          <button
            onClick={onAdd}
            className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg"
          >
            <FaPlus className="w-4 h-4" />
            <span>{t('finance.add_category')}</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="text-white/80 text-sm font-medium">{t('finance.total_categories')}</div>
            <div className="text-3xl font-bold mt-1">{totalCategories}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="text-white/80 text-sm font-medium">{t('finance.active_categories')}</div>
            <div className="text-3xl font-bold mt-1">{activeCategories}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="text-white/80 text-sm font-medium">{t('finance.total_transactions')}</div>
            <div className="text-3xl font-bold mt-1">{totalUsage}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="text-white/80 text-sm font-medium">{t('finance.total_amount')}</div>
            <div className="text-3xl font-bold mt-1">{formatNumberWithSpaces(totalAmount)}</div>
            <div className="text-white/60 text-xs mt-1">UZS</div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder={t('finance.search_categories')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
            />
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
              {t('finance.sort_by')}:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'usage' | 'amount')}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
            >
              <option value="name">{t('finance.sort_name')}</option>
              <option value="usage">{t('finance.sort_usage')}</option>
              <option value="amount">{t('finance.sort_amount')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      {filteredAndSorted.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FaTag className="mx-auto text-gray-300 text-6xl mb-4" />
          <p className="text-gray-500 text-lg">{t('finance.no_categories_found')}</p>
          <button
            onClick={onAdd}
            className="mt-4 inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <FaPlus className="w-4 h-4" />
            <span>{t('finance.add_first_category')}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSorted.map((category) => {
            const color = category.color || CATEGORY_COLORS[0];
            const usagePercentage = totalUsage > 0 ? (category.usageCount / totalUsage) * 100 : 0;
            
            return (
              <div
                key={category.id}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden border-2 border-gray-100 hover:border-indigo-200"
              >
                {/* Category Header */}
                <div
                  className="h-20 relative"
                  style={{ backgroundColor: color }}
                >
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="absolute top-3 right-3 flex space-x-2">
                    <button
                      onClick={() => onEdit(category)}
                      className="bg-white/90 hover:bg-white text-gray-700 p-2 rounded-lg shadow-md transition-all"
                      title={t('finance.edit')}
                    >
                      <FaEdit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(category.id)}
                      className="bg-white/90 hover:bg-white text-red-600 p-2 rounded-lg shadow-md transition-all"
                      title={t('finance.delete')}
                    >
                      <FaTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Category Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{category.name}</h3>
                      {category.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{category.description}</p>
                      )}
                    </div>
                    {category.icon && (
                      <div className="ml-3">
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl"
                          style={{ backgroundColor: color }}
                        >
                          <FaTag />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Statistics */}
                  <div className="space-y-3 mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <FaChartLine className="w-4 h-4" />
                        <span className="text-sm font-medium">{t('finance.usage_count')}</span>
                      </div>
                      <span className="text-lg font-bold text-gray-900">{category.usageCount}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <FaDollarSign className="w-4 h-4" />
                        <span className="text-sm font-medium">{t('finance.total_amount')}</span>
                      </div>
                      <span className={`text-lg font-bold ${type === 'profit' ? 'text-green-600' : 'text-red-600'}`}>
                        {formatNumberWithSpaces(category.totalAmount)} UZS
                      </span>
                    </div>

                    {/* Usage Bar */}
                    {totalUsage > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-500">{t('finance.usage_percentage')}</span>
                          <span className="text-xs font-semibold text-gray-700">{usagePercentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${usagePercentage}%`,
                              backgroundColor: color
                            }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Budget Indicator */}
                    {category.budget && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">{t('finance.budget_limit')}</span>
                          <span className="text-xs font-semibold text-gray-700">
                            {formatNumberWithSpaces(category.budget)} UZS
                          </span>
                        </div>
                        {type === 'expense' && category.budget > 0 && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-500">{t('finance.budget_used')}</span>
                              <span className={`text-xs font-semibold ${
                                (category.totalAmount / category.budget) > 1 ? 'text-red-600' : 'text-green-600'
                              }`}>
                                {((category.totalAmount / category.budget) * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  (category.totalAmount / category.budget) > 1 ? 'bg-red-500' : 'bg-green-500'
                                }`}
                                style={{
                                  width: `${Math.min((category.totalAmount / category.budget) * 100, 100)}%`
                                }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Last Used */}
                    {category.lastUsed && (
                      <div className="mt-2 text-xs text-gray-500">
                        {t('finance.last_used')}: {category.lastUsed.toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


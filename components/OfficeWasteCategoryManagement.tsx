'use client';

import React, { useState, useMemo } from 'react';
import { FaEdit, FaTrash, FaPlus, FaSearch, FaTag, FaBuilding, FaChartBar } from 'react-icons/fa';
import { OfficeWasteCategory, OfficeWaste } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatNumberWithSpaces } from '@/lib/formatNumber';

interface OfficeWasteCategoryManagementProps {
  categories: OfficeWasteCategory[];
  officeWaste: OfficeWaste[];
  onAdd: () => void;
  onEdit: (category: OfficeWasteCategory) => void;
  onDelete: (id: string) => void;
}

const CATEGORY_COLORS = [
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#10B981', // Green
  '#3B82F6', // Blue
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16', // Lime
  '#6366F1', // Indigo
];

export default function OfficeWasteCategoryManagement({
  categories,
  officeWaste,
  onAdd,
  onEdit,
  onDelete,
}: OfficeWasteCategoryManagementProps) {
  const { t, locale } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'usage' | 'amount' | 'order'>('order');

  const getCategoryName = (category: OfficeWasteCategory) => {
    if (locale === 'ru') return category.nameRu;
    if (locale === 'uz') return category.nameUz;
    return category.name;
  };

  // Calculate statistics for each category
  const categoriesWithStats = useMemo(() => {
    return categories.map(category => {
      const wasteInCategory = officeWaste.filter(w => w.category === category.name);
      const totalAmount = wasteInCategory.reduce((sum, w) => sum + w.amount, 0);
      const usageCount = wasteInCategory.length;
      const totalWaste = officeWaste.length;
      const usagePercentage = totalWaste > 0 ? (usageCount / totalWaste) * 100 : 0;
      const lastUsed = wasteInCategory.length > 0
        ? new Date(Math.max(...wasteInCategory.map(w => new Date(w.date).getTime())))
        : null;

      return {
        ...category,
        usageCount,
        totalAmount,
        usagePercentage,
        lastUsed,
      };
    });
  }, [categories, officeWaste, locale]);

  // Filter and sort categories
  const filteredCategories = useMemo(() => {
    let filtered = categoriesWithStats;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(cat => {
        const name = getCategoryName(cat).toLowerCase();
        return name.includes(query);
      });
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return getCategoryName(a).localeCompare(getCategoryName(b));
        case 'usage':
          return b.usageCount - a.usageCount;
        case 'amount':
          return b.totalAmount - a.totalAmount;
        case 'order':
        default:
          return a.order - b.order;
      }
    });

    return filtered;
  }, [categoriesWithStats, searchQuery, sortBy, locale]);

  const totalCategories = categories.length;
  const activeCategories = categories.filter(c => c.isActive).length;
  const totalUsage = categoriesWithStats.reduce((sum, c) => sum + c.usageCount, 0);
  const totalAmount = categoriesWithStats.reduce((sum, c) => sum + c.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">{t('finance.office_waste.category_management')}</h2>
            <p className="text-red-100 mt-1">{t('finance.office_waste.category_management_subtitle')}</p>
          </div>
          <button
            onClick={onAdd}
            className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg"
          >
            <FaPlus className="w-4 h-4" />
            <span>{t('finance.office_waste.add_category')}</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white/70 text-xs font-medium uppercase tracking-wide">{t('finance.office_waste.total_categories')}</div>
                <div className="text-3xl font-bold mt-2">{totalCategories}</div>
              </div>
              <FaTag className="w-8 h-8 text-white/30" />
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white/70 text-xs font-medium uppercase tracking-wide">{t('finance.office_waste.active_categories')}</div>
                <div className="text-3xl font-bold mt-2">{activeCategories}</div>
              </div>
              <FaBuilding className="w-8 h-8 text-white/30" />
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white/70 text-xs font-medium uppercase tracking-wide">{t('finance.office_waste.total_usage')}</div>
                <div className="text-3xl font-bold mt-2">{totalUsage}</div>
              </div>
              <FaChartBar className="w-8 h-8 text-white/30" />
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white/70 text-xs font-medium uppercase tracking-wide">{t('finance.office_waste.total_amount')}</div>
                <div className="text-2xl font-bold mt-2">{formatNumberWithSpaces(totalAmount.toString())}</div>
                <div className="text-white/60 text-xs mt-1">UZS</div>
              </div>
              <FaChartBar className="w-8 h-8 text-white/30" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Sort */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('finance.office_waste.search_categories')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
            />
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
              {t('finance.sort_by')}:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none"
            >
              <option value="order">{t('finance.office_waste.sort_order')}</option>
              <option value="name">{t('finance.sort_name')}</option>
              <option value="usage">{t('finance.sort_usage')}</option>
              <option value="amount">{t('finance.sort_amount')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      {filteredCategories.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FaTag className="mx-auto text-gray-300 text-6xl mb-4" />
          <p className="text-gray-500 text-lg">{t('finance.office_waste.no_categories')}</p>
          <button
            onClick={onAdd}
            className="mt-4 inline-flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <FaPlus className="w-4 h-4" />
            <span>{t('finance.office_waste.add_first_category')}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => (
            <div
              key={category.id}
              className={`bg-white rounded-lg shadow-lg overflow-hidden border-2 transition-all hover:shadow-xl ${
                category.isActive ? 'border-gray-200' : 'border-gray-300 opacity-60'
              }`}
            >
              {/* Category Header */}
              <div
                className="px-6 py-4 text-white"
                style={{ backgroundColor: category.color }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <FaTag className="text-xl" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{getCategoryName(category)}</h3>
                      {!category.isActive && (
                        <span className="text-xs bg-white/20 px-2 py-1 rounded mt-1 inline-block">
                          {t('finance.office_waste.inactive')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Category Content */}
              <div className="p-6">
                {category.description && (
                  <p className="text-gray-600 text-sm mb-4">{category.description}</p>
                )}

                {/* Statistics */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">{t('finance.usage_count')}:</span>
                    <span className="font-semibold text-gray-900">{category.usageCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">{t('finance.usage_percentage')}:</span>
                    <span className="font-semibold text-gray-900">{category.usagePercentage.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">{t('finance.office_waste.total_amount')}:</span>
                    <span className="font-semibold text-red-600">
                      {formatNumberWithSpaces(category.totalAmount.toString())} UZS
                    </span>
                  </div>
                  {category.lastUsed && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 text-sm">{t('finance.last_used')}:</span>
                      <span className="text-gray-500 text-xs">
                        {new Date(category.lastUsed).toLocaleDateString(locale === 'ru' ? 'ru-RU' : locale === 'uz' ? 'uz-UZ' : 'en-US')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end space-x-2">
                  <button
                    onClick={() => onEdit(category)}
                    className="text-indigo-600 hover:text-indigo-900 px-3 py-2 rounded-lg hover:bg-indigo-50 transition-colors"
                    title={t('finance.edit')}
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => onDelete(category.id)}
                    className="text-red-600 hover:text-red-900 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
                    title={t('finance.delete')}
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


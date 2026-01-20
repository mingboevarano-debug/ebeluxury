'use client';

import React, { useState, useMemo } from 'react';
import { FaEdit, FaTrash, FaPlus, FaSearch, FaBuilding, FaDollarSign, FaCalendarAlt, FaTag } from 'react-icons/fa';
import { OfficeWaste, OfficeWasteCategory } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatNumberWithSpaces } from '@/lib/formatNumber';

interface OfficeWasteManagementProps {
  officeWaste?: OfficeWaste[];
  categories?: OfficeWasteCategory[];
  onAdd: () => void;
  onEdit: (waste: OfficeWaste) => void;
  onDelete: (id: string) => void;
}

export default function OfficeWasteManagement({
  officeWaste = [],
  categories = [],
  onAdd,
  onEdit,
  onDelete,
}: OfficeWasteManagementProps) {
  const { t, locale } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Get active categories only
  const activeCategories = categories.filter(c => c.isActive);

  const getCategoryName = (categoryName: string) => {
    const category = categories.find(c => c.name === categoryName);
    if (!category) return categoryName;
    if (locale === 'ru') return category.nameRu;
    if (locale === 'uz') return category.nameUz;
    return category.name;
  };

  const getCategoryById = (categoryName: string) => {
    return categories.find(c => c.name === categoryName);
  };

  // Calculate statistics
  const totalWaste = officeWaste.length;
  const totalAmount = officeWaste.reduce((sum, w) => sum + w.amount, 0);
  const categoriesCount = new Set(officeWaste.map(w => w.category)).size;
  const thisMonthWaste = officeWaste.filter(w => {
    const wasteDate = new Date(w.date);
    const now = new Date();
    return wasteDate.getMonth() === now.getMonth() && wasteDate.getFullYear() === now.getFullYear();
  }).reduce((sum, w) => sum + w.amount, 0);

  // Filter waste
  const filteredWaste = useMemo(() => {
    let filtered = officeWaste;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(waste =>
        waste.title.toLowerCase().includes(query) ||
        waste.description?.toLowerCase().includes(query) ||
        waste.vendor?.toLowerCase().includes(query) ||
        waste.category.toLowerCase().includes(query)
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(waste => waste.category === selectedCategory);
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [officeWaste, searchQuery, selectedCategory]);

  // Group by category
  const wasteByCategory = useMemo(() => {
    const grouped: Record<string, OfficeWaste[]> = {};
    filteredWaste.forEach(waste => {
      if (!grouped[waste.category]) {
        grouped[waste.category] = [];
      }
      grouped[waste.category].push(waste);
    });
    return grouped;
  }, [filteredWaste]);

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">{t('finance.office_waste.title')}</h2>
            <p className="text-red-100 mt-1">{t('finance.office_waste.subtitle')}</p>
          </div>
          <button
            onClick={onAdd}
            className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg"
          >
            <FaPlus className="w-4 h-4" />
            <span>{t('finance.office_waste.add')}</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white/70 text-xs font-medium uppercase tracking-wide">{t('finance.office_waste.total_records')}</div>
                <div className="text-3xl font-bold mt-2">{totalWaste}</div>
              </div>
              <FaBuilding className="w-8 h-8 text-white/30" />
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white/70 text-xs font-medium uppercase tracking-wide">{t('finance.office_waste.total_amount')}</div>
                <div className="text-2xl font-bold mt-2">{formatNumberWithSpaces(totalAmount)}</div>
                <div className="text-white/60 text-xs mt-1">UZS</div>
              </div>
              <FaDollarSign className="w-8 h-8 text-white/30" />
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white/70 text-xs font-medium uppercase tracking-wide">{t('finance.office_waste.categories')}</div>
                <div className="text-3xl font-bold mt-2">{categoriesCount}</div>
              </div>
              <FaTag className="w-8 h-8 text-white/30" />
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white/70 text-xs font-medium uppercase tracking-wide">{t('finance.office_waste.this_month')}</div>
                <div className="text-2xl font-bold mt-2">{formatNumberWithSpaces(thisMonthWaste)}</div>
                <div className="text-white/60 text-xs mt-1">UZS</div>
              </div>
              <FaCalendarAlt className="w-8 h-8 text-white/30" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('finance.office_waste.search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
            />
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
              {t('finance.office_waste.filter_category')}:
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none"
            >
              <option value="">{t('finance.office_waste.all_categories')}</option>
              {activeCategories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {getCategoryName(cat.name)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Office Waste List */}
      {filteredWaste.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FaBuilding className="mx-auto text-gray-300 text-6xl mb-4" />
          <p className="text-gray-500 text-lg">{t('finance.office_waste.no_records')}</p>
          <button
            onClick={onAdd}
            className="mt-4 inline-flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <FaPlus className="w-4 h-4" />
            <span>{t('finance.office_waste.add_first')}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(wasteByCategory).map(([category, wastes]) => (
            <div key={category} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-red-50 to-orange-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">{getCategoryName(category)}</h3>
                  <div className="flex items-center space-x-4">
                    <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      {wastes.length} {t('finance.office_waste.items')}
                    </span>
                    <span className="text-gray-600 font-semibold">
                      {formatNumberWithSpaces(wastes.reduce((sum, w) => sum + w.amount, 0))} UZS
                    </span>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('finance.office_waste.date')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('finance.office_waste.title')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('finance.office_waste.vendor')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('finance.office_waste.amount')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('finance.office_waste.payment_method')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('finance.table.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {wastes.map((waste) => (
                      <tr key={waste.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(waste.date).toLocaleDateString(locale === 'ru' ? 'ru-RU' : locale === 'uz' ? 'uz-UZ' : 'en-US')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="font-medium">{waste.title}</div>
                          {waste.description && (
                            <div className="text-gray-500 text-xs mt-1">{waste.description}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {waste.vendor || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                          {formatNumberWithSpaces(waste.amount)} UZS
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                          {waste.paymentMethod === 'cash' ? t('finance.payment_method.cash') : t('finance.payment_method.card')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => onEdit(waste)}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                            title={t('finance.edit')}
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => onDelete(waste.id)}
                            className="text-red-600 hover:text-red-900"
                            title={t('finance.delete')}
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


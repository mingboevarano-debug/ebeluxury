'use client';

import React, { useState, useEffect } from 'react';
import { FaTimes, FaPalette, FaTag, FaDollarSign, FaInfoCircle } from 'react-icons/fa';
import { FinanceCategory } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatNumberWithSpaces, parseFormattedNumber } from '@/lib/formatNumber';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  editingCategory: FinanceCategory | null;
  categoryForm: {
    name: string;
    type: 'profit' | 'expense';
    description: string;
    color: string;
    icon: string;
    budget: string;
    isActive: boolean;
  };
  setCategoryForm: React.Dispatch<React.SetStateAction<{
    name: string;
    type: 'profit' | 'expense';
    description: string;
    color: string;
    icon: string;
    budget: string;
    isActive: boolean;
  }>>;
  submitting: boolean;
}

const CATEGORY_COLORS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Lime', value: '#84CC16' },
  { name: 'Indigo', value: '#6366F1' },
];

const CATEGORY_ICONS = [
  { name: 'Dollar', icon: 'FaDollarSign' },
  { name: 'Chart', icon: 'FaChartLine' },
  { name: 'Tag', icon: 'FaTag' },
  { name: 'Cart', icon: 'FaShoppingCart' },
  { name: 'Home', icon: 'FaHome' },
  { name: 'Car', icon: 'FaCar' },
];

export default function CategoryModal({
  isOpen,
  onClose,
  onSubmit,
  editingCategory,
  categoryForm,
  setCategoryForm,
  submitting
}: CategoryModalProps) {
  const { t } = useLanguage();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <FaTag className="text-white text-xl" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">
                {editingCategory ? t('finance.edit_category') : t('finance.add_category')}
              </h3>
              <p className="text-indigo-100 text-sm mt-0.5">
                {editingCategory ? t('finance.update_category_info') : t('finance.create_category_info')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all duration-200"
            aria-label="Close modal"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={onSubmit} className="p-6 max-w-4xl mx-auto">
        <div className="space-y-6">
          {/* Type Selection */}
          <div className="group">
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
              <FaTag className="text-indigo-600" />
              <span>{t('finance.category_type')} <span className="text-red-500">*</span></span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCategoryForm({ ...categoryForm, type: 'profit' })}
                className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-xl border-2 transition-all duration-200 ${categoryForm.type === 'profit'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
              >
                <span className="font-medium">{t('finance.tab.profit')}</span>
              </button>
              <button
                type="button"
                onClick={() => setCategoryForm({ ...categoryForm, type: 'expense' })}
                className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-xl border-2 transition-all duration-200 ${categoryForm.type === 'expense'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
              >
                <span className="font-medium">{t('finance.tab.expense')}</span>
              </button>
            </div>
          </div>

          {/* Category Name */}
          <div className="group">
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
              <FaTag className="text-indigo-600" />
              <span>{t('form.name')} <span className="text-red-500">*</span></span>
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 outline-none bg-white hover:border-gray-300"
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              placeholder={t('finance.category_name_placeholder')}
            />
          </div>

          {/* Description */}
          <div className="group">
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
              <FaInfoCircle className="text-indigo-600" />
              <span>{t('finance.description')} ({t('finance.optional')})</span>
            </label>
            <textarea
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 outline-none bg-white hover:border-gray-300 resize-none"
              value={categoryForm.description || ''}
              onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              placeholder={t('finance.description_placeholder')}
            />
          </div>

          {/* Color Selection */}
          <div className="group">
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
              <FaPalette className="text-indigo-600" />
              <span>{t('finance.color')} ({t('finance.optional')})</span>
            </label>
            <div className="grid grid-cols-5 gap-3">
              {CATEGORY_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setCategoryForm({ ...categoryForm, color: color.value })}
                  className={`h-12 rounded-lg border-2 transition-all duration-200 ${categoryForm.color === color.value
                      ? 'border-indigo-500 ring-2 ring-indigo-500/50 scale-110'
                      : 'border-gray-200 hover:border-gray-300'
                    }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
            {categoryForm.color && (
              <div className="mt-2 flex items-center space-x-2">
                <div
                  className="w-6 h-6 rounded border border-gray-300"
                  style={{ backgroundColor: categoryForm.color }}
                />
                <span className="text-sm text-gray-600">{categoryForm.color}</span>
              </div>
            )}
          </div>

          {/* Budget (for expenses) */}
          {categoryForm.type === 'expense' && (
            <div className="group">
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                <FaDollarSign className="text-indigo-600" />
                <span>{t('finance.budget_limit')} ({t('finance.optional')})</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 outline-none bg-white hover:border-gray-300"
                  value={categoryForm.budget || ''}
                  onChange={(e) => {
                    const parsed = parseFormattedNumber(e.target.value);
                    setCategoryForm({ ...categoryForm, budget: formatNumberWithSpaces(parsed) });
                  }}
                  placeholder="0"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <span className="font-medium">UZS</span>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">{t('finance.budget_hint')}</p>
            </div>
          )}

          {/* Active Status */}
          <div className="group">
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
              <span>{t('finance.status')}</span>
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={categoryForm.isActive !== false}
                  onChange={(e) => setCategoryForm({ ...categoryForm, isActive: e.target.checked })}
                  className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">
                  {categoryForm.isActive !== false ? t('finance.active') : t('finance.inactive')}
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end space-x-3 mt-8 pt-6 border-t border-gray-200 pb-6">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('finance.cancel')}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {submitting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{t('finance.saving')}</span>
              </>
            ) : (
              <>
                <FaTag />
                <span>{editingCategory ? t('finance.update') : t('finance.add')}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}


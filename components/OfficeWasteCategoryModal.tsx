'use client';

import React, { useEffect } from 'react';
import { FaTimes, FaTag, FaPalette, FaSortNumericDown } from 'react-icons/fa';
import { OfficeWasteCategory } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface OfficeWasteCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  editingCategory: OfficeWasteCategory | null;
  categoryForm: {
    name: string;
    nameRu: string;
    nameUz: string;
    description: string;
    color: string;
    order: string;
    isActive: boolean;
  };
  setCategoryForm: React.Dispatch<React.SetStateAction<{
    name: string;
    nameRu: string;
    nameUz: string;
    description: string;
    color: string;
    order: string;
    isActive: boolean;
  }>>;
  submitting: boolean;
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

export default function OfficeWasteCategoryModal({
  isOpen,
  onClose,
  onSubmit,
  editingCategory,
  categoryForm,
  setCategoryForm,
  submitting,
}: OfficeWasteCategoryModalProps) {
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
      <div className="sticky top-0 z-10 bg-gradient-to-r from-red-600 to-orange-600 px-6 py-5 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <FaTag className="text-white text-xl" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">
                {editingCategory ? t('finance.office_waste.edit_category') : t('finance.office_waste.add_category')}
              </h3>
              <p className="text-red-100 text-sm mt-0.5">
                {editingCategory ? t('finance.office_waste.update_category_info') : t('finance.office_waste.create_category_info')}
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
          {/* Category Names */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                <FaTag className="text-red-600" />
                <span>{t('finance.office_waste.name_en')} *</span>
              </label>
              <input
                type="text"
                required
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder={t('finance.office_waste.name_en_placeholder')}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
              />
            </div>
            <div>
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                <FaTag className="text-red-600" />
                <span>{t('finance.office_waste.name_ru')} *</span>
              </label>
              <input
                type="text"
                required
                value={categoryForm.nameRu}
                onChange={(e) => setCategoryForm({ ...categoryForm, nameRu: e.target.value })}
                placeholder={t('finance.office_waste.name_ru_placeholder')}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
              />
            </div>
            <div>
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                <FaTag className="text-red-600" />
                <span>{t('finance.office_waste.name_uz')} *</span>
              </label>
              <input
                type="text"
                required
                value={categoryForm.nameUz}
                onChange={(e) => setCategoryForm({ ...categoryForm, nameUz: e.target.value })}
                placeholder={t('finance.office_waste.name_uz_placeholder')}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
              <span>{t('finance.description')}</span>
            </label>
            <textarea
              value={categoryForm.description}
              onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              placeholder={t('finance.office_waste.description_placeholder')}
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all resize-none"
            />
          </div>

          {/* Color and Order */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                <FaPalette className="text-red-600" />
                <span>{t('finance.color')} *</span>
              </label>
              <div className="grid grid-cols-5 gap-2 mb-3">
                {CATEGORY_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setCategoryForm({ ...categoryForm, color })}
                    className={`w-full h-12 rounded-lg border-2 transition-all ${
                      categoryForm.color === color
                        ? 'border-gray-900 scale-110 shadow-lg'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <input
                type="text"
                value={categoryForm.color}
                onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                placeholder="#EF4444"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
              />
            </div>

            <div>
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                <FaSortNumericDown className="text-red-600" />
                <span>{t('finance.office_waste.order')} *</span>
              </label>
              <input
                type="number"
                required
                min="0"
                value={categoryForm.order}
                onChange={(e) => setCategoryForm({ ...categoryForm, order: e.target.value })}
                placeholder="0"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
              />
              <p className="text-gray-500 text-xs mt-1">{t('finance.office_waste.order_hint')}</p>
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="isActive"
              checked={categoryForm.isActive}
              onChange={(e) => setCategoryForm({ ...categoryForm, isActive: e.target.checked })}
              className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              {t('finance.office_waste.active_category')}
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            <span>{t('finance.profit.cancel')}</span>
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {submitting ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>{t('finance.profit.saving')}</span>
              </>
            ) : (
              <span>{editingCategory ? t('finance.office_waste.update') : t('finance.office_waste.add')}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}


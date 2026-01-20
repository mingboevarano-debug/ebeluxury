'use client';

import React, { useEffect } from 'react';
import { FaTimes, FaBuilding, FaDollarSign, FaCalendarAlt, FaTag, FaStore, FaReceipt } from 'react-icons/fa';
import { OfficeWaste, PaymentMethod } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatNumberWithSpaces, parseFormattedNumber } from '@/lib/formatNumber';

interface OfficeWasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  editingWaste: OfficeWaste | null;
  wasteForm: {
    title: string;
    description: string;
    category: string;
    amount: string;
    paymentMethod: PaymentMethod;
    vendor: string;
    receiptNumber: string;
    date: string;
  };
  setWasteForm: React.Dispatch<React.SetStateAction<{
    title: string;
    description: string;
    category: string;
    amount: string;
    paymentMethod: PaymentMethod;
    vendor: string;
    receiptNumber: string;
    date: string;
  }>>;
  submitting: boolean;
  categories: Array<{ id: string; name: string; nameRu: string; nameUz: string; isActive: boolean }>;
}

export default function OfficeWasteModal({
  isOpen,
  onClose,
  onSubmit,
  editingWaste,
  wasteForm,
  setWasteForm,
  submitting,
  categories = [],
}: OfficeWasteModalProps) {
  const { t, locale } = useLanguage();

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

  const activeCategories = categories.filter(c => c.isActive);

  const getCategoryName = (categoryName: string) => {
    const category = categories.find(c => c.name === categoryName);
    if (!category) return categoryName;
    if (locale === 'ru') return category.nameRu;
    if (locale === 'uz') return category.nameUz;
    return category.name;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s/g, '');
    if (value === '' || /^\d+$/.test(value)) {
      setWasteForm({ ...wasteForm, amount: value });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-red-600 to-orange-600 px-6 py-5 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <FaBuilding className="text-white text-xl" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">
                {editingWaste ? t('finance.office_waste.edit') : t('finance.office_waste.add_new')}
              </h3>
              <p className="text-red-100 text-sm mt-0.5">
                {editingWaste ? t('finance.office_waste.update_info') : t('finance.office_waste.record_info')}
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
          {/* Title */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
              <FaTag className="text-red-600" />
              <span>{t('finance.office_waste.title')} *</span>
            </label>
            <input
              type="text"
              required
              value={wasteForm.title}
              onChange={(e) => setWasteForm({ ...wasteForm, title: e.target.value })}
              placeholder={t('finance.office_waste.title_placeholder')}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
              <span>{t('finance.office_waste.description')}</span>
            </label>
            <textarea
              value={wasteForm.description}
              onChange={(e) => setWasteForm({ ...wasteForm, description: e.target.value })}
              placeholder={t('finance.office_waste.description_placeholder')}
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all resize-none"
            />
          </div>

          {/* Category and Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                <FaTag className="text-red-600" />
                <span>{t('finance.office_waste.category')} *</span>
              </label>
              <select
                required
                value={wasteForm.category}
                onChange={(e) => setWasteForm({ ...wasteForm, category: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
              >
                <option value="">{t('finance.office_waste.select_category')}</option>
                {activeCategories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {getCategoryName(cat.name)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                <FaCalendarAlt className="text-red-600" />
                <span>{t('finance.office_waste.date')} *</span>
              </label>
              <input
                type="date"
                required
                value={wasteForm.date}
                onChange={(e) => setWasteForm({ ...wasteForm, date: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
              />
            </div>
          </div>

          {/* Amount and Payment Method */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                <FaDollarSign className="text-red-600" />
                <span>{t('finance.office_waste.amount')} (UZS) *</span>
              </label>
              <input
                type="text"
                required
                value={formatNumberWithSpaces(wasteForm.amount)}
                onChange={handleAmountChange}
                placeholder="0"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
              />
            </div>

            <div>
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                <span>{t('finance.office_waste.payment_method')} *</span>
              </label>
              <div className="flex space-x-4 mt-2">
                <button
                  type="button"
                  onClick={() => setWasteForm({ ...wasteForm, paymentMethod: 'cash' })}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                    wasteForm.paymentMethod === 'cash'
                      ? 'bg-green-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t('finance.payment_method.cash')}
                </button>
                <button
                  type="button"
                  onClick={() => setWasteForm({ ...wasteForm, paymentMethod: 'card' })}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                    wasteForm.paymentMethod === 'card'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t('finance.payment_method.card')}
                </button>
              </div>
            </div>
          </div>

          {/* Vendor and Receipt Number */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                <FaStore className="text-red-600" />
                <span>{t('finance.office_waste.vendor')}</span>
              </label>
              <input
                type="text"
                value={wasteForm.vendor}
                onChange={(e) => setWasteForm({ ...wasteForm, vendor: e.target.value })}
                placeholder={t('finance.office_waste.vendor_placeholder')}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
              />
            </div>

            <div>
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                <FaReceipt className="text-red-600" />
                <span>{t('finance.office_waste.receipt_number')}</span>
              </label>
              <input
                type="text"
                value={wasteForm.receiptNumber}
                onChange={(e) => setWasteForm({ ...wasteForm, receiptNumber: e.target.value })}
                placeholder={t('finance.office_waste.receipt_placeholder')}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
              />
            </div>
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
              <span>{editingWaste ? t('finance.office_waste.update') : t('finance.office_waste.add')}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}


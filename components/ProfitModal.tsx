'use client';

import React, { useEffect } from 'react';
import { FaTimes, FaDollarSign, FaUser, FaCreditCard, FaMoneyBillWave, FaFolder, FaTag, FaComment } from 'react-icons/fa';
import { formatNumberWithSpaces, parseFormattedNumber } from '@/lib/formatNumber';
import { Profit, Project, FinanceCategory } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProfitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  editingProfit: Profit | null;
  profitForm: {
    projectId: string;
    categoryId: string;
    paymentMethod: 'cash' | 'card';
    amount: string;
    fromWhom: string;
    comment: string;
  };
  setProfitForm: React.Dispatch<React.SetStateAction<{
    projectId: string;
    categoryId: string;
    paymentMethod: 'cash' | 'card';
    amount: string;
    fromWhom: string;
    comment: string;
  }>>;
  projects: Project[];
  profitCategories: FinanceCategory[];
  submitting: boolean;
}

export default function ProfitModal({
  isOpen,
  onClose,
  onSubmit,
  editingProfit,
  profitForm,
  setProfitForm,
  projects,
  profitCategories,
  submitting
}: ProfitModalProps) {
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
      <div className="sticky top-0 z-10 bg-gradient-to-r from-green-600 to-green-700 px-6 py-5 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <FaDollarSign className="text-white text-xl" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">
                {editingProfit ? t('finance.profit.edit') : t('finance.profit.add_new')}
              </h3>
              <p className="text-green-100 text-sm mt-0.5">
                {editingProfit ? t('finance.profit.update_info') : t('finance.profit.record_transaction')}
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
          {/* Project Selection */}
          <div className="group">
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
              <FaFolder className="text-green-600" />
              <span>{t('finance.profit.project_optional')}</span>
            </label>
            <select
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-200 outline-none bg-white hover:border-gray-300"
              value={profitForm.projectId}
              onChange={(e) => setProfitForm({ ...profitForm, projectId: e.target.value })}
            >
              <option value="">{t('finance.profit.select_project')}</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.clientName || t('finance.profit.unknown')} - {project.location || t('finance.profit.no_location')}
                </option>
              ))}
            </select>
          </div>

          {/* Category Selection */}
          <div className="group">
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
              <FaTag className="text-green-600" />
              <span>{t('finance.profit.category')} <span className="text-red-500">*</span></span>
            </label>
            <select
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-200 outline-none bg-white hover:border-gray-300"
              value={profitForm.categoryId}
              onChange={(e) => setProfitForm({ ...profitForm, categoryId: e.target.value })}
            >
              <option value="">{t('finance.profit.select_category')}</option>
              {profitCategories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>

          {/* Payment Method */}
          <div className="group">
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
              <FaCreditCard className="text-green-600" />
              <span>{t('finance.profit.payment_method')} <span className="text-red-500">*</span></span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setProfitForm({ ...profitForm, paymentMethod: 'cash' })}
                className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-xl border-2 transition-all duration-200 ${profitForm.paymentMethod === 'cash'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
              >
                <FaMoneyBillWave className="text-lg" />
                <span className="font-medium">{t('finance.payment_method.cash')}</span>
              </button>
              <button
                type="button"
                onClick={() => setProfitForm({ ...profitForm, paymentMethod: 'card' })}
                className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-xl border-2 transition-all duration-200 ${profitForm.paymentMethod === 'card'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
              >
                <FaCreditCard className="text-lg" />
                <span className="font-medium">{t('finance.payment_method.card')}</span>
              </button>
            </div>
          </div>

          {/* Amount */}
          <div className="group">
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
              <FaDollarSign className="text-green-600" />
              <span>{t('finance.profit.amount')} <span className="text-red-500">*</span></span>
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                required
                className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-200 outline-none bg-white hover:border-gray-300 text-lg font-semibold"
                value={profitForm.amount}
                onChange={(e) => {
                  const parsed = parseFormattedNumber(e.target.value);
                  setProfitForm({ ...profitForm, amount: formatNumberWithSpaces(parsed) });
                }}
                placeholder="0"
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <span className="font-medium">UZS</span>
              </div>
            </div>
          </div>

          {/* From Whom */}
          <div className="group">
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
              <FaUser className="text-green-600" />
              <span>{t('finance.profit.from_whom')} <span className="text-red-500">*</span></span>
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-200 outline-none bg-white hover:border-gray-300"
              value={profitForm.fromWhom}
              onChange={(e) => setProfitForm({ ...profitForm, fromWhom: e.target.value })}
              placeholder={t('finance.profit.from_whom_placeholder')}
            />
          </div>

          {/* Comment */}
          <div className="group">
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
              <FaComment className="text-green-600" />
              <span>{t('finance.profit.comment_optional')}</span>
            </label>
            <textarea
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-200 outline-none bg-white hover:border-gray-300 resize-none"
              value={profitForm.comment}
              onChange={(e) => setProfitForm({ ...profitForm, comment: e.target.value })}
              placeholder={t('finance.profit.comment_placeholder')}
            />
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
            {t('finance.profit.cancel')}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {submitting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{t('finance.profit.saving')}</span>
              </>
            ) : (
              <>
                <FaDollarSign />
                <span>{editingProfit ? t('finance.profit.update') : t('finance.profit.add')}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}


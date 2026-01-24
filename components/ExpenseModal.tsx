'use client';

import React, { useEffect, useState } from 'react';
import {
  FaTimes,
  FaDollarSign,
  FaUser,
  FaCreditCard,
  FaMoneyBillWave,
  FaFolder,
  FaTag,
  FaComment,
} from 'react-icons/fa';
import { formatNumberWithSpaces, parseFormattedNumber } from '@/lib/formatNumber';
import { Expense, Project, FinanceCategory, LocalizedStage, User } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import EmployeeSelectionModal from './EmployeeSelectionModal';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  editingExpense: Expense | null;
  expenseForm: {
    projectId: string;
    categoryId: string;
    name: string;
    stage: string;
    paymentMethod: 'cash' | 'card';
    amount: string;
    toWhom: string;
    comment: string;
    selectedEmployeeIds?: string[];
  };
  setExpenseForm: React.Dispatch<
    React.SetStateAction<{
      projectId: string;
      categoryId: string;
      name: string;
      stage: string;
      paymentMethod: 'cash' | 'card';
      amount: string;
      toWhom: string;
      comment: string;
      selectedEmployeeIds?: string[];
    }>
  >;
  projects: Project[];
  stages: LocalizedStage[];
  expenseCategories: FinanceCategory[];
  users: User[];
  submitting: boolean;
  selectedEmployeeIds?: string[];
  onEmployeeSelectionChange?: (employeeIds: string[]) => void;
  disableProjectSelection?: boolean; // Disable project selection (e.g., when on contract page)
}

export default function ExpenseModal({
  isOpen,
  onClose,
  onSubmit,
  editingExpense,
  expenseForm,
  setExpenseForm,
  projects,
  stages,
  expenseCategories,
  users,
  submitting,
  selectedEmployeeIds = [],
  onEmployeeSelectionChange,
  disableProjectSelection = false,
}: ExpenseModalProps) {
  const { t, locale } = useLanguage();
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);

  // Debug: Log categories when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('ExpenseModal opened with categories:', expenseCategories.length);
      console.log('Category details:', expenseCategories);
    }
  }, [isOpen, expenseCategories]);

  // Check if selected category is salary-related (case-insensitive and flexible matching)
  const selectedCategory = expenseCategories.find(c => c.id === expenseForm.categoryId);
  const categoryNameLower = selectedCategory?.name?.toLowerCase() || '';
  const isSalaryCategory = (categoryNameLower.includes('xodimlar') || categoryNameLower.includes('xodimlarni')) && 
                           categoryNameLower.includes('maoshi');

  /**
   * FIX:
   * Your i18n `t()` is typed to accept ONLY known keys (a union type).
   * These keys are missing from that union:
   * - finance.profit.client
   * - finance.profit.location
   * - finance.profit.construction
   *
   * We keep full type-safety for everything else and bypass typing only where needed.
   */
  const tUnsafe = (key: string) => (t as unknown as (k: string) => string)(key);

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

  // Debug: Log when category changes
  useEffect(() => {
    if (expenseForm.categoryId && selectedCategory) {
      console.log('Selected category:', selectedCategory.name, 'isSalaryCategory:', isSalaryCategory);
    }
  }, [expenseForm.categoryId, selectedCategory, isSalaryCategory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-red-600 to-red-700 px-6 py-5 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <FaDollarSign className="text-white text-xl" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">
                {editingExpense ? t('finance.expense.edit') : t('finance.expense.add')}
              </h3>
              <p className="text-red-100 text-sm mt-0.5">
                {editingExpense ? t('finance.profit.update_info') : t('finance.profit.record_transaction')}
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
          {/* Project Selection - Optional */}
          {!disableProjectSelection ? (
            <div className="group">
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                <FaFolder className="text-red-600" />
                <span>{t('finance.expense.to_project')}</span>
              </label>
              <select
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all duration-200 outline-none bg-white hover:border-gray-300 appearance-none cursor-pointer"
                value={expenseForm.projectId}
                onChange={(e) => setExpenseForm({ ...expenseForm, projectId: e.target.value })}
              >
              <option value="">{t('finance.expense.select_project')}</option>
              {projects.map((project) => {
                // Format project display name properly
                const parts = [];
                if (project.constructionName) {
                  parts.push(`[${project.constructionName}]`);
                }
                if (project.clientName) {
                  parts.push(project.clientName);
                }
                if (project.location) {
                  parts.push(project.location);
                }
                const displayName = parts.length > 0 ? parts.join(' - ') : t('finance.profit.unknown');
                
                return (
                  <option key={project.id} value={project.id}>
                    {displayName}
                  </option>
                );
              })}
            </select>

            {/* Show selected project details in a clean format */}
            {expenseForm.projectId && (() => {
              const selected = projects.find((p) => p.id === expenseForm.projectId);
              if (!selected) return null;

              return (
                <div className="mt-2 p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                  <div className="text-sm text-gray-700 space-y-1">
                    {selected.clientName && (
                      <p>
                        <span className="font-semibold">{tUnsafe('finance.profit.client')}:</span>{' '}
                        {selected.clientName}
                      </p>
                    )}
                    {selected.location && (
                      <p>
                        <span className="font-semibold">{tUnsafe('finance.profit.location')}:</span>{' '}
                        {selected.location}
                      </p>
                    )}
                    {selected.constructionName && (
                      <p>
                        <span className="font-semibold">{tUnsafe('finance.profit.construction')}:</span>{' '}
                        {selected.constructionName}
                      </p>
                    )}
                  </div>
                </div>
              );
            })()}
            </div>
          ) : expenseForm.projectId && (() => {
            // Show contract info when project selection is disabled
            const selected = projects.find((p) => p.id === expenseForm.projectId);
            if (!selected) return null;

            return (
              <div className="group">
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                  <FaFolder className="text-red-600" />
                  <span>{t('finance.expense.to_project')}</span>
                </label>
                <div className="p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                  <div className="text-sm text-gray-700 space-y-1">
                    {selected.clientName && (
                      <p>
                        <span className="font-semibold">{tUnsafe('finance.profit.client')}:</span>{' '}
                        {selected.clientName}
                      </p>
                    )}
                    {selected.location && (
                      <p>
                        <span className="font-semibold">{tUnsafe('finance.profit.location')}:</span>{' '}
                        {selected.location}
                      </p>
                    )}
                    {selected.constructionName && (
                      <p>
                        <span className="font-semibold">{tUnsafe('finance.profit.construction')}:</span>{' '}
                        {selected.constructionName}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Expense Name */}
          <div className="group">
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
              <FaTag className="text-red-600" />
              <span>
                {t('finance.expense.name')} <span className="text-red-500">*</span>
              </span>
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all duration-200 outline-none bg-white hover:border-gray-300"
              value={expenseForm.name}
              onChange={(e) => setExpenseForm({ ...expenseForm, name: e.target.value })}
              placeholder={t('finance.expense.name')}
            />
          </div>

          {/* Category Selection */}
          <div className="group">
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
              <FaTag className="text-red-600" />
              <span>
                {t('finance.profit.category')} <span className="text-red-500">*</span>
              </span>
            </label>
            {expenseCategories.length === 0 ? (
              <div className="w-full px-4 py-3 border-2 border-yellow-300 rounded-xl bg-yellow-50">
                <p className="text-sm text-yellow-800">
                  {t('finance.no_categories_available') || 'No expense categories available. Please create categories first.'}
                </p>
              </div>
            ) : (
              <select
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all duration-200 outline-none bg-white hover:border-gray-300 appearance-none cursor-pointer"
                value={expenseForm.categoryId}
                onChange={(e) => setExpenseForm({ ...expenseForm, categoryId: e.target.value })}
              >
                <option value="">{t('finance.expense.select_category')}</option>
                {expenseCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Employee Selection - Only show for "Xodimlar maoshi" category */}
          {isSalaryCategory && (
            <div className="group">
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                <FaUser className="text-red-600" />
                <span>
                  {t('finance.expense.select_employees') || 'Select Employees'} <span className="text-red-500">*</span>
                </span>
              </label>
              <button
                type="button"
                onClick={() => setIsEmployeeModalOpen(true)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all duration-200 outline-none bg-white hover:border-gray-300 text-left flex items-center justify-between"
              >
                <span className={selectedEmployeeIds.length > 0 ? 'text-gray-900' : 'text-gray-500'}>
                  {selectedEmployeeIds.length > 0
                    ? `${selectedEmployeeIds.length} ${t('finance.expense.employees_selected') || 'employees selected'}`
                    : t('finance.expense.click_to_select_employees') || 'Click to select employees'}
                </span>
                <FaUser className="text-gray-400" />
              </button>
              {selectedEmployeeIds.length > 0 && (
                <div className="mt-2 p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    {t('finance.expense.selected_employees') || 'Selected Employees'}:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {users
                      .filter(u => selectedEmployeeIds.includes(u.id))
                      .map(employee => (
                        <span
                          key={employee.id}
                          className="px-3 py-1 bg-white rounded-lg border border-red-200 text-sm text-gray-700"
                        >
                          {employee.name}
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Stage Selection - Optional */}
          <div className="group">
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
              <FaFolder className="text-red-600" />
              <span>
                {t('finance.expense.stage')} <span className="text-gray-500 text-xs font-normal">({t('finance.optional') || 'Optional'})</span>
              </span>
            </label>
            <select
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all duration-200 outline-none bg-white hover:border-gray-300"
              value={expenseForm.stage}
              onChange={(e) => setExpenseForm({ ...expenseForm, stage: e.target.value })}
            >
              <option value="">{t('finance.expense.select_stage')} ({t('finance.optional') || 'Optional'})</option>
              {stages.map((stage) => (
                <option key={stage.en} value={stage.en}>
                  {locale === 'uz' ? stage.uz : locale === 'ru' ? stage.ru : stage.en}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method */}
          <div className="group">
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
              <FaCreditCard className="text-red-600" />
              <span>
                {t('finance.profit.payment_method')} <span className="text-red-500">*</span>
              </span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setExpenseForm({ ...expenseForm, paymentMethod: 'cash' })}
                className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                  expenseForm.paymentMethod === 'cash'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <FaMoneyBillWave className="text-lg" />
                <span className="font-medium">{t('finance.payment_method.cash')}</span>
              </button>

              <button
                type="button"
                onClick={() => setExpenseForm({ ...expenseForm, paymentMethod: 'card' })}
                className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                  expenseForm.paymentMethod === 'card'
                    ? 'border-red-500 bg-red-50 text-red-700'
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
              <FaDollarSign className="text-red-600" />
              <span>
                {t('finance.profit.amount')} <span className="text-red-500">*</span>
              </span>
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                required
                className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all duration-200 outline-none bg-white hover:border-gray-300 text-lg font-semibold"
                value={expenseForm.amount}
                onChange={(e) => {
                  const parsed = parseFormattedNumber(e.target.value);
                  setExpenseForm({ ...expenseForm, amount: formatNumberWithSpaces(parsed) });
                }}
                placeholder="0"
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <span className="font-medium">UZS</span>
              </div>
            </div>
          </div>

          {/* To Whom */}
          <div className="group">
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
              <FaUser className="text-red-600" />
              <span>
                {t('finance.table.to_whom')} <span className="text-red-500">*</span>
              </span>
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all duration-200 outline-none bg-white hover:border-gray-300"
              value={expenseForm.toWhom}
              onChange={(e) => setExpenseForm({ ...expenseForm, toWhom: e.target.value })}
              placeholder={t('finance.expense.to_whom_given')}
            />
          </div>

          {/* Comment */}
          <div className="group">
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
              <FaComment className="text-red-600" />
              <span>{t('finance.profit.comment_optional')}</span>
            </label>
            <textarea
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all duration-200 outline-none bg-white hover:border-gray-300 resize-none"
              value={expenseForm.comment}
              onChange={(e) => setExpenseForm({ ...expenseForm, comment: e.target.value })}
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
            className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-xl hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {submitting ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>{t('finance.profit.saving')}</span>
              </>
            ) : (
              <>
                <FaDollarSign />
                <span>{editingExpense ? t('finance.profit.update') : t('finance.expense.submit_button')}</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Employee Selection Modal */}
      <EmployeeSelectionModal
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
        onConfirm={(selectedEmployees) => {
          if (onEmployeeSelectionChange) {
            onEmployeeSelectionChange(selectedEmployees.map(e => e.id));
          }
        }}
        employees={users}
        selectedEmployeeIds={selectedEmployeeIds}
      />
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { FaTimes, FaUser, FaCheck, FaSearch } from 'react-icons/fa';
import { User } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface EmployeeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedEmployees: User[]) => void;
  employees: User[];
  selectedEmployeeIds?: string[];
}

export default function EmployeeSelectionModal({
  isOpen,
  onClose,
  onConfirm,
  employees,
  selectedEmployeeIds = [],
}: EmployeeSelectionModalProps) {
  const { t } = useLanguage();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(selectedEmployeeIds));
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set(selectedEmployeeIds));
      setSearchTerm('');
    }
  }, [isOpen, selectedEmployeeIds]);

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

  // Filter employees based on search term (exclude admin and director)
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch = 
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.role?.toLowerCase().includes(searchTerm.toLowerCase());
    const isEmployee = emp.role !== 'admin' && emp.role !== 'director';
    return matchesSearch && isEmployee;
  });

  const toggleEmployee = (employeeId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(employeeId)) {
      newSelected.delete(employeeId);
    } else {
      newSelected.add(employeeId);
    }
    setSelectedIds(newSelected);
  };

  const handleConfirm = () => {
    const selectedEmployees = employees.filter((emp) => selectedIds.has(emp.id));
    onConfirm(selectedEmployees);
    onClose();
  };

  const selectedCount = selectedIds.size;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-5 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <FaUser className="text-white text-xl" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">
                  {t('finance.expense.select_employees') || 'Select Employees'}
                </h3>
                <p className="text-red-100 text-sm mt-0.5">
                  {selectedCount > 0 
                    ? `${selectedCount} ${t('finance.expense.employees_selected') || 'employees selected'}`
                    : t('finance.expense.select_employees_hint') || 'Select employees for salary payment'}
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

        {/* Search Bar */}
        <div className="px-6 pt-4 pb-2">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('finance.expense.search_employees') || 'Search employees...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none"
            />
          </div>
        </div>

        {/* Employee List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {filteredEmployees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FaUser className="text-4xl mx-auto mb-2 opacity-50" />
              <p>{t('finance.expense.no_employees_found') || 'No employees found'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredEmployees.map((employee) => {
                const isSelected = selectedIds.has(employee.id);
                return (
                  <div
                    key={employee.id}
                    onClick={() => toggleEmployee(employee.id)}
                    className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                        isSelected
                          ? 'border-red-500 bg-red-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {isSelected && <FaCheck className="text-white text-xs" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{employee.name}</p>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        {employee.email && <span>{employee.email}</span>}
                        {employee.role && (
                          <>
                            <span>•</span>
                            <span className="capitalize">{employee.role}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
          >
            {t('finance.profit.cancel') || 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={selectedCount === 0}
            className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <FaCheck />
            <span>
              {t('finance.expense.confirm_selection') || 'Confirm'} ({selectedCount})
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

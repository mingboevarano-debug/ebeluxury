'use client';

import React, { useEffect } from 'react';
import { FaTimes, FaTag, FaDollarSign } from 'react-icons/fa';
import { Service } from '@/lib/services';
import { useLanguage } from '@/contexts/LanguageContext';

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  editingService: Service | null;
  serviceForm: {
    id: string;
    name: string;
    nameRu: string;
    nameUz: string;
    stage: string;
    stageRu: string;
    stageUz: string;
    cost: string;
  };
  setServiceForm: React.Dispatch<React.SetStateAction<{
    id: string;
    name: string;
    nameRu: string;
    nameUz: string;
    stage: string;
    stageRu: string;
    stageUz: string;
    cost: string;
  }>>;
  submitting: boolean;
  availableStages: string[];
}

const STAGES = [
  { en: 'I. PREPARATORY STAGE', ru: 'I. ПОДГОТОВИТЕЛЬНЫЙ ЭТАП', uz: 'I. TAYYORGARLIK BOSQICHI' },
  { en: 'II. DISMANTLING WORKS', ru: 'II. ДЕМОНТАЖНЫЕ РАБОТЫ', uz: 'II. DEMONTAJ ISHLARI' },
  { en: 'III. ROUGH CONSTRUCTION WORKS', ru: 'III. ЧЕРНОВЫЕ СТРОИТЕЛЬНЫЕ РАБОТЫ', uz: 'III. QO\'POL QURILISH ISHLARI' },
  { en: 'IV. PREPARATION FOR FINISHING', ru: 'IV. ПОДГОТОВКА ПОД ЧИСТОВУЮ ОТДЕЛКУ', uz: 'IV. YAKUNIY QOPLAM UCHUN TAYYORGARLIK' },
  { en: 'V. FINISHING WORKS', ru: 'V. ЧИСТОВЫЕ ОТДЕЛОЧНЫЕ РАБОТЫ', uz: 'V. YAKUNIY QOPLAMA ISHLARI' },
  { en: 'VI. INSTALLATION OF EQUIPMENT AND FURNITURE', ru: 'VI. УСТАНОВКА ОБОРУДОВАНИЯ И ФУРНИТУРЫ', uz: 'VI. USKUNALAR VA MEBEL O\'RNATISH' },
];

export default function ServiceModal({
  isOpen,
  onClose,
  onSubmit,
  editingService,
  serviceForm,
  setServiceForm,
  submitting,
  availableStages
}: ServiceModalProps) {
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

  const getStageLabel = (stage: typeof STAGES[0]) => {
    if (locale === 'ru') return stage.ru;
    if (locale === 'uz') return stage.uz;
    return stage.en;
  };

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <FaTag className="text-white text-xl" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">
                {editingService ? t('admin.service.edit') : t('admin.service.add')}
              </h3>
              <p className="text-blue-100 text-sm mt-0.5">
                {editingService ? t('admin.service.update_info') : t('admin.service.create_info')}
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
          {/* Service ID (only for new services) */}
          {!editingService && (
            <div className="group">
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                <FaTag className="text-blue-600" />
                <span>{t('admin.service.id')} <span className="text-red-500">*</span></span>
              </label>
              <input
                type="number"
                required
                min="1"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 outline-none bg-white hover:border-gray-300"
                value={serviceForm.id}
                onChange={(e) => setServiceForm({ ...serviceForm, id: e.target.value })}
                placeholder="Enter service ID"
              />
            </div>
          )}

          {/* Stage Selection */}
          <div className="group">
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
              <FaTag className="text-blue-600" />
              <span>{t('admin.service.stage')} <span className="text-red-500">*</span></span>
            </label>
            <select
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 outline-none bg-white hover:border-gray-300"
              value={serviceForm.stage}
              onChange={(e) => {
                const selectedStage = STAGES.find(s => s.en === e.target.value);
                if (selectedStage) {
                  setServiceForm({
                    ...serviceForm,
                    stage: selectedStage.en,
                    stageRu: selectedStage.ru,
                    stageUz: selectedStage.uz
                  });
                }
              }}
            >
              <option value="">{t('admin.service.select_stage')}</option>
              {STAGES.map((stage) => (
                <option key={stage.en} value={stage.en}>
                  {getStageLabel(stage)}
                </option>
              ))}
            </select>
          </div>

          {/* Service Name (English) */}
          <div className="group">
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
              <FaTag className="text-blue-600" />
              <span>{t('admin.service.name_en')} <span className="text-red-500">*</span></span>
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 outline-none bg-white hover:border-gray-300"
              value={serviceForm.name}
              onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
              placeholder="Enter service name in English"
            />
          </div>

          {/* Service Name (Russian) */}
          <div className="group">
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
              <FaTag className="text-blue-600" />
              <span>{t('admin.service.name_ru')} <span className="text-red-500">*</span></span>
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 outline-none bg-white hover:border-gray-300"
              value={serviceForm.nameRu}
              onChange={(e) => setServiceForm({ ...serviceForm, nameRu: e.target.value })}
              placeholder="Enter service name in Russian"
            />
          </div>

          {/* Service Name (Uzbek) */}
          <div className="group">
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
              <FaTag className="text-blue-600" />
              <span>{t('admin.service.name_uz')} <span className="text-red-500">*</span></span>
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 outline-none bg-white hover:border-gray-300"
              value={serviceForm.nameUz}
              onChange={(e) => setServiceForm({ ...serviceForm, nameUz: e.target.value })}
              placeholder="Enter service name in Uzbek"
            />
          </div>

          {/* Cost */}
          <div className="group">
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
              <FaDollarSign className="text-blue-600" />
              <span>{t('admin.service.cost')} <span className="text-red-500">*</span></span>
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 outline-none bg-white hover:border-gray-300"
              value={serviceForm.cost}
              onChange={(e) => setServiceForm({ ...serviceForm, cost: e.target.value })}
              placeholder="0"
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
            {t('finance.cancel')}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
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
                <span>{editingService ? t('finance.update') : t('finance.add')}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}


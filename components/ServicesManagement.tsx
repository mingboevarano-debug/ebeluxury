'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { FaEdit, FaTrash, FaPlus, FaSearch, FaTag, FaDollarSign } from 'react-icons/fa';
import { Service } from '@/lib/services';
import { useLanguage } from '@/contexts/LanguageContext';

interface ServicesManagementProps {
  services: Service[];
  onAdd: () => void;
  onEdit: (service: Service) => void;
  onDelete: (id: number) => void;
  onInitialize?: () => void;
}

const STAGES = [
  { en: 'I. PREPARATORY STAGE', ru: 'I. ПОДГОТОВИТЕЛЬНЫЙ ЭТАП', uz: 'I. TAYYORGARLIK BOSQICHI' },
  { en: 'II. DISMANTLING WORKS', ru: 'II. ДЕМОНТАЖНЫЕ РАБОТЫ', uz: 'II. DEMONTAJ ISHLARI' },
  { en: 'III. ROUGH CONSTRUCTION WORKS', ru: 'III. ЧЕРНОВЫЕ СТРОИТЕЛЬНЫЕ РАБОТЫ', uz: 'III. QO\'POL QURILISH ISHLARI' },
  { en: 'IV. PREPARATION FOR FINISHING', ru: 'IV. ПОДГОТОВКА ПОД ЧИСТОВУЮ ОТДЕЛКУ', uz: 'IV. YAKUNIY QOPLAM UCHUN TAYYORGARLIK' },
  { en: 'V. FINISHING WORKS', ru: 'V. ЧИСТОВЫЕ ОТДЕЛОЧНЫЕ РАБОТЫ', uz: 'V. YAKUNIY QOPLAMA ISHLARI' },
  { en: 'VI. INSTALLATION OF EQUIPMENT AND FURNITURE', ru: 'VI. УСТАНОВКА ОБОРУДОВАНИЯ И ФУРНИТУРЫ', uz: 'VI. USKUNALAR VA MEBEL O\'RNATISH' },
];

export default function ServicesManagement({
  services,
  onAdd,
  onEdit,
  onDelete,
  onInitialize
}: ServicesManagementProps) {
  const { t, locale } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('');

  // Debug: Log services received
  useEffect(() => {
    console.log('ServicesManagement received services:', services.length, services);
  }, [services]);

  const getStageName = (service: Service) => {
    if (locale === 'ru') return service.stageRu;
    if (locale === 'uz') return service.stageUz;
    return service.stage;
  };

  const getServiceName = (service: Service) => {
    if (locale === 'ru') return service.nameRu;
    if (locale === 'uz') return service.nameUz;
    return service.name;
  };

  // Group services by stage
  const servicesByStage = useMemo(() => {
    const grouped: Record<string, Service[]> = {};
    services.forEach(service => {
      const stage = getStageName(service);
      if (!grouped[stage]) {
        grouped[stage] = [];
      }
      grouped[stage].push(service);
    });
    return grouped;
  }, [services, locale]);

  // Filter services
  const filteredServices = useMemo(() => {
    let filtered = services;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(service => {
        const name = getServiceName(service).toLowerCase();
        const stage = getStageName(service).toLowerCase();
        return name.includes(query) || stage.includes(query);
      });
    }

    if (selectedStage) {
      filtered = filtered.filter(service => {
        const stage = getStageName(service);
        return stage === selectedStage;
      });
    }

    return filtered.sort((a, b) => a.id - b.id);
  }, [services, searchQuery, selectedStage, locale]);

  const getStageLabel = (stage: typeof STAGES[0]) => {
    if (locale === 'ru') return stage.ru;
    if (locale === 'uz') return stage.uz;
    return stage.en;
  };

  // Calculate statistics
  const totalServices = services.length;
  const uniqueServiceIds = new Set(services.map(s => s.id)).size;
  const totalCost = services.reduce((sum, s) => sum + (s.cost || 0), 0);
  const servicesWithCost = services.filter(s => s.cost > 0).length;
  const servicesWithoutCost = services.filter(s => !s.cost || s.cost === 0).length;
  
  // Calculate services per stage
  const servicesPerStage = useMemo(() => {
    const counts: Record<string, number> = {};
    STAGES.forEach(stageDef => {
      const stageLabel = getStageLabel(stageDef);
      counts[stageLabel] = (servicesByStage[stageLabel] || []).length;
    });
    return counts;
  }, [servicesByStage, locale, getStageLabel]);

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">{t('admin.service.management')}</h2>
            <p className="text-blue-100 mt-1">{t('admin.service.management_subtitle')}</p>
          </div>
          <button
            onClick={onAdd}
            className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg"
          >
            <FaPlus className="w-4 h-4" />
            <span>{t('admin.service.add')}</span>
          </button>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white/70 text-xs font-medium uppercase tracking-wide">{t('admin.service.total_services')}</div>
                <div className="text-3xl font-bold mt-2">{uniqueServiceIds}</div>
                <div className="text-white/60 text-xs mt-1">
                  {totalServices !== uniqueServiceIds && `(${totalServices} ${t('admin.service.total')})`}
                </div>
              </div>
              <FaTag className="w-8 h-8 text-white/30" />
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white/70 text-xs font-medium uppercase tracking-wide">{t('admin.service.total_stages')}</div>
                <div className="text-3xl font-bold mt-2">{Object.keys(servicesByStage).length}</div>
                <div className="text-white/60 text-xs mt-1">{t('admin.service.of_stages')}</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-white text-xs font-bold">{Object.keys(servicesByStage).length}</span>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white/70 text-xs font-medium uppercase tracking-wide">{t('admin.service.with_price')}</div>
                <div className="text-3xl font-bold mt-2">{servicesWithCost}</div>
                <div className="text-white/60 text-xs mt-1">
                  {totalServices > 0 ? `${Math.round((servicesWithCost / totalServices) * 100)}%` : '0%'}
                </div>
              </div>
              <FaDollarSign className="w-8 h-8 text-white/30" />
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white/70 text-xs font-medium uppercase tracking-wide">{t('admin.service.without_price')}</div>
                <div className="text-3xl font-bold mt-2">{servicesWithoutCost}</div>
                <div className="text-white/60 text-xs mt-1">
                  {totalServices > 0 ? `${Math.round((servicesWithoutCost / totalServices) * 100)}%` : '0%'}
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-yellow-500/30 flex items-center justify-center">
                <span className="text-yellow-200 text-xs">!</span>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white/70 text-xs font-medium uppercase tracking-wide">{t('admin.service.avg_cost')}</div>
                <div className="text-2xl font-bold mt-2">
                  {servicesWithCost > 0 ? (totalCost / servicesWithCost).toFixed(0) : '0'}
                </div>
                <div className="text-white/60 text-xs mt-1">UZS</div>
              </div>
              <FaDollarSign className="w-8 h-8 text-white/30" />
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white/70 text-xs font-medium uppercase tracking-wide">{t('admin.service.total_value')}</div>
                <div className="text-2xl font-bold mt-2">
                  {totalCost > 0 ? (totalCost / 1000).toFixed(1) + 'K' : '0'}
                </div>
                <div className="text-white/60 text-xs mt-1">UZS</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-green-500/30 flex items-center justify-center">
                <span className="text-green-200 text-xs font-bold">₽</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stage Breakdown */}
        <div className="mt-6 bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
          <div className="text-white/90 text-sm font-semibold mb-3">{t('admin.service.distribution_by_stage')}</div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {STAGES.map((stageDef, index) => {
              const stageLabel = getStageLabel(stageDef);
              const count = servicesPerStage[stageLabel] || 0;
              const percentage = totalServices > 0 ? (count / totalServices) * 100 : 0;
              const colors = [
                'from-blue-500 to-cyan-500',
                'from-purple-500 to-pink-500',
                'from-orange-500 to-red-500',
                'from-green-500 to-emerald-500',
                'from-yellow-500 to-amber-500',
                'from-indigo-500 to-blue-500',
              ];
              
              return (
                <div key={stageDef.en} className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="text-white/70 text-xs font-medium mb-2 truncate">
                    {t('admin.service.stage_number')} {index + 1}
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">{count}</div>
                  <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                    <div
                      className={`bg-gradient-to-r ${colors[index]} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="text-white/60 text-xs">{percentage.toFixed(1)}%</div>
                </div>
              );
            })}
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
              placeholder={t('admin.service.search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            />
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
              {t('admin.service.filter_stage')}:
            </label>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
            >
              <option value="">{t('admin.service.all_stages')}</option>
              {STAGES.map((stage) => (
                <option key={stage.en} value={getStageLabel(stage)}>
                  {getStageLabel(stage)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Services by Stage */}
      {services.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FaTag className="mx-auto text-gray-300 text-6xl mb-4" />
          <p className="text-gray-500 text-lg">{t('admin.service.no_services')}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
            {onInitialize && (
              <button
                onClick={onInitialize}
                className="inline-flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <FaPlus className="w-4 h-4" />
                <span>{t('admin.service.initialize_services')}</span>
              </button>
            )}
            <button
              onClick={onAdd}
              className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <FaPlus className="w-4 h-4" />
              <span>{t('admin.service.add_first')}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Show services grouped by known stages */}
          {STAGES.map((stageDef) => {
            const stageLabel = getStageLabel(stageDef);
            const stageServices = servicesByStage[stageLabel] || [];
            
            if (selectedStage && selectedStage !== stageLabel) return null;
            if (stageServices.length === 0 && !selectedStage) return null;

            const filteredStageServices = stageServices.filter(service => {
              if (!searchQuery) return true;
              const query = searchQuery.toLowerCase();
              const name = getServiceName(service).toLowerCase();
              return name.includes(query);
            });

            if (filteredStageServices.length === 0) return null;

            return (
              <div key={stageDef.en} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900">{stageLabel}</h3>
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      {filteredStageServices.length} {t('admin.service.services')}
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('admin.service.name')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('admin.service.cost')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('finance.table.actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredStageServices.map((service) => (
                        <tr key={service.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{service.id}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {getServiceName(service)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                            {service.cost > 0 ? `${service.cost} UZS` : 'Not set'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => onEdit(service)}
                              className="text-indigo-600 hover:text-indigo-900 mr-4"
                              title={t('finance.edit')}
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => onDelete(service.id)}
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
            );
          })}
          
          {/* Show services that don't match any known stage */}
          {(() => {
            const knownStages = STAGES.map(s => getStageLabel(s));
            const unmatchedServices = filteredServices.filter(service => {
              const stage = getStageName(service);
              return !knownStages.includes(stage);
            });

            if (unmatchedServices.length === 0) return null;
            if (selectedStage) return null; // Don't show unmatched if filtering by stage

            return (
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900">{t('admin.service.other_stages')}</h3>
                    <span className="bg-yellow-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      {unmatchedServices.length} {t('admin.service.services')}
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('admin.service.stage')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('admin.service.name')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('admin.service.cost')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('finance.table.actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {unmatchedServices.map((service) => (
                        <tr key={service.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{service.id}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {getStageName(service)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {getServiceName(service)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                            {service.cost > 0 ? `${service.cost} UZS` : 'Not set'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => onEdit(service)}
                              className="text-indigo-600 hover:text-indigo-900 mr-4"
                              title={t('finance.edit')}
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => onDelete(service.id)}
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
            );
          })()}
          
          {/* Fallback: Show all services in a flat list if no services are grouped */}
          {Object.keys(servicesByStage).length === 0 && filteredServices.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">{t('admin.service.all_services')}</h3>
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    {filteredServices.length} {t('admin.service.services')}
                  </span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.service.stage')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.service.name')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.service.cost')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('finance.table.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredServices.map((service) => (
                      <tr key={service.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{service.id}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {getStageName(service)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {getServiceName(service)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                          {service.cost} UZS
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => onEdit(service)}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                            title={t('finance.edit')}
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => onDelete(service.id)}
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
          )}
        </div>
      )}
    </div>
  );
}


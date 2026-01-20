'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Layout from '@/components/Layout';
import { Project } from '@/types';
import { getCurrentUser } from '@/lib/auth';
import { useLanguage } from '@/contexts/LanguageContext';
import { getProjectById, updateProject } from '@/lib/db';
import { getConstructionServices, Service } from '@/lib/services';
import { HiArrowLeft, HiInformationCircle, HiCheckCircle, HiSave, HiCheck } from 'react-icons/hi';
import { FaDollarSign } from 'react-icons/fa';
import { MdCalculate } from 'react-icons/md';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { toast } from 'react-toastify';

export default function ProjectServicesPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params?.projectId as string;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [constructionServices, setConstructionServices] = useState<Service[]>([]);
  const { t, locale } = useLanguage();

  useEffect(() => {
    fetchProject();
    fetchServices();
  }, [projectId]);

  const fetchServices = async () => {
    try {
      const services = await getConstructionServices();
      setConstructionServices(services);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  useEffect(() => {
    if (project?.selectedServices) {
      setSelectedServices(project.selectedServices);
    }
  }, [project]);

  const fetchProject = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const projectData = await getProjectById(projectId);
      if (!projectData) {
        toast.error('Project not found');
        router.push('/dashboard/foreman');
        return;
      }

      // Verify the project belongs to the current foreman
      if (projectData.foremanId !== user.id) {
        toast.error('Unauthorized access');
        router.push('/dashboard/foreman');
        return;
      }

      setProject(projectData);
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error('Failed to load project');
      router.push('/dashboard/foreman');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleService = (serviceId: number) => {
    setSelectedServices(prev => {
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
    setSaveSuccess(false);
  };

  const handleSaveServices = async () => {
    if (!project) return;

    setSaving(true);
    setSaveSuccess(false);
    try {
      await updateProject(project.id, {
        selectedServices: selectedServices,
      });

      // Update local project state
      setProject({
        ...project,
        selectedServices: selectedServices,
      });

      setSaveSuccess(true);
      toast.success(t('foreman.saved'));
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving services:', error);
      toast.error(t('foreman.save_error'));
    } finally {
      setSaving(false);
    }
  };

  const getServiceName = (service: Service) => {
    if (locale === 'ru') return service.nameRu;
    if (locale === 'uz') return service.nameUz;
    return service.name;
  };

  const getStageName = (service: Service) => {
    if (locale === 'ru') return service.stageRu;
    if (locale === 'uz') return service.stageUz;
    return service.stage;
  };

  const servicesByStage = constructionServices.reduce((acc, service) => {
    const stage = getStageName(service);
    if (!acc[stage]) {
      acc[stage] = [];
    }
    acc[stage].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  const selectedServicesList = constructionServices.filter(s => selectedServices.includes(s.id));
  const totalSelectedCost = selectedServicesList.length * 6;

  // Helper function to format translation with count
  const formatTranslation = (key: string, count?: number) => {
    let translation = t(key as any);
    if (count !== undefined) {
      translation = translation.replace(/{count}/g, count.toString());
    }
    return translation;
  };

  if (loading) {
    return (
      <Layout>
        <div className="px-4 py-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-xl text-gray-600">Loading...</div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <Layout>
      <div className="px-4 py-6">
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard/foreman')}
            className="mb-4 text-indigo-600 hover:text-indigo-800 font-medium flex items-center transition-colors"
          >
            <HiArrowLeft className="w-5 h-5 mr-2" />
            {t('foreman.back_to_projects')}
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('foreman.project_services')} - {project.clientName || project.id.slice(0, 8)}
          </h1>
          <p className="text-gray-600">{project.location}</p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">
          <div className="flex items-start">
            <HiInformationCircle className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              {t('foreman.select_services_info')}
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-6 border-2 border-indigo-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border-2 border-blue-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
                  {t('foreman.selected_services')}
                </p>
                <HiCheckCircle className="w-6 h-6 text-blue-500" />
              </div>
              <p className="text-4xl font-bold text-blue-800">{selectedServices.length}</p>
              <p className="text-xs text-blue-600 mt-1">
                {formatTranslation('foreman.out_of_services', constructionServices.length)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border-2 border-green-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">
                  {t('foreman.service_cost')}
                </p>
                <FaDollarSign className="w-6 h-6 text-green-500" />
              </div>
              <p className="text-4xl font-bold text-green-800">$6</p>
              <p className="text-xs text-green-600 mt-1">{t('foreman.per_service')}</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border-2 border-purple-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-purple-700 uppercase tracking-wide">
                  {t('foreman.total_cost')}
                </p>
                <MdCalculate className="w-6 h-6 text-purple-500" />
              </div>
              <p className="text-4xl font-bold text-purple-800">${totalSelectedCost}</p>
              <p className="text-xs text-purple-600 mt-1">
                {selectedServices.length > 0
                  ? `${selectedServices.length} × $6 = $${totalSelectedCost}`
                  : t('foreman.no_services_selected')
                }
              </p>
            </div>
          </div>

          {/* Save Button */}
          <div className="border-t-2 border-gray-200 pt-6">
            <button
              onClick={handleSaveServices}
              disabled={saving || selectedServices.length === 0}
              className={`w-full py-4 px-6 rounded-xl font-bold text-lg shadow-lg transition-all transform ${saving
                  ? 'bg-gray-400 cursor-not-allowed'
                  : saveSuccess
                    ? 'bg-green-600 hover:bg-green-700'
                    : selectedServices.length === 0
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 hover:scale-[1.02] active:scale-[0.98]'
                } text-white flex items-center justify-center space-x-3`}
            >
              {saving ? (
                <>
                  <AiOutlineLoading3Quarters className="animate-spin h-5 w-5 text-white" />
                  <span>{t('foreman.saving')}</span>
                </>
              ) : saveSuccess ? (
                <>
                  <HiCheck className="w-6 h-6" />
                  <span>{t('foreman.saved')}</span>
                </>
              ) : (
                <>
                  <HiSave className="w-6 h-6" />
                  <span>{t('foreman.save_services')}</span>
                </>
              )}
            </button>
            {selectedServices.length === 0 && (
              <p className="text-center text-sm text-gray-500 mt-3">
                {t('foreman.no_services_selected')}
              </p>
            )}
          </div>
        </div>

        {/* Services List */}
        <div className="space-y-6">
          {Object.entries(servicesByStage).map(([stage, services]) => {
            const stageSelectedServices = services.filter(s => selectedServices.includes(s.id));
            const stageTotal = stageSelectedServices.length * 6;

            return (
              <div key={stage} className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4">
                  <h2 className="text-xl font-bold text-white">{stage}</h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {services.map((service) => {
                    const isSelected = selectedServices.includes(service.id);
                    return (
                      <div
                        key={service.id}
                        className={`px-6 py-4 transition-all ${isSelected
                            ? 'bg-green-50 border-l-4 border-green-500 shadow-sm'
                            : 'hover:bg-gray-50'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 flex items-center space-x-4">
                            <span className={`text-sm font-bold min-w-[50px] ${isSelected ? 'text-green-700' : 'text-indigo-600'
                              }`}>
                              #{service.id}
                            </span>
                            <div className="flex-1">
                              <p className={`font-medium ${isSelected ? 'text-green-900' : 'text-gray-900'
                                }`}>
                                {getServiceName(service)}
                              </p>
                            </div>
                            {isSelected && (
                              <span className="px-3 py-1 bg-green-200 text-green-800 text-xs font-bold rounded-full border border-green-300">
                                {t('foreman.selected')}
                              </span>
                            )}
                          </div>
                          <div className="ml-4 flex items-center space-x-4">
                            <div className="text-right">
                              <span className="text-lg font-bold text-green-600">${service.cost}</span>
                              <p className="text-xs text-gray-500">{t('foreman.per_service')}</p>
                            </div>
                            <button
                              onClick={() => handleToggleService(service.id)}
                              className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl transition-all transform hover:scale-110 active:scale-95 shadow-md ${isSelected
                                  ? 'bg-red-500 hover:bg-red-600 text-white'
                                  : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                                }`}
                              title={isSelected ? t('foreman.remove_service') : t('foreman.add_service')}
                            >
                              {isSelected ? '−' : '+'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="bg-gray-50 px-6 py-4 border-t-2 border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-700">
                      {t('foreman.stage_total')} ({stageSelectedServices.length} / {services.length}):
                    </span>
                    <span className="text-xl font-bold text-indigo-600">
                      ${stageTotal}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}

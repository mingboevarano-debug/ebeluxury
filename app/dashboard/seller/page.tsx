'use client';

// Force rebuild 2
import { useState, useEffect, useMemo } from 'react';
import Layout from '@/components/Layout';
import { Contract, User } from '@/types';
import { getContracts, createContract } from '@/lib/db';
import { subscribeToAuthChanges } from '@/lib/auth';
import Countdown from 'react-countdown';
import DataTable, { TableColumn } from 'react-data-table-component';
import ContractsLineChart from '@/components/ContractsLineChart';
import { useLanguage } from '@/contexts/LanguageContext';
import ExportButtons from '@/components/ExportButtons';
import { toast } from 'react-toastify';
import { getConstructionServices, Service } from '@/lib/services';
import { FaHome, FaBuilding, FaIdCard, FaWrench, FaCheckCircle, FaDollarSign, FaSearch, FaTimes, FaCalculator, FaInfoCircle } from 'react-icons/fa';

// Define styles for the search input
const SearchInput = ({ filterText, onFilter, onClear, placeholder }: any) => (
  <div className="flex items-center space-x-2 mb-4">
    <input
      id="search"
      type="text"
      placeholder={placeholder}
      className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      value={filterText}
      onChange={onFilter}
    />
    <button
      onClick={onClear}
      className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded focus:outline-none"
    >
      X
    </button>
  </div>
);

export default function SellerDashboard() {
  const { t, locale } = useLanguage();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [formData, setFormData] = useState({
    clientName: '',
    clientSurname: '',
    clientPhone: '',
    location: '',
    price: '',
    deadline: '',
    description: '',
    accommodationType: 'apartment' as 'apartment' | 'house',
    passportId: '',
    accommodationSquare: '',
    selectedServices: [] as number[],
  });
  const [constructionServices, setConstructionServices] = useState<Service[]>([]);
  const [serviceSearchTerm, setServiceSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('all');

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showForm) {
        setShowForm(false);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [showForm]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showForm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showForm]);

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = subscribeToAuthChanges((currentUser) => {
      console.log('Auth state changed, user:', currentUser); // Debug log
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        fetchContracts();
      }
    });

    // Fetch construction services
    const fetchServices = async () => {
      try {
        const services = await getConstructionServices();
        setConstructionServices(services);
      } catch (error) {
        console.error('Error fetching services:', error);
      }
    };
    fetchServices();

    return () => unsubscribe();
  }, []);

  const fetchContracts = async () => {
    try {
      const data = await getContracts();
      setContracts(data || []);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      setContracts([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('Attempting to create contract, user:', user); // Debug log

    if (!user) {
      toast.error(t('alert.login_required'));
      return;
    }

    try {
      await createContract({
        sellerId: user.id,
        sellerName: user.name,
        clientName: formData.clientName,
        clientSurname: formData.clientSurname,
        clientPhone: formData.clientPhone,
        location: formData.location,
        price: parseFloat(formData.price),
        deadline: new Date(formData.deadline),
        description: formData.description,
        status: 'pending',
        accommodationType: formData.accommodationType,
        passportId: formData.passportId,
        accommodationSquare: formData.accommodationSquare ? parseFloat(formData.accommodationSquare) : undefined,
        selectedServices: formData.selectedServices,
      });

      setShowForm(false);
      setFormData({
        clientName: '',
        clientSurname: '',
        clientPhone: '',
        location: '',
        price: '',
        deadline: '',
        description: '',
        accommodationType: 'apartment',
        passportId: '',
        accommodationSquare: '',
        selectedServices: [],
      });
      fetchContracts();
      toast.success('Contract created successfully');
    } catch (error) {
      console.error('Error creating contract:', error);
      toast.error(t('alert.create_failed'));
    }
  };

  const filteredItems = contracts.filter(
    item =>
      (item.clientName && item.clientName.toLowerCase().includes(filterText.toLowerCase())) ||
      (item.clientSurname && item.clientSurname.toLowerCase().includes(filterText.toLowerCase()))
  );

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

  // Smart calculations
  const totalServicesCost = formData.selectedServices.length * 6;
  const suggestedPrice = totalServicesCost > 0 ? totalServicesCost * 100 : 0;

  // Calculate price per square meter
  const accommodationSquareNum = parseFloat(formData.accommodationSquare) || 0;
  const contractPriceNum = parseFloat(formData.price) || 0;
  const pricePerSquare = accommodationSquareNum > 0 && contractPriceNum > 0
    ? contractPriceNum / accommodationSquareNum
    : 0;

  // Filter services by search and stage
  const filteredServices = constructionServices.filter(service => {
    const matchesSearch = getServiceName(service).toLowerCase().includes(serviceSearchTerm.toLowerCase()) ||
      service.id.toString().includes(serviceSearchTerm);
    const matchesStage = selectedStage === 'all' || getStageName(service) === selectedStage;
    return matchesSearch && matchesStage;
  });

  // Group services by stage
  const servicesByStage = filteredServices.reduce((acc, service) => {
    const stage = getStageName(service);
    if (!acc[stage]) {
      acc[stage] = [];
    }
    acc[stage].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  const allStages = Array.from(new Set(constructionServices.map(s => getStageName(s))));

  const subHeaderComponentMemo = useMemo(() => {
    const handleClear = () => {
      if (filterText) {
        setFilterText('');
      }
    };

    return (
      <SearchInput
        onFilter={(e: any) => setFilterText(e.target.value)}
        onClear={handleClear}
        filterText={filterText}
        placeholder={t('seller.search_placeholder')}
      />
    );
  }, [filterText, t]);

  const columns: TableColumn<Contract>[] = [
    {
      name: t('table.client'),
      selector: row => `${row.clientName} ${row.clientSurname}`,
      sortable: true,
      wrap: true,
      minWidth: '150px',
      width: '180px',
    },
    {
      name: t('table.phone'),
      selector: row => row.clientPhone,
      sortable: true,
      minWidth: '120px',
      width: '150px',
    },
    {
      name: t('seller.location'),
      selector: row => row.location,
      sortable: true,
      wrap: true,
      minWidth: '150px',
      width: '200px',
    },
    {
      name: t('seller.accommodation'),
      selector: row => row.accommodationType || 'N/A',
      sortable: true,
      minWidth: '120px',
      width: '140px',
      cell: row => (
        <span className="capitalize inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          {row.accommodationType === 'apartment' ? t('seller.apartment') : row.accommodationType === 'house' ? t('seller.house') : 'N/A'}
        </span>
      ),
    },
    {
      name: t('seller.accommodation_square'),
      selector: row => row.accommodationSquare || 0,
      sortable: true,
      minWidth: '120px',
      width: '140px',
      cell: row => (
        <span className="text-sm font-medium text-gray-700">
          {row.accommodationSquare ? `${row.accommodationSquare} m²` : 'N/A'}
        </span>
      ),
    },
    {
      name: t('seller.passport_id'),
      selector: row => row.passportId || 'N/A',
      sortable: true,
      minWidth: '130px',
      width: '160px',
    },
    {
      name: t('seller.services'),
      selector: row => row.selectedServices?.length || 0,
      sortable: true,
      minWidth: '200px',
      width: '300px',
      cell: row => {
        const serviceCount = row.selectedServices?.length || 0;
        const serviceCost = serviceCount * 6;
        return (
          <div className="flex flex-col space-y-1">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 w-fit">
              {serviceCount} {serviceCount === 1 ? t('seller.service_selected') : t('seller.services_selected')}
            </span>
            {serviceCount > 0 && (
              <span className="text-xs font-semibold text-indigo-600">
                ${serviceCost} ({serviceCount} × $6)
              </span>
            )}
          </div>
        );
      },
    },
    {
      name: t('table.price'),
      selector: row => row.price,
      sortable: true,
      minWidth: '120px',
      width: '150px',
      format: row => `${row.price} UZS`,
    },
    {
      name: t('table.deadline_timer'),
      selector: row => row.deadline.toString(),
      sortable: true,
      minWidth: '200px',
      width: '250px',
      cell: row => (
        <div className="py-2">
          <div className="text-xs text-gray-500 mb-2">
            {new Date(row.deadline).toLocaleString()}
          </div>
          <Countdown
            date={new Date(row.deadline)}
            renderer={({ days, hours, minutes, seconds, completed }) => {
              if (completed) {
                return (
                  <div className="inline-flex items-center px-4 py-3 rounded-lg text-lg font-bold bg-gradient-to-r from-red-500 to-red-600 text-white border-2 border-red-700 shadow-lg animate-pulse">
                    <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {t('status.expired')}
                  </div>
                );
              } else {
                const isUrgent = days === 0;
                const isWarning = days <= 2;

                return (
                  <div className={`inline-flex items-center px-5 py-3 rounded-xl border-2 text-base font-bold font-mono shadow-2xl transform transition-all hover:scale-105 ${isUrgent
                    ? 'bg-gradient-to-r from-red-500 to-red-600 border-red-700 text-white animate-pulse shadow-red-500/50'
                    : isWarning
                      ? 'bg-gradient-to-r from-orange-400 to-orange-500 border-orange-600 text-white shadow-orange-500/50'
                      : 'bg-gradient-to-r from-indigo-600 to-blue-600 border-indigo-700 text-white shadow-indigo-500/50'
                    }`}>
                    {isUrgent && (
                      <svg className="w-5 h-5 mr-2 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span className="text-2xl font-black">
                      {days}{t('timer.days')} {hours}{t('timer.hours')} {minutes}{t('timer.minutes')} {seconds}{t('timer.seconds')}
                    </span>
                  </div>
                );
              }
            }}
          />
        </div>
      ),
    },
    {
      name: t('table.status'),
      selector: row => row.status,
      sortable: true,
      minWidth: '120px',
      width: '140px',
      cell: row => (
        <span className={`capitalize inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold shadow-sm ${row.status === 'completed' ? 'bg-green-100 text-green-800 border border-green-300' :
          row.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' :
            row.status === 'in_progress' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
              'bg-gray-100 text-gray-800 border border-gray-300'
          }`}>
          {t(`status.${row.status}` as any)}
        </span>
      ),
    },
    {
      name: t('seller.description'),
      selector: row => row.description,
      wrap: true,
      omit: false,
      minWidth: '200px',
      width: '300px',
    },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-xl text-gray-600">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 py-6 w-full max-w-full overflow-x-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{t('seller.title')}</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-all transform hover:scale-105"
          >
            {showForm ? t('seller.cancel') : t('seller.create_contract')}
          </button>
        </div>

        {showForm && (
          <div
            className="fixed inset-0 z-50 bg-gray-900 bg-opacity-95 overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowForm(false);
              }
            }}
          >
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
              {/* Sticky Header */}
              <div className="sticky top-0 z-10 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white shadow-2xl">
                <div className="max-w-7xl mx-auto px-6 py-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                        <FaIdCard className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold">{t('seller.new_contract')}</h2>
                        <p className="text-indigo-100 text-sm mt-1">{t('seller.form_subtitle')}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="text-white/80 hover:text-white hover:bg-white/20 p-3 rounded-lg transition-all duration-200"
                    >
                      <FaTimes className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Form Content */}
              <div className="max-w-7xl mx-auto px-6 py-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Client Information Section */}
                  <div className="bg-white p-8 rounded-2xl shadow-xl border-2 border-indigo-100">
                    <div className="flex items-center mb-6">
                      <div className="bg-gradient-to-r from-indigo-500 to-blue-500 p-3 rounded-xl mr-4">
                        <FaIdCard className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">{t('seller.client_information')}</h3>
                        <p className="text-sm text-gray-500 mt-1">{t('seller.client_info_subtitle')}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('seller.client_name')}</label>
                        <input
                          type="text"
                          required
                          className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                          value={formData.clientName}
                          onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                          placeholder={t('seller.client_name')}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('seller.client_surname')}</label>
                        <input
                          type="text"
                          required
                          className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                          value={formData.clientSurname}
                          onChange={(e) => setFormData({ ...formData, clientSurname: e.target.value })}
                          placeholder={t('seller.client_surname')}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('seller.client_phone')}</label>
                        <input
                          type="tel"
                          required
                          className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                          value={formData.clientPhone}
                          onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                          placeholder="+998 XX XXX XX XX"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('seller.location')}</label>
                        <input
                          type="text"
                          required
                          className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          placeholder={t('seller.location')}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Accommodation & Passport Section */}
                  <div className="bg-white p-8 rounded-2xl shadow-xl border-2 border-purple-100">
                    <div className="flex items-center mb-6">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-xl mr-4">
                        <FaHome className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">{t('seller.accommodation_details')}</h3>
                        <p className="text-sm text-gray-500 mt-1">{t('seller.accommodation_info_subtitle')}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('seller.accommodation_type')}</label>
                        <div className="relative">
                          <select
                            required
                            className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 appearance-none cursor-pointer"
                            value={formData.accommodationType}
                            onChange={(e) => setFormData({ ...formData, accommodationType: e.target.value as 'apartment' | 'house' })}
                          >
                            <option value="apartment">{t('seller.apartment')}</option>
                            <option value="house">{t('seller.house')}</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            {formData.accommodationType === 'apartment' ? (
                              <FaBuilding className="w-5 h-5 text-gray-400" />
                            ) : (
                              <FaHome className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('seller.accommodation_square')} (m²)</label>
                        <input
                          type="number"
                          required
                          step="0.01"
                          min="0"
                          className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                          value={formData.accommodationSquare}
                          onChange={(e) => setFormData({ ...formData, accommodationSquare: e.target.value })}
                          placeholder="0.00"
                        />
                        {accommodationSquareNum > 0 && contractPriceNum > 0 && (
                          <p className="mt-2 text-xs font-semibold text-indigo-600 flex items-center">
                            <FaCalculator className="w-3 h-3 mr-1" />
                            {t('seller.price_per_square')}: {pricePerSquare.toLocaleString('en-US', { maximumFractionDigits: 2 })} UZS/m²
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('seller.passport_id')}</label>
                        <input
                          type="text"
                          required
                          className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                          value={formData.passportId}
                          onChange={(e) => setFormData({ ...formData, passportId: e.target.value })}
                          placeholder={t('seller.passport_id_placeholder')}
                        />
                      </div>
                    </div>
                  </div>
                  {/* Services Selection Section */}
                  <div className="bg-white p-8 rounded-2xl shadow-xl border-2 border-green-100">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center">
                        <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-3 rounded-xl mr-4">
                          <FaWrench className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">{t('seller.repairing_services')}</h3>
                          <p className="text-sm text-gray-500 mt-1">{t('seller.services_info_subtitle')}</p>
                        </div>
                      </div>
                      {formData.selectedServices.length > 0 && (
                        <div className="flex items-center space-x-3">
                          <div className="px-4 py-2 bg-green-500 text-white text-sm font-semibold rounded-xl flex items-center shadow-lg">
                            <FaCheckCircle className="w-4 h-4 mr-2" />
                            {formData.selectedServices.length} {formData.selectedServices.length === 1 ? t('seller.service_selected') : t('seller.services_selected')}
                          </div>
                          <div className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold rounded-xl flex items-center shadow-lg">
                            <FaDollarSign className="w-4 h-4 mr-2" />
                            ${totalServicesCost}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Search and Filter */}
                    <div className="mb-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                          <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="text"
                            placeholder={t('seller.search_services_placeholder')}
                            value={serviceSearchTerm}
                            onChange={(e) => setServiceSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                          />
                        </div>
                        <div className="relative">
                          <select
                            value={selectedStage}
                            onChange={(e) => setSelectedStage(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 appearance-none cursor-pointer"
                          >
                            <option value="all">{t('seller.all_stages')}</option>
                            {allStages.map((stage) => (
                              <option key={stage} value={stage}>{stage}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            const allFilteredServiceIds: number[] = filteredServices.map(service => Number(service.id));
                            const combinedIds: number[] = [...formData.selectedServices, ...allFilteredServiceIds];
                            const uniqueIds = new Set<number>(combinedIds);
                            const newSelectedServices: number[] = Array.from(uniqueIds);
                            setFormData({ ...formData, selectedServices: newSelectedServices });
                          }}
                          className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all transform hover:scale-105 flex items-center space-x-2"
                        >
                          <FaCheckCircle className="w-4 h-4" />
                          <span>{t('seller.select_all_services')}</span>
                        </button>
                      </div>
                    </div>

                    {/* Selected Services Summary */}
                    {formData.selectedServices.length > 0 && (
                      <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-bold text-gray-900 flex items-center">
                            <FaCheckCircle className="w-5 h-5 mr-2 text-green-600" />
                            {t('seller.selected_services')} ({formData.selectedServices.length})
                          </h4>
                          <div className="px-4 py-2 bg-white rounded-lg border-2 border-green-300">
                            <span className="text-lg font-bold text-indigo-600">${totalServicesCost}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                          {constructionServices
                            .filter(service => formData.selectedServices.includes(service.id))
                            .map((service) => (
                              <div key={service.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                                <div className="flex-1">
                                  <span className="text-xs font-bold text-indigo-600 mr-2">#{service.id}</span>
                                  <span className="text-sm text-gray-700">{getServiceName(service)}</span>
                                </div>
                                <div className="flex items-center space-x-2 ml-3">
                                  <span className="text-xs text-gray-500">{t('seller.service_cost')}:</span>
                                  <span className="text-sm font-bold text-green-600">$6</span>
                                </div>
                              </div>
                            ))}
                        </div>
                        <div className="mt-4 pt-4 border-t-2 border-green-300 flex items-center justify-between">
                          <span className="text-base font-semibold text-gray-700">{t('seller.total_services_cost')}:</span>
                          <span className="text-2xl font-bold text-indigo-600">${totalServicesCost}</span>
                        </div>
                      </div>
                    )}

                    {/* Services List by Stage */}
                    <div className="max-h-96 overflow-y-auto border-2 border-gray-200 rounded-xl p-6 bg-gray-50 shadow-inner">
                      {constructionServices.length === 0 ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                            <p className="text-sm text-gray-500">{t('seller.loading_services')}</p>
                          </div>
                        </div>
                      ) : filteredServices.length === 0 ? (
                        <div className="text-center py-12">
                          <FaSearch className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">{t('seller.no_services_found')}</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {Object.entries(servicesByStage).map(([stage, services]) => (
                            <div key={stage} className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
                              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3">
                                <h4 className="text-lg font-bold text-white">{stage}</h4>
                              </div>
                              <div className="divide-y divide-gray-200">
                                {services.map((service) => {
                                  const isSelected = formData.selectedServices.includes(service.id);
                                  return (
                                    <label
                                      key={service.id}
                                      className={`flex items-center space-x-4 p-4 cursor-pointer transition-all ${isSelected
                                        ? 'bg-gradient-to-r from-indigo-50 to-blue-50 border-l-4 border-indigo-500'
                                        : 'hover:bg-gray-50'
                                        }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setFormData({
                                              ...formData,
                                              selectedServices: [...formData.selectedServices, service.id],
                                            });
                                          } else {
                                            setFormData({
                                              ...formData,
                                              selectedServices: formData.selectedServices.filter((id) => id !== service.id),
                                            });
                                          }
                                        }}
                                        className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 cursor-pointer"
                                      />
                                      <div className="flex-1">
                                        <div className="flex items-center space-x-3">
                                          <span className="font-bold text-indigo-600 text-sm">#{service.id}</span>
                                          <span className={`text-sm ${isSelected ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                            {getServiceName(service)}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex items-center space-x-3">
                                        <span className="text-sm font-bold text-green-600">$6</span>
                                        {isSelected && (
                                          <FaCheckCircle className="w-5 h-5 text-green-500" />
                                        )}
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Contract Details Section */}
                  <div className="bg-white p-8 rounded-2xl shadow-xl border-2 border-amber-100">
                    <div className="flex items-center mb-6">
                      <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-3 rounded-xl mr-4">
                        <FaCalculator className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">{t('seller.contract_details')}</h3>
                        <p className="text-sm text-gray-500 mt-1">{t('seller.contract_details_subtitle')}</p>
                      </div>
                    </div>

                    {/* Smart Price Suggestion */}
                    {totalServicesCost > 0 && (
                      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
                        <div className="flex items-start">
                          <FaInfoCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-blue-900 mb-1">{t('seller.smart_price_suggestion')}</p>
                            <p className="text-sm text-blue-700 mb-2">
                              {t('seller.price_suggestion_desc')
                                .replace('{count}', formData.selectedServices.length.toString())
                                .replace('${cost}', totalServicesCost.toString())
                                .replace('{cost}', totalServicesCost.toString())}
                            </p>
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, price: (suggestedPrice).toFixed(2) })}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all text-sm"
                            >
                              {t('seller.use_suggested_price').replace('{price}', suggestedPrice.toLocaleString())}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">{t('seller.price')} (UZS)</label>
                        <div className="relative">
                          <FaDollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="number"
                            required
                            step="0.01"
                            min="0"
                            className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            placeholder="0.00"
                          />
                        </div>
                        {formData.price && parseFloat(formData.price) > 0 && (
                          <div className="mt-2 space-y-1">
                            <p className="text-xs text-gray-500">
                              {t('seller.price_helper_text')
                                .replace('$ {cost}', `$${totalServicesCost}`)
                                .replace('{cost}', totalServicesCost.toString())
                                .replace('{price}', parseFloat(formData.price).toLocaleString())}
                            </p>
                            {accommodationSquareNum > 0 && pricePerSquare > 0 && (
                              <p className="text-xs font-semibold text-indigo-600 flex items-center">
                                <FaCalculator className="w-3 h-3 mr-1" />
                                {t('seller.price_per_square')}: {pricePerSquare.toLocaleString('en-US', { maximumFractionDigits: 2 })} UZS/m²
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">{t('seller.deadline')}</label>
                        <input
                          type="datetime-local"
                          required
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 cursor-pointer"
                          value={formData.deadline}
                          onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="mt-6">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">{t('seller.description')}</label>
                      <textarea
                        required
                        rows={5}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 resize-none"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder={t('seller.description')}
                      />
                    </div>
                  </div>

                  {/* Summary Card */}
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-2xl shadow-2xl text-white">
                    <div className={`grid gap-6 ${accommodationSquareNum > 0 && pricePerSquare > 0 ? 'grid-cols-1 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'}`}>
                      <div>
                        <p className="text-sm text-indigo-200 mb-1">{t('seller.summary_services_selected')}</p>
                        <p className="text-3xl font-bold">{formData.selectedServices.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-indigo-200 mb-1">{t('seller.summary_services_cost')}</p>
                        <p className="text-3xl font-bold">${totalServicesCost}</p>
                      </div>
                      <div>
                        <p className="text-sm text-indigo-200 mb-1">{t('seller.summary_contract_price')}</p>
                        <p className="text-3xl font-bold">
                          {formData.price ? parseFloat(formData.price).toLocaleString() : '0'} UZS
                        </p>
                      </div>
                      {accommodationSquareNum > 0 && pricePerSquare > 0 && (
                        <div>
                          <p className="text-sm text-indigo-200 mb-1">{t('seller.price_per_square')}</p>
                          <p className="text-3xl font-bold">
                            {pricePerSquare.toLocaleString('en-US', { maximumFractionDigits: 2 })} UZS/m²
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit Buttons */}
                  <div className="sticky bottom-0 bg-white border-t-2 border-gray-200 py-6 -mx-6 px-6 flex justify-end space-x-4 shadow-lg">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-8 py-3 rounded-xl font-semibold border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all transform hover:scale-105"
                    >
                      {t('seller.cancel')}
                    </button>
                    <button
                      type="submit"
                      className="px-10 py-3 rounded-xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white shadow-xl hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-800 transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-500/50"
                    >
                      {t('seller.submit')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <ContractsLineChart contracts={contracts} />
        </div>

        <div className="bg-white shadow-lg rounded-lg p-6 w-full overflow-x-auto">
          <ExportButtons
            data={filteredItems}
            columns={[
              { name: t('table.client'), selector: (row: Contract) => `${row.clientName} ${row.clientSurname}` },
              { name: t('table.phone'), selector: (row: Contract) => row.clientPhone },
              { name: t('seller.location'), selector: (row: Contract) => row.location },
              { name: t('seller.accommodation_type'), selector: (row: Contract) => row.accommodationType === 'apartment' ? t('seller.apartment') : row.accommodationType === 'house' ? t('seller.house') : 'N/A' },
              { name: t('seller.accommodation_square'), selector: (row: Contract) => row.accommodationSquare ? `${row.accommodationSquare} m²` : 'N/A' },
              { name: t('seller.passport_id'), selector: (row: Contract) => row.passportId || 'N/A' },
              { name: t('seller.services_count'), selector: (row: Contract) => row.selectedServices?.length || 0 },
              { name: t('table.price'), selector: (row: Contract) => row.price, format: (row: Contract) => `${row.price} UZS` },
              { name: t('seller.deadline'), selector: (row: Contract) => new Date(row.deadline).toLocaleString() },
              { name: t('table.status'), selector: (row: Contract) => t(`status.${row.status}` as any) },
              { name: t('seller.description'), selector: (row: Contract) => row.description },
            ]}
            fileName="Seller_Contracts"
          />
          <div className="mt-4 w-full overflow-x-auto">
            <DataTable
              columns={columns}
              data={filteredItems}
              pagination
              highlightOnHover
              pointerOnHover
              subHeader
              subHeaderComponent={subHeaderComponentMemo}
              persistTableHead
              customStyles={{
                table: {
                  style: {
                    width: '100%',
                    minWidth: '1200px',
                  },
                },
                tableWrapper: {
                  style: {
                    width: '100%',
                  },
                },
                cells: {
                  style: {
                    padding: '12px 16px',
                    fontSize: '14px',
                  },
                },
                headCells: {
                  style: {
                    padding: '12px 16px',
                    fontSize: '14px',
                    fontWeight: '600',
                  },
                },
              }}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}

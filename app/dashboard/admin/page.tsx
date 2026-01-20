'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { User, UserRole, Report, Warning } from '@/types';
import { getUsers, getReports, getWarnings, deleteUser, getServices, createService, updateService, deleteService, initializeServices } from '@/lib/db';
import { createSecondaryUser } from '@/lib/auth';
import DataTable from 'react-data-table-component';

import ImageModal from '@/components/ImageModal';
import ServicesManagement from '@/components/ServicesManagement';
import ServiceModal from '@/components/ServiceModal';
import { useLanguage } from '@/contexts/LanguageContext';
import WarningLineChart from '@/components/WarningLineChart';
import ExportButtons from '@/components/ExportButtons';
import { toast } from 'react-toastify';
import { Service } from '@/lib/services';

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'employees' | 'reports' | 'warnings' | 'services'>('employees');
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'seller' as UserRole,
  });
  
  // Services Modal State
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceForm, setServiceForm] = useState({
    id: '',
    name: '',
    nameRu: '',
    nameUz: '',
    stage: '',
    stageRu: '',
    stageUz: '',
    cost: '',
  });
  const [submitting, setSubmitting] = useState(false);
  
  const { t } = useLanguage();

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    }
  };

  const fetchServices = async () => {
    try {
      const data = await getServices();
      console.log('Fetched services:', data.length, data);
      
      // Auto-initialize services if database is empty
      if (data.length === 0) {
        console.log('No services found, initializing from default...');
        try {
          const { STATIC_CONSTRUCTION_SERVICES } = await import('@/lib/services');
          await initializeServices(STATIC_CONSTRUCTION_SERVICES);
          // Fetch again after initialization
          const newData = await getServices();
          console.log('Services initialized, fetched:', newData.length);
          setServices(newData);
          toast.success(t('admin.service.initialized'));
        } catch (initError) {
          console.error('Error auto-initializing services:', initError);
          setServices([]);
        }
      } else {
        setServices(data);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      setServices([]);
    }
  };

  const fetchReports = async () => {
    try {
      const data = await getReports();
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setReports([]);
    }
  };

  const fetchWarnings = async () => {
    try {
      const data = await getWarnings();
      setWarnings(data || []);
    } catch (error) {
      console.error('Error fetching warnings:', error);
      setWarnings([]);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([
        fetchUsers(),
        fetchReports(),
        fetchWarnings(),
        fetchServices()
      ]);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createSecondaryUser(
        formData.email,
        formData.password,
        formData.name,
        formData.role
      );

      setShowForm(false);
      setFormData({ email: '', password: '', name: '', role: 'seller' });
      fetchUsers();
      toast.success('User created successfully');
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user.');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm(t('form.confirm_delete'))) return;

    try {
      await deleteUser(id);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div>Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{t('admin.title')}</h1>
          {activeTab === 'employees' && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
            >
              {showForm ? t('admin.cancel') : t('admin.create_employee')}
            </button>
          )}
        </div>

        <div className="mb-4 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('employees')}
              className={`${activeTab === 'employees'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {t('admin.tabs.employees')}
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`${activeTab === 'reports'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {t('admin.tabs.reports')}
            </button>
            <button
              onClick={() => setActiveTab('warnings')}
              className={`${activeTab === 'warnings'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {t('admin.tabs.warnings')}
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`${activeTab === 'services'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {t('admin.tabs.services')}
            </button>
          </nav>
        </div>

        {activeTab === 'employees' && (
          <>
            {showForm && (
              <div className="bg-white p-6 rounded-lg shadow mb-6">
                <h2 className="text-xl font-semibold mb-4">{t('admin.create_employee')}</h2>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('form.name')}
                    </label>
                    <input
                      type="text"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('form.email')}
                    </label>
                    <input
                      type="email"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('form.password')}
                    </label>
                    <input
                      type="password"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('form.role')}
                    </label>
                    <select
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    >
                      <option value="seller">{t('role.seller')}</option>
                      <option value="foreman">{t('role.foreman')}</option>
                      <option value="supplier">{t('role.supplier')}</option>
                      <option value="hr">{t('role.hr')}</option>
                      <option value="admin">{t('role.admin')}</option>
                      <option value="director">{t('role.director')}</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
                  >
                    {t('form.create_user')}
                  </button>
                </form>
              </div>
            )}

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {users.map((user) => (
                  <li key={user.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        <p className="text-sm text-gray-500">{t('form.role')}: {t(`role.${user.role}` as any)}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                      >
                        {t('form.delete')}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {activeTab === 'reports' && (
          <div className="bg-white shadow overflow-hidden sm:rounded-md p-4">
            <ExportButtons
              data={reports}
              columns={[
                { name: t('table.foreman'), selector: (row: Report) => row.foremanName || t('table.unknown_foreman') },
                { name: t('table.project'), selector: (row: Report) => row.projectId?.slice(0, 8) || t('table.no_project') },
                { name: t('table.description'), selector: (row: Report) => row.description },
                {
                  name: t('table.location'),
                  selector: (row: Report) => row.location ? `${row.location.latitude.toFixed(4)}, ${row.location.longitude.toFixed(4)}` : t('table.no_project')
                },
                {
                  name: t('table.media'),
                  selector: (row: Report) => `${row.photos?.length || 0} photos, ${row.videos?.length || 0} videos`
                },
                { name: t('table.date'), selector: (row: Report) => row.createdAt ? new Date(row.createdAt).toLocaleString() : '' },
              ]}
              fileName="Reports"
            />
            <DataTable
              columns={[
                {
                  name: t('table.foreman'),
                  selector: (row: Report) => row.foremanName || t('table.unknown_foreman'),
                  sortable: true,
                },
                {
                  name: t('table.project'),
                  selector: (row: Report) => row.projectId?.slice(0, 8) || t('table.no_project'),
                },
                {
                  name: t('table.description'),
                  selector: (row: Report) => row.description,
                  wrap: true,
                  grow: 2,
                },
                {
                  name: t('table.location'),
                  cell: (row: Report) => (
                    row.location ? (
                      <a
                        href={`https://www.google.com/maps?q=${row.location.latitude},${row.location.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        {t('table.view_map')} ({row.location.latitude.toFixed(4)}, {row.location.longitude.toFixed(4)})
                      </a>
                    ) : t('table.no_project')
                  ),
                },
                {
                  name: t('table.media'),
                  cell: (row: Report) => (
                    <div className="flex space-x-1">
                      {row.photos?.slice(0, 3).map((photo, i) => (
                        <button
                          key={i}
                          onClick={() => setZoomedImage(photo)}
                          className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded"
                        >
                          <img src={photo} alt="Thumb" className="h-8 w-8 object-cover rounded border hover:opacity-75 transition-opacity" />
                        </button>
                      ))}
                      {row.videos?.length > 0 && (
                        <span className="text-xs bg-gray-200 px-1 rounded flex items-center">
                          +{row.videos.length} vid
                        </span>
                      )}
                    </div>
                  ),
                },
                {
                  name: t('table.date'),
                  selector: (row: Report) => row.createdAt ? new Date(row.createdAt).toLocaleString() : '',
                  sortable: true,
                  width: '180px',
                },
              ]}
              data={reports}
              pagination
              highlightOnHover
              responsive
            />
          </div>
        )}

        {
          activeTab === 'warnings' && (
            <>
              <div className="mb-6">
                <WarningLineChart warnings={warnings} />
              </div>
              <div className="bg-white shadow overflow-hidden sm:rounded-md p-4">
                <ExportButtons
                  data={warnings}
                  columns={[
                    { name: t('table.foreman'), selector: (row: Warning) => row.foremanName || t('table.unknown_foreman') },
                    { name: t('table.project'), selector: (row: Warning) => row.projectId?.slice(0, 8) || t('table.no_project') },
                    { name: t('table.message'), selector: (row: Warning) => row.message },
                    { name: t('table.status'), selector: (row: Warning) => t(`warning.${row.status}` as any) || row.status },
                    { name: t('table.date'), selector: (row: Warning) => row.createdAt ? new Date(row.createdAt).toLocaleString() : '' },
                  ]}
                  fileName="Warnings"
                />
                <ul className="divide-y divide-gray-200">
                  {warnings.map((warning) => (
                    <li key={warning.id} className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Warning from {warning.foremanName}
                        </p>
                        <p className="text-sm text-gray-500">
                          Project: {warning.projectId.slice(0, 8)}
                        </p>
                        <p className="text-sm text-red-700 mt-2 font-semibold">
                          {warning.message}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          Status: <span className={warning.status === 'pending' ? 'text-red-600' : 'text-green-600'}>
                            {warning.status}
                          </span>
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(warning.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )
        }

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div>
            <ServicesManagement
              services={services}
              onAdd={() => {
                setEditingService(null);
                setServiceForm({
                  id: '',
                  name: '',
                  nameRu: '',
                  nameUz: '',
                  stage: '',
                  stageRu: '',
                  stageUz: '',
                  cost: '',
                });
                setIsServiceModalOpen(true);
              }}
              onEdit={(service) => {
                setEditingService(service);
                setServiceForm({
                  id: service.id.toString(),
                  name: service.name,
                  nameRu: service.nameRu,
                  nameUz: service.nameUz,
                  stage: service.stage,
                  stageRu: service.stageRu,
                  stageUz: service.stageUz,
                  cost: service.cost.toString(),
                });
                setIsServiceModalOpen(true);
              }}
              onDelete={async (id) => {
                if (!confirm(t('admin.service.confirm_delete'))) return;
                try {
                  await deleteService(id);
                  toast.success(t('admin.service.deleted'));
                  await fetchServices();
                } catch (error: any) {
                  console.error('Error deleting service:', error);
                  toast.error(error.message || t('admin.service.delete_error'));
                }
              }}
              onInitialize={async () => {
                if (!confirm(t('admin.service.confirm_initialize'))) return;
                try {
                  const { STATIC_CONSTRUCTION_SERVICES } = await import('@/lib/services');
                  await initializeServices(STATIC_CONSTRUCTION_SERVICES);
                  toast.success(t('admin.service.initialized'));
                  await fetchServices();
                } catch (error: any) {
                  console.error('Error initializing services:', error);
                  toast.error(error.message || t('admin.service.initialize_error'));
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Service Modal */}
      <ServiceModal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        onSubmit={async (e) => {
          e.preventDefault();
          setSubmitting(true);
          try {
            const serviceData: Omit<Service, 'id'> = {
              name: serviceForm.name.trim(),
              nameRu: serviceForm.nameRu.trim(),
              nameUz: serviceForm.nameUz.trim(),
              stage: serviceForm.stage,
              stageRu: serviceForm.stageRu,
              stageUz: serviceForm.stageUz,
              cost: parseFloat(serviceForm.cost),
            };

            if (editingService) {
              await updateService(editingService.id, serviceData);
              toast.success(t('admin.service.updated'));
            } else {
              const newId = parseInt(serviceForm.id);
              if (isNaN(newId) || newId <= 0) {
                toast.error(t('admin.service.invalid_id'));
                setSubmitting(false);
                return;
              }
              const fullService: Service = { ...serviceData, id: newId };
              await createService(fullService);
              toast.success(t('admin.service.created'));
            }

            await fetchServices();
            setIsServiceModalOpen(false);
            setServiceForm({
              id: '',
              name: '',
              nameRu: '',
              nameUz: '',
              stage: '',
              stageRu: '',
              stageUz: '',
              cost: '',
            });
          } catch (error: any) {
            console.error('Error saving service:', error);
            toast.error(error.message || t('admin.service.save_error'));
          } finally {
            setSubmitting(false);
          }
        }}
        editingService={editingService}
        serviceForm={serviceForm}
        setServiceForm={setServiceForm}
        submitting={submitting}
        availableStages={[]}
      />

      <ImageModal src={zoomedImage} onClose={() => setZoomedImage(null)} />
    </Layout>
  );
}


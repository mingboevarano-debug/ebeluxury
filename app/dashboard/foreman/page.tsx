'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import dynamic from 'next/dynamic';

const DraftDrawing = dynamic(() => import('@/components/DraftDrawing'), {
  ssr: false,
});
import { Contract, Project } from '@/types';
import Countdown from 'react-countdown';
import { getCurrentUser } from '@/lib/auth';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  getContracts,
  getProjectsByForeman,
  createProject,
  updateContract,
  updateProject,
  createReport,
  createWarning,
  createSupplyRequest,
  getDraftsByProject,
  deleteDraft
} from '@/lib/db';
import { FaCamera, FaVideo, FaMapMarkerAlt, FaDollarSign, FaSearch, FaFileAlt, FaChartBar, FaExclamationTriangle, FaPlus, FaPencilRuler, FaEdit, FaTrash } from 'react-icons/fa';
import { MdLocationOn, MdAccessTime, MdCancel, MdWarning } from 'react-icons/md';
import { toast } from 'react-toastify';

export default function ForemanDashboard() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showManageModal, setShowManageModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showSupplyModal, setShowSupplyModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [projectDescription, setProjectDescription] = useState('');
  const [employeeCount, setEmployeeCount] = useState('');
  const [totalWorkers, setTotalWorkers] = useState('');
  const [supplyItems, setSupplyItems] = useState<Array<{ material: string; quantity: string }>>([{ material: '', quantity: '' }]);
  const [supplyNote, setSupplyNote] = useState('');
  const [supplyDeadline, setSupplyDeadline] = useState('');
  const [submittingSupply, setSubmittingSupply] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [showDraftDrawing, setShowDraftDrawing] = useState(false);
  const [editingDraft, setEditingDraft] = useState<any>(null);
  const [drafts, setDrafts] = useState<any[]>([]);
  const { t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (showDraftModal && selectedProject) {
      fetchDrafts();
    }
  }, [showDraftModal, selectedProject]);

  const fetchDrafts = async () => {
    if (!selectedProject) return;
    try {
      const projectDrafts = await getDraftsByProject(selectedProject.id);
      setDrafts(projectDrafts);
    } catch (error) {
      console.error('Error fetching drafts:', error);
    }
  };

  const fetchData = async () => {
    await fetchContracts();
    await fetchProjects();
  };

  const fetchContracts = async () => {
    try {
      const data = await getContracts();
      // Filter for pending contracts that can be picked up
      setContracts(data.filter((c) => c.status === 'pending'));
    } catch (error) {
      console.error('Error fetching contracts:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const data = await getProjectsByForeman(user.id);
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleSelectContract = async (contract: Contract) => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        toast.error('User not found');
        return;
      }

      // 1. Create the project
      await createProject({
        contractId: contract.id,
        foremanId: user.id,
        foremanName: user.name,
        clientName: `${contract.clientName} ${contract.clientSurname}`, // Store client name
        location: contract.location, // Store location
        price: contract.price, // Store price
        status: 'active',
        deadline: contract.deadline,
        description: contract.description || '', // Use contract description as initial
        employeeCount: 0,
        totalWorkers: 0,
      });

      // 2. Update contract status
      await updateContract(contract.id, {
        status: 'in_progress',
        foremanId: user.id,
      });

      // 3. Refresh data
      await fetchData();
    } catch (error) {
      console.error('Error selecting contract:', error);
      toast.error('Failed to select contract');
    }
  };

  const handleUpdateProject = async () => {
    if (!selectedProject) return;

    try {
      await updateProject(selectedProject.id, {
        description: projectDescription,
        employeeCount: employeeCount ? parseInt(employeeCount) : undefined,
        totalWorkers: totalWorkers ? parseInt(totalWorkers) : undefined,
      });

      await fetchProjects();
      setShowManageModal(false);
      setSelectedProject(null);
      setProjectDescription('');
      setEmployeeCount('');
      setTotalWorkers('');
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project');
    }
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Failed to get location');
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
    }
  };

  const handleCaptureMedia = async (type: 'photo' | 'video') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: type === 'video',
      });

      const mediaRecorder = type === 'photo'
        ? null
        : new MediaRecorder(stream);

      if (type === 'photo') {
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        video.addEventListener('loadedmetadata', () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx?.drawImage(video, 0, 0);
          stream.getTracks().forEach(track => track.stop());

          canvas.toBlob(async (blob) => {
            if (blob) {
              const formData = new FormData();
              formData.append('file', blob, 'photo.jpg');
              // Leaving API upload as is for now, assuming it works or will be fixed separately
              const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
              });
              const data = await response.json();
              setPhotos([...photos, data.url]);
            }
          });
        });
      } else {
        const chunks: Blob[] = [];
        if (mediaRecorder) {
          mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
          mediaRecorder.onstop = async () => {
            stream.getTracks().forEach(track => track.stop());
            const blob = new Blob(chunks, { type: 'video/webm' });
            const formData = new FormData();
            formData.append('file', blob, 'video.webm');
            const response = await fetch('/api/upload', {
              method: 'POST',
              body: formData,
            });
            const data = await response.json();
            setVideos([...videos, data.url]);
          };
          mediaRecorder.start();
          setTimeout(() => mediaRecorder.stop(), 5000);
        }
      }
    } catch (error) {
      console.error('Error capturing media:', error);
      toast.error('Failed to access camera');
    }
  };

  const handleSubmitReport = async () => {
    if (!selectedProject || !location) {
      toast.warning('Please capture location first');
      return;
    }

    try {
      await createReport({
        projectId: selectedProject.id,
        description: reportDescription,
        photos,
        videos,
        location,
      });

      setShowReportModal(false);
      setReportDescription('');
      setPhotos([]);
      setVideos([]);
      setLocation(null);
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report');
    }
  };

  const handleSubmitWarning = async () => {
    if (!selectedProject || !warningMessage) {
      toast.warning('Please enter a warning message');
      return;
    }

    try {
      await createWarning({
        projectId: selectedProject.id,
        message: warningMessage,
      });

      setShowWarningModal(false);
      setWarningMessage('');
    } catch (error) {
      console.error('Error submitting warning:', error);
      toast.error('Failed to submit warning');
    }
  };

  const handleSubmitSupplyRequest = async () => {
    if (!selectedProject) return;
    const validItems = supplyItems.filter((i) => i.material.trim() && i.quantity.trim());
    if (validItems.length === 0 || !supplyDeadline) {
      toast.warning(t('foreman.supply_required'));
      return;
    }

    setSubmittingSupply(true);
    try {
      const user = await getCurrentUser();
      if (!user) {
        toast.error('User not found');
        return;
      }

      const items = validItems.map((item) => {
        const material = item.material.trim();
        const quantity = item.quantity.trim();
        return quantity ? `${material} x${quantity}` : material;
      });

      await createSupplyRequest({
        projectId: selectedProject.id,
        projectName: selectedProject.clientName || selectedProject.id.slice(0, 8),
        projectLocation: selectedProject.location,
        foremanId: user.id,
        foremanName: user.name,
        items,
        deadline: new Date(supplyDeadline),
        note: supplyNote.trim() || undefined,
        status: 'pending',
      });

      setShowSupplyModal(false);
      setSupplyItems([{ material: '', quantity: '' }]);
      setSupplyDeadline('');
      setSupplyNote('');
      setSelectedProject(null);
      toast.success(t('foreman.supply_sent'));
    } catch (error) {
      console.error('Error creating supply request:', error);
      toast.error(t('foreman.supply_error'));
    } finally {
      setSubmittingSupply(false);
    }
  };

  return (
    <Layout>
      <div className="px-4 py-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">{t('foreman.title')}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">{t('foreman.contracts')}</h2>
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {contracts.length === 0 ? (
                  <p className="p-4 text-gray-500">{t('foreman.no_contracts')}</p>
                ) : (
                  contracts.map((contract) => (
                    <li key={contract.id} className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {contract.clientName} {contract.clientSurname}
                        </p>
                        <p className="text-sm text-gray-500">{contract.location}</p>
                        <p className="text-sm text-gray-500">{contract.price} UZS</p>
                        <p className="text-sm text-gray-500 mt-1">{contract.description}</p>
                        <button
                          onClick={() => handleSelectContract(contract)}
                          className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm"
                        >
                          {t('foreman.select_project')}
                        </button>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">{t('foreman.projects')}</h2>
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {projects.length === 0 ? (
                  <p className="p-4 text-gray-500">{t('foreman.no_projects')}</p>
                ) : (
                  projects.map((project) => (
                    <li key={project.id} className="px-6 py-6 hover:bg-gray-50 transition-colors">
                      <div className="space-y-4">
                        {/* Header: Client Name & Status */}
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-bold text-gray-900">
                            {project.clientName || `${t('table.project')} ${project.id.slice(0, 8)}`}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${project.status === 'active'
                            ? 'bg-green-100 text-green-800 border border-green-300'
                            : 'bg-gray-100 text-gray-800 border border-gray-300'
                            }`}>
                            {project.status.toUpperCase()}
                          </span>
                        </div>

                        {/* Location & Price */}
                        <div className="grid grid-cols-2 gap-4">
                          {project.location && (
                            <div className="flex items-start space-x-2">
                              <MdLocationOn className="w-5 h-5 text-gray-400 mt-0.5" />
                              <div>
                                <p className="text-xs text-gray-500 font-medium">{t('seller.location')}</p>
                                <p className="text-sm text-gray-900">{project.location}</p>
                              </div>
                            </div>
                          )}
                          {project.price && (
                            <div className="flex items-start space-x-2">
                              <FaDollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                              <div>
                                <p className="text-xs text-gray-500 font-medium">{t('table.price')}</p>
                                <p className="text-sm font-bold text-green-600">{project.price} UZS</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Countdown Timer - LARGE & VISIBLE */}
                        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-xl p-4">
                          <p className="text-xs font-semibold text-indigo-600 mb-2 uppercase tracking-wide flex items-center">
                            <MdAccessTime className="w-4 h-4 mr-1" />
                            {t('foreman.deadline')}
                          </p>
                          <Countdown
                            date={new Date(project.deadline)}
                            renderer={({ days, hours, minutes, seconds, completed }) => {
                              if (completed) {
                                return (
                                  <div className="flex items-center space-x-2 text-red-600">
                                    <MdCancel className="w-6 h-6" />
                                    <span className="text-xl font-black">{t('status.expired')}</span>
                                  </div>
                                );
                              }
                              const isUrgent = days === 0;
                              return (
                                <div className={`flex items-center space-x-3 ${isUrgent ? 'text-red-600 animate-pulse' : 'text-indigo-700'}`}>
                                  {isUrgent && (
                                    <MdWarning className="w-6 h-6 animate-bounce" />
                                  )}
                                  <span className="text-3xl font-black font-mono">
                                    {days}{t('timer.days')} {hours}{t('timer.hours')} {minutes}{t('timer.minutes')} {seconds}{t('timer.seconds')}
                                  </span>
                                </div>
                              );
                            }}
                          />
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(project.deadline).toLocaleString()}
                          </p>
                        </div>

                        {/* Description */}
                        {project.description && (
                          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <p className="text-xs font-semibold text-gray-600 mb-1">{t('seller.description')}</p>
                            <p className="text-sm text-gray-700">{project.description}</p>
                          </div>
                        )}

                        {/* Workers Info */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                            <p className="text-xs text-blue-600 font-medium">{t('foreman.emp_count')}</p>
                            <p className="text-2xl font-bold text-blue-700">{project.employeeCount || 0}</p>
                          </div>
                          <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                            <p className="text-xs text-purple-600 font-medium">{t('foreman.total_workers')}</p>
                            <p className="text-2xl font-bold text-purple-700">{project.totalWorkers || 0}</p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                          <button
                            onClick={() => {
                              router.push(`/dashboard/foreman/${project.id}/services`);
                            }}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-md transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
                          >
                            <FaSearch className="w-5 h-5" />
                            <span>{t('foreman.more_details') || 'More Details'}</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProject(project);
                              setProjectDescription(project.description || '');
                              setEmployeeCount(project.employeeCount?.toString() || '');
                              setTotalWorkers(project.totalWorkers?.toString() || '');
                              setShowManageModal(true);
                            }}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-md transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
                          >
                            <FaFileAlt className="w-5 h-5" />
                            <span>{t('foreman.manage')}</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProject(project);
                              setShowReportModal(true);
                            }}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-md transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
                          >
                            <FaChartBar className="w-5 h-5" />
                            <span>{t('foreman.send_report')}</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProject(project);
                              setShowWarningModal(true);
                            }}
                            className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-md transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
                          >
                            <FaExclamationTriangle className="w-5 h-5" />
                            <span>{t('foreman.send_warning')}</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProject(project);
                              setShowSupplyModal(true);
                            }}
                            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-md transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
                          >
                            <FaFileAlt className="w-5 h-5" />
                            <span>{t('foreman.request_supply')}</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProject(project);
                              setShowDraftModal(true);
                            }}
                            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-md transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
                          >
                            <FaPencilRuler className="w-5 h-5" />
                            <span>{t('foreman.draw_draft')}</span>
                          </button>
                        </div>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Manage Project Modal */}
        {showManageModal && selectedProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">
                {t('foreman.details')} - {selectedProject.clientName || selectedProject.id.slice(0, 8)}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('foreman.project_desc')}
                  </label>
                  <textarea
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder={t('foreman.desc_placeholder')}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('foreman.emp_count')}
                    </label>
                    <input
                      type="number"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      value={employeeCount}
                      onChange={(e) => setEmployeeCount(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('foreman.total_workers')}
                    </label>
                    <input
                      type="number"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      value={totalWorkers}
                      onChange={(e) => setTotalWorkers(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleUpdateProject}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
                  >
                    {t('foreman.update_btn')}
                  </button>
                  <button
                    onClick={() => {
                      setShowManageModal(false);
                      setSelectedProject(null);
                      setProjectDescription('');
                      setEmployeeCount('');
                      setTotalWorkers('');
                    }}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
                  >
                    {t('foreman.close_btn')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showReportModal && selectedProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4">
              <h2 className="text-xl font-semibold mb-4">{t('foreman.send_report')}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('table.description')}
                  </label>
                  <textarea
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleCaptureMedia('photo')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center space-x-2"
                  >
                    <FaCamera className="w-4 h-4" />
                    <span>{t('foreman.capture_photo')}</span>
                  </button>
                  <button
                    onClick={() => handleCaptureMedia('video')}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md flex items-center space-x-2"
                  >
                    <FaVideo className="w-4 h-4" />
                    <span>{t('foreman.capture_video')}</span>
                  </button>
                  <button
                    onClick={handleGetLocation}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center space-x-2"
                  >
                    <FaMapMarkerAlt className="w-4 h-4" />
                    <span>{t('foreman.get_location')}</span>
                  </button>
                </div>
                {location && (
                  <p className="text-sm text-gray-600">
                    {t('table.location')}: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                  </p>
                )}
                {photos.length > 0 && <p className="text-sm text-gray-600">{photos.length} photos captured</p>}
                {videos.length > 0 && <p className="text-sm text-gray-600">{videos.length} videos captured</p>}

                <div className="flex space-x-2">
                  <button
                    onClick={handleSubmitReport}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
                  >
                    {t('foreman.submit_report')}
                  </button>
                  <button
                    onClick={() => {
                      setShowReportModal(false);
                      setReportDescription('');
                      setPhotos([]);
                      setVideos([]);
                      setLocation(null);
                    }}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
                  >
                    {t('foreman.cancel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showWarningModal && selectedProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
              <h2 className="text-xl font-semibold mb-4">{t('foreman.send_warning')}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('foreman.warning_msg')}
                  </label>
                  <textarea
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={warningMessage}
                    onChange={(e) => setWarningMessage(e.target.value)}
                    placeholder={t('foreman.warning_placeholder')}
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleSubmitWarning}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md"
                  >
                    {t('foreman.submit_warning')}
                  </button>
                  <button
                    onClick={() => {
                      setShowWarningModal(false);
                      setWarningMessage('');
                    }}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
                  >
                    {t('foreman.cancel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showSupplyModal && selectedProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4">
              <h2 className="text-xl font-semibold mb-4">{t('foreman.request_supply')}</h2>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-700">
                  {t('foreman.supply_hint')}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('foreman.items_needed')}</label>
                  <div className="space-y-3 mt-2">
                    {supplyItems.map((item, idx) => (
                      <div key={idx} className="flex items-center space-x-2 group">
                        <input
                          type="text"
                          className="flex-1 px-4 py-3 rounded-lg border-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all shadow-sm hover:border-gray-300"
                          value={item.material}
                          onChange={(e) => {
                            const copy = [...supplyItems];
                            copy[idx] = { ...copy[idx], material: e.target.value };
                            setSupplyItems(copy);
                          }}
                          placeholder={t('foreman.material_placeholder')}
                        />
                        <input
                          type="text"
                          className="w-24 px-4 py-3 rounded-lg border-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all shadow-sm hover:border-gray-300"
                          value={item.quantity}
                          onChange={(e) => {
                            const copy = [...supplyItems];
                            copy[idx] = { ...copy[idx], quantity: e.target.value };
                            setSupplyItems(copy);
                          }}
                          placeholder={t('foreman.quantity_placeholder')}
                        />
                        <button
                          type="button"
                          onClick={() => setSupplyItems([...supplyItems, { material: '', quantity: '' }])}
                          className="px-3 py-3 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white border-2 border-orange-500 hover:from-orange-600 hover:to-orange-700 hover:border-orange-600 shadow-md transition-all transform hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap flex items-center justify-center"
                          aria-label={t('foreman.add_item')}
                          title={t('foreman.add_item')}
                        >
                          <FaPlus className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('foreman.deadline')}</label>
                  <input
                    type="datetime-local"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={supplyDeadline}
                    onChange={(e) => setSupplyDeadline(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('foreman.note_optional')}</label>
                  <textarea
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={supplyNote}
                    onChange={(e) => setSupplyNote(e.target.value)}
                    placeholder={t('foreman.note_optional')}
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleSubmitSupplyRequest}
                    disabled={submittingSupply}
                    className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white px-4 py-2 rounded-md"
                  >
                    {submittingSupply ? t('foreman.saving') : t('foreman.submit_supply')}
                  </button>
                  <button
                    onClick={() => {
                      setShowSupplyModal(false);
                      setSupplyItems([{ material: '', quantity: '' }]);
                      setSupplyDeadline('');
                      setSupplyNote('');
                    }}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
                  >
                    {t('foreman.cancel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Draft Modal */}
        {showDraftModal && selectedProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">{t('foreman.draft.manage_drafts')}</h2>
                <button
                  onClick={() => setShowDraftModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
              <div className="mb-4">
                <button
                  onClick={async () => {
                    setEditingDraft(null);
                    const user = await getCurrentUser();
                    if (user && selectedProject) {
                      setShowDraftDrawing(true);
                    }
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                >
                  <FaPlus />
                  <span>{t('foreman.draft.new_draft')}</span>
                </button>
              </div>
              <div className="space-y-2">
                {drafts.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">{t('foreman.draft.no_drafts')}</p>
                ) : (
                  drafts.map((draft) => (
                    <div key={draft.id} className="border rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{draft.title}</h3>
                        {draft.description && <p className="text-sm text-gray-600">{draft.description}</p>}
                        <p className="text-xs text-gray-500">{new Date(draft.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setEditingDraft(draft);
                            setShowDraftDrawing(true);
                          }}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm(t('foreman.draft.confirm_delete'))) {
                              try {
                                await deleteDraft(draft.id);
                                setDrafts(drafts.filter(d => d.id !== draft.id));
                                toast.success(t('foreman.draft.deleted'));
                              } catch (error) {
                                toast.error(t('foreman.draft.delete_error'));
                              }
                            }
                          }}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Draft Drawing Component */}
        {showDraftDrawing && selectedProject && (
          <DraftDrawing
            isOpen={showDraftDrawing}
            onClose={() => {
              setShowDraftDrawing(false);
              setEditingDraft(null);
            }}
            projectId={selectedProject.id}
            foremanId={selectedProject.foremanId}
            foremanName={selectedProject.foremanName}
            editingDraft={editingDraft}
            onSave={async () => {
              if (selectedProject) {
                const projectDrafts = await getDraftsByProject(selectedProject.id);
                setDrafts(projectDrafts);
              }
              toast.success(t('foreman.draft.saved'));
            }}
          />
        )}
      </div>
    </Layout>
  );
}


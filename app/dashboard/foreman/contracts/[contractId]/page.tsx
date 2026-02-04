'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Layout from '@/components/Layout';
import { Contract, Project, ProjectImage, User, Expense } from '@/types';
import {
  getContractById,
  getProjectsByForeman,
  getExpenses,
  createProject,
  updateContract,
  updateProject,
  createReport,
  createWarning,
  createSupplyRequest,
  getDraftsByProject,
  deleteDraft,
} from '@/lib/db';
import {
  createProjectImage,
  getProjectImagesByProject,
  deleteProjectImage,
} from '@/lib/projectImages';
import { getCurrentUser } from '@/lib/auth';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatNumberWithSpaces } from '@/lib/formatNumber';
import {
  FaArrowLeft,
  FaBuilding,
  FaUser,
  FaPhone,
  FaMapMarkerAlt,
  FaCalendar,
  FaFileAlt,
  FaSearch,
  FaKey,
  FaChartBar,
  FaCamera,
  FaVideo,
  FaExclamationTriangle,
  FaPencilRuler,
  FaEdit,
  FaTrash,
  FaPlus,
  FaImage,
  FaUpload,
} from 'react-icons/fa';
import { MdLocationOn, MdAccessTime, MdCancel, MdWarning } from 'react-icons/md';
import { toast } from 'react-toastify';

const Countdown = dynamic(() => import('react-countdown').then((mod) => mod.default), {
  ssr: false,
  loading: () => <span className="text-indigo-700 font-mono">...</span>,
});
const DraftDrawing = dynamic(() => import('@/components/DraftDrawing'), { ssr: false });

export default function ForemanContractDetailPage() {
  const router = useRouter();
  const params = useParams();
  const contractId = params?.contractId as string;
  const { t } = useLanguage();

  const [contract, setContract] = useState<Contract | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);

  // Modal state
  const [showManageModal, setShowManageModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showSupplyModal, setShowSupplyModal] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [showDraftDrawing, setShowDraftDrawing] = useState(false);
  const [editingDraft, setEditingDraft] = useState<any>(null);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [projectDescription, setProjectDescription] = useState('');
  const [employeeCount, setEmployeeCount] = useState('');
  const [totalWorkers, setTotalWorkers] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [warningMessage, setWarningMessage] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [supplyItems, setSupplyItems] = useState<Array<{ material: string; quantity: string }>>([{ material: '', quantity: '' }]);
  const [supplyNote, setSupplyNote] = useState('');
  const [supplyDeadline, setSupplyDeadline] = useState('');
  const [submittingSupply, setSubmittingSupply] = useState(false);

  // Project images
  const [showProjectImageModal, setShowProjectImageModal] = useState(false);
  const [projectImages, setProjectImages] = useState<ProjectImage[]>([]);
  const [imageDescription, setImageDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<ProjectImage | null>(null);
  const [imageZoomLevel, setImageZoomLevel] = useState(1);

  useEffect(() => {
    fetchData();
  }, [contractId]);

  useEffect(() => {
    if (showDraftModal && project) {
      getDraftsByProject(project.id).then(setDrafts).catch(console.error);
    }
  }, [showDraftModal, project]);

  useEffect(() => {
    if (project) {
      getProjectImagesByProject(project.id).then(setProjectImages).catch(console.error);
    }
  }, [project]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && zoomedImage) setZoomedImage(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [zoomedImage]);

  const fetchData = async () => {
    if (!contractId) return;

    setLoading(true);
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }

      if (currentUser.role !== 'foreman') {
        router.push(`/dashboard/${currentUser.role}`);
        return;
      }

      setUser(currentUser);

      const [contractData, foremanProjects, allExpenses] = await Promise.all([
        getContractById(contractId),
        getProjectsByForeman(currentUser.id),
        getExpenses(),
      ]);

      if (!contractData) {
        toast.error(t('finance.contract_not_found') || 'Contract not found');
        router.push('/dashboard/foreman');
        return;
      }

      setContract(contractData);

      const projectForContract = foremanProjects.find((p) => p.contractId === contractId);
      setProject(projectForContract || null);

      const contractExpenses = allExpenses.filter((e) => e.projectId === contractId);
      setExpenses(contractExpenses);
    } catch (error) {
      console.error('Error fetching contract:', error);
      toast.error(t('finance.load_error') || 'Failed to load contract');
      router.push('/dashboard/foreman');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectContract = async () => {
    if (!contract || !user) return;

    setSelecting(true);
    try {
      await createProject({
        contractId: contract.id,
        foremanId: user.id,
        foremanName: user.name,
        clientName: `${contract.clientName} ${contract.clientSurname}`,
        location: contract.location,
        constructionName: contract.constructionName,
        price: contract.price,
        status: 'active',
        deadline: contract.deadline,
        description: contract.description || '',
        employeeCount: 0,
        totalWorkers: 0,
      });

      await updateContract(contract.id, {
        status: 'in_progress',
        foremanId: user.id,
      });

      toast.success(t('foreman.select_project') || 'Project selected successfully');
      await fetchData();
    } catch (error) {
      console.error('Error selecting contract:', error);
      toast.error('Failed to select contract');
    } finally {
      setSelecting(false);
    }
  };

  const handleUpdateProject = async () => {
    if (!project) return;
    try {
      await updateProject(project.id, {
        description: projectDescription,
        employeeCount: employeeCount ? parseInt(employeeCount) : undefined,
        totalWorkers: totalWorkers ? parseInt(totalWorkers) : undefined,
      });
      await fetchData();
      setShowManageModal(false);
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
        (position) => setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Failed to get location');
        }
      );
    } else {
      toast.error('Geolocation is not supported');
    }
  };

  const handleCaptureMedia = async (type: 'photo' | 'video') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: type === 'video' });
      const mediaRecorder = type === 'photo' ? null : new MediaRecorder(stream);
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
          stream.getTracks().forEach((track) => track.stop());
          canvas.toBlob(async (blob) => {
            if (blob) {
              const formData = new FormData();
              formData.append('file', blob, 'photo.jpg');
              const response = await fetch('/api/upload', { method: 'POST', body: formData });
              const data = await response.json();
              setPhotos((p) => [...p, data.url]);
            }
          });
        });
      } else if (mediaRecorder) {
        const chunks: Blob[] = [];
        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = async () => {
          stream.getTracks().forEach((track) => track.stop());
          const blob = new Blob(chunks, { type: 'video/webm' });
          const formData = new FormData();
          formData.append('file', blob, 'video.webm');
          const response = await fetch('/api/upload', { method: 'POST', body: formData });
          const data = await response.json();
          setVideos((v) => [...v, data.url]);
        };
        mediaRecorder.start();
        setTimeout(() => mediaRecorder.stop(), 5000);
      }
    } catch (error) {
      console.error('Error capturing media:', error);
      toast.error('Failed to access camera');
    }
  };

  const handleSubmitReport = async () => {
    if (!project || !location) {
      toast.warning('Please capture location first');
      return;
    }
    try {
      await createReport({
        projectId: project.id,
        foremanId: project.foremanId,
        foremanName: project.foremanName || '',
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
      toast.success(t('foreman.submit_report') || 'Report submitted');
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report');
    }
  };

  const handleUploadProjectImage = async () => {
    if (!project || !user || !imageDescription.trim()) {
      toast.warning(t('foreman.project_image.description_required') || 'Please enter a description');
      return;
    }
    if (!imageFile) {
      toast.warning(t('foreman.project_image.file_required') || 'Please select an image');
      return;
    }
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await response.json();
      if (!response.ok || !data.url) {
        throw new Error(data.error || 'Upload failed');
      }
      await createProjectImage({
        projectId: project.id,
        imageUrl: data.url,
        description: imageDescription.trim(),
        foremanId: project.foremanId,
        foremanName: project.foremanName || '',
      });
      const updated = await getProjectImagesByProject(project.id);
      setProjectImages(updated);
      setShowProjectImageModal(false);
      setImageDescription('');
      setImageFile(null);
      toast.success(t('foreman.project_image.uploaded') || 'Image uploaded');
    } catch (error: any) {
      console.error('Error uploading project image:', error);
      toast.error(error.message || t('foreman.project_image.upload_error') || 'Upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteProjectImage = async (id: string) => {
    if (!confirm(t('foreman.project_image.confirm_delete') || 'Delete this image?')) return;
    try {
      await deleteProjectImage(id);
      setProjectImages((prev) => prev.filter((img) => img.id !== id));
      toast.success(t('foreman.project_image.deleted') || 'Image deleted');
    } catch (error) {
      toast.error(t('foreman.project_image.delete_error') || 'Failed to delete');
    }
  };

  const handleSubmitWarning = async () => {
    if (!project || !warningMessage) {
      toast.warning('Please enter a warning message');
      return;
    }
    try {
      await createWarning({
        projectId: project.id,
        projectName: project.clientName || project.constructionName || project.id,
        foremanId: project.foremanId,
        foremanName: project.foremanName || '',
        message: warningMessage,
        status: 'pending',
      });
      setShowWarningModal(false);
      setWarningMessage('');
      toast.success(t('foreman.submit_warning') || 'Warning submitted');
    } catch (error) {
      console.error('Error submitting warning:', error);
      toast.error('Failed to submit warning');
    }
  };

  const handleSubmitSupplyRequest = async () => {
    if (!project || !user) return;
    const validItems = supplyItems.filter((i) => i.material.trim() && i.quantity.trim());
    if (validItems.length === 0 || !supplyDeadline) {
      toast.warning(t('foreman.supply_required') || 'Please add items and deadline');
      return;
    }
    setSubmittingSupply(true);
    try {
      const items = validItems.map((i) => `${i.material.trim()} x${i.quantity.trim()}`);
      const requestId = await createSupplyRequest({
        projectId: project.id,
        projectName: project.clientName || project.id.slice(0, 8),
        projectLocation: project.location,
        foremanId: user.id,
        foremanName: user.name,
        items,
        deadline: new Date(supplyDeadline),
        note: supplyNote.trim() || undefined,
        status: 'pending',
      });
      try {
        await fetch('/api/notify-supply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requestId,
            projectName: project.clientName || project.id.slice(0, 8),
            projectLocation: project.location,
            foremanName: user.name,
            items,
            deadline: new Date(supplyDeadline).toISOString(),
          }),
        });
      } catch (notifyErr) {
        console.error('Supply Telegram notify failed:', notifyErr);
      }
      setShowSupplyModal(false);
      setSupplyItems([{ material: '', quantity: '' }]);
      setSupplyDeadline('');
      setSupplyNote('');
      toast.success(t('foreman.supply_sent') || 'Supply request sent');
    } catch (error) {
      console.error('Error creating supply request:', error);
      toast.error(t('foreman.supply_error') || 'Failed to send supply request');
    } finally {
      setSubmittingSupply(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-xl text-gray-600">{t('finance.loading') || 'Loading...'}</div>
        </div>
      </Layout>
    );
  }

  if (!contract) {
    return null;
  }

  const canSelect = contract.status === 'pending' && !project;
  const canViewProject = contract.status === 'in_progress' && project;

  return (
    <Layout>
      <div className="px-3 sm:px-4 py-4 sm:py-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <button
            onClick={() => router.push('/dashboard/foreman')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-3 sm:mb-4"
          >
            <FaArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="truncate">{t('foreman.back_to_projects') || 'Back to Dashboard'}</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
            {t('finance.contract_details') || 'Contract Details'}
          </h1>
        </div>

        {/* Mening Loyihalarim (My Projects) - First/Top */}
        {canViewProject && project && (
          <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">{t('foreman.projects')}</h2>
            <div className="border rounded-lg p-4 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">{project.clientName || project.id.slice(0, 8)}</h3>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-300">
                  {project.status?.toUpperCase() || 'ACTIVE'}
                </span>
              </div>
              {project.location && (
                <div className="flex items-start space-x-2">
                  <MdLocationOn className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium">{t('seller.location')}</p>
                    <p className="text-sm text-gray-900">{project.location}</p>
                  </div>
                </div>
              )}
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-xl p-3 sm:p-4">
                <p className="text-xs font-semibold text-indigo-600 mb-2 uppercase flex items-center">
                  <MdAccessTime className="w-4 h-4 mr-1 flex-shrink-0" />
                  {t('foreman.deadline')}
                </p>
                <Countdown
                  date={new Date(project.deadline)}
                  renderer={({ days, hours, minutes, seconds, completed }) => {
                    if (completed) {
                      return (
                        <div className="flex items-center space-x-2 text-red-600">
                          <MdCancel className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                          <span className="text-lg sm:text-xl font-black">{t('status.expired')}</span>
                        </div>
                      );
                    }
                    const isUrgent = days === 0;
                    return (
                      <div className={`flex flex-wrap items-center gap-2 sm:gap-3 ${isUrgent ? 'text-red-600 animate-pulse' : 'text-indigo-700'}`}>
                        {isUrgent && <MdWarning className="w-5 h-5 sm:w-6 sm:h-6 animate-bounce flex-shrink-0" />}
                        <span className="text-xl sm:text-2xl md:text-3xl font-black font-mono break-all">
                          {days}{t('timer.days')} {hours}{t('timer.hours')} {minutes}{t('timer.minutes')} {seconds}{t('timer.seconds')}
                        </span>
                      </div>
                    );
                  }}
                />
                <p className="text-xs text-gray-500 mt-2">{new Date(project.deadline).toLocaleString()}</p>
              </div>
              {project.description && (
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 mb-1">{t('seller.description')}</p>
                  <p className="text-sm text-gray-700">{project.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <p className="text-xs text-blue-600 font-medium">{t('foreman.emp_count')}</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-700">{project.employeeCount || 0}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                  <p className="text-xs text-purple-600 font-medium">{t('foreman.total_workers')}</p>
                  <p className="text-xl sm:text-2xl font-bold text-purple-700">{project.totalWorkers || 0}</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 pt-2 border-t border-gray-200">
                <button
                  onClick={() => router.push(`/dashboard/foreman/${project.id}/services`)}
                  className="flex-1 min-w-0 sm:min-w-[140px] bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center space-x-2"
                >
                  <FaSearch className="w-5 h-5 flex-shrink-0" />
                  <span>{t('foreman.more_details') || 'Details'}</span>
                </button>
                <button
                  onClick={() => {
                    setProjectDescription(project.description || '');
                    setEmployeeCount(project.employeeCount?.toString() || '');
                    setTotalWorkers(project.totalWorkers?.toString() || '');
                    setShowManageModal(true);
                  }}
                  className="flex-1 min-w-0 sm:min-w-[140px] bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center space-x-2"
                >
                  <FaFileAlt className="w-5 h-5 flex-shrink-0" />
                  <span>{t('foreman.manage')}</span>
                </button>
                <button
                  onClick={() => setShowReportModal(true)}
                  className="flex-1 min-w-0 sm:min-w-[140px] bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center space-x-2"
                >
                  <FaChartBar className="w-5 h-5 flex-shrink-0" />
                  <span>{t('foreman.send_report')}</span>
                </button>
                <button
                  onClick={() => setShowWarningModal(true)}
                  className="flex-1 min-w-0 sm:min-w-[140px] bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center space-x-2"
                >
                  <FaExclamationTriangle className="w-5 h-5 flex-shrink-0" />
                  <span>{t('foreman.send_warning')}</span>
                </button>
                <button
                  onClick={() => setShowSupplyModal(true)}
                  className="flex-1 min-w-0 sm:min-w-[140px] bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center space-x-2"
                >
                  <FaFileAlt className="w-5 h-5 flex-shrink-0" />
                  <span>{t('foreman.request_supply')}</span>
                </button>
                <button
                  onClick={() => setShowDraftModal(true)}
                  className="flex-1 min-w-0 sm:min-w-[140px] bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center space-x-2"
                >
                  <FaPencilRuler className="w-5 h-5 flex-shrink-0" />
                  <span>{t('foreman.draw_draft')}</span>
                </button>
                <button
                  onClick={() => setShowProjectImageModal(true)}
                  className="flex-1 min-w-0 sm:min-w-[140px] bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center space-x-2"
                >
                  <FaImage className="w-5 h-5 flex-shrink-0" />
                  <span>{t('foreman.project_image.upload')}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Project Images Section */}
        {canViewProject && project && (
          <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center space-x-2">
              <FaImage className="text-teal-600" />
              <span>{t('foreman.project_image.title')}</span>
            </h2>
            {projectImages.length === 0 ? (
              <p className="text-gray-500 text-sm py-4">{t('foreman.project_image.no_images')}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {projectImages.map((img) => (
                  <div key={img.id} className="border rounded-lg overflow-hidden bg-gray-50">
                    <div
                      className="w-full h-40 overflow-hidden cursor-zoom-in bg-gray-100"
                      onClick={() => { setZoomedImage(img); setImageZoomLevel(1); }}
                    >
                      <img src={img.imageUrl} alt={img.description} className="w-full h-full object-cover hover:opacity-90 transition-opacity" />
                    </div>
                    <div className="p-3">
                      <p className="text-sm text-gray-700">{img.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{new Date(img.createdAt).toLocaleString()}</p>
                      <button
                        onClick={() => handleDeleteProjectImage(img.id)}
                        className="mt-2 text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
                      >
                        <FaTrash className="w-3 h-3" />
                        {t('foreman.project_image.delete')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Contract Information Card */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center space-x-2">
            <FaBuilding className="text-indigo-600" />
            <span>{t('finance.contract_info') || 'Contract Information'}</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500 flex items-center space-x-2 mb-1">
                <FaUser />
                <span>{t('finance.contract.client') || 'Client'}</span>
              </label>
              <p className="text-lg text-gray-900">
                {contract.clientName} {contract.clientSurname}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500 flex items-center space-x-2 mb-1">
                <FaPhone />
                <span>{t('finance.contract.phone') || 'Phone'}</span>
              </label>
              <p className="text-lg text-gray-900">{contract.clientPhone}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500 flex items-center space-x-2 mb-1">
                <FaMapMarkerAlt />
                <span>{t('finance.contract.location') || 'Location'}</span>
              </label>
              <p className="text-lg text-gray-900">{contract.location}</p>
            </div>

            {contract.constructionName && (
              <div>
                <label className="text-sm font-medium text-gray-500 mb-1">
                  {t('finance.contract.construction') || 'Construction Name'}
                </label>
                <p className="text-lg text-gray-900">{contract.constructionName}</p>
              </div>
            )}

            {contract.doorPassword && (
              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center space-x-2 mb-1">
                  <FaKey />
                  <span>{t('foreman.door_code') || 'Door Code'}</span>
                </label>
                <p className="text-lg font-mono font-semibold text-gray-900 bg-gray-100 px-3 py-2 rounded-lg">
                  {contract.doorPassword}
                </p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-500 flex items-center space-x-2 mb-1">
                <FaCalendar />
                <span>{t('finance.contract.deadline') || 'Deadline'}</span>
              </label>
              <p className="text-lg text-gray-900">
                {new Date(contract.deadline).toLocaleDateString()}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500 mb-1">
                {t('finance.contract.status') || 'Status'}
              </label>
              <span
                className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                  contract.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : contract.status === 'in_progress'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {t(`status.${contract.status}` as any) || contract.status}
              </span>
            </div>

            {contract.description && (
              <div className="md:col-span-2 lg:col-span-3">
                <label className="text-sm font-medium text-gray-500 flex items-center space-x-2 mb-1">
                  <FaFileAlt />
                  <span>{t('finance.contract.description') || 'Description'}</span>
                </label>
                <p className="text-lg text-gray-900">{contract.description}</p>
              </div>
            )}
          </div>

          {/* Expenses Section */}
          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center space-x-2">
              <FaChartBar className="text-red-600" />
              <span>{t('finance.expenses') || 'Expenses'} ({expenses.length})</span>
            </h2>
            {expenses.length === 0 ? (
              <p className="text-gray-500 py-4">{t('finance.no_expenses') || 'No expenses for this contract.'}</p>
            ) : (
              <>
                <div className="overflow-x-auto overflow-y-hidden rounded-lg border border-gray-200 -mx-2 sm:mx-0">
                    <table className="min-w-[600px] sm:min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('finance.table.date')}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('finance.table.name')}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('finance.table.category')}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('finance.table.to_whom')}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('finance.table.total')}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('finance.table.payment_method')}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {expenses.map((expense) => (
                        <tr key={expense.id}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {new Date(expense.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{expense.name || '-'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{expense.categoryName}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{expense.toWhom}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-red-600">
                            {formatNumberWithSpaces(expense.amount.toString())} UZS
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {t(`finance.payment_method.${expense.paymentMethod}`)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-4 text-lg font-semibold text-red-600">
                  {t('foreman.total_expenses') || 'Total expenses'}: {formatNumberWithSpaces(expenses.filter(e => !e.approvalStatus || e.approvalStatus === 'approved').reduce((sum, e) => sum + e.amount, 0).toString())} UZS
                </p>
              </>
            )}
          </div>

          {/* Select Project (pending contracts) */}
          {canSelect && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={handleSelectContract}
                disabled={selecting}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-colors"
              >
                <FaSearch className="w-5 h-5" />
                <span>{selecting ? (t('foreman.saving') || 'Saving...') : t('foreman.select_project')}</span>
              </button>
            </div>
          )}
        </div>

        {/* Modals */}
        {showManageModal && project && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
            <div className="bg-white p-4 sm:p-6 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">{t('foreman.details')} - {project.clientName}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('foreman.project_desc')}</label>
                  <textarea rows={4} className="mt-1 block w-full rounded-md border-gray-300" value={projectDescription} onChange={(e) => setProjectDescription(e.target.value)} placeholder={t('foreman.desc_placeholder')} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('foreman.emp_count')}</label>
                    <input type="number" className="mt-1 block w-full rounded-md border-gray-300" value={employeeCount} onChange={(e) => setEmployeeCount(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('foreman.total_workers')}</label>
                    <input type="number" className="mt-1 block w-full rounded-md border-gray-300" value={totalWorkers} onChange={(e) => setTotalWorkers(e.target.value)} />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button onClick={handleUpdateProject} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md">{t('foreman.update_btn')}</button>
                  <button onClick={() => { setShowManageModal(false); setProjectDescription(''); setEmployeeCount(''); setTotalWorkers(''); }} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md">{t('foreman.close_btn')}</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showReportModal && project && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
            <div className="bg-white p-4 sm:p-6 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">{t('foreman.send_report')}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('table.description')}</label>
                  <textarea rows={4} className="mt-1 block w-full rounded-md border-gray-300" value={reportDescription} onChange={(e) => setReportDescription(e.target.value)} />
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
                  <button onClick={() => handleCaptureMedia('photo')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center justify-center space-x-2"><FaCamera className="w-4 h-4 flex-shrink-0" /><span>{t('foreman.capture_photo')}</span></button>
                  <button onClick={() => handleCaptureMedia('video')} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md flex items-center justify-center space-x-2"><FaVideo className="w-4 h-4 flex-shrink-0" /><span>{t('foreman.capture_video')}</span></button>
                  <button onClick={handleGetLocation} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center justify-center space-x-2"><FaMapMarkerAlt className="w-4 h-4 flex-shrink-0" /><span>{t('foreman.get_location')}</span></button>
                </div>
                {location && <p className="text-sm text-gray-600">{t('table.location')}: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</p>}
                {photos.length > 0 && <p className="text-sm text-gray-600">{photos.length} photos</p>}
                {videos.length > 0 && <p className="text-sm text-gray-600">{videos.length} videos</p>}
                <div className="flex space-x-2">
                  <button onClick={handleSubmitReport} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md">{t('foreman.submit_report')}</button>
                  <button onClick={() => { setShowReportModal(false); setReportDescription(''); setPhotos([]); setVideos([]); setLocation(null); }} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md">{t('foreman.cancel')}</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showWarningModal && project && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
            <div className="bg-white p-4 sm:p-6 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">{t('foreman.send_warning')}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('foreman.warning_msg')}</label>
                  <textarea rows={4} className="mt-1 block w-full rounded-md border-gray-300" value={warningMessage} onChange={(e) => setWarningMessage(e.target.value)} placeholder={t('foreman.warning_placeholder')} />
                </div>
                <div className="flex space-x-2">
                  <button onClick={handleSubmitWarning} className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md">{t('foreman.submit_warning')}</button>
                  <button onClick={() => { setShowWarningModal(false); setWarningMessage(''); }} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md">{t('foreman.cancel')}</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showSupplyModal && project && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
            <div className="bg-white p-4 sm:p-6 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">{t('foreman.request_supply')}</h2>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-700">{t('foreman.supply_hint')}</div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('foreman.items_needed')}</label>
                  <div className="space-y-3">
                    {supplyItems.map((item, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <input type="text" className="flex-1 min-w-0 px-4 py-3 rounded-lg border-2 border-gray-200" value={item.material} onChange={(e) => { const c = [...supplyItems]; c[idx] = { ...c[idx], material: e.target.value }; setSupplyItems(c); }} placeholder={t('foreman.material_placeholder')} />
                        <div className="flex gap-2">
                          <input type="text" className="w-20 sm:w-24 px-4 py-3 rounded-lg border-2 border-gray-200" value={item.quantity} onChange={(e) => { const c = [...supplyItems]; c[idx] = { ...c[idx], quantity: e.target.value }; setSupplyItems(c); }} placeholder={t('foreman.quantity_placeholder')} />
                          <button type="button" onClick={() => setSupplyItems([...supplyItems, { material: '', quantity: '' }])} className="px-3 py-3 rounded-lg bg-orange-600 text-white flex-shrink-0"><FaPlus className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('foreman.deadline')}</label>
                  <input type="datetime-local" className="mt-1 block w-full rounded-md border-gray-300" value={supplyDeadline} onChange={(e) => setSupplyDeadline(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('foreman.note_optional')}</label>
                  <textarea rows={3} className="mt-1 block w-full rounded-md border-gray-300" value={supplyNote} onChange={(e) => setSupplyNote(e.target.value)} />
                </div>
                <div className="flex space-x-2">
                  <button onClick={handleSubmitSupplyRequest} disabled={submittingSupply} className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white px-4 py-2 rounded-md">{submittingSupply ? t('foreman.saving') : t('foreman.submit_supply')}</button>
                  <button onClick={() => { setShowSupplyModal(false); setSupplyItems([{ material: '', quantity: '' }]); setSupplyDeadline(''); setSupplyNote(''); }} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md">{t('foreman.cancel')}</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showDraftModal && project && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
            <div className="bg-white p-4 sm:p-6 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">{t('foreman.draft.manage_drafts')}</h2>
                <button onClick={() => setShowDraftModal(false)} className="text-gray-500 hover:text-gray-700">×</button>
              </div>
              <div className="mb-4">
                <button onClick={() => { setEditingDraft(null); setShowDraftDrawing(true); }} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                  <FaPlus /><span>{t('foreman.draft.new_draft')}</span>
                </button>
              </div>
              <div className="space-y-2">
                {drafts.length === 0 ? <p className="text-gray-500 text-center py-8">{t('foreman.draft.no_drafts')}</p> : drafts.map((draft) => (
                  <div key={draft.id} className="border rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{draft.title}</h3>
                      {draft.description && <p className="text-sm text-gray-600">{draft.description}</p>}
                      <p className="text-xs text-gray-500">{new Date(draft.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button onClick={() => { setEditingDraft(draft); setShowDraftDrawing(true); }} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"><FaEdit /></button>
                      <button onClick={async () => { if (confirm(t('foreman.draft.confirm_delete'))) { try { await deleteDraft(draft.id); setDrafts(drafts.filter((d) => d.id !== draft.id)); toast.success(t('foreman.draft.deleted')); } catch (e) { toast.error(t('foreman.draft.delete_error')); } } }} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"><FaTrash /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {showDraftDrawing && project && (
          <DraftDrawing
            isOpen={showDraftDrawing}
            onClose={() => { setShowDraftDrawing(false); setEditingDraft(null); }}
            projectId={project.id}
            foremanId={project.foremanId}
            foremanName={project.foremanName || ''}
            editingDraft={editingDraft}
            onSave={async () => { const projectDrafts = await getDraftsByProject(project.id); setDrafts(projectDrafts); toast.success(t('foreman.draft.saved')); }}
          />
        )}

        {/* Image Zoom Lightbox */}
        {zoomedImage && (
          <div
            className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setZoomedImage(null)}
          >
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white font-bold text-2xl flex items-center justify-center leading-none"
            >
              ×
            </button>
            <div className="flex flex-col items-center w-full max-w-4xl">
              <div className="flex items-center gap-2 mb-4 bg-white/10 rounded-lg px-3 py-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setImageZoomLevel((z) => Math.max(0.5, z - 0.25)); }}
                  className="w-9 h-9 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold text-xl flex items-center justify-center"
                >
                  −
                </button>
                <span className="text-white text-sm font-medium min-w-[3rem] text-center">{Math.round(imageZoomLevel * 100)}%</span>
                <button
                  onClick={(e) => { e.stopPropagation(); setImageZoomLevel((z) => Math.min(3, z + 0.25)); }}
                  className="w-9 h-9 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold text-xl flex items-center justify-center"
                >
                  +
                </button>
              </div>
              <div className="overflow-auto max-h-[75vh] flex items-center justify-center">
                <img
                  src={zoomedImage.imageUrl}
                  alt={zoomedImage.description}
                  className="max-w-full object-contain transition-transform duration-200"
                  style={{ transform: `scale(${imageZoomLevel})` }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <p className="mt-3 text-white text-sm text-center max-w-md">{zoomedImage.description}</p>
            </div>
          </div>
        )}

        {showProjectImageModal && project && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
            <div className="bg-white p-4 sm:p-6 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FaImage className="text-teal-600" />
                {t('foreman.project_image.upload_title')}
              </h2>
              <p className="text-sm text-gray-600 mb-4">{t('foreman.project_image.upload_hint')}</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('foreman.project_image.description')}</label>
                  <textarea
                    rows={3}
                    className="w-full rounded-lg border-gray-300"
                    value={imageDescription}
                    onChange={(e) => setImageDescription(e.target.value)}
                    placeholder={t('foreman.project_image.description_placeholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('foreman.project_image.select_image')}</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  />
                  {imageFile && <p className="mt-1 text-xs text-gray-500">{imageFile.name}</p>}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleUploadProjectImage}
                    disabled={uploadingImage || !imageFile || !imageDescription.trim()}
                    className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    {uploadingImage ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        {t('foreman.project_image.uploading')}
                      </>
                    ) : (
                      <>
                        <FaUpload className="w-4 h-4" />
                        {t('foreman.project_image.upload_btn')}
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => { setShowProjectImageModal(false); setImageDescription(''); setImageFile(null); }}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
                  >
                    {t('foreman.close_btn')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

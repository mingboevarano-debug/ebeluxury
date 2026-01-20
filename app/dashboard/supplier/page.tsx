'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { SupplyRequest } from '@/types';
import { getCurrentUser } from '@/lib/auth';
import { getSupplyRequests, updateSupplyRequestStatus } from '@/lib/db';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'react-toastify';
import { 
  MdPendingActions, 
  MdCheckCircle, 
  MdLocalShipping, 
  MdDone, 
  MdCancel,
  MdSearch,
  MdFilterList
} from 'react-icons/md';
import { 
  FaClock, 
  FaMapMarkerAlt, 
  FaUserTie,
  FaExclamationTriangle,
  FaCheck,
  FaTimes,
  FaTruck,
  FaBox
} from 'react-icons/fa';
import Countdown from 'react-countdown';

type StatusFilter = 'all' | 'pending' | 'accepted' | 'in_progress' | 'delivered' | 'completed' | 'rejected';

export default function SupplierDashboard() {
  const [requests, setRequests] = useState<SupplyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<SupplyRequest | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [supplierNote, setSupplierNote] = useState('');
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    const init = async () => {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/login');
        return;
      }
      if (user.role !== 'supplier') {
        toast.error(t('supplier.no_access'));
        router.push(`/dashboard/${user.role}`);
        return;
      }
      await fetchRequests();
    };
    init();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await getSupplyRequests();
      setRequests(data);
    } catch (error) {
      console.error('Error fetching supply requests:', error);
      toast.error(t('supplier.load_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: SupplyRequest['status'], note?: string, reason?: string) => {
    setUpdatingId(id);
    try {
      await updateSupplyRequestStatus(id, status, note, reason);
      toast.success(t(`supplier.status_${status}`) || t('supplier.accepted'));
      await fetchRequests();
      setShowRejectModal(false);
      setShowNoteModal(false);
      setRejectReason('');
      setSupplierNote('');
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error updating request:', error);
      toast.error(t('supplier.update_error'));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleReject = (req: SupplyRequest) => {
    setSelectedRequest(req);
    setShowRejectModal(true);
  };

  const handleAddNote = (req: SupplyRequest) => {
    setSelectedRequest(req);
    setSupplierNote(req.supplierNote || '');
    setShowNoteModal(true);
  };

  const getStatusColor = (status: SupplyRequest['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: SupplyRequest['status']) => {
    switch (status) {
      case 'pending': return <MdPendingActions className="w-5 h-5" />;
      case 'accepted': return <MdCheckCircle className="w-5 h-5" />;
      case 'in_progress': return <FaTruck className="w-5 h-5" />;
      case 'delivered': return <MdLocalShipping className="w-5 h-5" />;
      case 'completed': return <MdDone className="w-5 h-5" />;
      case 'rejected': return <MdCancel className="w-5 h-5" />;
      default: return null;
    }
  };

  const isUrgent = (deadline: Date) => {
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    const hours = diff / (1000 * 60 * 60);
    return hours <= 24 && hours > 0;
  };

  const isOverdue = (deadline: Date) => {
    return new Date(deadline) < new Date();
  };

  const filteredRequests = requests.filter(req => {
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    const matchesSearch = searchQuery === '' || 
      req.projectName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.foremanName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.items.some(item => item.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const statusCounts = {
    all: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    accepted: requests.filter(r => r.status === 'accepted').length,
    in_progress: requests.filter(r => r.status === 'in_progress').length,
    delivered: requests.filter(r => r.status === 'delivered').length,
    completed: requests.filter(r => r.status === 'completed').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  return (
    <Layout>
      <div className="px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{t('supplier.title')}</h1>
          <p className="text-gray-600 mt-1 text-sm">
            {t('supplier.subtitle') || 'Manage all supply orders and track their progress'}
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t('supplier.search_placeholder') || 'Search by project, foreman, or items...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-2">
              <MdFilterList className="w-5 h-5 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">{t('supplier.filter_all') || 'All Orders'} ({statusCounts.all})</option>
                <option value="pending">{t('supplier.pending')} ({statusCounts.pending})</option>
                <option value="accepted">{t('supplier.status_accepted')} ({statusCounts.accepted})</option>
                <option value="in_progress">{t('supplier.status_in_progress') || 'In Progress'} ({statusCounts.in_progress})</option>
                <option value="delivered">{t('supplier.status_delivered') || 'Delivered'} ({statusCounts.delivered})</option>
                <option value="completed">{t('supplier.status_completed') || 'Completed'} ({statusCounts.completed})</option>
                <option value="rejected">{t('supplier.status_rejected') || 'Rejected'} ({statusCounts.rejected})</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">{t('supplier.loading')}</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">{t('supplier.no_orders') || 'No orders found'}</p>
            </div>
          ) : (
            filteredRequests.map((req) => {
              const urgent = isUrgent(req.deadline);
              const overdue = isOverdue(req.deadline);
              
              return (
                <div key={req.id} className="bg-white rounded-lg shadow-lg border-2 border-gray-200 hover:border-indigo-300 transition-all">
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">{req.projectName || req.projectId}</h3>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(req.status)}`}>
                            {getStatusIcon(req.status)}
                            <span className="ml-1">{t(`supplier.status_${req.status}`) || req.status}</span>
                          </span>
                          {(urgent || overdue) && (
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                              overdue ? 'bg-red-100 text-red-800 animate-pulse' : 'bg-orange-100 text-orange-800'
                            }`}>
                              <FaExclamationTriangle className="w-3 h-3 mr-1" />
                              {overdue ? t('supplier.overdue') || 'OVERDUE' : t('supplier.urgent') || 'URGENT'}
                            </span>
                          )}
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p className="flex items-center space-x-2">
                            <FaUserTie className="w-4 h-4" />
                            <span><strong>{t('supplier.foreman') || 'Foreman'}:</strong> {req.foremanName}</span>
                          </p>
                          <p className="flex items-center space-x-2">
                            <FaMapMarkerAlt className="w-4 h-4" />
                            <span><strong>{t('supplier.location') || 'Location'}:</strong> {req.projectLocation || t('supplier.no_location')}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                      <p className="font-semibold text-gray-900 mb-2 flex items-center">
                        <FaBox className="w-4 h-4 mr-2" />
                        {t('supplier.items')}
                      </p>
                      <ul className="space-y-1">
                        {req.items.map((item, idx) => (
                          <li key={idx} className="text-gray-700 flex items-start">
                            <span className="text-indigo-600 mr-2">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Notes */}
                    {(req.note || req.supplierNote || req.rejectedReason) && (
                      <div className="mb-4 space-y-2">
                        {req.note && (
                          <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                            <p className="text-sm">
                              <strong className="text-blue-900">{t('supplier.foreman_note') || 'Foreman Note'}:</strong>
                              <span className="text-blue-800 ml-2">{req.note}</span>
                            </p>
                          </div>
                        )}
                        {req.supplierNote && (
                          <div className="bg-green-50 border-l-4 border-green-400 p-3 rounded">
                            <p className="text-sm">
                              <strong className="text-green-900">{t('supplier.supplier_note') || 'Your Note'}:</strong>
                              <span className="text-green-800 ml-2">{req.supplierNote}</span>
                            </p>
                          </div>
                        )}
                        {req.rejectedReason && (
                          <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded">
                            <p className="text-sm">
                              <strong className="text-red-900">{t('supplier.rejection_reason') || 'Rejection Reason'}:</strong>
                              <span className="text-red-800 ml-2">{req.rejectedReason}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Deadline with Countdown */}
                    <div className="mb-4 p-3 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FaClock className={`w-5 h-5 ${overdue ? 'text-red-600' : urgent ? 'text-orange-600' : 'text-indigo-600'}`} />
                          <span className="font-semibold text-gray-900">{t('supplier.deadline')}:</span>
                          <span className={`font-bold ${overdue ? 'text-red-600' : urgent ? 'text-orange-600' : 'text-gray-700'}`}>
                            {new Date(req.deadline).toLocaleString()}
                          </span>
                        </div>
                        {!overdue && (
                          <Countdown
                            date={new Date(req.deadline)}
                            renderer={({ days, hours, minutes, completed }) => {
                              if (completed) return null;
                              return (
                                <span className={`text-sm font-semibold ${urgent ? 'text-orange-600' : 'text-indigo-600'}`}>
                                  {days}d {hours}h {minutes}m
                                </span>
                              );
                            }}
                          />
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                      {req.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(req.id, 'accepted')}
                            disabled={updatingId === req.id}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold shadow disabled:opacity-50 flex items-center justify-center space-x-2"
                          >
                            <FaCheck className="w-4 h-4" />
                            <span>{t('supplier.accept_order')}</span>
                          </button>
                          <button
                            onClick={() => handleReject(req)}
                            disabled={updatingId === req.id}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold shadow disabled:opacity-50 flex items-center justify-center space-x-2"
                          >
                            <FaTimes className="w-4 h-4" />
                            <span>{t('supplier.reject_order') || 'Reject'}</span>
                          </button>
                        </>
                      )}
                      {req.status === 'accepted' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(req.id, 'in_progress')}
                            disabled={updatingId === req.id}
                            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold shadow disabled:opacity-50 flex items-center justify-center space-x-2"
                          >
                            <FaTruck className="w-4 h-4" />
                            <span>{t('supplier.mark_in_progress') || 'Mark In Progress'}</span>
                          </button>
                          <button
                            onClick={() => handleAddNote(req)}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold shadow flex items-center justify-center space-x-2"
                          >
                            <span>{t('supplier.add_note') || 'Add Note'}</span>
                          </button>
                        </>
                      )}
                      {req.status === 'in_progress' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(req.id, 'delivered')}
                            disabled={updatingId === req.id}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold shadow disabled:opacity-50 flex items-center justify-center space-x-2"
                          >
                            <MdLocalShipping className="w-4 h-4" />
                            <span>{t('supplier.mark_delivered') || 'Mark Delivered'}</span>
                          </button>
                          <button
                            onClick={() => handleAddNote(req)}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold shadow flex items-center justify-center space-x-2"
                          >
                            <span>{t('supplier.add_note') || 'Add Note'}</span>
                          </button>
                        </>
                      )}
                      {req.status === 'delivered' && (
                        <button
                          onClick={() => handleStatusUpdate(req.id, 'completed')}
                          disabled={updatingId === req.id}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-semibold shadow disabled:opacity-50 flex items-center justify-center space-x-2"
                        >
                          <MdDone className="w-4 h-4" />
                          <span>{t('supplier.mark_completed') || 'Mark Completed'}</span>
                        </button>
                      )}
                      {(req.status === 'accepted' || req.status === 'in_progress' || req.status === 'delivered') && (
                        <button
                          onClick={() => handleAddNote(req)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold shadow flex items-center justify-center space-x-2"
                        >
                          <span>{t('supplier.update_note') || 'Update Note'}</span>
                        </button>
                      )}
                    </div>

                    {/* Timestamps */}
                    {(req.acceptedAt || req.deliveredAt) && (
                      <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500 space-y-1">
                        {req.acceptedAt && (
                          <p>{t('supplier.accepted_at') || 'Accepted'}: {new Date(req.acceptedAt).toLocaleString()}</p>
                        )}
                        {req.deliveredAt && (
                          <p>{t('supplier.delivered_at') || 'Delivered'}: {new Date(req.deliveredAt).toLocaleString()}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Reject Modal */}
        {showRejectModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
              <h2 className="text-xl font-semibold mb-4">{t('supplier.reject_order') || 'Reject Order'}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('supplier.rejection_reason') || 'Reason for rejection (required)'}
                  </label>
                  <textarea
                    rows={4}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder={t('supplier.rejection_placeholder') || 'Please provide a reason...'}
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleStatusUpdate(selectedRequest.id, 'rejected', undefined, rejectReason)}
                    disabled={!rejectReason.trim() || updatingId === selectedRequest.id}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-semibold"
                  >
                    {t('supplier.confirm_reject') || 'Confirm Rejection'}
                  </button>
                  <button
                    onClick={() => {
                      setShowRejectModal(false);
                      setRejectReason('');
                      setSelectedRequest(null);
                    }}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold"
                  >
                    {t('foreman.cancel') || 'Cancel'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Note Modal */}
        {showNoteModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
              <h2 className="text-xl font-semibold mb-4">{t('supplier.add_note') || 'Add Note'}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('supplier.supplier_note') || 'Your Note'}
                  </label>
                  <textarea
                    rows={4}
                    value={supplierNote}
                    onChange={(e) => setSupplierNote(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder={t('supplier.note_placeholder') || 'Add a note about this order...'}
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      const currentStatus = selectedRequest.status;
                      handleStatusUpdate(selectedRequest.id, currentStatus, supplierNote);
                    }}
                    disabled={updatingId === selectedRequest.id}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-semibold"
                  >
                    {t('supplier.save_note') || 'Save Note'}
                  </button>
                  <button
                    onClick={() => {
                      setShowNoteModal(false);
                      setSupplierNote('');
                      setSelectedRequest(null);
                    }}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold"
                  >
                    {t('foreman.cancel') || 'Cancel'}
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

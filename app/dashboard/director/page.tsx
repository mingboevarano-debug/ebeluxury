'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Report, Warning, Expense } from '@/types';
import { getReports, getWarnings, getExpenses, updateExpense } from '@/lib/db';
import { subscribeToAuthChanges } from '@/lib/auth';
import DataTable from 'react-data-table-component';
import ImageModal from '@/components/ImageModal';
import { useLanguage } from '@/contexts/LanguageContext';
import ExportButtons from '@/components/ExportButtons';
import { toast } from 'react-toastify';
import { FaCheck, FaTimes, FaInfoCircle } from 'react-icons/fa';

export default function DirectorDashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [activeTab, setActiveTab] = useState<'reports' | 'warnings' | 'expenses'>('reports');
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [processingExpenseId, setProcessingExpenseId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(null);
  const { t, locale } = useLanguage();

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((user) => {
      setCurrentUserId(user?.id ?? null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    fetchReports();
    fetchWarnings();
    fetchExpenses();
  }, []);

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

  const fetchExpenses = async () => {
    try {
      const data = await getExpenses();
      setExpenses(data || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setExpenses([]);
    }
  };

  const handleExpenseAction = async (expenseId: string, status: 'approved' | 'rejected' | 'ignored') => {
    if (!currentUserId) return;
    setProcessingExpenseId(expenseId);
    try {
      await updateExpense(expenseId, {
        approvalStatus: status,
        approvedBy: currentUserId,
        approvedAt: new Date(),
      });
      toast.success(t('director.expense_action_success') || `Expense ${status}`);
      await fetchExpenses();
      setExpandedExpenseId((prev) => (prev === expenseId ? null : prev));
    } catch (error: any) {
      console.error('Error updating expense:', error);
      toast.error(error.message || t('director.expense_action_error'));
    } finally {
      setProcessingExpenseId(null);
    }
  };

  const pendingExpenses = expenses.filter(e => e.approvalStatus === 'pending');

  return (
    <Layout>
      <div className="px-4 py-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Director Dashboard</h1>

        <div className="mb-4 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
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
              onClick={() => setActiveTab('expenses')}
              className={`${activeTab === 'expenses'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              {t('director.tabs.expenses') || 'Expenses'}
              {pendingExpenses.length > 0 && (
                <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full">
                  {pendingExpenses.length}
                </span>
              )}
            </button>
          </nav>
        </div>

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
              fileName="Director_Reports"
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

        {activeTab === 'warnings' && (
          <div className="bg-white shadow overflow-hidden sm:rounded-md p-4">
            <ExportButtons
              data={warnings}
              columns={[
                { name: t('table.foreman'), selector: (row: Warning) => row.foremanName || t('table.unknown_foreman') },
                { name: t('table.project'), selector: (row: Warning) => row.projectName || row.projectId?.slice(0, 8) || t('table.no_project') },
                { name: t('table.message'), selector: (row: Warning) => row.message },
                { name: t('table.status'), selector: (row: Warning) => t(`warning.${row.status}` as any) || row.status },
                { name: t('table.date'), selector: (row: Warning) => row.createdAt ? new Date(row.createdAt).toLocaleString() : '' },
              ]}
              fileName="Director_Warnings"
            />
            <DataTable
              columns={[
                {
                  name: t('table.foreman'),
                  selector: (row: Warning) => row.foremanName || t('table.unknown_foreman'),
                  sortable: true,
                },
                {
                  name: t('table.project'),
                  selector: (row: Warning) => row.projectName || row.projectId?.slice(0, 8) || t('table.no_project'),
                },
                {
                  name: t('table.message'),
                  selector: (row: Warning) => row.message,
                  wrap: true,
                  grow: 2,
                },
                {
                  name: t('table.status'),
                  cell: (row: Warning) => (
                    <span className={row.status === 'pending' ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                      {t(`warning.${row.status}` as any) || row.status}
                    </span>
                  ),
                  sortable: true,
                },
                {
                  name: t('table.date'),
                  selector: (row: Warning) => row.createdAt ? new Date(row.createdAt).toLocaleString() : '',
                  sortable: true,
                  width: '180px',
                },
              ]}
              data={warnings}
              pagination
              highlightOnHover
              responsive
            />
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="bg-white shadow overflow-hidden sm:rounded-md p-4">
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h3 className="font-semibold text-amber-900 mb-1">
                {t('director.expenses.pending_title') || 'Pending Expense Approvals'}
              </h3>
              <p className="text-sm text-amber-700">
                {t('director.expenses.pending_desc') || 'Accept expenses to count them in totals. Reject to exclude them.'}
              </p>
            </div>
            {pendingExpenses.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                {t('director.expenses.no_pending') || 'No pending expenses to approve'}
              </div>
            ) : (
              <>
                <div className="space-y-4 md:hidden">
                  {pendingExpenses.map((exp) => {
                    const isExpanded = expandedExpenseId === exp.id;
                    const formatter = new Intl.NumberFormat(
                      locale === 'ru' ? 'ru-RU' : locale === 'en' ? 'en-US' : 'uz-UZ'
                    );
                    const formattedAmount =
                      typeof exp.amount === 'number' ? `${formatter.format(exp.amount)} UZS` : `${exp.amount} UZS`;

                    return (
                      <div key={exp.id} className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold uppercase tracking-wide text-amber-600">
                              {exp.categoryName}
                            </p>
                            <p className="mt-1 text-lg font-bold text-gray-900">{exp.name || '-'}</p>
                          </div>
                          <div className="text-right text-xs text-gray-500">
                            <span>{exp.createdAt ? new Date(exp.createdAt).toLocaleDateString() : '-'}</span>
                          </div>
                        </div>
                        <div className="mt-3">
                          <p className="text-2xl font-extrabold text-gray-900 tabular-nums">{formattedAmount}</p>
                          <p className="mt-1 text-sm text-gray-500">
                            {t('finance.table.to_whom')}:{' '}
                            <span className="font-medium text-gray-700">{exp.toWhom || '-'}</span>
                          </p>
                        </div>
                        {isExpanded && (
                          <div className="mt-3 space-y-2 rounded-lg bg-amber-50 px-3 py-3 text-sm text-amber-900">
                            <p>
                              <span className="font-semibold">{t('finance.table.project')}:</span>{' '}
                              {exp.projectName || '-'}
                            </p>
                            <p>
                              <span className="font-semibold">{t('finance.table.payment_method')}:</span>{' '}
                              {t(`finance.payment_method.${exp.paymentMethod}`) || exp.paymentMethod}
                            </p>
                            {exp.stage && (
                              <p>
                                <span className="font-semibold">{t('finance.table.stage')}:</span> {exp.stage}
                              </p>
                            )}
                            {exp.comment && (
                              <p>
                                <span className="font-semibold">{t('finance.table.comment')}:</span> {exp.comment}
                              </p>
                            )}
                            <p className="text-xs text-amber-700">
                              {t('director.expenses.created_by') || 'Created by'}: {exp.createdByName}
                            </p>
                          </div>
                        )}
                        <div className="mt-4 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => handleExpenseAction(exp.id, 'approved')}
                            disabled={processingExpenseId === exp.id}
                            className="flex h-16 w-full flex-col items-center justify-center gap-1 rounded-xl bg-green-600 text-white shadow-sm transition hover:bg-green-700 disabled:opacity-50"
                            aria-label={t('director.expenses.card.approve') || 'Tasdiqlash'}
                            title={t('director.expenses.card.approve') || 'Tasdiqlash'}
                          >
                            <FaCheck className="h-5 w-5" />
                            <span className="text-[10px] font-semibold uppercase tracking-wide">
                              {t('director.expenses.card.approve') || 'Tasdiqlash'}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setExpandedExpenseId(isExpanded ? null : exp.id)}
                            className="flex h-16 w-full flex-col items-center justify-center gap-1 rounded-xl bg-amber-500 text-white shadow-sm transition hover:bg-amber-600"
                            aria-label={
                              isExpanded
                                ? t('director.expenses.card.hide_details') || "Yopish"
                                : t('director.expenses.card.more_info') || "Batafsil"
                            }
                            title={
                              isExpanded
                                ? t('director.expenses.card.hide_details') || "Yopish"
                                : t('director.expenses.card.more_info') || "Batafsil"
                            }
                          >
                            <FaInfoCircle className="h-5 w-5" />
                            <span className="text-[10px] font-semibold uppercase tracking-wide">
                              {isExpanded
                                ? t('director.expenses.card.hide_details') || "Yopish"
                                : t('director.expenses.card.more_info') || "Batafsil"}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExpenseAction(exp.id, 'rejected')}
                            disabled={processingExpenseId === exp.id}
                            className="flex h-16 w-full flex-col items-center justify-center gap-1 rounded-xl bg-red-600 text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
                            aria-label={t('director.expenses.card.reject') || 'Rad etish'}
                            title={t('director.expenses.card.reject') || 'Rad etish'}
                          >
                            <FaTimes className="h-5 w-5" />
                            <span className="text-[10px] font-semibold uppercase tracking-wide">
                              {t('director.expenses.card.reject') || 'Rad etish'}
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="hidden md:block">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('finance.table.date')}</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('finance.table.name')}</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('finance.table.category')}</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('finance.table.to_whom')}</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('finance.table.amount')}</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('finance.table.payment_method')}</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('director.expenses.created_by') || 'Created by'}</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('director.expenses.actions') || 'Actions'}</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {pendingExpenses.map((exp) => (
                          <tr key={exp.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {exp.createdAt ? new Date(exp.createdAt).toLocaleDateString() : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">{exp.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{exp.categoryName}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{exp.toWhom}</td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {exp.amount?.toLocaleString?.() ?? exp.amount} UZS
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {t(`finance.payment_method.${exp.paymentMethod}`) || exp.paymentMethod}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{exp.createdByName}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleExpenseAction(exp.id, 'approved')}
                                  disabled={processingExpenseId === exp.id}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg"
                                >
                                  <FaCheck className="w-3.5 h-3.5" />
                                  {t('director.expenses.accept') || 'Accept'}
                                </button>
                                <button
                                  onClick={() => handleExpenseAction(exp.id, 'rejected')}
                                  disabled={processingExpenseId === exp.id}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg"
                                >
                                  <FaTimes className="w-3.5 h-3.5" />
                                  {t('director.expenses.reject') || 'Reject'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <ImageModal src={zoomedImage} onClose={() => setZoomedImage(null)} />
    </Layout>
  );
}

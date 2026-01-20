'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Report, Warning } from '@/types';
import { getReports, getWarnings } from '@/lib/db';
import DataTable from 'react-data-table-component';
import ImageModal from '@/components/ImageModal';
import { useLanguage } from '@/contexts/LanguageContext';
import ExportButtons from '@/components/ExportButtons';

export default function DirectorDashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [activeTab, setActiveTab] = useState<'reports' | 'warnings'>('reports');
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    fetchReports();
    fetchWarnings();
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
                { name: t('table.project'), selector: (row: Warning) => row.projectId?.slice(0, 8) || t('table.no_project') },
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
                  selector: (row: Warning) => row.projectId?.slice(0, 8) || t('table.no_project'),
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
      </div>

      <ImageModal src={zoomedImage} onClose={() => setZoomedImage(null)} />
    </Layout>
  );
}

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { Contract, Project, SupplyRequest } from '@/types';
import { subscribeToAuthChanges } from '@/lib/auth';
import { getContracts, getAllProjects, getSupplyRequests } from '@/lib/db';
import { useLanguage } from '@/contexts/LanguageContext';
import { FaTruck } from 'react-icons/fa';

export default function TechnicalSupervisorDashboard() {
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [supplyRequests, setSupplyRequests] = useState<SupplyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (currentUser) => {
      if (!currentUser) {
        setLoading(false);
        return;
      }
      if (currentUser.role !== 'technical_supervisor') {
        router.replace(`/dashboard/${currentUser.role}`);
        setLoading(false);
        return;
      }
      try {
        const [contractsData, projectsData, supplyData] = await Promise.all([
          getContracts(),
          getAllProjects(),
          getSupplyRequests(),
        ]);
        setContracts(contractsData);
        setProjects(projectsData || []);
        setSupplyRequests(supplyData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  // Per-contract delivery count: count supply requests for projects under each contract
  const deliveriesByContractId = useMemo(() => {
    const map: Record<string, number> = {};
    for (const req of supplyRequests) {
      const project = projects.find((p) => p.id === req.projectId);
      if (project?.contractId) {
        map[project.contractId] = (map[project.contractId] ?? 0) + 1;
      }
    }
    return map;
  }, [projects, supplyRequests]);

  if (loading) {
    return (
      <Layout>
        <div className="px-3 sm:px-4 py-4 sm:py-6">
          <div className="text-gray-500">{(t as (k: string) => string)('common.loading') || 'Loading...'}</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-3 sm:px-4 py-4 sm:py-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 truncate">
          {t('technical_supervisor.title')}
        </h1>

        <div>
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">
            {t('technical_supervisor.all_contracts')}
          </h2>
          <div className="bg-white shadow overflow-x-auto overflow-y-hidden rounded-lg -mx-3 sm:mx-0">
            <table className="min-w-[600px] sm:min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('finance.contract.client') || 'Client'}
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('finance.contract.location') || 'Location'}
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('finance.contract.construction') || 'Construction'}
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('finance.contract.deadline') || 'Deadline'}
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('finance.contract.status') || 'Status'}
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('technical_supervisor.deliveries')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contracts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 sm:px-6 py-8 text-center text-gray-500">
                      {t('technical_supervisor.no_contracts')}
                    </td>
                  </tr>
                ) : (
                  contracts.map((contract) => {
                    const deliveryCount = deliveriesByContractId[contract.id] ?? 0;
                    return (
                      <tr
                        key={contract.id}
                        onClick={() => router.push(`/dashboard/foreman/contracts/${contract.id}`)}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {contract.clientName} {contract.clientSurname}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-900">
                          {contract.location}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-900">
                          {contract.constructionName || '-'}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(contract.deadline).toLocaleDateString()}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              contract.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : contract.status === 'in_progress'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {(t as (k: string) => string)(`status.${contract.status}`) || contract.status}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-center">
                          <span
                            className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-medium"
                            title={t('technical_supervisor.deliveries_count') || 'Number of deliveries'}
                          >
                            <FaTruck className="w-4 h-4 flex-shrink-0" aria-hidden />
                            <span>{deliveryCount}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}

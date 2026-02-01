'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { Contract, User } from '@/types';
import { subscribeToAuthChanges } from '@/lib/auth';
import { getContracts } from '@/lib/db';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ForemanDashboard() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const { t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const data = await getContracts();
          setContracts(data);
        } catch (error) {
          console.error('Error fetching contracts:', error);
        }
      } else {
        setContracts([]);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <Layout>
      <div className="px-4 py-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">{t('foreman.title')}</h1>

        <div>
          <h2 className="text-xl font-semibold mb-4">{t('foreman.contracts')}</h2>
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('finance.contract.client') || 'Client'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('finance.contract.location') || 'Location'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('finance.contract.construction') || 'Construction'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('finance.contract.deadline') || 'Deadline'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('finance.contract.status') || 'Status'}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contracts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      {t('foreman.no_contracts')}
                    </td>
                  </tr>
                ) : (
                  contracts.map((contract) => {
                    const isMyContract = contract.status === 'in_progress' && contract.foremanId === user?.id;
                    return (
                      <tr
                        key={contract.id}
                        onClick={() => router.push(`/dashboard/foreman/contracts/${contract.id}`)}
                        className={`cursor-pointer transition-colors ${
                          isMyContract
                            ? 'bg-green-50 hover:bg-green-100'
                            : 'hover:bg-indigo-50'
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {contract.clientName} {contract.clientSurname}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {contract.location}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {contract.constructionName || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(contract.deadline).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            contract.status === 'completed' ? 'bg-green-100 text-green-800' :
                            contract.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {t(`status.${contract.status}` as any) || contract.status}
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

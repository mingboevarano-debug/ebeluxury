'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { getWarnings, getContracts, getAllProjects } from '@/lib/db';
import { useLanguage } from '@/contexts/LanguageContext';
import { Contract, Warning } from '@/types';
import ContractsLineChart from '@/components/ContractsLineChart';
import ContractStatsBarChart from '@/components/ContractStatsBarChart';
import WarningStatsCharts from '@/components/WarningStatsCharts';

export default function StatisticsPage() {
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [warnings, setWarnings] = useState<Warning[]>([]);
    const [loading, setLoading] = useState(true);
    const { t } = useLanguage();

    useEffect(() => {
        fetchStatistics();
    }, []);

    const fetchStatistics = async () => {
        try {
            const [warningsData, contractsData, projects] = await Promise.all([
                getWarnings(),
                getContracts(),
                getAllProjects(),
            ]);

            setWarnings(warningsData || []);
            setContracts(contractsData || []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching statistics:', error);
            setLoading(false);
        }
    };

    // Calculate detailed statistics
    const stats = {
        // Contract stats
        totalContracts: contracts.length,
        contractsInProgress: contracts.filter(c => c.status === 'in_progress').length,
        contractsPending: contracts.filter(c => c.status === 'pending').length,
        contractsCompleted: contracts.filter(c => c.status === 'completed').length,

        // Warning stats
        totalWarnings: warnings.length,
        warningsPending: warnings.filter(w => w.status === 'pending').length,
        warningsResolved: warnings.filter(w => w.status === 'resolved').length,

        // Recent warnings (last 7 days)
        recentWarnings: warnings.filter(w => {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            return new Date(w.createdAt) >= sevenDaysAgo;
        }).length,
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex h-screen items-center justify-center">
                    <div className="text-xl">Loading statistics...</div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="px-4 py-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('stats.title')}</h1>

                {/* Overview Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Contracts */}
                    <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 overflow-hidden shadow-lg rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <dt className="text-sm font-medium text-indigo-100 truncate">
                                {t('stats.contracts_received')}
                            </dt>
                            <dd className="mt-1 text-4xl font-bold text-white">
                                {stats.totalContracts}
                            </dd>
                        </div>
                    </div>

                    {/* Contracts In Progress */}
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 overflow-hidden shadow-lg rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <dt className="text-sm font-medium text-blue-100 truncate">
                                {t('stats.contracts_in_progress')}
                            </dt>
                            <dd className="mt-1 text-4xl font-bold text-white">
                                {stats.contractsInProgress}
                            </dd>
                        </div>
                    </div>

                    {/* Contracts Pending (Not In Progress) */}
                    <div className="bg-gradient-to-br from-yellow-500 to-orange-500 overflow-hidden shadow-lg rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <dt className="text-sm font-medium text-yellow-100 truncate">
                                {t('stats.contracts_not_in_progress')}
                            </dt>
                            <dd className="mt-1 text-4xl font-bold text-white">
                                {stats.contractsPending}
                            </dd>
                        </div>
                    </div>

                    {/* Total Warnings */}
                    <div className="bg-gradient-to-br from-red-500 to-red-600 overflow-hidden shadow-lg rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <dt className="text-sm font-medium text-red-100 truncate">
                                {t('stats.total_warnings')}
                            </dt>
                            <dd className="mt-1 text-4xl font-bold text-white">
                                {stats.totalWarnings}
                            </dd>
                        </div>
                    </div>
                </div>

                {/* Additional Detail Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-green-500">
                        <div className="px-4 py-5 sm:p-6">
                            <dt className="text-sm font-medium text-gray-500 truncate">
                                {t('stats.completed_contracts')}
                            </dt>
                            <dd className="mt-1 text-3xl font-semibold text-green-600">
                                {stats.contractsCompleted}
                            </dd>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-red-500">
                        <div className="px-4 py-5 sm:p-6">
                            <dt className="text-sm font-medium text-gray-500 truncate">
                                {t('stats.pending_warnings')}
                            </dt>
                            <dd className="mt-1 text-3xl font-semibold text-red-600">
                                {stats.warningsPending}
                            </dd>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-blue-500">
                        <div className="px-4 py-5 sm:p-6">
                            <dt className="text-sm font-medium text-gray-500 truncate">
                                {t('stats.warnings_this_week')}
                            </dt>
                            <dd className="mt-1 text-3xl font-semibold text-blue-600">
                                {stats.recentWarnings}
                            </dd>
                        </div>
                    </div>
                </div>

                {/* Contract Visualizations */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('stats.contract_stats')}</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Line Chart - Contract Trends */}
                        <div>
                            <ContractsLineChart contracts={contracts} />
                        </div>

                        {/* Bar Chart - Contract Distribution */}
                        <div>
                            <ContractStatsBarChart contracts={contracts} />
                        </div>
                    </div>
                </div>

                {/* Warning Visualizations */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('stats.warning_stats')}</h2>
                    <WarningStatsCharts warnings={warnings} />
                </div>
            </div>
        </Layout>
    );
}

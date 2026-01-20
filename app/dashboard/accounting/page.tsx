'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { Payment, Fine, User } from '@/types';
import { getPayments, getFines, getUsers, createPayment, updateUser } from '@/lib/db';
import SalaryStatsChart from '@/components/SalaryStatsChart';
import FineStatsChart from '@/components/FineStatsChart';
import EmployeeSalaryPieChart from '@/components/EmployeeSalaryPieChart';
import EmployeeFinesPieChart from '@/components/EmployeeFinesPieChart';
import { useLanguage } from '@/contexts/LanguageContext';
import { subscribeToAuthChanges } from '@/lib/auth';
import { toast } from 'react-toastify';
import { formatNumberWithSpaces, parseFormattedNumber, getNumericValue } from '@/lib/formatNumber';

export default function AccountingDashboard() {
    const router = useRouter();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [fines, setFines] = useState<Fine[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [checkingAccess, setCheckingAccess] = useState(true);
    const { t } = useLanguage();

    // Payment Modal State
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    const [selecteduserId, setSelectedUserId] = useState('');
    const [payAmount, setPayAmount] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        // Subscribe to auth changes to get current user
        const unsubscribe = subscribeToAuthChanges((currentUser: User | null) => {
            setUser(currentUser);
            
            if (!currentUser) {
                // User not logged in, Layout will handle redirect
                setCheckingAccess(false);
                return;
            }

            // Check if user has access (HR, Admin, or Director)
            if (!['hr', 'admin', 'director'].includes(currentUser.role)) {
                // Redirect users without access to their dashboard
                router.push(`/dashboard/${currentUser.role}`);
                setCheckingAccess(false);
                return;
            }

            // User has access, fetch data
            const fetchData = async () => {
                try {
                    const [paymentsData, finesData, usersData] = await Promise.all([
                        getPayments(),
                        getFines(),
                        getUsers()
                    ]);
                    setPayments(paymentsData);
                    setFines(finesData);
                    setUsers(usersData);
                } catch (error) {
                    console.error('Error fetching data:', error);
                } finally {
                    setCheckingAccess(false);
                    setLoading(false);
                }
            };
            fetchData();
        });

        return () => unsubscribe();
    }, [router]);

    const totalSalaryPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalFines = fines.reduce((sum, f) => sum + f.amount, 0);

    const handlePaySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selecteduserId || !payAmount) {
            toast.error('Please select an employee and enter payment amount');
            return;
        }

        const user = users.find(u => u.id === selecteduserId);
        if (!user) {
            toast.error('User not found');
            return;
        }

        const amount = getNumericValue(payAmount);
        if (isNaN(amount) || amount <= 0) {
            toast.error(t('hr.invalid_amount') || 'Invalid amount');
            return;
        }

        setSubmitting(true);
        try {
            console.log('Creating payment for user:', user.id, 'Amount:', amount);
            
            const paymentId = await createPayment({
                userId: user.id,
                userName: user.name,
                amount: amount,
                date: new Date()
            });
            
            console.log('Payment created with ID:', paymentId);

            // Clear fines after payment (like HR dashboard does)
            console.log('Clearing fines for user:', user.id);
            await updateUser(user.id, {
                fines: 0
            });
            
            console.log('Fines cleared, refreshing data');

            // Refresh all data
            const [newPayments, newFines, newUsers] = await Promise.all([
                getPayments(),
                getFines(),
                getUsers()
            ]);
            setPayments(newPayments);
            setFines(newFines);
            setUsers(newUsers);

            setIsPayModalOpen(false);
            setPayAmount('');
            setSelectedUserId('');
            toast.success(t('hr.paid_success'));
        } catch (err: any) {
            console.error('Payment error:', err);
            console.error('Error details:', {
                message: err.message,
                code: err.code,
                stack: err.stack
            });
            toast.error(err.message || 'Payment failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const selectedUser = users.find(u => u.id === selecteduserId);

    if (checkingAccess || loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-xl text-gray-600">Loading...</div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="px-4 py-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">{t('accounting.title')}</h1>
                    <button
                        onClick={() => setIsPayModalOpen(true)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium shadow-sm transition-colors"
                    >
                        {t('hr.pay')}
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow border border-green-100">
                        <h3 className="text-lg font-medium text-gray-500">{t('accounting.salary_stats')}</h3>
                        <p className="text-3xl font-bold text-green-600 mt-2">{totalSalaryPaid.toLocaleString()} UZS</p>
                        <p className="text-sm text-gray-400 mt-1">{t('chart.total_paid')}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow border border-red-100">
                        <h3 className="text-lg font-medium text-gray-500">{t('accounting.fine_stats')}</h3>
                        <p className="text-3xl font-bold text-red-600 mt-2">{totalFines.toLocaleString()} UZS</p>
                        <p className="text-sm text-gray-400 mt-1">{t('chart.total_warnings')}</p>
                    </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <SalaryStatsChart payments={payments} />
                    <FineStatsChart fines={fines} />
                </div>

                {/* Employee Salary Pie Chart */}
                <div className="mb-8">
                    <div className="mb-4">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            {t('chart.employee_salary_distribution') || 'Employee Salary Distribution'}
                        </h2>
                        <p className="text-gray-600 text-sm">
                            {t('accounting.salary_pie_description') || 'Visual representation of each employee\'s salary as a portion of total payroll'}
                        </p>
                    </div>
                    <EmployeeSalaryPieChart users={users} />
                </div>

                {/* Employee Fines Pie Chart */}
                <div className="mb-8">
                    <div className="mb-4">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            {t('chart.employee_fines_distribution') || 'Employee Fines Distribution'}
                        </h2>
                        <p className="text-gray-600 text-sm">
                            {t('accounting.fines_pie_description') || 'Visual representation of fines distribution across employees'}
                        </p>
                    </div>
                    <EmployeeFinesPieChart fines={fines} />
                </div>

                {/* Pay Modal */}
                {isPayModalOpen && (
                    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setIsPayModalOpen(false)}></div>
                            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
                                <form onSubmit={handlePaySubmit}>
                                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4" id="modal-title">
                                            {t('hr.pay')}
                                        </h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">{t('form.name')}</label>
                                                <select
                                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                                    value={selecteduserId}
                                                    onChange={(e) => {
                                                        setSelectedUserId(e.target.value);
                                                    }}
                                                    required
                                                >
                                                    <option value="">{t('form.role')}...</option>
                                                    {users.map(u => (
                                                        <option key={u.id} value={u.id}>
                                                            {u.name} ({t(`role.${u.role}` as any)})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {selectedUser && (
                                                <div className="bg-gray-50 p-4 rounded-md text-sm space-y-1">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">{t('hr.salary')}:</span>
                                                        <span className="font-medium text-gray-900">{selectedUser.salary?.toLocaleString()} UZS</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">{t('hr.fines')}:</span>
                                                        <span className="font-medium text-red-600">-{selectedUser.fines?.toLocaleString()} UZS</span>
                                                    </div>
                                                    <div className="border-t border-gray-200 pt-1 flex justify-between font-bold">
                                                        <span className="text-gray-900">{t('hr.net_salary')}:</span>
                                                        <span className="text-green-600">{((selectedUser.salary || 0) - (selectedUser.fines || 0)).toLocaleString()} UZS</span>
                                                    </div>
                                                </div>
                                            )}

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">{t('hr.salary')} (UZS)</label>
                                                <div className="mt-1 relative rounded-md shadow-sm">
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        required
                                                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-3 sm:text-sm border-gray-300 rounded-md"
                                                        placeholder="0"
                                                        value={payAmount}
                                                        onChange={(e) => {
                                                            const parsed = parseFormattedNumber(e.target.value);
                                                            setPayAmount(formatNumberWithSpaces(parsed));
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                                        >
                                            {submitting ? 'Processing...' : t('hr.pay')}
                                        </button>
                                        <button
                                            type="button"
                                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                            onClick={() => setIsPayModalOpen(false)}
                                        >
                                            {t('admin.cancel')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}

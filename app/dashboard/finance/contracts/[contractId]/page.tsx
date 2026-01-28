'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Layout from '@/components/Layout';
import { Contract, Profit, Expense, User, FinanceCategory, Project, LocalizedStage } from '@/types';
import { getContractById, getProfits, getExpenses, getFinanceCategories, createExpense, getAllProjects, getContracts, getServices, getUsers } from '@/lib/db';
import { subscribeToAuthChanges } from '@/lib/auth';
import { toast } from 'react-toastify';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatNumberWithSpaces, getNumericValue } from '@/lib/formatNumber';
import { FaArrowLeft, FaBuilding, FaUser, FaPhone, FaMapMarkerAlt, FaDollarSign, FaCalendar, FaFileAlt, FaChartLine, FaChartBar, FaPlus } from 'react-icons/fa';
import ExpenseModal from '@/components/ExpenseModal';

export default function ContractDetailPage() {
  const router = useRouter();
  const params = useParams();
  const contractId = params?.contractId as string;
  const { t, locale } = useLanguage();
  
  const [contract, setContract] = useState<Contract | null>(null);
  const [profits, setProfits] = useState<Profit[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stages, setStages] = useState<LocalizedStage[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);

  // Expense Modal State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseForm, setExpenseForm] = useState({
    projectId: '',
    categoryId: '',
    name: '',
    stage: '',
    paymentMethod: 'cash' as 'cash' | 'card',
    amount: '',
    toWhom: '',
    comment: '',
    selectedEmployeeIds: [] as string[],
    profitId: '' as string | undefined
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (currentUser: User | null) => {
      setUser(currentUser);

      if (!currentUser) {
        setCheckingAccess(false);
        return;
      }

      // Check if user has access (HR, Admin, or Director)
      if (!['hr', 'admin', 'director'].includes(currentUser.role)) {
        router.push(`/dashboard/${currentUser.role}`);
        setCheckingAccess(false);
        return;
      }

      await fetchData();
      setCheckingAccess(false);
    });

    return () => unsubscribe();
  }, [router, contractId]);

  const fetchData = async () => {
    if (!contractId) return;
    
    setLoading(true);
    try {
      const [
        contractData,
        allProfits,
        allExpenses,
        categoriesData,
        allProjects,
        allContracts,
        servicesData,
        allUsers
      ] = await Promise.all([
        getContractById(contractId),
        getProfits(),
        getExpenses(),
        getFinanceCategories(),
        getAllProjects(),
        getContracts(),
        getServices(),
        getUsers()
      ]);

      if (!contractData) {
        toast.error(t('finance.contract_not_found') || 'Contract not found');
        router.push('/dashboard/finance');
        return;
      }

      setContract(contractData);

      // Filter profits and expenses by contractId (projectId is actually contractId)
      const contractProfits = allProfits.filter(p => p.projectId === contractId);
      const contractExpenses = allExpenses.filter(e => e.projectId === contractId);

      setProfits(contractProfits);
      setExpenses(contractExpenses);
      setCategories(categoriesData);
      
      // Debug: Log categories
      console.log('Categories fetched:', categoriesData.length);
      console.log('Expense categories:', categoriesData.filter(c => c.type === 'expense').length);

      // Extract unique stages from services
      const stageMap = new Map<string, LocalizedStage>();
      servicesData.forEach(s => {
        if (s.stage && !stageMap.has(s.stage)) {
          stageMap.set(s.stage, {
            en: s.stage,
            ru: s.stageRu || s.stage,
            uz: s.stageUz || s.stage
          });
        }
      });
      const uniqueStages = Array.from(stageMap.values()).sort((a, b) => a.en.localeCompare(b.en));
      setStages(uniqueStages);

      // Format contracts as projects for selection
      const formattedSites: Project[] = allContracts.map(contract => ({
        id: contract.id,
        contractId: contract.id,
        foremanId: contract.foremanId || '',
        foremanName: '',
        clientName: `${contract.clientName} ${contract.clientSurname}`.trim(),
        location: contract.location,
        constructionName: contract.constructionName,
        price: contract.price,
        description: contract.description,
        deadline: contract.deadline,
        status: contract.status === 'pending' ? 'active' : 'active',
        createdAt: contract.createdAt
      } as Project));
      setProjects(formattedSites);
      setUsers(allUsers.filter(u => u.role !== 'admin' && u.role !== 'director'));
    } catch (error) {
      console.error('Error fetching contract data:', error);
      toast.error(t('finance.load_error'));
    } finally {
      setLoading(false);
    }
  };

  // Expense Handlers
  const handleOpenExpenseModal = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setExpenseForm({
        projectId: expense.projectId || contractId,
        categoryId: expense.categoryId,
        name: expense.name || '',
        stage: expense.stage || '',
        paymentMethod: expense.paymentMethod,
        amount: formatNumberWithSpaces(expense.amount.toString()),
        toWhom: expense.toWhom,
        comment: expense.comment || '',
        selectedEmployeeIds: expense.employees || [],
        profitId: expense.profitId || ''
      });
    } else {
      setEditingExpense(null);
      setExpenseForm({
        projectId: contractId, // Auto-set to current contract
        categoryId: '',
        name: '',
        stage: '',
        paymentMethod: 'cash',
        amount: '',
        toWhom: '',
        comment: '',
        selectedEmployeeIds: [],
        profitId: ''
      });
    }
    setIsExpenseModalOpen(true);
  };

  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !contract) return;

    const amount = getNumericValue(expenseForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error(t('finance.invalid_amount'));
      return;
    }

    if (!expenseForm.categoryId) {
      toast.error(t('finance.select_category'));
      return;
    }

    if (!expenseForm.toWhom.trim()) {
      toast.error(t('finance.enter_to_whom'));
      return;
    }

    if (!expenseForm.name.trim()) {
      toast.error(t('finance.enter_expense_name') || 'Please enter expense name');
      return;
    }

    setSubmitting(true);
    try {
      const category = categories.find(c => c.id === expenseForm.categoryId);
      const project = projects.find(p => p.id === contractId);

      // Get selected employees if any
      const selectedEmployees = expenseForm.selectedEmployeeIds.length > 0
        ? users.filter(u => expenseForm.selectedEmployeeIds.includes(u.id))
        : [];

      const expenseData = {
        projectId: contractId, // Always link to current contract
        projectName: project ? (() => {
          const parts = [];
          if (project.constructionName) {
            parts.push(`[${project.constructionName}]`);
          }
          if (project.clientName) {
            parts.push(project.clientName);
          }
          if (project.location) {
            parts.push(project.location);
          }
          return parts.length > 0 ? parts.join(' - ') : undefined;
        })() : undefined,
        categoryId: expenseForm.categoryId,
        categoryName: category?.name || '',
        name: expenseForm.name.trim(),
        stage: expenseForm.stage || undefined,
        paymentMethod: expenseForm.paymentMethod,
        amount,
        toWhom: expenseForm.toWhom.trim(),
        createdBy: user.id,
        createdByName: user.name,
        ...(expenseForm.comment.trim() && { comment: expenseForm.comment.trim() }),
        ...(selectedEmployees.length > 0 && {
          employees: selectedEmployees.map(e => e.id),
          employeeNames: selectedEmployees.map(e => e.name)
        }),
        ...(expenseForm.profitId && { profitId: expenseForm.profitId })
      };

      await createExpense(expenseData);
      toast.success(t('finance.expense_added'));
      await fetchData();
      setIsExpenseModalOpen(false);
      setExpenseForm({
        projectId: contractId,
        categoryId: '',
        name: '',
        stage: '',
        paymentMethod: 'cash',
        amount: '',
        toWhom: '',
        comment: '',
        selectedEmployeeIds: [],
        profitId: ''
      });
    } catch (error: any) {
      console.error('Error saving expense:', error);
      toast.error(error.message || t('finance.save_expense_error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingAccess || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-xl text-gray-600">{t('finance.loading')}</div>
        </div>
      </Layout>
    );
  }

  if (!contract) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-xl text-gray-600">{t('finance.contract_not_found') || 'Contract not found'}</div>
        </div>
      </Layout>
    );
  }

  const totalProfit = profits.reduce((sum, p) => sum + p.amount, 0);
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalProfit - totalExpense;
  const contractPrice = contract.price || 0;
  const profitMargin = contractPrice > 0 ? ((netProfit / contractPrice) * 100).toFixed(2) : '0';

  return (
    <Layout>
      <div className="px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard/finance')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <FaArrowLeft />
            <span>{t('finance.back_to_finance') || 'Back to Finance'}</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('finance.contract_details') || 'Contract Details'}
          </h1>
        </div>

        {/* Contract Information Card */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <FaBuilding className="text-indigo-600" />
            <span>{t('finance.contract_info') || 'Contract Information'}</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

            <div>
              <label className="text-sm font-medium text-gray-500 flex items-center space-x-2 mb-1">
                <FaDollarSign />
                <span>{t('finance.contract.price') || 'Contract Price'}</span>
              </label>
              <p className="text-lg font-semibold text-indigo-600">
                {formatNumberWithSpaces(contractPrice.toString())} UZS
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500 flex items-center space-x-2 mb-1">
                <FaCalendar />
                <span>{t('finance.contract.deadline') || 'Deadline'}</span>
              </label>
              <p className="text-lg text-gray-900">
                {contract.deadline.toLocaleDateString()}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500 mb-1">
                {t('finance.contract.status') || 'Status'}
              </label>
              <p className="text-lg text-gray-900 capitalize">
                {t(`status.${contract.status}` as any) || contract.status}
              </p>
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
        </div>

        {/* Financial Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow border border-green-100">
            <h3 className="text-lg font-medium text-gray-500 flex items-center space-x-2">
              <FaChartLine className="text-green-600" />
              <span>{t('finance.total_profit')}</span>
            </h3>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {formatNumberWithSpaces(totalProfit.toString())} UZS
            </p>
            <p className="text-sm text-gray-400 mt-1">{profits.length} {t('finance.transactions') || 'transactions'}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-red-100">
            <h3 className="text-lg font-medium text-gray-500 flex items-center space-x-2">
              <FaChartBar className="text-red-600" />
              <span>{t('finance.total_expense')}</span>
            </h3>
            <p className="text-3xl font-bold text-red-600 mt-2">
              {formatNumberWithSpaces(totalExpense.toString())} UZS
            </p>
            <p className="text-sm text-gray-400 mt-1">{expenses.length} {t('finance.transactions') || 'transactions'}</p>
          </div>

          <div className={`bg-white p-6 rounded-lg shadow border ${netProfit >= 0 ? 'border-blue-100' : 'border-red-100'}`}>
            <h3 className="text-lg font-medium text-gray-500">{t('finance.net_profit')}</h3>
            <p className={`text-3xl font-bold mt-2 ${netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatNumberWithSpaces(netProfit.toString())} UZS
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {profitMargin}% {t('finance.margin') || 'margin'}
            </p>
          </div>

          <div className="bg-gray-100 p-6 rounded-lg shadow border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-600 tracking-wide">{t('finance.contract.money_on_delay') || 'Money on Delay'}</h3>
            <p className="text-3xl font-bold text-gray-700 mt-2">
              {formatNumberWithSpaces((contractPrice - totalProfit).toString())} UZS
            </p>
            <p className="text-sm text-gray-500 mt-1">{t('finance.from_contract') || 'from contract'}</p>
          </div>
        </div>

        {/* Profits Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
              <FaChartLine className="text-green-600" />
              <span>{t('finance.profits') || 'Profits'} ({profits.length})</span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('finance.table.date')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('finance.table.category')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('finance.table.from_whom')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('finance.table.payment_method')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('finance.table.amount')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('finance.table.comment')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {profits.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      {t('finance.no_profits')}
                    </td>
                  </tr>
                ) : (
                  profits.map((profit) => (
                    <tr key={profit.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {profit.createdAt.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{profit.categoryName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{profit.fromWhom}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {t(`finance.payment_method.${profit.paymentMethod}`)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {formatNumberWithSpaces(profit.amount.toString())} UZS
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{profit.comment || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
              <FaChartBar className="text-red-600" />
              <span>{t('finance.expenses') || 'Expenses'} ({expenses.length})</span>
            </h2>
            <button
              onClick={() => handleOpenExpenseModal()}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium shadow-sm transition-colors"
            >
              <FaPlus className="w-4 h-4" />
              <span>{t('finance.add_expense')}</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('finance.table.date')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('finance.table.name')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('finance.table.category')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('finance.table.to_whom')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('finance.table.price')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('finance.table.quantity')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('finance.table.total')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('finance.table.payment_method')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('finance.table.comment')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                      {t('finance.no_expenses')}
                    </td>
                  </tr>
                ) : (
                  expenses.map((expense) => (
                    <tr key={expense.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {expense.createdAt.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{expense.name || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{expense.categoryName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{expense.toWhom}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {expense.unitPrice ? formatNumberWithSpaces(expense.unitPrice.toString()) + ' UZS' : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {expense.quantity || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                        {formatNumberWithSpaces(expense.amount.toString())} UZS
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {t(`finance.payment_method.${expense.paymentMethod}`)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{expense.comment || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expense Modal */}
        <ExpenseModal
          isOpen={isExpenseModalOpen}
          onClose={() => setIsExpenseModalOpen(false)}
          onSubmit={handleSubmitExpense}
          editingExpense={editingExpense}
          expenseForm={expenseForm}
          setExpenseForm={setExpenseForm}
          projects={projects}
          stages={stages}
          expenseCategories={categories.filter(c => c.type === 'expense')}
          users={users}
          profits={profits}
          submitting={submitting}
          selectedEmployeeIds={expenseForm.selectedEmployeeIds}
          onEmployeeSelectionChange={(employeeIds) => {
            setExpenseForm({ ...expenseForm, selectedEmployeeIds: employeeIds });
          }}
          disableProjectSelection={true}
        />
      </div>
    </Layout>
  );
}

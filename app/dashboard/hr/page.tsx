'use client';

import { useState, useEffect } from 'react';
import { getUsers, updateUser, deleteUser as deleteUserDb, createPayment, createFine, createTask, getPayments } from '@/lib/db';
import { createSecondaryUser, getCurrentUser } from '@/lib/auth';
import { User, UserRole, Payment } from '@/types';
import Layout from '@/components/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { FaEdit, FaTrash, FaDollarSign, FaCheckCircle, FaTimes } from 'react-icons/fa';
import { MdPayment, MdWarning, MdAssignment } from 'react-icons/md';
import { toast } from 'react-toastify';
import { formatNumberWithSpaces, parseFormattedNumber, getNumericValue } from '@/lib/formatNumber';

export default function HRDashboard() {
  const { t } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [userLastPayments, setUserLastPayments] = useState<Record<string, Payment | null>>({});

  // User Management
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'seller' as UserRole,
    salary: '',
    fines: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Payment Modal State
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payingUser, setPayingUser] = useState<User | null>(null);
  const [payData, setPayData] = useState({
    amount: ''
  });

  // Fine Modal State
  const [isFineModalOpen, setIsFineModalOpen] = useState(false);
  const [finingUser, setFiningUser] = useState<User | null>(null);
  const [fineData, setFineData] = useState({
    amount: '',
    reason: ''
  });

  // Task Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskingUser, setTaskingUser] = useState<User | null>(null);
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    deadline: ''
  });

  useEffect(() => {
    fetchUsers();
    fetchCurrentUser();
    fetchPayments();
  }, []);

  useEffect(() => {
    // Update last payment for each user when payments change
    if (payments.length > 0 && users.length > 0) {
      const lastPayments: Record<string, Payment | null> = {};
      users.forEach(user => {
        const userPayments = payments.filter(p => p.userId === user.id);
        lastPayments[user.id] = userPayments.length > 0 ? userPayments[0] : null;
      });
      setUserLastPayments(lastPayments);
    }
  }, [payments, users]);

  const fetchCurrentUser = async () => {
    const user = await getCurrentUser();
    setCurrentUser(user);
  };

  const fetchPayments = async () => {
    try {
      const allPayments = await getPayments();
      setPayments(allPayments);
    } catch (err) {
      console.error('Error fetching payments:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Use getUsers exactly like accounting section does - no transformation
      const allUsers = await getUsers();
      
      // Log to see what we're getting from Firestore
      console.log('=== HR Dashboard - Users from Firestore ===');
      allUsers.forEach((user, idx) => {
        console.log(`User ${idx + 1}:`, {
          name: user.name,
          role: user.role,
          salary: user.salary,
          salaryType: typeof user.salary,
          'hasSalary': 'salary' in user,
          allFields: Object.keys(user)
        });
      });
      
      // Only filter out admin and director, but keep data structure exactly as it comes
      const filteredUsers = allUsers.filter(u => u.role !== 'admin' && u.role !== 'director');
      
      console.log('=== Filtered Users ===');
      filteredUsers.forEach((user, idx) => {
        console.log(`Filtered User ${idx + 1}:`, {
          name: user.name,
          salary: user.salary,
          salaryType: typeof user.salary
        });
      });
      
      // Set users exactly as accounting does - no mapping or transformation
      setUsers(filteredUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const totalEmployees = users.length;
    // Calculate total salary - handle both number and array
    const totalSalary = users.reduce((sum, user) => {
      if (Array.isArray(user.salary)) {
        return sum + user.salary.reduce((arrSum, val) => arrSum + val, 0);
      }
      return sum + (user.salary || 0);
    }, 0);
    const totalFines = users.reduce((sum, user) => sum + (user.fines || 0), 0);
    return { totalEmployees, totalSalary, totalFines };
  };
  
  // Helper function to get salary value (sum if array, number if number)
  const getSalaryValue = (salary: number | number[] | undefined): number => {
    if (Array.isArray(salary)) {
      return salary.reduce((sum, val) => sum + val, 0);
    }
    return salary || 0;
  };

  const stats = calculateStats();

  // ... (Existing handlers: handleOpenModal, handleCloseModal, handleSubmit, handleDelete, handlePay)
  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
        salary: Array.isArray(user.salary) 
          ? formatNumberWithSpaces(getSalaryValue(user.salary).toString())
          : (user.salary !== undefined && user.salary !== null ? formatNumberWithSpaces(user.salary.toString()) : ''),
        fines: user.fines !== undefined && user.fines !== null ? formatNumberWithSpaces(user.fines.toString()) : '',
        phone: user.phone || ''
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'seller',
        salary: '',
        fines: '',
        phone: ''
      });
    }
    setError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (editingUser) {
        // Only update salary/fines if a value is provided (not empty)
        const updateData: any = {
          name: formData.name,
          role: formData.role,
          phone: formData.phone || undefined
        };
        
        if (formData.salary.trim() !== '') {
          const salaryValue = getNumericValue(formData.salary);
          if (!isNaN(salaryValue) && salaryValue >= 0) {
            updateData.salary = salaryValue;
            console.log('Setting salary to:', salaryValue, 'for user:', editingUser.id);
          } else {
            console.warn('Invalid salary value:', formData.salary);
          }
        } else {
          console.log('Salary field is empty, not updating salary');
        }

        if (formData.fines.trim() !== '') {
          const finesValue = getNumericValue(formData.fines);
          if (!isNaN(finesValue) && finesValue >= 0) {
            updateData.fines = finesValue;
          }
        }
        
        console.log('Updating user:', editingUser.id, 'with data:', updateData);
        await updateUser(editingUser.id, updateData);
        console.log('User updated successfully');
        
        // Show success message if salary was updated
        if (updateData.salary !== undefined) {
          toast.success(`Salary updated to ${updateData.salary.toLocaleString()} UZS`);
        }
      } else {
        if (!formData.password) {
          setError(t('signin.password') + ' is required');
          setSubmitting(false);
          return;
        }
        const newUserId = await createSecondaryUser(
          formData.email,
          formData.password,
          formData.name,
          formData.role
        );
        
        const updateData: any = {
          phone: formData.phone || undefined
        };
        
        if (formData.salary.trim() !== '') {
          const salaryValue = getNumericValue(formData.salary);
          if (!isNaN(salaryValue) && salaryValue >= 0) {
            updateData.salary = salaryValue;
            console.log('Setting salary to:', salaryValue);
          } else {
            console.warn('Invalid salary value:', formData.salary);
          }
        } else {
          console.log('Salary field is empty, not updating salary');
        }
        
        if (formData.fines.trim() !== '') {
          const finesValue = getNumericValue(formData.fines);
          if (!isNaN(finesValue) && finesValue >= 0) {
            updateData.fines = finesValue;
          }
        }
        
        console.log('Creating new user with data:', updateData);
        await updateUser(newUserId, updateData);
        console.log('New user created and updated successfully');
        
        // Show success message if salary was set
        if (updateData.salary !== undefined) {
          toast.success(`Employee created with salary ${updateData.salary.toLocaleString()} UZS`);
        }
      }
      await fetchUsers();
      handleCloseModal();
      toast.success(editingUser ? t('hr.employee_updated') || 'Employee updated successfully' : t('hr.employee_created') || 'Employee created successfully');
    } catch (err: any) {
      console.error('Error saving user:', err);
      setError(err.message || 'Failed to save user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('form.confirm_delete'))) return;
    try {
      await deleteUserDb(id);
      await fetchUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
    }
  };

  // Payment Handlers
  const handleOpenPayModal = (user: User) => {
    setPayingUser(user);
    // Calculate net salary - handle both number and array
    const salaryValue = getSalaryValue(user.salary);
    const netSalary = salaryValue - (user.fines || 0);
    setPayData({ amount: netSalary > 0 ? formatNumberWithSpaces(netSalary.toString()) : '' });
    // Show warning if salary is not set, but still allow payment
    if (salaryValue === 0) {
      toast.warning(t('hr.salary_not_set_warning') || 'Note: Salary is not set for this employee. You can still make a payment with a custom amount.');
    }
    setIsPayModalOpen(true);
  };

  const handleClosePayModal = () => {
    setIsPayModalOpen(false);
    setPayingUser(null);
    setPayData({ amount: '' });
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingUser) {
      toast.error('User not found');
      return;
    }

    if (!payData.amount || payData.amount.trim() === '') {
      toast.error('Please enter payment amount');
      return;
    }

    const amount = getNumericValue(payData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error(t('hr.invalid_amount') || 'Invalid amount');
      return;
    }

    setSubmitting(true);
    try {
      await createPayment({
        userId: payingUser.id,
        userName: payingUser.name,
        amount: amount,
        date: new Date()
      });

      // Get current salary and convert to array, then add payment amount
      const currentSalary = payingUser.salary;
      let salaryArray: number[] = [];
      
      // If salary is already an array, use it
      if (Array.isArray(currentSalary)) {
        salaryArray = [...currentSalary];
      } 
      // If salary is a number, convert to array
      else if (typeof currentSalary === 'number' && currentSalary > 0) {
        salaryArray = [currentSalary];
      }
      // If salary is undefined or 0, start with empty array
      
      // Add the payment amount to the array
      salaryArray.push(amount);
      
      console.log('Adding payment to salary array:', {
        userId: payingUser.id,
        paymentAmount: amount,
        salaryArray: salaryArray
      });

      // Update user in database - add payment to salary array and clear fines
      await updateUser(payingUser.id, {
        fines: 0,
        salary: salaryArray
      });

      // Update local state immediately for instant UI update
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === payingUser.id 
            ? { ...user, fines: 0, salary: salaryArray }
            : user
        )
      );

      // Close modal
      handleClosePayModal();
      
      // Show success toast
      toast.success(t('hr.paid_success') || 'Payment successful!');
      
      // Refresh payments and users from server to ensure data consistency
      setTimeout(async () => {
        try {
          await Promise.all([fetchUsers(), fetchPayments()]);
        } catch (err) {
          console.error('Error refreshing data:', err);
        }
      }, 200);
    } catch (err: any) {
      console.error('Error processing payment:', err);
      toast.error(err.message || t('hr.payment_failed') || 'Payment failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Fine Handlers
  const handleOpenFineModal = (user: User) => {
    setFiningUser(user);
    setFineData({ amount: '', reason: '' });
    setIsFineModalOpen(true);
  };

  const handleCloseFineModal = () => {
    setIsFineModalOpen(false);
    setFiningUser(null);
  };

  const handleSubmitFine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!finingUser) return;
    setSubmitting(true);

    const amount = getNumericValue(fineData.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('Invalid amount');
      setSubmitting(false);
      return;
    }

    try {
      await createFine({
        userId: finingUser.id,
        userName: finingUser.name,
        amount: amount,
        reason: fineData.reason,
        date: new Date()
      });

      const currentFines = finingUser.fines || 0;
      await updateUser(finingUser.id, {
        fines: currentFines + amount
      });

      alert(t('hr.fine_success'));
      await fetchUsers();
      handleCloseFineModal();
    } catch (err) {
      console.error('Error submitting fine:', err);
      alert('Failed to submit fine');
    } finally {
      setSubmitting(false);
    }
  };

  // Task Handlers
  const handleOpenTaskModal = (user: User) => {
    setTaskingUser(user);
    setTaskData({ title: '', description: '', deadline: '' });
    setIsTaskModalOpen(true);
  };

  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
    setTaskingUser(null);
  };

  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskingUser || !currentUser) return;
    setSubmitting(true);

    if (!taskData.title || !taskData.deadline) {
      alert('Title and deadline are required');
      setSubmitting(false);
      return;
    }

    try {
      await createTask({
        userId: taskingUser.id,
        userName: taskingUser.name,
        assignedBy: currentUser.id,
        title: taskData.title,
        description: taskData.description,
        deadline: new Date(taskData.deadline),
        status: 'pending'
      });

      alert(t('hr.task_success'));
      handleCloseTaskModal();
    } catch (err) {
      console.error('Error assigning task:', err);
      alert('Failed to assign task');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Layout><div>Loading...</div></Layout>;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">{t('hr.title')}</h1>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            {t('hr.add_employee')}
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500">{t('hr.total_employees')}</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{stats.totalEmployees}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500">{t('hr.total_salary')}</h3>
            <p className="mt-2 text-3xl font-semibold text-green-600">
              {stats.totalSalary.toLocaleString()} UZS
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500">{t('hr.total_fines')}</h3>
            <p className="mt-2 text-3xl font-semibold text-red-600">
              {stats.totalFines.toLocaleString()} UZS
            </p>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('form.name')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('form.role')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('hr.salary')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('hr.fines')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('hr.net_salary')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('hr.last_payment') || 'Last Payment'}</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          {user.phone && <div className="text-xs text-gray-400">{user.phone}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                        {t(`role.${user.role}` as any)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {Array.isArray(user.salary) ? (
                        <div>
                          <div className="font-medium">{getSalaryValue(user.salary).toLocaleString()} UZS</div>
                          <div className="text-xs text-gray-400">{user.salary.length} payment{user.salary.length !== 1 ? 's' : ''}</div>
                        </div>
                      ) : (
                        <span>{(user.salary || 0).toLocaleString()} UZS</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-500">
                      {user.fines?.toLocaleString() || '0'} UZS
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {(getSalaryValue(user.salary) - (user.fines || 0)).toLocaleString()} UZS
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {userLastPayments[user.id] ? (
                        <div>
                          <div className="font-medium text-gray-900">
                            {userLastPayments[user.id]!.amount.toLocaleString()} UZS
                          </div>
                          <div className="text-xs text-gray-400">
                            {userLastPayments[user.id]!.date.toLocaleDateString()} {userLastPayments[user.id]!.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">{t('hr.no_payment') || 'No payment yet'}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Give Task */}
                        <button
                          onClick={() => handleOpenTaskModal(user)}
                          className="inline-flex items-center px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors border border-blue-200"
                          title={t('hr.give_task')}
                        >
                          <MdAssignment className="w-4 h-4 mr-1.5" />
                          <span>{t('hr.give_task')}</span>
                        </button>

                        {/* Pay */}
                        <button
                          onClick={() => handleOpenPayModal(user)}
                          className="inline-flex items-center px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-sm font-semibold transition-colors border border-green-200"
                          title={t('hr.pay')}
                        >
                          <MdPayment className="w-4 h-4 mr-1.5" />
                          <span>{t('hr.pay')}</span>
                        </button>

                        {/* Fine */}
                        <button
                          onClick={() => handleOpenFineModal(user)}
                          className="inline-flex items-center px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm font-semibold transition-colors border border-red-200"
                          title={t('hr.give_fine')}
                        >
                          <MdWarning className="w-4 h-4 mr-1.5" />
                          <span>{t('hr.give_fine')}</span>
                        </button>

                        <button
                          onClick={() => handleOpenModal(user)}
                          className="inline-flex items-center px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium transition-colors border border-indigo-200"
                        >
                          <FaEdit className="w-4 h-4 mr-1.5" />
                          <span>{t('form.edit')}</span>
                        </button>

                        <button
                          onClick={() => handleDelete(user.id)}
                          className="inline-flex items-center px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm font-medium transition-colors border border-red-200"
                        >
                          <FaTrash className="w-4 h-4 mr-1.5" />
                          <span>{t('form.delete')}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* User Mgmt and Fine Modals same as before */}
      {isModalOpen && (
        // ... (User Modal code reused from previous step)
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={handleCloseModal}></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    {editingUser ? t('hr.edit_employee') : t('hr.add_employee')}
                  </h3>
                  {error && (
                    <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                      <div className="flex">
                        <div className="ml-3">
                          <p className="text-sm text-red-700">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">{t('form.name')}</label>
                      <input type="text" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">{t('form.email')}</label>
                      <input type="email" required disabled={!!editingUser} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                    {!editingUser && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">{t('form.password')}</label>
                        <input type="password" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">{t('form.role')}</label>
                      <select className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}>
                        <option value="seller">{t('role.seller' as any)}</option>
                        <option value="foreman">{t('role.foreman' as any)}</option>
                        <option value="supplier">{t('role.supplier' as any)}</option>
                        <option value="hr">{t('role.hr' as any)}</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">{t('hr.salary')}</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="text-gray-500 sm:text-sm">UZS</span></div>
                          <input 
                            type="text" 
                            inputMode="numeric"
                            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-12 sm:text-sm border-gray-300 rounded-md" 
                            value={formData.salary} 
                            onChange={(e) => {
                              const parsed = parseFormattedNumber(e.target.value);
                              setFormData({ ...formData, salary: formatNumberWithSpaces(parsed) });
                            }} 
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">{t('hr.fines')}</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="text-gray-500 sm:text-sm">UZS</span></div>
                          <input 
                            type="text" 
                            inputMode="numeric"
                            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-12 sm:text-sm border-gray-300 rounded-md" 
                            value={formData.fines} 
                            onChange={(e) => {
                              const parsed = parseFormattedNumber(e.target.value);
                              setFormData({ ...formData, fines: formatNumberWithSpaces(parsed) });
                            }} 
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">{t('table.phone')}</label>
                      <input type="tel" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button type="submit" disabled={submitting} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50">{submitting ? t('signin.loading') : (editingUser ? t('foreman.update_btn') : t('admin.create_employee'))}</button>
                  <button type="button" onClick={handleCloseModal} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">{t('admin.cancel')}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {isPayModalOpen && payingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={handleClosePayModal}></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
              <form onSubmit={handleSubmitPayment}>
                <div className="bg-gradient-to-r from-green-50 to-green-100 px-6 py-4 border-b border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-green-500 rounded-full p-2">
                        <MdPayment className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{t('hr.pay_salary') || 'Pay Salary'}</h3>
                        <p className="text-sm text-gray-600">{payingUser.name}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleClosePayModal}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <FaTimes className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                  <div className="bg-white px-6 py-5">
                  {/* Employee Info Card */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-5 border border-gray-200">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 font-medium">{t('hr.salary')}:</p>
                        <p className="text-lg font-bold text-gray-900">
                          {getSalaryValue(payingUser.salary).toLocaleString()} UZS
                          {Array.isArray(payingUser.salary) && (
                            <span className="text-xs font-normal text-gray-500 ml-2">
                              ({payingUser.salary.length} payment{payingUser.salary.length !== 1 ? 's' : ''})
                            </span>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 font-medium">{t('hr.fines')}:</p>
                        <p className="text-lg font-bold text-red-600">-{(payingUser.fines || 0).toLocaleString()} UZS</p>
                      </div>
                      <div className="col-span-2 border-t border-gray-200 pt-3 mt-2">
                        <div className="flex justify-between items-center">
                          <p className="text-gray-700 font-semibold">{t('hr.net_salary')}:</p>
                          <p className="text-2xl font-bold text-green-600">
                            {(getSalaryValue(payingUser.salary) - (payingUser.fines || 0)).toLocaleString()} UZS
                          </p>
                        </div>
                      </div>
                      {userLastPayments[payingUser.id] && (
                        <div className="col-span-2 border-t border-gray-200 pt-3 mt-2">
                          <p className="text-gray-500 font-medium text-xs mb-1">{t('hr.last_payment') || 'Last Payment'}:</p>
                          <p className="text-sm text-gray-700">
                            {userLastPayments[payingUser.id]!.amount.toLocaleString()} UZS on {userLastPayments[payingUser.id]!.date.toLocaleDateString()} at {userLastPayments[payingUser.id]!.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {t('hr.payment_amount') || 'Payment Amount'} (UZS)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <FaDollarSign className="text-gray-400" />
                        </div>
                        <input
                          type="text"
                          inputMode="numeric"
                          required
                          className="block w-full pl-10 pr-3 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg font-semibold"
                          value={payData.amount}
                          onChange={(e) => {
                            const parsed = parseFormattedNumber(e.target.value);
                            setPayData({ amount: formatNumberWithSpaces(parsed) });
                          }}
                          placeholder="0"
                        />
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        {t('hr.payment_note') || 'This will clear all fines for this employee. Payment time will be recorded.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleClosePayModal}
                    className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors flex items-center space-x-2"
                  >
                    <FaTimes className="w-4 h-4" />
                    <span>{t('admin.cancel')}</span>
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2 shadow-md"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>{t('signin.loading')}</span>
                      </>
                    ) : (
                      <>
                        <FaCheckCircle className="w-5 h-5" />
                        <span>{t('hr.confirm_payment') || 'Confirm Payment'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {isFineModalOpen && finingUser && (
        // ... (Fine Modal code reused)
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true"><div className="absolute inset-0 bg-gray-500 opacity-75" onClick={handleCloseFineModal}></div></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
              <form onSubmit={handleSubmitFine}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">{t('hr.give_fine')} - {finingUser.name}</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">{t('hr.fine_amount')}</label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="text-gray-500 sm:text-sm">UZS</span></div>
                        <input 
                          type="text" 
                          inputMode="numeric"
                          required 
                          className="focus:ring-red-500 focus:border-red-500 block w-full pl-12 sm:text-sm border-gray-300 rounded-md" 
                          value={fineData.amount} 
                          onChange={(e) => {
                            const parsed = parseFormattedNumber(e.target.value);
                            setFineData({ ...fineData, amount: formatNumberWithSpaces(parsed) });
                          }} 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">{t('hr.fine_reason')}</label>
                      <textarea required rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm" value={fineData.reason} onChange={(e) => setFineData({ ...fineData, reason: e.target.value })} />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button type="submit" disabled={submitting} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50">{submitting ? t('signin.loading') : t('hr.give_fine')}</button>
                  <button type="button" onClick={handleCloseFineModal} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">{t('admin.cancel')}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Give Task Modal */}
      {isTaskModalOpen && taskingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={handleCloseTaskModal}></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
              <form onSubmit={handleSubmitTask}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    {t('hr.give_task')} - {taskingUser.name}
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">{t('hr.task_title')}</label>
                      <input
                        type="text"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={taskData.title}
                        onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">{t('hr.task_description')}</label>
                      <textarea
                        required
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={taskData.description}
                        onChange={(e) => setTaskData({ ...taskData, description: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">{t('hr.task_deadline')}</label>
                      <input
                        type="date"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={taskData.deadline}
                        onChange={(e) => setTaskData({ ...taskData, deadline: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {submitting ? t('signin.loading') : t('hr.give_task')}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseTaskModal}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {t('admin.cancel')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
}

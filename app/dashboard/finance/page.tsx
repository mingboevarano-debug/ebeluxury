'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { Profit, Expense, FinanceCategory, Project, User, OfficeWaste, OfficeWasteCategory, LocalizedStage, Contract } from '@/types';
import {
  getProfits,
  getExpenses,
  getFinanceCategories,
  createProfit,
  createExpense,
  updateProfit,
  updateExpense,
  deleteProfit,
  deleteExpense,
  deleteAllProfits,
  deleteAllExpenses,
  getAllProjects,
  getContracts,
  createFinanceCategory,
  updateFinanceCategory,
  deleteFinanceCategory,
  getOfficeWaste,
  createOfficeWaste,
  updateOfficeWaste,
  deleteOfficeWaste,
  getOfficeWasteCategories,
  createOfficeWasteCategory,
  updateOfficeWasteCategory,
  deleteOfficeWasteCategory,
  getServices,
  getUsers
} from '@/lib/db';
import { subscribeToAuthChanges, getCurrentUser } from '@/lib/auth';
import { toast } from 'react-toastify';
import { formatNumberWithSpaces, parseFormattedNumber, getNumericValue } from '@/lib/formatNumber';
import { FaEdit, FaTrash, FaPlus, FaTimes, FaCog, FaChartPie, FaFileExcel, FaFolder, FaDownload, FaChevronDown } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ProfitModal from '@/components/ProfitModal';
import ExpenseModal from '@/components/ExpenseModal';
import CategoryManagement from '@/components/CategoryManagement';
import CategoryModal from '@/components/CategoryModal';
import OfficeWasteManagement from '@/components/OfficeWasteManagement';
import OfficeWasteModal from '@/components/OfficeWasteModal';
import OfficeWasteCategoryManagement from '@/components/OfficeWasteCategoryManagement';
import OfficeWasteCategoryModal from '@/components/OfficeWasteCategoryModal';
import FinanceStatistics from '@/components/FinanceStatistics';
import { useLanguage } from '@/contexts/LanguageContext';

export default function FinanceDashboard() {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const [activeTab, setActiveTab] = useState<'profit' | 'expense' | 'categories' | 'office_waste' | 'office_waste_categories' | 'statistics' | 'contracts'>('profit');
  const [profits, setProfits] = useState<Profit[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [officeWaste, setOfficeWaste] = useState<OfficeWaste[]>([]);
  const [officeWasteCategories, setOfficeWasteCategories] = useState<OfficeWasteCategory[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [stages, setStages] = useState<LocalizedStage[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);

  // Profit Modal State
  const [isProfitModalOpen, setIsProfitModalOpen] = useState(false);
  const [editingProfit, setEditingProfit] = useState<Profit | null>(null);
  const [profitForm, setProfitForm] = useState({
    projectId: '',
    categoryId: '',
    paymentMethod: 'cash' as 'cash' | 'card',
    amount: '',
    fromWhom: '',
    comment: ''
  });

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

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FinanceCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    type: 'profit' as 'profit' | 'expense',
    description: '',
    color: '#3B82F6',
    icon: '',
    budget: '',
    isActive: true
  });

  // Office Waste Modal State
  const [isOfficeWasteModalOpen, setIsOfficeWasteModalOpen] = useState(false);
  const [editingOfficeWaste, setEditingOfficeWaste] = useState<OfficeWaste | null>(null);
  const [officeWasteForm, setOfficeWasteForm] = useState({
    title: '',
    description: '',
    category: '',
    amount: '',
    paymentMethod: 'cash' as 'cash' | 'card',
    vendor: '',
    receiptNumber: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Office Waste Category Modal State
  const [isOfficeWasteCategoryModalOpen, setIsOfficeWasteCategoryModalOpen] = useState(false);
  const [editingOfficeWasteCategory, setEditingOfficeWasteCategory] = useState<OfficeWasteCategory | null>(null);
  const [officeWasteCategoryForm, setOfficeWasteCategoryForm] = useState({
    name: '',
    nameRu: '',
    nameUz: '',
    description: '',
    color: '#EF4444',
    order: '0',
    isActive: true
  });

  const [submitting, setSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedImportCategoryId, setSelectedImportCategoryId] = useState<string>('');
  const [selectedImportContractId, setSelectedImportContractId] = useState<string>('');

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

      // Fetch all data
      await fetchData();
      setCheckingAccess(false);
    });

    return () => unsubscribe();
  }, [router]);

  const fetchData = async () => {
    try {
      const [
        allProfits,
        allExpenses,
        allProjects,
        allContracts,
        categoriesData,
        officeWasteData,
        officeWasteCategoriesData,
        servicesData,
        allUsers
      ] = await Promise.all([
        getProfits(),
        getExpenses(),
        getAllProjects(),
        getContracts(),
        getFinanceCategories(),
        getOfficeWaste(),
        getOfficeWasteCategories(),
        getServices(),
        getUsers()
      ]);

      // Extract unique stages from services with all translations
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

      // Merge contracts and projects for selection
      // We want to show all contracts. If a contract has a project, we can link them.
      // For the dropdown, we'll map contracts to a Project-like structure.
      const formattedSites: Project[] = allContracts.map(contract => {
        return {
          id: contract.id, // Use contract ID as the primary selection ID
          contractId: contract.id,
          foremanId: contract.foremanId || '',
          foremanName: '', // Not strictly needed for selection
          clientName: `${contract.clientName} ${contract.clientSurname}`.trim(),
          location: contract.location,
          constructionName: contract.constructionName,
          price: contract.price,
          description: contract.description,
          deadline: contract.deadline,
          status: contract.status === 'pending' ? 'active' : 'active', // Compatibility
          createdAt: contract.createdAt
        } as Project;
      });

      setProfits(allProfits);
      setExpenses(allExpenses);
      setCategories(categoriesData);
      setProjects(formattedSites);
      setContracts(allContracts);
      setOfficeWaste(officeWasteData);
      setOfficeWasteCategories(officeWasteCategoriesData);
      // Filter out admin and director from users list
      setUsers(allUsers.filter(u => u.role !== 'admin' && u.role !== 'director'));

      // Set default import category to "Materialga harajat" if it exists
      const materialCategory = categoriesData.find(c => c.type === 'expense' && (c.name === 'Materialga harajat' || c.name === 'Materialga xarajat'));
      if (materialCategory && !selectedImportCategoryId) {
        setSelectedImportCategoryId(materialCategory.id);
      }

      // Initialize default categories if none exist
      if (officeWasteCategoriesData.length === 0) {
        await initializeDefaultOfficeWasteCategories();
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(t('finance.load_error'));
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultOfficeWasteCategories = async () => {
    const defaultCategories = [
      { name: 'Furniture', nameRu: 'Мебель', nameUz: 'Mebel', description: '', color: '#EF4444', order: 1, isActive: true },
      { name: 'Technology', nameRu: 'Технологии', nameUz: 'Texnologiya', description: '', color: '#3B82F6', order: 2, isActive: true },
      { name: 'Utilities', nameRu: 'Коммунальные услуги', nameUz: 'Kommunal xizmatlar', description: '', color: '#10B981', order: 3, isActive: true },
      { name: 'Maintenance', nameRu: 'Обслуживание', nameUz: 'Xizmat ko\'rsatish', description: '', color: '#F59E0B', order: 4, isActive: true },
      { name: 'Office Supplies', nameRu: 'Офисные принадлежности', nameUz: 'Ofis materiallari', description: '', color: '#8B5CF6', order: 5, isActive: true },
      { name: 'Internet & WiFi', nameRu: 'Интернет и WiFi', nameUz: 'Internet va WiFi', description: '', color: '#EC4899', order: 6, isActive: true },
      { name: 'Security', nameRu: 'Безопасность', nameUz: 'Xavfsizlik', description: '', color: '#06B6D4', order: 7, isActive: true },
      { name: 'Cleaning', nameRu: 'Уборка', nameUz: 'Tozalash', description: '', color: '#F97316', order: 8, isActive: true },
      { name: 'Other', nameRu: 'Другое', nameUz: 'Boshqa', description: '', color: '#6366F1', order: 9, isActive: true },
    ];

    try {
      for (const cat of defaultCategories) {
        await createOfficeWasteCategory(cat);
      }
      const updatedCategories = await getOfficeWasteCategories();
      setOfficeWasteCategories(updatedCategories);
    } catch (error) {
      console.error('Error initializing default categories:', error);
    }
  };

  // Profit Handlers
  const handleOpenProfitModal = (profit?: Profit) => {
    if (profit) {
      setEditingProfit(profit);
      setProfitForm({
        projectId: profit.projectId || '',
        categoryId: profit.categoryId,
        paymentMethod: profit.paymentMethod,
        amount: formatNumberWithSpaces(profit.amount.toString()),
        fromWhom: profit.fromWhom,
        comment: profit.comment || ''
      });
    } else {
      setEditingProfit(null);
      setProfitForm({
        projectId: '',
        categoryId: '',
        paymentMethod: 'cash',
        amount: '',
        fromWhom: '',
        comment: ''
      });
    }
    setIsProfitModalOpen(true);
  };

  const handleSubmitProfit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const amount = getNumericValue(profitForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error(t('finance.invalid_amount'));
      return;
    }

    if (!profitForm.categoryId) {
      toast.error(t('finance.select_category'));
      return;
    }

    if (!profitForm.fromWhom.trim()) {
      toast.error(t('finance.enter_from_whom'));
      return;
    }

    setSubmitting(true);
    try {
      const category = categories.find(c => c.id === profitForm.categoryId);
      const project = profitForm.projectId ? projects.find(p => p.id === profitForm.projectId) : null;

      const profitData = {
        projectId: profitForm.projectId || undefined,
        projectName: project ? (() => {
          // Format project name properly to avoid concatenation mess
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
        name: '',
        categoryId: profitForm.categoryId,
        categoryName: category?.name || '',
        paymentMethod: profitForm.paymentMethod,
        amount,
        fromWhom: profitForm.fromWhom.trim(),
        createdBy: user.id,
        createdByName: user.name,
        ...(profitForm.comment.trim() && { comment: profitForm.comment.trim() })
      };

      if (editingProfit) {
        await updateProfit(editingProfit.id, profitData);
        toast.success(t('finance.profit_updated'));
      } else {
        await createProfit(profitData);
        toast.success(t('finance.profit_added'));
      }

      await fetchData();
      setIsProfitModalOpen(false);
      setProfitForm({
        projectId: '',
        categoryId: '',
        paymentMethod: 'cash',
        amount: '',
        fromWhom: '',
        comment: ''
      });
    } catch (error: any) {
      console.error('Error saving profit:', error);
      toast.error(error.message || t('finance.save_profit_error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProfit = async (id: string) => {
    if (!confirm(t('finance.confirm_delete_profit'))) return;

    try {
      await deleteProfit(id);
      toast.success(t('finance.profit_deleted'));
      await fetchData();
    } catch (error: any) {
      console.error('Error deleting profit:', error);
      toast.error(error.message || t('finance.delete_profit_error'));
    }
  };

  // Expense Handlers
  const handleOpenExpenseModal = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setExpenseForm({
        projectId: expense.projectId || '',
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
        projectId: '',
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
    if (!user) return;

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
      const project = expenseForm.projectId ? projects.find(p => p.id === expenseForm.projectId) : null;

      // Get selected employees if any
      const selectedEmployees = expenseForm.selectedEmployeeIds.length > 0
        ? users.filter(u => expenseForm.selectedEmployeeIds.includes(u.id))
        : [];

      const expenseData = {
        categoryId: expenseForm.categoryId,
        categoryName: category?.name || '',
        name: expenseForm.name.trim(),
        paymentMethod: expenseForm.paymentMethod,
        amount,
        toWhom: expenseForm.toWhom.trim(),
        createdBy: user.id,
        createdByName: user.name,
        ...(expenseForm.projectId && { projectId: expenseForm.projectId }),
        ...(project && (() => {
          // Format project name properly to avoid concatenation mess
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
          const projectName = parts.length > 0 ? parts.join(' - ') : undefined;
          return projectName ? { projectName } : {};
        })()),
        ...(expenseForm.stage && expenseForm.stage.trim() && { stage: expenseForm.stage.trim() }),
        ...(expenseForm.comment.trim() && { comment: expenseForm.comment.trim() }),
        ...(selectedEmployees.length > 0 && {
          employees: selectedEmployees.map(e => e.id),
          employeeNames: selectedEmployees.map(e => e.name)
        }),
        ...(expenseForm.profitId && { profitId: expenseForm.profitId })
      };

      if (editingExpense) {
        await updateExpense(editingExpense.id, expenseData);
        toast.success(t('finance.expense_updated'));
      } else {
        await createExpense(expenseData);
        toast.success(t('finance.expense_added'));
        
        // Send Telegram notification for new expenses
        try {
          await fetch('/api/telegram', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: expenseData.name,
              categoryName: expenseData.categoryName,
              amount: expenseData.amount,
              toWhom: expenseData.toWhom,
              createdByName: expenseData.createdByName,
              projectName: expenseData.projectName,
              paymentMethod: expenseData.paymentMethod,
              comment: expenseData.comment,
              stage: expenseData.stage,
            }),
          });
        } catch (telegramError) {
          // Don't show error to user if Telegram notification fails
          console.error('Failed to send Telegram notification:', telegramError);
        }
      }

      await fetchData();
      setIsExpenseModalOpen(false);
      setExpenseForm({
        projectId: '',
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

  const handleDeleteExpense = async (id: string) => {
    if (!confirm(t('finance.confirm_delete_expense'))) return;

    try {
      await deleteExpense(id);
      toast.success(t('finance.expense_deleted'));
      await fetchData();
    } catch (error: any) {
      console.error('Error deleting expense:', error);
      toast.error(error.message || t('finance.delete_expense_error'));
    }
  };

  // Category Handlers
  const handleOpenCategoryModal = (category?: FinanceCategory) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        type: category.type,
        description: category.description || '',
        color: category.color || '#3B82F6',
        icon: category.icon || '',
        budget: category.budget ? formatNumberWithSpaces(category.budget.toString()) : '',
        isActive: category.isActive !== false
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({
        name: '',
        type: activeTab === 'profit' || activeTab === 'expense' ? activeTab : 'profit',
        description: '',
        color: '#3B82F6',
        icon: '',
        budget: '',
        isActive: true
      });
    }
    setIsCategoryModalOpen(true);
  };

  const handleSubmitCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      toast.error(t('finance.enter_category_name'));
      return;
    }

    setSubmitting(true);
    try {
      const budgetValue = categoryForm.budget ? getNumericValue(categoryForm.budget) : undefined;

      const categoryData: any = {
        name: categoryForm.name.trim(),
        type: categoryForm.type,
        isActive: categoryForm.isActive !== false,
        ...(categoryForm.description?.trim() && { description: categoryForm.description.trim() }),
        ...(categoryForm.color && { color: categoryForm.color }),
        ...(categoryForm.icon && { icon: categoryForm.icon }),
        ...(budgetValue !== undefined && { budget: budgetValue }),
      };

      if (editingCategory) {
        await updateFinanceCategory(editingCategory.id, categoryData);
        toast.success(t('finance.category_updated'));
      } else {
        await createFinanceCategory(categoryData);
        toast.success(t('finance.category_created'));
      }

      await fetchData();
      setIsCategoryModalOpen(false);
      setCategoryForm({
        name: '',
        type: 'profit',
        description: '',
        color: '#3B82F6',
        icon: '',
        budget: '',
        isActive: true
      });
    } catch (error: any) {
      console.error('Error saving category:', error);
      toast.error(error.message || t('finance.save_category_error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm(t('finance.confirm_delete_category'))) return;

    try {
      await deleteFinanceCategory(id);
      toast.success(t('finance.category_deleted'));
      await fetchData();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast.error(error.message || t('finance.delete_category_error'));
    }
  };

  // Excel Template Download Handler
  const handleDownloadTemplate = () => {
    try {
      // Create header row based on user's requirements:
      // A (0): Sana (Date)
      // B (1): Nomi (Name)
      // C (2): Olingan joyi (Source/Place)
      // D (3): Бирлик нархи (Unit price)
      // E (4): Миқдор (Quantity)
      // F (5): Жамми сума (Total amount)
      // G (6): Лойиҳа (Project)
      
      const headers = [
        'Sana',           // A - Date
        'Nomi',           // B - Name
        'Olingan joyi',   // C - Source/Place
        'Бирлик нархи',   // D - Unit price
        'Миқдор',         // E - Quantity
        'Жамми сума',     // F - Total amount
        'Лойиҳа'          // G - Project
      ];

      // Create worksheet with only headers (no data rows)
      const ws = XLSX.utils.aoa_to_sheet([headers]);
      
      // Set column widths for better readability
      ws['!cols'] = [
        { wch: 12 },  // A - Date
        { wch: 20 },  // B - Name
        { wch: 20 },  // C - Source/Place
        { wch: 15 },  // D - Unit price
        { wch: 10 },  // E - Quantity
        { wch: 15 },  // F - Total amount
        { wch: 25 }   // G - Project
      ];

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Expenses');

      // Download the file
      XLSX.writeFile(wb, 'expense_template.xlsx');
      toast.success(t('finance.template_downloaded') || 'Template downloaded successfully');
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error(t('finance.template_download_error') || 'Failed to download template');
    }
  };

  // Excel Import Handler
  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      // Skip header row
      const rows = jsonData.slice(1);
      let successCount = 0;
      let errorCount = 0;

      if (!selectedImportCategoryId) {
        toast.error(t('finance.select_category_first'));
        setImporting(false);
        return;
      }

      const selectedCategory = categories.find(c => c.id === selectedImportCategoryId);

      if (!selectedCategory) {
        toast.error(t('finance.create_category_first'));
        setImporting(false);
        return;
      }

      for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
        const row = rows[rowIndex];
        try {
          // Column mapping based on new Excel template:
          // A (0): Sana (Date)
          // B (1): Nomi (Name)
          // C (2): Olingan joyi (Source -> toWhom)
          // D (3): Бирлик нархи (Unit price -> unitPrice)
          // E (4): Миқдор (Quantity -> quantity)
          // F (5): Жамми сума (Total amount -> amount)
          // G (6): Лойиҳа (Project -> comment)

          const dateValue = row[0];
          const name = row[1];
          const source = row[2]; // Olingan joyi -> toWhom
          const unitPrice = row[3]; // Бирлик нархи
          const quantity = row[4]; // Миқдор
          const totalAmount = row[5]; // Жамми сума
          const project = row[6]; // Лойиҳа -> comment

          // Skip empty rows - require at least name and total amount
          if (!name || !totalAmount) {
            console.log(`Skipping row ${rowIndex + 2}: missing name or total amount`);
            continue;
          }

          // Parse total amount (Жамми сума)
          const parsedAmount = typeof totalAmount === 'number' 
            ? totalAmount 
            : parseFloat(String(totalAmount).replace(/\s/g, ''));
          if (isNaN(parsedAmount) || parsedAmount <= 0) continue;

          // Parse unit price (Бирлик нархи) if present
          const parsedUnitPrice = unitPrice 
            ? (typeof unitPrice === 'number' 
                ? unitPrice 
                : parseFloat(String(unitPrice).replace(/\s/g, '')))
            : undefined;

          // Parse quantity (Миқдор) if present
          const parsedQuantity = quantity 
            ? (typeof quantity === 'number' 
                ? quantity 
                : parseFloat(String(quantity)))
            : undefined;

          // Parse date if present, otherwise use current date
          let expenseDate = new Date();
          if (dateValue) {
            // Try to parse the date
            let parsedDate: Date;
            if (typeof dateValue === 'number') {
              // Excel date serial number (days since 1900-01-01)
              // Excel epoch starts on 1900-01-01, but Excel incorrectly treats 1900 as a leap year
              // So we need to adjust: Excel date = (days since 1900-01-01) - 1
              const excelEpoch = new Date(1899, 11, 30); // December 30, 1899
              parsedDate = new Date(excelEpoch.getTime() + (dateValue - 1) * 24 * 60 * 60 * 1000);
            } else if (dateValue instanceof Date) {
              parsedDate = dateValue;
            } else {
              // Try parsing as date string
              parsedDate = new Date(dateValue);
            }
            if (!isNaN(parsedDate.getTime())) {
              expenseDate = parsedDate;
            }
          }

          // Build expense data
          const expenseData: Omit<Expense, 'id' | 'createdAt'> = {
            categoryId: selectedCategory.id,
            categoryName: selectedCategory.name,
            name: String(name).trim(),
            paymentMethod: 'cash',
            amount: parsedAmount, // Total amount from Жамми сума
            toWhom: source ? String(source).trim() : 'Unknown',
            createdBy: user.id,
            createdByName: user.name,
            ...(parsedUnitPrice && !isNaN(parsedUnitPrice) && { unitPrice: parsedUnitPrice }),
            ...(parsedQuantity && !isNaN(parsedQuantity) && { quantity: parsedQuantity }),
            ...(project && { comment: String(project).trim() }),
            ...(selectedImportContractId && { projectId: selectedImportContractId }),
            ...(selectedImportContractId && (() => {
              const contract = contracts.find(c => c.id === selectedImportContractId);
              if (!contract) return {};
              const parts = [];
              if (contract.constructionName) {
                parts.push(`[${contract.constructionName}]`);
              }
              const clientFullName = `${contract.clientName} ${contract.clientSurname}`.trim();
              if (clientFullName) {
                parts.push(clientFullName);
              }
              if (contract.location) {
                parts.push(contract.location);
              }
              const projectName = parts.length > 0 ? parts.join(' - ') : undefined;
              return projectName ? { projectName } : {};
            })()),
          };

          // Create expense with custom date
          const expenseRef = doc(collection(db, 'expenses'));
          const expenseDataWithDate = {
            ...expenseData,
            createdAt: Timestamp.fromDate(expenseDate),
          };
          await setDoc(expenseRef, expenseDataWithDate);
          
          // Send Telegram notification for imported expenses
          try {
            await fetch('/api/telegram', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: expenseData.name,
                categoryName: expenseData.categoryName,
                amount: expenseData.amount,
                toWhom: expenseData.toWhom,
                createdByName: expenseData.createdByName,
                projectName: expenseData.projectName,
                paymentMethod: expenseData.paymentMethod,
                comment: expenseData.comment,
                stage: expenseData.stage,
              }),
            });
          } catch (telegramError) {
            // Don't show error to user if Telegram notification fails
            console.error('Failed to send Telegram notification:', telegramError);
          }
          
          successCount++;
        } catch (rowError: any) {
          console.error(`Error processing row ${rowIndex + 2}:`, rowError);
          console.error('Row data:', row);
          errorCount++;
        }
      }

      await fetchData();
      toast.success(t('finance.import_success').replace('{successCount}', successCount.toString()) + (errorCount > 0 ? `, ${errorCount} failed` : ''));
    } catch (error) {
      console.error('Error importing Excel:', error);
      toast.error(t('finance.import_failed'));
    } finally {
      setImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleDeleteAllProfits = async () => {
    if (!window.confirm(t('finance.confirm_delete_all_profits'))) return;

    setLoading(true);
    try {
      await deleteAllProfits();
      toast.success(t('finance.all_profits_deleted'));
      await fetchData();
    } catch (error: any) {
      console.error('Error deleting all profits:', error);
      toast.error(error.message || t('finance.delete_all_profits_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAllExpenses = async () => {
    if (!window.confirm(t('finance.confirm_delete_all_expenses'))) return;

    setLoading(true);
    try {
      await deleteAllExpenses();
      toast.success(t('finance.all_expenses_deleted'));
      await fetchData();
    } catch (error: any) {
      console.error('Error deleting all expenses:', error);
      toast.error(error.message || t('finance.delete_all_expenses_error'));
    } finally {
      setLoading(false);
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

  const profitCategories = categories.filter(c => c.type === 'profit');
  const expenseCategories = categories.filter(c => c.type === 'expense');
  const totalProfit = profits.reduce((sum, p) => sum + p.amount, 0);
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalProfit - totalExpense;
  const totalContractPrice = contracts.reduce((sum, c) => sum + c.price, 0);
  const totalContractProfits = contracts.reduce((sum, contract) => {
    const contractProfits = profits.filter(p => p.projectId === contract.id);
    return sum + contractProfits.reduce((profitSum, p) => profitSum + p.amount, 0);
  }, 0);
  const totalMoneyOnDelay = totalContractPrice - totalContractProfits;

  return (
    <Layout>
      <div className="px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{t('finance.title')}</h1>
          <button
            onClick={() => setActiveTab('categories')}
            className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium shadow-sm transition-colors"
          >
            <FaCog className="w-4 h-4" />
            <span>{t('finance.manage_categories')}</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow border border-green-100">
            <h3 className="text-lg font-medium text-gray-500">{t('finance.total_profit')}</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">{formatNumberWithSpaces(totalProfit.toString())} UZS</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border border-red-100">
            <h3 className="text-lg font-medium text-gray-500">{t('finance.total_expense')}</h3>
            <p className="text-3xl font-bold text-red-600 mt-2">{formatNumberWithSpaces(totalExpense.toString())} UZS</p>
          </div>
          <div className={`bg-white p-6 rounded-lg shadow border ${netProfit >= 0 ? 'border-blue-100' : 'border-red-100'}`}>
            <h3 className="text-lg font-medium text-gray-500">{t('finance.net_profit')}</h3>
            <p className={`text-3xl font-bold mt-2 ${netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatNumberWithSpaces(netProfit.toString())} UZS
            </p>
          </div>
          <div className="bg-gray-100 p-6 rounded-lg shadow border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-600 tracking-wide">{t('finance.contract.money_on_delay')}</h3>
            <p className="text-3xl font-bold mt-2 text-gray-700">
              {formatNumberWithSpaces(totalMoneyOnDelay.toString())} UZS
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-4 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('profit')}
              className={`${activeTab === 'profit'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {t('finance.tab.profit')} ({profits.length})
            </button>
            <button
              onClick={() => setActiveTab('expense')}
              className={`${activeTab === 'expense'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {t('finance.tab.expense')} ({expenses.length})
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`${activeTab === 'categories'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {t('finance.tab.categories')}
            </button>
            <button
              onClick={() => setActiveTab('office_waste')}
              className={`${activeTab === 'office_waste'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {t('finance.tab.office_waste')} ({officeWaste.length})
            </button>
            <button
              onClick={() => setActiveTab('office_waste_categories')}
              className={`${activeTab === 'office_waste_categories'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {t('finance.tab.office_waste_categories')}
            </button>
            <button
              onClick={() => setActiveTab('statistics')}
              className={`${activeTab === 'statistics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
            >
              <FaChartPie className="w-4 h-4" />
              <span>{t('finance.tab.statistics')}</span>
            </button>
            <button
              onClick={() => setActiveTab('contracts')}
              className={`${activeTab === 'contracts'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
            >
              <FaFolder className="w-4 h-4" />
              <span>{t('finance.tab.contracts') || 'Contracts'} ({contracts.length})</span>
            </button>
          </nav>
        </div>

        {/* Statistics Tab */}
        {activeTab === 'statistics' && (
          <FinanceStatistics profits={profits} expenses={expenses} />
        )}

        {/* Profit Tab */}
        {activeTab === 'profit' && (
          <div>
            <div className="flex justify-end mb-4 gap-3">
              <button
                onClick={handleDeleteAllProfits}
                className="flex items-center space-x-2 bg-red-100 hover:bg-red-200 text-red-600 px-4 py-2 rounded-md font-medium shadow-sm transition-colors"
                disabled={profits.length === 0}
              >
                <FaTrash className="w-4 h-4" />
                <span>{t('finance.remove_all')}</span>
              </button>
              <button
                onClick={() => handleOpenProfitModal()}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium shadow-sm transition-colors"
              >
                <FaPlus className="w-4 h-4" />
                <span>{t('finance.add_profit')}</span>
              </button>
            </div>

            <div className="bg-white shadow rounded-lg overflow-x-auto">
              <div className="min-w-[1200px]">
                <table className="min-w-[1200px] divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('finance.table.date')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('finance.table.project')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('finance.table.category')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('finance.table.from_whom')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('finance.table.payment_method')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('finance.table.amount')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('finance.table.comment')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('finance.table.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {profits.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-4 text-center text-gray-500">{t('finance.no_profits')}</td>
                      </tr>
                    ) : (
                      profits.map((profit) => (
                        <tr key={profit.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {profit.createdAt.toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {profit.projectName || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{profit.categoryName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{profit.fromWhom}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {t(`finance.payment_method.${profit.paymentMethod}`)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                            {profit.amount.toLocaleString()} UZS
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">{profit.comment || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleOpenProfitModal(profit)}
                              className="text-indigo-600 hover:text-indigo-900 mr-4"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDeleteProfit(profit.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Expense Tab */}
        {activeTab === 'expense' && (
          <div>
            {/* Expense toolbar */}
            <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm">
              {/* Import configuration (category + contract) */}
              <div className="flex flex-wrap items-end gap-4">
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    {t('finance.import_category')}
                  </span>
                  <div className="relative">
                    <select
                      value={selectedImportCategoryId}
                      onChange={(e) => setSelectedImportCategoryId(e.target.value)}
                      className="min-w-[220px] pr-9 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 bg-white shadow-sm appearance-none"
                    >
                      <option value="">{t('finance.select_category')}</option>
                      {expenseCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    <FaChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                  </div>
                </div>

                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    {t('finance.import_contract')}
                  </span>
                  <div className="relative">
                    <select
                      value={selectedImportContractId}
                      onChange={(e) => setSelectedImportContractId(e.target.value)}
                      className="min-w-[260px] max-w-xs pr-9 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 bg-white shadow-sm appearance-none"
                    >
                      <option value="">{t('finance.select_contract') || 'Without contract'}</option>
                      {contracts.map((contract) => {
                        const clientFullName = `${contract.clientName} ${contract.clientSurname}`.trim();
                        const labelParts = [];
                        if (clientFullName) labelParts.push(clientFullName);
                        if (contract.location) labelParts.push(contract.location);
                        if (contract.constructionName) labelParts.push(`[${contract.constructionName}]`);
                        const label = labelParts.join(' • ');
                        return (
                          <option key={contract.id} value={contract.id}>
                            {label || contract.id}
                          </option>
                        );
                      })}
                    </select>
                    <FaChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Actions: template, import, bulk delete, add */}
              <div className="flex flex-wrap items-center justify-end gap-3">
                <button
                  onClick={handleDownloadTemplate}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium shadow-sm transition-colors"
                >
                  <FaDownload className="w-4 h-4" />
                  <span>{t('finance.download_template') || 'Download Template'}</span>
                </button>

                <label className={`flex items-center space-x-2 ${importing ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} text-white px-4 py-2 rounded-md font-medium shadow-sm transition-colors cursor-pointer`}>
                  <FaFileExcel className="w-4 h-4" />
                  <span>{importing ? t('finance.importing') : t('finance.import_excel')}</span>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleImportExcel}
                    disabled={importing}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={handleDeleteAllExpenses}
                  className="flex items-center space-x-2 bg-red-100 hover:bg-red-200 text-red-600 px-4 py-2 rounded-md font-medium shadow-sm transition-colors"
                  disabled={expenses.length === 0}
                >
                  <FaTrash className="w-4 h-4" />
                  <span>{t('finance.remove_all')}</span>
                </button>

                <button
                  onClick={() => handleOpenExpenseModal()}
                  className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium shadow-sm transition-colors"
                >
                  <FaPlus className="w-4 h-4" />
                  <span>{t('finance.add_expense')}</span>
                </button>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg overflow-x-auto">
              <div className="overflow-x-auto">
                <table className="min-w-[1200px] divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('finance.table.date')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('finance.table.name')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('finance.table.project')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('finance.table.category')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('finance.table.to_whom')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('finance.table.stage')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('finance.table.price')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('finance.table.quantity')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('finance.table.total')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('finance.table.payment_method')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('finance.table.comment')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('finance.table.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {expenses.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="px-6 py-4 text-center text-gray-500">{t('finance.no_expenses')}</td>
                      </tr>
                    ) : (
                      expenses.map((expense) => (
                        <tr key={expense.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {expense.createdAt.toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {expense.name || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {expense.projectName || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{expense.categoryName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{expense.toWhom}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {(() => {
                              if (!expense.stage) return '-';
                              const stageObj = stages.find(s => s.en === expense.stage);
                              if (stageObj) {
                                return locale === 'uz' ? stageObj.uz : locale === 'ru' ? stageObj.ru : stageObj.en;
                              }
                              return expense.stage;
                            })()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {expense.unitPrice ? formatNumberWithSpaces(expense.unitPrice.toString()) + ' UZS' : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {expense.quantity || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                            {expense.amount.toLocaleString()} UZS
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {t(`finance.payment_method.${expense.paymentMethod}`)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">{expense.comment || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleOpenExpenseModal(expense)}
                              className="text-indigo-600 hover:text-indigo-900 mr-4"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDeleteExpense(expense.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="space-y-8">
            {/* Profit Categories */}
            <CategoryManagement
              categories={profitCategories}
              type="profit"
              profits={profits}
              onAdd={() => {
                setCategoryForm({
                  name: '',
                  type: 'profit',
                  description: '',
                  color: '#3B82F6',
                  icon: '',
                  budget: '',
                  isActive: true
                });
                handleOpenCategoryModal();
              }}
              onEdit={handleOpenCategoryModal}
              onDelete={handleDeleteCategory}
            />

            {/* Expense Categories */}
            <CategoryManagement
              categories={expenseCategories}
              type="expense"
              expenses={expenses}
              onAdd={() => {
                setCategoryForm({
                  name: '',
                  type: 'expense',
                  description: '',
                  color: '#3B82F6',
                  icon: '',
                  budget: '',
                  isActive: true
                });
                handleOpenCategoryModal();
              }}
              onEdit={handleOpenCategoryModal}
              onDelete={handleDeleteCategory}
            />
          </div>
        )}

        {/* Profit Modal */}
        <ProfitModal
          isOpen={isProfitModalOpen}
          onClose={() => setIsProfitModalOpen(false)}
          onSubmit={handleSubmitProfit}
          editingProfit={editingProfit}
          profitForm={profitForm}
          setProfitForm={setProfitForm}
          projects={projects}
          profitCategories={profitCategories}
          submitting={submitting}
        />

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
          expenseCategories={expenseCategories}
          users={users}
          profits={profits}
          submitting={submitting}
          selectedEmployeeIds={expenseForm.selectedEmployeeIds}
          onEmployeeSelectionChange={(employeeIds) => {
            setExpenseForm({ ...expenseForm, selectedEmployeeIds: employeeIds });
          }}
        />

        {/* Category Modal */}
        <CategoryModal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          onSubmit={handleSubmitCategory}
          editingCategory={editingCategory}
          categoryForm={categoryForm}
          setCategoryForm={setCategoryForm}
          submitting={submitting}
        />

        {/* Office Waste Tab */}
        {activeTab === 'office_waste' && (
          <OfficeWasteManagement
            officeWaste={officeWaste}
            onAdd={() => {
              setEditingOfficeWaste(null);
              setOfficeWasteForm({
                title: '',
                description: '',
                category: '',
                amount: '',
                paymentMethod: 'cash',
                vendor: '',
                receiptNumber: '',
                date: new Date().toISOString().split('T')[0]
              });
              setIsOfficeWasteModalOpen(true);
            }}
            onEdit={(waste) => {
              setEditingOfficeWaste(waste);
              setOfficeWasteForm({
                title: waste.title,
                description: waste.description || '',
                category: waste.category,
                amount: waste.amount.toString(),
                paymentMethod: waste.paymentMethod,
                vendor: waste.vendor || '',
                receiptNumber: waste.receiptNumber || '',
                date: new Date(waste.date).toISOString().split('T')[0]
              });
              setIsOfficeWasteModalOpen(true);
            }}
            onDelete={async (id) => {
              if (!confirm(t('finance.office_waste.confirm_delete'))) return;
              try {
                await deleteOfficeWaste(id);
                toast.success(t('finance.office_waste.deleted'));
                await fetchData();
              } catch (error) {
                console.error('Error deleting office waste:', error);
                toast.error(t('finance.office_waste.delete_error'));
              }
            }}
          />
        )}

        {/* Office Waste Modal */}
        <OfficeWasteModal
          isOpen={isOfficeWasteModalOpen}
          onClose={() => setIsOfficeWasteModalOpen(false)}
          onSubmit={async (e) => {
            e.preventDefault();
            if (!user) return;

            setSubmitting(true);
            try {
              const amount = getNumericValue(officeWasteForm.amount);
              if (isNaN(amount) || amount <= 0) {
                toast.error(t('finance.office_waste.invalid_amount'));
                setSubmitting(false);
                return;
              }

              const wasteData: Omit<OfficeWaste, 'id' | 'createdAt'> = {
                title: officeWasteForm.title.trim(),
                description: officeWasteForm.description.trim() || undefined,
                category: officeWasteForm.category,
                amount: amount,
                paymentMethod: officeWasteForm.paymentMethod,
                vendor: officeWasteForm.vendor.trim() || undefined,
                receiptNumber: officeWasteForm.receiptNumber.trim() || undefined,
                date: new Date(officeWasteForm.date),
                createdBy: user.id,
                createdByName: user.name,
              };

              if (editingOfficeWaste) {
                await updateOfficeWaste(editingOfficeWaste.id, wasteData);
                toast.success(t('finance.office_waste.updated'));
              } else {
                await createOfficeWaste(wasteData);
                toast.success(t('finance.office_waste.created'));
              }

              setIsOfficeWasteModalOpen(false);
              setOfficeWasteForm({
                title: '',
                description: '',
                category: '',
                amount: '',
                paymentMethod: 'cash',
                vendor: '',
                receiptNumber: '',
                date: new Date().toISOString().split('T')[0]
              });
              await fetchData();
            } catch (error: any) {
              console.error('Error saving office waste:', error);
              toast.error(error.message || t('finance.office_waste.save_error'));
            } finally {
              setSubmitting(false);
            }
          }}
          editingWaste={editingOfficeWaste}
          wasteForm={officeWasteForm}
          setWasteForm={setOfficeWasteForm}
          submitting={submitting}
          categories={officeWasteCategories}
        />

        {/* Office Waste Categories Tab */}
        {activeTab === 'office_waste_categories' && (
          <OfficeWasteCategoryManagement
            categories={officeWasteCategories}
            officeWaste={officeWaste}
            onAdd={() => {
              setEditingOfficeWasteCategory(null);
              setOfficeWasteCategoryForm({
                name: '',
                nameRu: '',
                nameUz: '',
                description: '',
                color: '#EF4444',
                order: (officeWasteCategories.length + 1).toString(),
                isActive: true
              });
              setIsOfficeWasteCategoryModalOpen(true);
            }}
            onEdit={(category) => {
              setEditingOfficeWasteCategory(category);
              setOfficeWasteCategoryForm({
                name: category.name,
                nameRu: category.nameRu,
                nameUz: category.nameUz,
                description: category.description || '',
                color: category.color,
                order: category.order.toString(),
                isActive: category.isActive
              });
              setIsOfficeWasteCategoryModalOpen(true);
            }}
            onDelete={async (id) => {
              if (!confirm(t('finance.office_waste.confirm_delete_category'))) return;
              try {
                await deleteOfficeWasteCategory(id);
                toast.success(t('finance.office_waste.category_deleted'));
                await fetchData();
              } catch (error) {
                console.error('Error deleting category:', error);
                toast.error(t('finance.office_waste.delete_category_error'));
              }
            }}
          />
        )}

        {/* Office Waste Category Modal */}
        <OfficeWasteCategoryModal
          isOpen={isOfficeWasteCategoryModalOpen}
          onClose={() => setIsOfficeWasteCategoryModalOpen(false)}
          onSubmit={async (e) => {
            e.preventDefault();
            setSubmitting(true);
            try {
              const categoryData: Omit<OfficeWasteCategory, 'id' | 'createdAt'> = {
                name: officeWasteCategoryForm.name.trim(),
                nameRu: officeWasteCategoryForm.nameRu.trim(),
                nameUz: officeWasteCategoryForm.nameUz.trim(),
                description: officeWasteCategoryForm.description.trim() || undefined,
                color: officeWasteCategoryForm.color,
                order: parseInt(officeWasteCategoryForm.order) || 0,
                isActive: officeWasteCategoryForm.isActive,
              };

              if (editingOfficeWasteCategory) {
                await updateOfficeWasteCategory(editingOfficeWasteCategory.id, categoryData);
                toast.success(t('finance.office_waste.category_updated'));
              } else {
                await createOfficeWasteCategory(categoryData);
                toast.success(t('finance.office_waste.category_created'));
              }

              setIsOfficeWasteCategoryModalOpen(false);
              setOfficeWasteCategoryForm({
                name: '',
                nameRu: '',
                nameUz: '',
                description: '',
                color: '#EF4444',
                order: (officeWasteCategories.length + 1).toString(),
                isActive: true
              });
              await fetchData();
            } catch (error: any) {
              console.error('Error saving category:', error);
              toast.error(error.message || t('finance.office_waste.save_category_error'));
            } finally {
              setSubmitting(false);
            }
          }}
          editingCategory={editingOfficeWasteCategory}
          categoryForm={officeWasteCategoryForm}
          setCategoryForm={setOfficeWasteCategoryForm}
          submitting={submitting}
        />

        {/* Contracts Tab */}
        {activeTab === 'contracts' && (
          <div>
            <div className="bg-white shadow rounded-lg overflow-x-auto">
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
                      {t('finance.contract.price') || 'Price'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('finance.contract.deadline') || 'Deadline'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('finance.contract.status') || 'Status'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('finance.table.actions') || 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contracts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        {t('finance.no_contracts') || 'No contracts found'}
                      </td>
                    </tr>
                  ) : (
                    contracts.map((contract) => {
                      const contractProfits = profits.filter(p => p.projectId === contract.id);
                      const contractExpenses = expenses.filter(e => e.projectId === contract.id);
                      const contractTotalProfit = contractProfits.reduce((sum, p) => sum + p.amount, 0);
                      const contractTotalExpense = contractExpenses.reduce((sum, e) => sum + e.amount, 0);
                      const contractNetProfit = contractTotalProfit - contractTotalExpense;

                      return (
                        <tr 
                          key={contract.id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => router.push(`/dashboard/finance/contracts/${contract.id}`)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {contract.clientName} {contract.clientSurname}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {contract.location}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {contract.constructionName || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                            {formatNumberWithSpaces(contract.price.toString())} UZS
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {contract.deadline.toLocaleDateString()}
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center space-x-2">
                              <span className="text-green-600">
                                +{formatNumberWithSpaces(contractTotalProfit.toString())}
                              </span>
                              <span className="text-red-600">
                                -{formatNumberWithSpaces(contractTotalExpense.toString())}
                              </span>
                              <span className={`font-semibold ${contractNetProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                {contractNetProfit >= 0 ? '+' : ''}{formatNumberWithSpaces(contractNetProfit.toString())}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout >
  );
}





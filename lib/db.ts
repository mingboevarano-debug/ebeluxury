import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { Contract, Project, Report, Warning, User, SupplyRequest, SupplyRequestStatus, Meeting, Attendance, AttendanceStatus, Profit, Expense, FinanceCategory, OfficeWaste, OfficeWasteCategory, Draft } from '@/types';
import { Service } from '@/lib/services';

// Contracts
export const createContract = async (contract: Omit<Contract, 'id' | 'createdAt'>): Promise<string> => {
  const contractRef = doc(collection(db, 'contracts'));
  const contractData = {
    ...contract,
    deadline: Timestamp.fromDate(contract.deadline),
    createdAt: Timestamp.now(),
  };
  await setDoc(contractRef, contractData);
  return contractRef.id;
};

export const getContracts = async (): Promise<Contract[]> => {
  const contractsRef = collection(db, 'contracts');
  const snapshot = await getDocs(query(contractsRef, orderBy('createdAt', 'desc')));
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      deadline: data.deadline?.toDate?.() || new Date(),
      createdAt: data.createdAt?.toDate?.() || new Date(),
    };
  }) as Contract[];
};

export const getContractById = async (id: string): Promise<Contract | null> => {
  const contractRef = doc(db, 'contracts', id);
  const contractSnap = await getDoc(contractRef);
  if (contractSnap.exists()) {
    const data = contractSnap.data();
    return {
      id: contractSnap.id,
      ...data,
      deadline: data.deadline?.toDate?.() || new Date(),
      createdAt: data.createdAt?.toDate?.() || new Date(),
    } as Contract;
  }
  return null;
};

export const updateContract = async (id: string, updates: Partial<Contract>): Promise<void> => {
  const contractRef = doc(db, 'contracts', id);
  const updateData: any = { ...updates };
  if (updates.deadline) {
    updateData.deadline = Timestamp.fromDate(updates.deadline);
  }
  await updateDoc(contractRef, updateData);
};

// Projects
export const createProject = async (project: Omit<Project, 'id' | 'createdAt'>): Promise<string> => {
  const projectRef = doc(collection(db, 'projects'));
  const projectData = {
    ...project,
    deadline: Timestamp.fromDate(project.deadline),
    createdAt: Timestamp.now(),
  };
  await setDoc(projectRef, projectData);
  return projectRef.id;
};

export const getProjectsByForeman = async (foremanId: string): Promise<Project[]> => {
  const projectsRef = collection(db, 'projects');
  const q = query(projectsRef, where('foremanId', '==', foremanId));
  const snapshot = await getDocs(q);
  const projects = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      deadline: data.deadline?.toDate?.() || new Date(),
      createdAt: data.createdAt?.toDate?.() || new Date(),
    };
  }) as Project[];

  return projects.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

export const getAllProjects = async (): Promise<Project[]> => {
  const projectsRef = collection(db, 'projects');
  const snapshot = await getDocs(query(projectsRef, orderBy('createdAt', 'desc')));
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      deadline: data.deadline?.toDate?.() || new Date(),
      createdAt: data.createdAt?.toDate?.() || new Date(),
    };
  }) as Project[];
};

export const getProjectById = async (id: string): Promise<Project | null> => {
  const projectRef = doc(db, 'projects', id);
  const projectSnap = await getDoc(projectRef);
  if (projectSnap.exists()) {
    const data = projectSnap.data();
    return {
      id: projectSnap.id,
      ...data,
      deadline: data.deadline?.toDate?.() || new Date(),
      createdAt: data.createdAt?.toDate?.() || new Date(),
    } as Project;
  }
  return null;
};

export const updateProject = async (id: string, updates: Partial<Project>): Promise<void> => {
  const projectRef = doc(db, 'projects', id);
  const updateData: any = { ...updates };
  if (updates.deadline) {
    updateData.deadline = Timestamp.fromDate(updates.deadline);
  }
  await updateDoc(projectRef, updateData);
};

// Reports
export const createReport = async (report: Omit<Report, 'id' | 'createdAt'>): Promise<string> => {
  const reportRef = doc(collection(db, 'reports'));
  const reportData = {
    ...report,
    createdAt: Timestamp.now(),
  };
  await setDoc(reportRef, reportData);
  return reportRef.id;
};

export const getReports = async (): Promise<Report[]> => {
  const reportsRef = collection(db, 'reports');
  const snapshot = await getDocs(query(reportsRef, orderBy('createdAt', 'desc')));
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || new Date(),
    };
  }) as Report[];
};

export const getReportsByProject = async (projectId: string): Promise<Report[]> => {
  const reportsRef = collection(db, 'reports');
  const q = query(reportsRef, where('projectId', '==', projectId));
  const snapshot = await getDocs(q);
  const reports = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || new Date(),
    };
  }) as Report[];

  return reports.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

// Warnings
export const createWarning = async (warning: Omit<Warning, 'id' | 'createdAt'>): Promise<string> => {
  const warningRef = doc(collection(db, 'warnings'));
  const warningData = {
    ...warning,
    createdAt: Timestamp.now(),
  };
  await setDoc(warningRef, warningData);
  return warningRef.id;
};

export const getWarnings = async (): Promise<Warning[]> => {
  const warningsRef = collection(db, 'warnings');
  const snapshot = await getDocs(query(warningsRef, orderBy('createdAt', 'desc')));
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || new Date(),
    };
  }) as Warning[];
};

export const updateWarning = async (id: string, updates: Partial<Warning>): Promise<void> => {
  const warningRef = doc(db, 'warnings', id);
  await updateDoc(warningRef, updates);
};

// Supply Requests
export const createSupplyRequest = async (
  request: Omit<SupplyRequest, 'id' | 'createdAt' | 'status'> & { status?: SupplyRequestStatus }
): Promise<string> => {
  const requestRef = doc(collection(db, 'supplyRequests'));
  const requestData = {
    ...request,
    status: request.status || 'pending',
    deadline: Timestamp.fromDate(request.deadline),
    createdAt: Timestamp.now(),
  };
  await setDoc(requestRef, requestData);
  return requestRef.id;
};

export const getSupplyRequests = async (): Promise<SupplyRequest[]> => {
  const supplyRef = collection(db, 'supplyRequests');
  const snapshot = await getDocs(query(supplyRef, orderBy('createdAt', 'desc')));
  return snapshot.docs.map(docSnap => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      deadline: data.deadline?.toDate?.() || new Date(),
      createdAt: data.createdAt?.toDate?.() || new Date(),
      acceptedAt: data.acceptedAt?.toDate?.() || undefined,
      deliveredAt: data.deliveredAt?.toDate?.() || undefined,
    };
  }) as SupplyRequest[];
};

export const getSupplyRequestsByForeman = async (foremanId: string): Promise<SupplyRequest[]> => {
  const supplyRef = collection(db, 'supplyRequests');
  const q = query(supplyRef, where('foremanId', '==', foremanId));
  const snapshot = await getDocs(q);
  const requests = snapshot.docs.map(docSnap => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      deadline: data.deadline?.toDate?.() || new Date(),
      createdAt: data.createdAt?.toDate?.() || new Date(),
      acceptedAt: data.acceptedAt?.toDate?.() || undefined,
      deliveredAt: data.deliveredAt?.toDate?.() || undefined,
    };
  }) as SupplyRequest[];

  return requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

export const updateSupplyRequestStatus = async (
  id: string,
  status: SupplyRequestStatus,
  supplierNote?: string,
  rejectedReason?: string
): Promise<void> => {
  const requestRef = doc(db, 'supplyRequests', id);
  const updateData: any = { status };

  if (supplierNote) {
    updateData.supplierNote = supplierNote;
  }

  if (rejectedReason) {
    updateData.rejectedReason = rejectedReason;
  }

  if (status === 'accepted') {
    updateData.acceptedAt = Timestamp.now();
  }

  if (status === 'delivered') {
    updateData.deliveredAt = Timestamp.now();
  }

  await updateDoc(requestRef, updateData);
};

// Users
export const getUsers = async (): Promise<User[]> => {
  const usersRef = collection(db, 'users');
  const snapshot = await getDocs(usersRef);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    // Log to debug what we're getting from Firestore
    console.log(`User ${doc.id} from Firestore:`, {
      name: data.name,
      salary: data.salary,
      salaryType: typeof data.salary,
      hasSalaryField: 'salary' in data,
      allFields: Object.keys(data)
    });
    // Handle salary as number or array (for payment history)
    let salaryValue: number | number[] | undefined = undefined;
    // Check if salary field exists in the document
    if ('salary' in data) {
      if (Array.isArray(data.salary)) {
        // Salary is an array (payment history)
        salaryValue = data.salary;
      } else if (data.salary !== undefined && data.salary !== null && data.salary !== '') {
        if (typeof data.salary === 'string') {
          const parsed = parseFloat(data.salary);
          salaryValue = isNaN(parsed) ? undefined : parsed;
        } else if (typeof data.salary === 'number') {
          salaryValue = isNaN(data.salary) ? undefined : data.salary;
        }
      } else if (data.salary === 0) {
        // Explicitly handle 0 as a valid value
        salaryValue = 0;
      }
    }

    let finesValue: number | undefined = undefined;
    // Check if fines field exists in the document (even if it's 0)
    if ('fines' in data) {
      if (data.fines !== undefined && data.fines !== null && data.fines !== '') {
        if (typeof data.fines === 'string') {
          const parsed = parseFloat(data.fines);
          finesValue = isNaN(parsed) ? undefined : parsed;
        } else if (typeof data.fines === 'number') {
          finesValue = isNaN(data.fines) ? undefined : data.fines;
        }
      } else if (data.fines === 0) {
        // Explicitly handle 0 as a valid value
        finesValue = 0;
      }
    }

    return {
      id: doc.id,
      ...data,
      salary: salaryValue,
      fines: finesValue,
      createdAt: data.createdAt?.toDate?.() || new Date(),
    } as User;
  });
};

export const getUserById = async (id: string): Promise<User | null> => {
  const userRef = doc(db, 'users', id);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    const data = userSnap.data();
    return {
      id: userSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || new Date(),
    } as User;
  }
  return null;
};

export const updateUser = async (id: string, updates: Partial<User>): Promise<void> => {
  const userRef = doc(db, 'users', id);
  console.log('updateUser called with:', { id, updates });
  // Ensure salary and fines are numbers when saving
  const updateData: any = { ...updates };
  if (updates.salary !== undefined) {
    if (typeof updates.salary === 'string') {
      const parsed = parseFloat(updates.salary);
      updateData.salary = isNaN(parsed) ? updates.salary : parsed;
    } else {
      updateData.salary = updates.salary;
    }
  }
  if (updates.fines !== undefined) {
    if (typeof updates.fines === 'string') {
      const parsed = parseFloat(updates.fines);
      updateData.fines = isNaN(parsed) ? updates.fines : parsed;
    } else {
      updateData.fines = updates.fines;
    }
  }
  console.log('Saving to Firestore:', updateData);
  await updateDoc(userRef, updateData);
  console.log('User updated in Firestore successfully');
};

export const deleteUser = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'users', id));
};

// Payments
import { Payment, Fine, Task } from '@/types'; // Ensure Task is imported

export const createPayment = async (payment: Omit<Payment, 'id'>): Promise<string> => {
  const paymentRef = doc(collection(db, 'payments'));
  // Ensure date is a Firestore Timestamp if needed, or Date if your app handles it. 
  // Based on other functions, we use Timestamp in DB but Date in app.
  const paymentData = {
    ...payment,
    date: Timestamp.fromDate(payment.date),
  };
  await setDoc(paymentRef, paymentData);
  return paymentRef.id;
};

export const getPayments = async (): Promise<Payment[]> => {
  const paymentsRef = collection(db, 'payments');
  const snapshot = await getDocs(query(paymentsRef, orderBy('date', 'desc')));
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      date: data.date?.toDate?.() || new Date(),
    };
  }) as Payment[];
};

export const getPaymentsByUserId = async (userId: string): Promise<Payment[]> => {
  const paymentsRef = collection(db, 'payments');
  const q = query(paymentsRef, where('userId', '==', userId), orderBy('date', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      date: data.date?.toDate?.() || new Date(),
    };
  }) as Payment[];
};

export const createFine = async (fine: Omit<Fine, 'id'>): Promise<string> => {
  const fineRef = doc(collection(db, 'fines'));
  const fineData = {
    ...fine,
    date: Timestamp.fromDate(fine.date),
  };
  await setDoc(fineRef, fineData);
  return fineRef.id;
};

export const getFines = async (): Promise<Fine[]> => {
  const finesRef = collection(db, 'fines');
  const snapshot = await getDocs(query(finesRef, orderBy('date', 'desc')));
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      date: data.date?.toDate?.() || new Date(),
    };
  }) as Fine[];
};

export const createTask = async (task: Omit<Task, 'id' | 'createdAt'>): Promise<string> => {
  const taskRef = doc(collection(db, 'tasks'));
  const taskData = {
    ...task,
    deadline: Timestamp.fromDate(task.deadline),
    createdAt: Timestamp.now(),
  };
  await setDoc(taskRef, taskData);
  return taskRef.id;
};

// Meetings
export const createMeeting = async (meeting: Omit<Meeting, 'id' | 'createdAt'>): Promise<string> => {
  const meetingRef = doc(collection(db, 'meetings'));
  const meetingData = {
    ...meeting,
    dateTime: Timestamp.fromDate(meeting.dateTime),
    createdAt: Timestamp.now(),
  };
  await setDoc(meetingRef, meetingData);
  return meetingRef.id;
};

export const getMeetings = async (): Promise<Meeting[]> => {
  const meetingsRef = collection(db, 'meetings');
  const snapshot = await getDocs(query(meetingsRef, orderBy('dateTime', 'asc')));
  return snapshot.docs.map(docSnap => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      dateTime: data.dateTime?.toDate?.() || new Date(),
      createdAt: data.createdAt?.toDate?.() || new Date(),
    };
  }) as Meeting[];
};

export const deleteMeeting = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'meetings', id));
};

// Attendance
export const createAttendance = async (attendance: Omit<Attendance, 'id' | 'createdAt'>): Promise<string> => {
  const attendanceRef = doc(collection(db, 'attendance'));
  const attendanceData = {
    ...attendance,
    date: Timestamp.fromDate(attendance.date),
    checkInTime: attendance.checkInTime ? Timestamp.fromDate(attendance.checkInTime) : null,
    checkOutTime: attendance.checkOutTime ? Timestamp.fromDate(attendance.checkOutTime) : null,
    createdAt: Timestamp.now(),
  };
  await setDoc(attendanceRef, attendanceData);
  return attendanceRef.id;
};

export const getAttendance = async (userId?: string, date?: Date): Promise<Attendance[]> => {
  const attendanceRef = collection(db, 'attendance');
  let q = query(attendanceRef, orderBy('date', 'desc'), orderBy('createdAt', 'desc'));

  if (userId) {
    q = query(attendanceRef, where('userId', '==', userId), orderBy('date', 'desc'), orderBy('createdAt', 'desc'));
  }

  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    q = query(
      attendanceRef,
      where('date', '>=', Timestamp.fromDate(startOfDay)),
      where('date', '<=', Timestamp.fromDate(endOfDay)),
      orderBy('date', 'desc')
    );
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      date: data.date?.toDate?.() || new Date(),
      checkInTime: data.checkInTime?.toDate?.() || undefined,
      checkOutTime: data.checkOutTime?.toDate?.() || undefined,
      createdAt: data.createdAt?.toDate?.() || new Date(),
    };
  }) as Attendance[];
};

export const updateAttendanceCheckOut = async (id: string, checkOutTime: Date): Promise<void> => {
  const attendanceRef = doc(db, 'attendance', id);
  await updateDoc(attendanceRef, {
    checkOutTime: Timestamp.fromDate(checkOutTime),
  });
};

// Finance Categories
export const createFinanceCategory = async (category: Omit<FinanceCategory, 'id' | 'createdAt'>): Promise<string> => {
  const categoryRef = doc(collection(db, 'financeCategories'));
  const categoryData = {
    ...category,
    createdAt: Timestamp.now(),
  };
  await setDoc(categoryRef, categoryData);
  return categoryRef.id;
};

export const getFinanceCategories = async (type?: 'profit' | 'expense'): Promise<FinanceCategory[]> => {
  const categoriesRef = collection(db, 'financeCategories');
  let q = query(categoriesRef, orderBy('createdAt', 'desc'));
  if (type) {
    q = query(categoriesRef, where('type', '==', type), orderBy('createdAt', 'desc'));
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || new Date(),
    };
  }) as FinanceCategory[];
};

export const updateFinanceCategory = async (id: string, updates: Partial<FinanceCategory>): Promise<void> => {
  const categoryRef = doc(db, 'financeCategories', id);
  await updateDoc(categoryRef, updates);
};

export const deleteFinanceCategory = async (id: string): Promise<void> => {
  const categoryRef = doc(db, 'financeCategories', id);
  await deleteDoc(categoryRef);
};

// Profits
export const createProfit = async (profit: Omit<Profit, 'id' | 'createdAt'>): Promise<string> => {
  const profitRef = doc(collection(db, 'profits'));
  const profitData = {
    ...profit,
    createdAt: Timestamp.now(),
  };
  await setDoc(profitRef, profitData);
  return profitRef.id;
};

export const getProfits = async (): Promise<Profit[]> => {
  const profitsRef = collection(db, 'profits');
  const snapshot = await getDocs(query(profitsRef, orderBy('createdAt', 'desc')));
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || new Date(),
    };
  }) as Profit[];
};

export const updateProfit = async (id: string, updates: Partial<Profit>): Promise<void> => {
  const profitRef = doc(db, 'profits', id);
  await updateDoc(profitRef, updates);
};

export const deleteProfit = async (id: string): Promise<void> => {
  const profitRef = doc(db, 'profits', id);
  await deleteDoc(profitRef);
};

export const deleteAllProfits = async (): Promise<void> => {
  const profitsRef = collection(db, 'profits');
  const snapshot = await getDocs(profitsRef);
  const batch = writeBatch(db);
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
};

// Expenses
export const createExpense = async (expense: Omit<Expense, 'id' | 'createdAt'>): Promise<string> => {
  const expenseRef = doc(collection(db, 'expenses'));
  const expenseData = {
    ...expense,
    createdAt: Timestamp.now(),
  };
  await setDoc(expenseRef, expenseData);
  return expenseRef.id;
};

export const getExpenses = async (): Promise<Expense[]> => {
  const expensesRef = collection(db, 'expenses');
  const snapshot = await getDocs(query(expensesRef, orderBy('createdAt', 'desc')));
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || new Date(),
    };
  }) as Expense[];
};

export const updateExpense = async (id: string, updates: Partial<Expense>): Promise<void> => {
  const expenseRef = doc(db, 'expenses', id);
  await updateDoc(expenseRef, updates);
};

export const deleteExpense = async (id: string): Promise<void> => {
  const expenseRef = doc(db, 'expenses', id);
  await deleteDoc(expenseRef);
};

export const deleteAllExpenses = async (): Promise<void> => {
  const expensesRef = collection(db, 'expenses');
  const snapshot = await getDocs(expensesRef);
  const batch = writeBatch(db);
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
};

// Office Waste
export const createOfficeWaste = async (officeWaste: Omit<OfficeWaste, 'id' | 'createdAt'>): Promise<string> => {
  const wasteRef = doc(collection(db, 'officeWaste'));
  const wasteData = {
    ...officeWaste,
    date: Timestamp.fromDate(officeWaste.date),
    createdAt: Timestamp.now(),
  };
  await setDoc(wasteRef, wasteData);
  return wasteRef.id;
};

export const getOfficeWaste = async (): Promise<OfficeWaste[]> => {
  const wasteRef = collection(db, 'officeWaste');
  const snapshot = await getDocs(query(wasteRef, orderBy('date', 'desc')));
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      date: data.date?.toDate?.() || new Date(),
      createdAt: data.createdAt?.toDate?.() || new Date(),
    };
  }) as OfficeWaste[];
};

export const updateOfficeWaste = async (id: string, updates: Partial<OfficeWaste>): Promise<void> => {
  const wasteRef = doc(db, 'officeWaste', id);
  const updateData: any = { ...updates };
  if (updates.date) {
    updateData.date = Timestamp.fromDate(updates.date);
  }
  await updateDoc(wasteRef, updateData);
};

export const deleteOfficeWaste = async (id: string): Promise<void> => {
  const wasteRef = doc(db, 'officeWaste', id);
  await deleteDoc(wasteRef);
};

// Office Waste Categories
export const createOfficeWasteCategory = async (category: Omit<OfficeWasteCategory, 'id' | 'createdAt'>): Promise<string> => {
  const categoryRef = doc(collection(db, 'officeWasteCategories'));
  const categoryData = {
    ...category,
    createdAt: Timestamp.now(),
  };
  await setDoc(categoryRef, categoryData);
  return categoryRef.id;
};

export const getOfficeWasteCategories = async (): Promise<OfficeWasteCategory[]> => {
  const categoriesRef = collection(db, 'officeWasteCategories');
  const snapshot = await getDocs(query(categoriesRef, orderBy('order', 'asc')));
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || new Date(),
    };
  }) as OfficeWasteCategory[];
};

export const updateOfficeWasteCategory = async (id: string, updates: Partial<OfficeWasteCategory>): Promise<void> => {
  const categoryRef = doc(db, 'officeWasteCategories', id);
  await updateDoc(categoryRef, updates);
};

export const deleteOfficeWasteCategory = async (id: string): Promise<void> => {
  const categoryRef = doc(db, 'officeWasteCategories', id);
  await deleteDoc(categoryRef);
};

// Services
export const createService = async (service: Service): Promise<string> => {
  const serviceRef = doc(collection(db, 'services'));
  const serviceData = {
    ...service,
    createdAt: Timestamp.now(),
  };
  await setDoc(serviceRef, serviceData);
  return serviceRef.id;
};

export const getServices = async (): Promise<Service[]> => {
  const servicesRef = collection(db, 'services');
  const snapshot = await getDocs(query(servicesRef, orderBy('id', 'asc')));
  const allServices = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: data.id,
      name: data.name,
      nameRu: data.nameRu,
      nameUz: data.nameUz,
      stage: data.stage,
      stageRu: data.stageRu,
      stageUz: data.stageUz,
      cost: data.cost,
      createdAt: data.createdAt?.toDate?.() || new Date(),
    } as Service;
  });

  // Remove duplicates by ID (keep the first occurrence)
  const uniqueServices = Array.from(
    new Map(allServices.map(service => [service.id, service])).values()
  );

  return uniqueServices.sort((a, b) => a.id - b.id);
};

export const updateService = async (id: number, updates: Partial<Service>): Promise<void> => {
  const servicesRef = collection(db, 'services');
  const snapshot = await getDocs(query(servicesRef, where('id', '==', id)));
  if (snapshot.empty) {
    throw new Error('Service not found');
  }
  const serviceDoc = snapshot.docs[0];
  await updateDoc(serviceDoc.ref, updates);
};

export const deleteService = async (id: number): Promise<void> => {
  const servicesRef = collection(db, 'services');
  const snapshot = await getDocs(query(servicesRef, where('id', '==', id)));
  if (snapshot.empty) {
    throw new Error('Service not found');
  }
  const serviceDoc = snapshot.docs[0];
  await deleteDoc(serviceDoc.ref);
};

export const initializeServices = async (services: Service[]): Promise<void> => {
  // First, get existing services to avoid duplicates
  const existingServices = await getServices();
  const existingIds = new Set(existingServices.map(s => s.id));

  // Filter out services that already exist
  const newServices = services.filter(service => !existingIds.has(service.id));

  if (newServices.length === 0) {
    return; // All services already exist
  }

  // Add only new services (name only, cost set to 0 as per user requirement)
  const batch = newServices.map(service => {
    const serviceRef = doc(collection(db, 'services'));
    return setDoc(serviceRef, {
      id: service.id,
      name: service.name,
      nameRu: service.nameRu,
      nameUz: service.nameUz,
      stage: service.stage,
      stageRu: service.stageRu,
      stageUz: service.stageUz,
      cost: 0, // No price - set to 0 as requested (only service name stored)
      createdAt: Timestamp.now(),
    });
  });
  await Promise.all(batch);
};

// Drafts
export const createDraft = async (draft: Omit<Draft, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const draftRef = doc(collection(db, 'drafts'));
  const draftData = {
    ...draft,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  await setDoc(draftRef, draftData);
  return draftRef.id;
};

export const getDraftsByProject = async (projectId: string): Promise<Draft[]> => {
  const draftsRef = collection(db, 'drafts');
  // Query without orderBy to avoid index requirement, then sort in memory
  const q = query(draftsRef, where('projectId', '==', projectId));
  const snapshot = await getDocs(q);
  const drafts = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || new Date(),
      updatedAt: data.updatedAt?.toDate?.() || new Date(),
    };
  }) as Draft[];
  // Sort by createdAt descending in memory
  return drafts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

export const getDraftById = async (id: string): Promise<Draft | null> => {
  const draftRef = doc(db, 'drafts', id);
  const snapshot = await getDoc(draftRef);
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  return {
    id: snapshot.id,
    ...data,
    createdAt: data.createdAt?.toDate?.() || new Date(),
    updatedAt: data.updatedAt?.toDate?.() || new Date(),
  } as Draft;
};

export const updateDraft = async (id: string, updates: Partial<Draft>): Promise<void> => {
  const draftRef = doc(db, 'drafts', id);
  const updateData: any = { ...updates };
  updateData.updatedAt = Timestamp.now();
  await updateDoc(draftRef, updateData);
};

export const deleteDraft = async (id: string): Promise<void> => {
  const draftRef = doc(db, 'drafts', id);
  await deleteDoc(draftRef);
};



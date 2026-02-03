export type UserRole = 'director' | 'admin' | 'hr' | 'foreman' | 'seller' | 'supplier';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  salary?: number | number[]; // Can be a number or array of payment amounts
  fines?: number;
  phone?: string;
}

export interface Contract {
  id: string;
  sellerId: string;
  sellerName: string;
  clientName: string;
  clientSurname: string;
  clientPhone: string;
  location: string;
  price: number;
  deadline: Date;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: Date;
  foremanId?: string;
  accommodationType?: 'apartment' | 'house';
  passportId?: string;
  accommodationSquare?: number;
  selectedServices?: number[];
  constructionName?: string;
  doorPassword?: string;
}

export interface Project {
  id: string;
  contractId: string;
  foremanId: string;
  foremanName: string;
  clientName?: string;  // Client name from contract
  location?: string;    // Location from contract
  price?: number;       // Price from contract
  description: string;
  constructionName?: string;
  employeeCount?: number;
  totalWorkers?: number;
  deadline: Date;
  status: 'active' | 'completed';
  createdAt: Date;
  selectedServices?: number[];  // Array of service IDs that will be used for this project
  serviceStatuses?: Record<string, { status: 'done' | 'warning' | 'problem'; comment?: string }>;  // Foreman status per service (key = serviceId)
}

export interface ProjectImage {
  id: string;
  projectId: string;
  imageUrl: string;
  description: string;
  foremanId?: string;
  foremanName?: string;
  createdAt: Date;
}

export interface Draft {
  id: string;
  projectId: string;
  foremanId: string;
  foremanName: string;
  title: string;
  description?: string;
  canvasData: string; // JSON string of canvas drawing data
  thumbnail?: string; // Base64 thumbnail image
  createdAt: Date;
  updatedAt: Date;
}

export interface Report {
  id: string;
  projectId: string;
  foremanId: string;
  foremanName: string;
  description: string;
  photos: string[];
  videos: string[];
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  createdAt: Date;
}

export interface Warning {
  id: string;
  projectId: string;
  projectName?: string;
  foremanId: string;
  foremanName: string;
  message: string;
  status: 'pending' | 'resolved';
  createdAt: Date;
}

export type SupplyRequestStatus = 'pending' | 'accepted' | 'in_progress' | 'delivered' | 'completed' | 'rejected';

export interface SupplyRequest {
  id: string;
  projectId: string;
  projectName?: string;
  projectLocation?: string;
  foremanId: string;
  foremanName: string;
  items: string[];
  itemPrices?: number[];  // Price for each material (supplier fills when accepting)
  deadline: Date;
  status: SupplyRequestStatus;
  note?: string;
  supplierNote?: string;
  rejectedReason?: string;
  acceptedAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
}

export interface Payment {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  date: Date;
}

export interface Fine {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  reason: string;
  date: Date;
}

export interface Task {
  id: string;
  userId: string;
  userName: string;
  assignedBy: string;
  title: string;
  description: string;
  deadline: Date;
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: Date;
}

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  createdBy: string;
  createdByName: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  dateTime: Date;
  participants?: string[]; // Array of user IDs
  createdAt: Date;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'early';

export interface Attendance {
  id: string;
  userId: string;
  userName: string;
  date: Date; // Date of attendance (YYYY-MM-DD)
  checkInTime?: Date; // Time when employee checked in
  checkOutTime?: Date; // Time when employee checked out
  status: AttendanceStatus;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  verified: boolean; // Whether location was verified against office location
  note?: string;
  createdAt: Date;
}

export type PaymentMethod = 'cash' | 'card';

export interface FinanceCategory {
  id: string;
  name: string;
  type: 'profit' | 'expense';
  description?: string;
  color?: string; // Hex color code
  icon?: string; // Icon name from react-icons
  budget?: number; // Optional budget limit
  isActive?: boolean; // Active/inactive status
  order?: number; // Display order
  createdAt: Date;
}

export interface Profit {
  id: string;
  projectId?: string;
  projectName?: string;
  name: string;
  categoryId: string;
  categoryName: string;
  paymentMethod: PaymentMethod;
  amount: number;
  fromWhom: string; // Name and surname
  comment?: string;
  createdAt: Date;
  createdBy: string;
  createdByName: string;
}

export type ExpenseApprovalStatus = 'pending' | 'approved' | 'rejected' | 'ignored';

export interface Expense {
  id: string;
  projectId?: string;
  projectName?: string;
  name: string;
  stage?: string;
  categoryId: string;
  categoryName: string;
  paymentMethod: PaymentMethod;
  amount: number; // Total amount (Jammi suma)
  unitPrice?: number; // Unit price (Бирлик нархи) from Excel import
  quantity?: number; // Optional quantity from Excel import
  toWhom: string; // To whom given
  comment?: string;
  employees?: string[]; // Array of employee IDs for salary expenses
  employeeNames?: string[]; // Array of employee names for display
  profitId?: string; // Optional link to a profit entry
  approvalStatus?: ExpenseApprovalStatus; // Director approval: pending, approved, rejected, ignored
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  createdBy: string;
  createdByName: string;
}

export interface OfficeWaste {
  id: string;
  title: string;
  description?: string;
  category: string; // e.g., 'Furniture', 'Technology', 'Utilities', 'Maintenance', etc.
  amount: number;
  paymentMethod: PaymentMethod;
  vendor?: string; // Vendor/Supplier name
  receiptNumber?: string;
  date: Date;
  createdAt: Date;
  createdBy: string;
  createdByName: string;
}

export interface OfficeWasteCategory {
  id: string;
  name: string;
  nameRu: string;
  nameUz: string;
  description?: string;
  color: string; // Hex color code
  icon?: string; // Icon name from react-icons
  isActive: boolean;
  order: number;
  createdAt: Date;
}

export interface LocalizedStage {
  en: string;
  ru: string;
  uz: string;
}


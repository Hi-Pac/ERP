export type UserRole = 'admin' | 'supervisor' | 'user';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
  lastLogin: string;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
  createdBy: string;
  lastLogin?: string;
}

export type ProductCategory = 'Structural' | 'Exterior' | 'Decorative';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  batchCode?: string;
  price: number;
  stock: number;
  lowStockThreshold: number;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
}

export type CustomerType = 'Institutions' | 'Shops' | 'Individuals';

export interface Customer {
  id: string;
  fullName: string;
  phone: string;
  address: string;
  type: CustomerType;
  discountRate: number; // percentage
  balance: number;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
}

export type PaymentMethod = 'Cash' | 'Vodafone Cash' | 'Bank Transfer' | 'Cheque';

export interface InvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Deposit {
  amount: number;
  method: PaymentMethod;
  paid: boolean;
}

export interface Invoice {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  date: string;
  items: InvoiceItem[];
  subtotal: number;
  discountRate: number;
  discountAmount: number;
  total: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  deposit?: Deposit;
  status: 'pending' | 'paid' | 'partial' | 'cancelled';
  type: 'sale' | 'return';
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface Payment {
  id: string;
  customerId: string;
  customerName: string;
  orderId?: string;
  orderNumber?: string;
  amount: number;
  method: PaymentMethod;
  date: string;
  notes?: string;
  type: 'payment' | 'refund';
  createdAt: string;
  createdBy: string;
}

export interface Transaction {
  id: string;
  customerId: string;
  type: 'invoice' | 'payment' | 'return';
  description: string;
  debit: number;
  credit: number;
  balance: number;
  date: string;
  referenceId: string;
  createdAt: string;
  createdBy: string;
}

export interface DashboardStats {
  totalSales: number;
  totalCustomers: number;
  totalProducts: number;
  lowStockProducts: number;
  pendingOrders: number;
  todayRevenue: number;
  monthlyRevenue: number;
  topSellingProducts: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  recentOrders: Invoice[];
  salesChart: Array<{
    date: string;
    sales: number;
    revenue: number;
  }>;
}

export interface ReportFilter {
  startDate?: string;
  endDate?: string;
  customerId?: string;
  productId?: string;
  category?: ProductCategory;
  paymentMethod?: PaymentMethod;
  status?: string;
}

export interface PermissionConfig {
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, Record<string, PermissionConfig>> = {
  admin: {
    dashboard: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true },
    sales: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true },
    customers: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true },
    inventory: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true },
    accounting: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true },
    users: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true },
    reports: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true },
  },
  supervisor: {
    dashboard: { canView: true, canAdd: true, canEdit: true, canDelete: false, canExport: true },
    sales: { canView: true, canAdd: true, canEdit: true, canDelete: false, canExport: true },
    customers: { canView: true, canAdd: true, canEdit: true, canDelete: false, canExport: true },
    inventory: { canView: true, canAdd: true, canEdit: true, canDelete: false, canExport: true },
    accounting: { canView: true, canAdd: true, canEdit: true, canDelete: false, canExport: true },
    users: { canView: false, canAdd: false, canEdit: false, canDelete: false, canExport: false },
    reports: { canView: true, canAdd: true, canEdit: true, canDelete: false, canExport: true },
  },
  user: {
    dashboard: { canView: true, canAdd: true, canEdit: false, canDelete: false, canExport: false },
    sales: { canView: true, canAdd: true, canEdit: false, canDelete: false, canExport: false },
    customers: { canView: true, canAdd: true, canEdit: false, canDelete: false, canExport: false },
    inventory: { canView: true, canAdd: true, canEdit: false, canDelete: false, canExport: false },
    accounting: { canView: true, canAdd: true, canEdit: false, canDelete: false, canExport: false },
    users: { canView: false, canAdd: false, canEdit: false, canDelete: false, canExport: false },
    reports: { canView: true, canAdd: false, canEdit: false, canDelete: false, canExport: false },
  },
};

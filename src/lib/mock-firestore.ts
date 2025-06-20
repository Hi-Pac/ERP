// Mock Firestore service for demo purposes
import type {
  Product,
  Customer,
  Invoice,
  Payment,
  Transaction,
  User,
  ReportFilter
} from '@/types';

// Initialize demo data
const initializeDemoData = () => {
  if (localStorage.getItem('hcp_erp_initialized')) return;

  // Demo customers
  const demoCustomers: Customer[] = [
    {
      id: 'cust-001',
      fullName: 'John Smith',
      phone: '+1-555-0123',
      address: '123 Main Street, City, State 12345',
      type: 'Individuals',
      discountRate: 5,
      balance: 250.00,
      createdAt: '2024-06-15T10:00:00.000Z',
      createdBy: 'System'
    },
    {
      id: 'cust-002',
      fullName: 'ABC Construction Corp',
      phone: '+1-555-0456',
      address: '456 Business Ave, Industrial Zone, State 67890',
      type: 'Institutions',
      discountRate: 15,
      balance: -500.00,
      createdAt: '2024-06-16T11:30:00.000Z',
      createdBy: 'System'
    },
    {
      id: 'cust-003',
      fullName: 'City Hardware Store',
      phone: '+1-555-0789',
      address: '789 Commerce Street, Downtown, State 11111',
      type: 'Shops',
      discountRate: 10,
      balance: 125.50,
      createdAt: '2024-06-17T14:15:00.000Z',
      createdBy: 'System'
    }
  ];

  // Demo products
  const demoProducts: Product[] = [
    {
      id: 'prod-001',
      name: 'Steel Beam 20ft',
      category: 'Structural',
      batchCode: 'SB20-2024',
      price: 150.00,
      stock: 45,
      lowStockThreshold: 10,
      createdAt: '2024-06-15T08:00:00.000Z',
      createdBy: 'System'
    },
    {
      id: 'prod-002',
      name: 'Concrete Block',
      category: 'Structural',
      batchCode: 'CB-2024',
      price: 8.50,
      stock: 250,
      lowStockThreshold: 50,
      createdAt: '2024-06-15T08:15:00.000Z',
      createdBy: 'System'
    },
    {
      id: 'prod-003',
      name: 'Exterior Paint - White',
      category: 'Exterior',
      batchCode: 'EP-WHT-2024',
      price: 45.99,
      stock: 8,
      lowStockThreshold: 15,
      createdAt: '2024-06-15T08:30:00.000Z',
      createdBy: 'System'
    },
    {
      id: 'prod-004',
      name: 'Decorative Stone Tile',
      category: 'Decorative',
      price: 12.99,
      stock: 5,
      lowStockThreshold: 10,
      createdAt: '2024-06-15T08:45:00.000Z',
      createdBy: 'System'
    },
    {
      id: 'prod-005',
      name: 'Crown Molding',
      category: 'Decorative',
      batchCode: 'CM-2024',
      price: 18.50,
      stock: 0,
      lowStockThreshold: 5,
      createdAt: '2024-06-15T09:00:00.000Z',
      createdBy: 'System'
    }
  ];

  // Demo invoices
  const demoInvoices: Invoice[] = [
    {
      id: 'inv-001',
      orderNumber: 'HCP20240620001',
      customerId: 'cust-001',
      customerName: 'John Smith',
      date: '2024-06-20',
      items: [
        {
          productId: 'prod-001',
          productName: 'Steel Beam 20ft',
          quantity: 2,
          unitPrice: 150.00,
          total: 300.00
        }
      ],
      subtotal: 300.00,
      discountRate: 5,
      discountAmount: 15.00,
      total: 285.00,
      paymentMethod: 'Cash',
      status: 'paid',
      type: 'sale',
      createdAt: '2024-06-20T09:00:00.000Z',
      createdBy: 'Admin User'
    },
    {
      id: 'inv-002',
      orderNumber: 'HCP20240620002',
      customerId: 'cust-002',
      customerName: 'ABC Construction Corp',
      date: '2024-06-20',
      items: [
        {
          productId: 'prod-002',
          productName: 'Concrete Block',
          quantity: 100,
          unitPrice: 8.50,
          total: 850.00
        }
      ],
      subtotal: 850.00,
      discountRate: 15,
      discountAmount: 127.50,
      total: 722.50,
      paymentMethod: 'Bank Transfer',
      status: 'pending',
      type: 'sale',
      createdAt: '2024-06-20T10:30:00.000Z',
      createdBy: 'Admin User'
    }
  ];

  // Demo payments
  const demoPayments: Payment[] = [
    {
      id: 'pay-001',
      customerId: 'cust-001',
      customerName: 'John Smith',
      orderId: 'inv-001',
      orderNumber: 'HCP20240620001',
      amount: 285.00,
      method: 'Cash',
      date: '2024-06-20',
      type: 'payment',
      createdAt: '2024-06-20T09:15:00.000Z',
      createdBy: 'Admin User'
    }
  ];

  // Store in localStorage
  localStorage.setItem('hcp_customers', JSON.stringify(demoCustomers));
  localStorage.setItem('hcp_products', JSON.stringify(demoProducts));
  localStorage.setItem('hcp_invoices', JSON.stringify(demoInvoices));
  localStorage.setItem('hcp_payments', JSON.stringify(demoPayments));
  localStorage.setItem('hcp_transactions', JSON.stringify([]));
  localStorage.setItem('hcp_users', JSON.stringify([]));
  localStorage.setItem('hcp_erp_initialized', 'true');
};

// Generic CRUD operations for mock data
export class MockFirestoreService<T extends { id?: string }> {
  constructor(private collectionName: string) {
    initializeDemoData();
  }

  private getStorageKey(): string {
    return `hcp_${this.collectionName}`;
  }

  private getData(): T[] {
    const data = localStorage.getItem(this.getStorageKey());
    return data ? JSON.parse(data) : [];
  }

  private saveData(data: T[]): void {
    localStorage.setItem(this.getStorageKey(), JSON.stringify(data));
  }

  async create(data: Omit<T, 'id'>): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const items = this.getData();
        const id = `${this.collectionName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newItem = { ...data, id, createdAt: new Date().toISOString() } as T;
        items.push(newItem);
        this.saveData(items);
        resolve(id);
      }, 100);
    });
  }

  async getById(id: string): Promise<T | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const items = this.getData();
        const item = items.find(item => item.id === id);
        resolve(item || null);
      }, 50);
    });
  }

  async getAll(): Promise<T[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const items = this.getData();
        resolve(items);
      }, 100);
    });
  }

  async update(id: string, data: Partial<T>): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const items = this.getData();
        const index = items.findIndex(item => item.id === id);
        if (index !== -1) {
          items[index] = { ...items[index], ...data, updatedAt: new Date().toISOString() };
          this.saveData(items);
        }
        resolve();
      }, 100);
    });
  }

  async delete(id: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const items = this.getData();
        const filteredItems = items.filter(item => item.id !== id);
        this.saveData(filteredItems);
        resolve();
      }, 100);
    });
  }
}

// Service instances
export const mockProductsService = new MockFirestoreService<Product>('products');
export const mockCustomersService = new MockFirestoreService<Customer>('customers');
export const mockInvoicesService = new MockFirestoreService<Invoice>('invoices');
export const mockPaymentsService = new MockFirestoreService<Payment>('payments');
export const mockTransactionsService = new MockFirestoreService<Transaction>('transactions');
export const mockUsersService = new MockFirestoreService<User>('users');

// Utility functions
export const generateOrderNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const time = String(date.getTime()).slice(-6);
  return `HCP${year}${month}${day}${time}`;
};

export const updateCustomerBalance = async (customerId: string, amount: number): Promise<void> => {
  const customer = await mockCustomersService.getById(customerId);
  if (customer) {
    await mockCustomersService.update(customerId, {
      balance: customer.balance + amount
    });
  }
};

export const createTransaction = async (
  customerId: string,
  type: 'invoice' | 'payment' | 'return',
  description: string,
  debit: number,
  credit: number,
  referenceId: string,
  createdBy: string
): Promise<void> => {
  const customer = await mockCustomersService.getById(customerId);
  if (!customer) return;

  const newBalance = customer.balance + debit - credit;

  const transaction: Omit<Transaction, 'id'> = {
    customerId,
    type,
    description,
    debit,
    credit,
    balance: newBalance,
    date: new Date().toISOString(),
    referenceId,
    createdAt: new Date().toISOString(),
    createdBy
  };

  await mockTransactionsService.create(transaction);
  await updateCustomerBalance(customerId, debit - credit);
};

export const getFilteredData = async <T>(
  service: MockFirestoreService<T>,
  filters: ReportFilter
): Promise<T[]> => {
  const data = await service.getAll();
  
  return data.filter((item: any) => {
    if (filters.startDate && item.date && item.date < filters.startDate) return false;
    if (filters.endDate && item.date && item.date > filters.endDate) return false;
    if (filters.customerId && item.customerId !== filters.customerId) return false;
    if (filters.productId && item.productId !== filters.productId) return false;
    if (filters.category && item.category !== filters.category) return false;
    if (filters.paymentMethod && item.paymentMethod !== filters.paymentMethod) return false;
    if (filters.status && item.status !== filters.status) return false;
    
    return true;
  });
};

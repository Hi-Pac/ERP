import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  QueryConstraint,
  DocumentSnapshot,
  QuerySnapshot,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  Product,
  Customer,
  Invoice,
  Payment,
  Transaction,
  User,
  ReportFilter
} from '@/types';

// Generic CRUD operations
export class FirestoreService<T extends { id?: string }> {
  constructor(private collectionName: string) {}

  async create(data: Omit<T, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, this.collectionName), {
      ...data,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  }

  async getById(id: string): Promise<T | null> {
    const docRef = doc(db, this.collectionName, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as T;
    }
    return null;
  }

  async getAll(constraints: QueryConstraint[] = []): Promise<T[]> {
    const q = query(collection(db, this.collectionName), ...constraints);
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as T[];
  }

  async update(id: string, data: Partial<T>): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await deleteDoc(docRef);
  }

  async getPaginated(
    pageSize: number = 10,
    lastDoc?: DocumentSnapshot,
    constraints: QueryConstraint[] = []
  ): Promise<{ data: T[]; lastDoc: DocumentSnapshot | null }> {
    const queryConstraints = [
      ...constraints,
      limit(pageSize)
    ];

    if (lastDoc) {
      queryConstraints.push(startAfter(lastDoc));
    }

    const q = query(collection(db, this.collectionName), ...queryConstraints);
    const querySnapshot = await getDocs(q);

    const data = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as T[];

    const newLastDoc = querySnapshot.docs[querySnapshot.docs.length - 1] || null;

    return { data, lastDoc: newLastDoc };
  }
}

// Specific service instances
export const productsService = new FirestoreService<Product>('products');
export const customersService = new FirestoreService<Customer>('customers');
export const invoicesService = new FirestoreService<Invoice>('invoices');
export const paymentsService = new FirestoreService<Payment>('payments');
export const transactionsService = new FirestoreService<Transaction>('transactions');
export const usersService = new FirestoreService<User>('users');

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
  const customer = await customersService.getById(customerId);
  if (customer) {
    await customersService.update(customerId, {
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
  const customer = await customersService.getById(customerId);
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

  await transactionsService.create(transaction);
  await updateCustomerBalance(customerId, debit - credit);
};

export const getFilteredData = async <T>(
  service: FirestoreService<T>,
  filters: ReportFilter
): Promise<T[]> => {
  const constraints: QueryConstraint[] = [];

  if (filters.startDate) {
    constraints.push(where('date', '>=', filters.startDate));
  }

  if (filters.endDate) {
    constraints.push(where('date', '<=', filters.endDate));
  }

  if (filters.customerId) {
    constraints.push(where('customerId', '==', filters.customerId));
  }

  if (filters.productId) {
    constraints.push(where('productId', '==', filters.productId));
  }

  if (filters.category) {
    constraints.push(where('category', '==', filters.category));
  }

  if (filters.paymentMethod) {
    constraints.push(where('paymentMethod', '==', filters.paymentMethod));
  }

  if (filters.status) {
    constraints.push(where('status', '==', filters.status));
  }

  constraints.push(orderBy('createdAt', 'desc'));

  return await service.getAll(constraints);
};

// Batch operations
export const batchUpdate = async (operations: Array<{
  collection: string;
  id: string;
  data: any;
}>): Promise<void> => {
  const batch = writeBatch(db);

  operations.forEach(({ collection: collectionName, id, data }) => {
    const docRef = doc(db, collectionName, id);
    batch.update(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  });

  await batch.commit();
};

export const batchDelete = async (operations: Array<{
  collection: string;
  id: string;
}>): Promise<void> => {
  const batch = writeBatch(db);

  operations.forEach(({ collection: collectionName, id }) => {
    const docRef = doc(db, collectionName, id);
    batch.delete(docRef);
  });

  await batch.commit();
};

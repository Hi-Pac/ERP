import { 
  customersService, 
  productsService, 
  usersService,
  generateOrderNumber 
} from './firestore';
import type { Customer, Product, User } from '@/types';

export const initializeDemoData = async (): Promise<void> => {
  try {
    // Check if data already exists
    const existingCustomers = await customersService.getAll();
    if (existingCustomers.length > 0) {
      console.log('Demo data already exists');
      return;
    }

    console.log('Initializing demo data...');

    // Demo customers
    const demoCustomers: Omit<Customer, 'id'>[] = [
      {
        fullName: 'John Smith',
        phone: '+1-555-0123',
        address: '123 Main Street, City, State 12345',
        type: 'Individuals',
        discountRate: 5,
        balance: 250.00,
        createdAt: new Date().toISOString(),
        createdBy: 'System'
      },
      {
        fullName: 'ABC Construction Corp',
        phone: '+1-555-0456',
        address: '456 Business Ave, Industrial Zone, State 67890',
        type: 'Institutions',
        discountRate: 15,
        balance: -500.00,
        createdAt: new Date().toISOString(),
        createdBy: 'System'
      },
      {
        fullName: 'City Hardware Store',
        phone: '+1-555-0789',
        address: '789 Commerce Street, Downtown, State 11111',
        type: 'Shops',
        discountRate: 10,
        balance: 125.50,
        createdAt: new Date().toISOString(),
        createdBy: 'System'
      },
      {
        fullName: 'Sarah Johnson',
        phone: '+1-555-0321',
        address: '321 Oak Drive, Residential Area, State 22222',
        type: 'Individuals',
        discountRate: 0,
        balance: 0,
        createdAt: new Date().toISOString(),
        createdBy: 'System'
      },
      {
        fullName: 'Metro Construction LLC',
        phone: '+1-555-0654',
        address: '654 Industrial Park, Metro City, State 33333',
        type: 'Institutions',
        discountRate: 20,
        balance: 1250.75,
        createdAt: new Date().toISOString(),
        createdBy: 'System'
      }
    ];

    // Demo products
    const demoProducts: Omit<Product, 'id'>[] = [
      {
        name: 'Steel Beam 20ft',
        category: 'Structural',
        batchCode: 'SB20-2024',
        price: 150.00,
        stock: 45,
        lowStockThreshold: 10,
        createdAt: new Date().toISOString(),
        createdBy: 'System'
      },
      {
        name: 'Concrete Block',
        category: 'Structural',
        batchCode: 'CB-2024',
        price: 8.50,
        stock: 250,
        lowStockThreshold: 50,
        createdAt: new Date().toISOString(),
        createdBy: 'System'
      },
      {
        name: 'Exterior Paint - White',
        category: 'Exterior',
        batchCode: 'EP-WHT-2024',
        price: 45.99,
        stock: 12,
        lowStockThreshold: 15,
        createdAt: new Date().toISOString(),
        createdBy: 'System'
      },
      {
        name: 'Vinyl Siding',
        category: 'Exterior',
        batchCode: 'VS-2024',
        price: 25.75,
        stock: 89,
        lowStockThreshold: 20,
        createdAt: new Date().toISOString(),
        createdBy: 'System'
      },
      {
        name: 'Decorative Stone Tile',
        category: 'Decorative',
        price: 12.99,
        stock: 5,
        lowStockThreshold: 10,
        createdAt: new Date().toISOString(),
        createdBy: 'System'
      },
      {
        name: 'Crown Molding',
        category: 'Decorative',
        batchCode: 'CM-2024',
        price: 18.50,
        stock: 0,
        lowStockThreshold: 5,
        createdAt: new Date().toISOString(),
        createdBy: 'System'
      },
      {
        name: 'Aluminum Window Frame',
        category: 'Exterior',
        batchCode: 'AWF-2024',
        price: 125.00,
        stock: 8,
        lowStockThreshold: 15,
        createdAt: new Date().toISOString(),
        createdBy: 'System'
      },
      {
        name: 'Hardwood Flooring',
        category: 'Decorative',
        batchCode: 'HF-OAK-2024',
        price: 85.99,
        stock: 35,
        lowStockThreshold: 10,
        createdAt: new Date().toISOString(),
        createdBy: 'System'
      }
    ];

    // Demo users (for reference - actual user creation should be done through auth)
    const demoUsers: Omit<User, 'id'>[] = [
      {
        email: 'admin@hcp.com',
        displayName: 'System Administrator',
        role: 'admin',
        createdAt: new Date().toISOString(),
        createdBy: 'System'
      },
      {
        email: 'supervisor@hcp.com',
        displayName: 'John Supervisor',
        role: 'supervisor',
        createdAt: new Date().toISOString(),
        createdBy: 'System'
      },
      {
        email: 'user@hcp.com',
        displayName: 'Jane User',
        role: 'user',
        createdAt: new Date().toISOString(),
        createdBy: 'System'
      }
    ];

    // Create demo data
    console.log('Creating demo customers...');
    for (const customer of demoCustomers) {
      await customersService.create(customer);
    }

    console.log('Creating demo products...');
    for (const product of demoProducts) {
      await productsService.create(product);
    }

    console.log('Creating demo users...');
    for (const user of demoUsers) {
      await usersService.create(user);
    }

    console.log('Demo data initialization completed!');
  } catch (error) {
    console.error('Error initializing demo data:', error);
  }
};

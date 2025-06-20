import React, { useState, useEffect } from 'react';
import { Plus, Search, Download, Edit, Trash2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_PERMISSIONS } from '@/types';
import { customersService } from '@/lib/firestore';
import { exportToPDF, exportToExcel } from '@/lib/export';
import { CustomerForm } from '@/components/Customers/CustomerForm';
import { CustomerStatement } from '@/components/Customers/CustomerStatement';
import type { Customer, CustomerType } from '@/types';
import Swal from 'sweetalert2';

export const Customers: React.FC = () => {
  const { userProfile } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [statementCustomer, setStatementCustomer] = useState<Customer | null>(null);

  const permissions = userProfile?.role ? ROLE_PERMISSIONS[userProfile.role].customers : null;

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await customersService.getAll();
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
      Swal.fire('Error', 'Failed to load customers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || customer.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const handleCreateCustomer = async (customerData: Omit<Customer, 'id'>) => {
    try {
      await customersService.create(customerData);
      await loadCustomers();
      setIsCreateModalOpen(false);
      
      Swal.fire({
        title: 'Success!',
        text: 'Customer created successfully',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error creating customer:', error);
      Swal.fire('Error', 'Failed to create customer', 'error');
    }
  };

  const handleEditCustomer = async (customerData: Omit<Customer, 'id'>) => {
    if (!editingCustomer) return;

    try {
      await customersService.update(editingCustomer.id!, {
        ...customerData,
        updatedBy: userProfile?.displayName || 'Unknown'
      });
      await loadCustomers();
      setEditingCustomer(null);
      
      Swal.fire({
        title: 'Success!',
        text: 'Customer updated successfully',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error updating customer:', error);
      Swal.fire('Error', 'Failed to update customer', 'error');
    }
  };

  const handleDeleteCustomer = async (customer: Customer) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Delete customer ${customer.fullName}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await customersService.delete(customer.id!);
        await loadCustomers();
        
        Swal.fire({
          title: 'Deleted!',
          text: 'Customer has been deleted.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
      } catch (error) {
        console.error('Error deleting customer:', error);
        Swal.fire('Error', 'Failed to delete customer', 'error');
      }
    }
  };

  const handleExportPDF = async () => {
    const columns = [
      { header: 'Full Name', key: 'fullName' },
      { header: 'Phone', key: 'phone' },
      { header: 'Address', key: 'address' },
      { header: 'Type', key: 'type' },
      { header: 'Discount Rate', key: 'discountRate' },
      { header: 'Balance', key: 'balance' },
      { header: 'Created By', key: 'createdBy' }
    ];
    
    await exportToPDF(filteredCustomers, 'Customers Report', columns);
  };

  const handleExportExcel = () => {
    const exportData = filteredCustomers.map(customer => ({
      fullName: customer.fullName,
      phone: customer.phone,
      address: customer.address,
      type: customer.type,
      discountRate: customer.discountRate,
      balance: customer.balance,
      createdBy: customer.createdBy,
      createdAt: customer.createdAt,
      updatedBy: customer.updatedBy || '',
      updatedAt: customer.updatedAt || ''
    }));
    
    exportToExcel(exportData, 'customers_report', 'Customers Data');
  };

  const getTypeColor = (type: CustomerType) => {
    switch (type) {
      case 'Institutions':
        return 'bg-blue-100 text-blue-800';
      case 'Shops':
        return 'bg-green-100 text-green-800';
      case 'Individuals':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-gray-600">Manage customer information and relationships</p>
        </div>
        
        {permissions?.canAdd && (
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
                <DialogDescription>
                  Fill in the customer details below.
                </DialogDescription>
              </DialogHeader>
              <CustomerForm
                onSubmit={handleCreateCustomer}
                onCancel={() => setIsCreateModalOpen(false)}
                userProfile={userProfile}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search by name, phone, or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Institutions">Institutions</SelectItem>
                <SelectItem value="Shops">Shops</SelectItem>
                <SelectItem value="Individuals">Individuals</SelectItem>
              </SelectContent>
            </Select>

            {permissions?.canExport && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={handleExportPDF}>
                    Export as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportExcel}>
                    Export as Excel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{customers.length}</p>
              <p className="text-sm text-gray-600">Total Customers</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {customers.filter(c => c.type === 'Institutions').length}
              </p>
              <p className="text-sm text-gray-600">Institutions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {customers.filter(c => c.type === 'Shops').length}
              </p>
              <p className="text-sm text-gray-600">Shops</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {customers.filter(c => c.type === 'Individuals').length}
              </p>
              <p className="text-sm text-gray-600">Individuals</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customers ({filteredCustomers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.fullName}</TableCell>
                      <TableCell>{customer.phone}</TableCell>
                      <TableCell className="max-w-xs truncate">{customer.address}</TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(customer.type)}>
                          {customer.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{customer.discountRate}%</TableCell>
                      <TableCell className={`font-medium ${
                        customer.balance > 0 ? 'text-red-600' : 
                        customer.balance < 0 ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        ${customer.balance.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{customer.createdBy}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              Actions
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => setStatementCustomer(customer)}>
                              <FileText className="mr-2 h-4 w-4" />
                              View Statement
                            </DropdownMenuItem>
                            
                            {permissions?.canEdit && (
                              <DropdownMenuItem onClick={() => setEditingCustomer(customer)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            
                            {permissions?.canDelete && (
                              <DropdownMenuItem 
                                onClick={() => handleDeleteCustomer(customer)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No customers found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <Dialog open={!!editingCustomer} onOpenChange={() => setEditingCustomer(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Customer: {editingCustomer.fullName}</DialogTitle>
              <DialogDescription>
                Update the customer details below.
              </DialogDescription>
            </DialogHeader>
            <CustomerForm
              initialData={editingCustomer}
              onSubmit={handleEditCustomer}
              onCancel={() => setEditingCustomer(null)}
              userProfile={userProfile}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Customer Statement Modal */}
      {statementCustomer && (
        <Dialog open={!!statementCustomer} onOpenChange={() => setStatementCustomer(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Customer Statement: {statementCustomer.fullName}</DialogTitle>
              <DialogDescription>
                View transaction history and current balance.
              </DialogDescription>
            </DialogHeader>
            <CustomerStatement
              customer={statementCustomer}
              onClose={() => setStatementCustomer(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Eye, Edit, Trash2, Printer } from 'lucide-react';
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
import { invoicesService, customersService, productsService, generateOrderNumber } from '@/lib/firestore';
import { exportToPDF, exportToExcel, exportInvoiceToPDF } from '@/lib/export';
import { InvoiceForm } from '@/components/Sales/InvoiceForm';
import type { Invoice, Customer, Product } from '@/types';
import Swal from 'sweetalert2';

export const Sales: React.FC = () => {
  const { userProfile } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  const permissions = userProfile?.role ? ROLE_PERMISSIONS[userProfile.role].sales : null;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [invoicesData, customersData, productsData] = await Promise.all([
        invoicesService.getAll(),
        customersService.getAll(),
        productsService.getAll()
      ]);
      
      setInvoices(invoicesData);
      setCustomers(customersData);
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading sales data:', error);
      Swal.fire('Error', 'Failed to load sales data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleCreateInvoice = async (invoiceData: Omit<Invoice, 'id'>) => {
    try {
      const id = await invoicesService.create(invoiceData);
      await loadData();
      setIsCreateModalOpen(false);
      
      Swal.fire({
        title: 'Success!',
        text: 'Invoice created successfully',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error creating invoice:', error);
      Swal.fire('Error', 'Failed to create invoice', 'error');
    }
  };

  const handleEditInvoice = async (invoiceData: Omit<Invoice, 'id'>) => {
    if (!editingInvoice) return;

    try {
      await invoicesService.update(editingInvoice.id!, {
        ...invoiceData,
        updatedBy: userProfile?.displayName || 'Unknown'
      });
      await loadData();
      setEditingInvoice(null);
      
      Swal.fire({
        title: 'Success!',
        text: 'Invoice updated successfully',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error updating invoice:', error);
      Swal.fire('Error', 'Failed to update invoice', 'error');
    }
  };

  const handleDeleteInvoice = async (invoice: Invoice) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Delete invoice ${invoice.orderNumber}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await invoicesService.delete(invoice.id!);
        await loadData();
        
        Swal.fire({
          title: 'Deleted!',
          text: 'Invoice has been deleted.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
      } catch (error) {
        console.error('Error deleting invoice:', error);
        Swal.fire('Error', 'Failed to delete invoice', 'error');
      }
    }
  };

  const handlePrintInvoice = async (invoice: Invoice) => {
    const customer = customers.find(c => c.id === invoice.customerId);
    if (customer) {
      await exportInvoiceToPDF(invoice, customer);
    }
  };

  const handleExportPDF = async () => {
    const columns = [
      { header: 'Order Number', key: 'orderNumber' },
      { header: 'Customer', key: 'customerName' },
      { header: 'Date', key: 'date' },
      { header: 'Total', key: 'total' },
      { header: 'Status', key: 'status' },
      { header: 'Type', key: 'type' }
    ];
    
    await exportToPDF(filteredInvoices, 'Sales Report', columns);
  };

  const handleExportExcel = () => {
    const exportData = filteredInvoices.map(invoice => ({
      orderNumber: invoice.orderNumber,
      customerName: invoice.customerName,
      date: invoice.date,
      subtotal: invoice.subtotal,
      discountRate: invoice.discountRate,
      discountAmount: invoice.discountAmount,
      total: invoice.total,
      paymentMethod: invoice.paymentMethod,
      status: invoice.status,
      type: invoice.type,
      createdBy: invoice.createdBy,
      createdAt: invoice.createdAt
    }));
    
    exportToExcel(exportData, 'sales_report', 'Sales Data');
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading sales data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales Management</h1>
          <p className="text-gray-600">Manage invoices and sales orders</p>
        </div>
        
        {permissions?.canAdd && (
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Invoice</DialogTitle>
                <DialogDescription>
                  Fill in the details to create a new sales invoice.
                </DialogDescription>
              </DialogHeader>
              <InvoiceForm
                customers={customers}
                products={products}
                onSubmit={handleCreateInvoice}
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
                  placeholder="Search by order number or customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
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

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Orders ({filteredInvoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.orderNumber}</TableCell>
                      <TableCell>{invoice.customerName}</TableCell>
                      <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                      <TableCell>{invoice.items.length} items</TableCell>
                      <TableCell className="font-medium">${invoice.total.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            invoice.status === 'paid' ? 'default' :
                            invoice.status === 'pending' ? 'secondary' :
                            invoice.status === 'partial' ? 'outline' : 'destructive'
                          }
                        >
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={invoice.type === 'sale' ? 'default' : 'secondary'}>
                          {invoice.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{invoice.createdBy}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              Actions
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handlePrintInvoice(invoice)}>
                              <Printer className="mr-2 h-4 w-4" />
                              Print Invoice
                            </DropdownMenuItem>
                            
                            {permissions?.canEdit && (
                              <DropdownMenuItem onClick={() => setEditingInvoice(invoice)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            
                            {permissions?.canDelete && (
                              <DropdownMenuItem 
                                onClick={() => handleDeleteInvoice(invoice)}
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
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      No sales orders found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Invoice Modal */}
      {editingInvoice && (
        <Dialog open={!!editingInvoice} onOpenChange={() => setEditingInvoice(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Invoice: {editingInvoice.orderNumber}</DialogTitle>
              <DialogDescription>
                Update the invoice details below.
              </DialogDescription>
            </DialogHeader>
            <InvoiceForm
              customers={customers}
              products={products}
              initialData={editingInvoice}
              onSubmit={handleEditInvoice}
              onCancel={() => setEditingInvoice(null)}
              userProfile={userProfile}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

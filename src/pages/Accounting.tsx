import React, { useState, useEffect } from 'react';
import { Plus, Search, Download, DollarSign, CreditCard } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_PERMISSIONS } from '@/types';
import { paymentsService, customersService, createTransaction } from '@/lib/firestore';
import { exportToPDF, exportToExcel } from '@/lib/export';
import { PaymentForm } from '@/components/Accounting/PaymentForm';
import type { Payment, Customer, PaymentMethod } from '@/types';
import Swal from 'sweetalert2';

export const Accounting: React.FC = () => {
  const { userProfile } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const permissions = userProfile?.role ? ROLE_PERMISSIONS[userProfile.role].accounting : null;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [paymentsData, customersData] = await Promise.all([
        paymentsService.getAll(),
        customersService.getAll()
      ]);
      
      setPayments(paymentsData);
      setCustomers(customersData);
    } catch (error) {
      console.error('Error loading accounting data:', error);
      Swal.fire('Error', 'Failed to load accounting data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.orderNumber && payment.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesMethod = methodFilter === 'all' || payment.method === methodFilter;
    
    return matchesSearch && matchesMethod;
  });

  const handleCreatePayment = async (paymentData: Omit<Payment, 'id'>) => {
    try {
      const paymentId = await paymentsService.create(paymentData);
      
      // Create transaction record
      await createTransaction(
        paymentData.customerId,
        'payment',
        `Payment - ${paymentData.method}`,
        0,
        paymentData.amount,
        paymentId,
        userProfile?.displayName || 'Unknown'
      );
      
      await loadData();
      setIsCreateModalOpen(false);
      
      Swal.fire({
        title: 'Success!',
        text: 'Payment recorded successfully',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error recording payment:', error);
      Swal.fire('Error', 'Failed to record payment', 'error');
    }
  };

  const handleExportPDF = async () => {
    const columns = [
      { header: 'Date', key: 'date' },
      { header: 'Customer', key: 'customerName' },
      { header: 'Amount', key: 'amount' },
      { header: 'Method', key: 'method' },
      { header: 'Type', key: 'type' },
      { header: 'Order Number', key: 'orderNumber' },
      { header: 'Created By', key: 'createdBy' }
    ];
    
    await exportToPDF(filteredPayments, 'Payments Report', columns);
  };

  const handleExportExcel = () => {
    const exportData = filteredPayments.map(payment => ({
      date: payment.date,
      customerName: payment.customerName,
      amount: payment.amount,
      method: payment.method,
      type: payment.type,
      orderNumber: payment.orderNumber || '',
      notes: payment.notes || '',
      createdBy: payment.createdBy,
      createdAt: payment.createdAt
    }));
    
    exportToExcel(exportData, 'payments_report', 'Payments Data');
  };

  const getMethodColor = (method: PaymentMethod) => {
    switch (method) {
      case 'Cash':
        return 'bg-green-100 text-green-800';
      case 'Vodafone Cash':
        return 'bg-red-100 text-red-800';
      case 'Bank Transfer':
        return 'bg-blue-100 text-blue-800';
      case 'Cheque':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalPayments = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const todayPayments = filteredPayments
    .filter(p => p.date === new Date().toISOString().split('T')[0])
    .reduce((sum, p) => sum + p.amount, 0);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading accounting data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Accounting</h1>
          <p className="text-gray-600">Manage payments and financial transactions</p>
        </div>
        
        {permissions?.canAdd && (
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Record Payment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Record New Payment</DialogTitle>
                <DialogDescription>
                  Register a customer payment or refund.
                </DialogDescription>
              </DialogHeader>
              <PaymentForm
                customers={customers}
                onSubmit={handleCreatePayment}
                onCancel={() => setIsCreateModalOpen(false)}
                userProfile={userProfile}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">${totalPayments.toFixed(2)}</p>
                <p className="text-sm text-gray-600">Total Payments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">${todayPayments.toFixed(2)}</p>
              <p className="text-sm text-gray-600">Today's Payments</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{payments.length}</p>
              <p className="text-sm text-gray-600">Total Transactions</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {payments.filter(p => p.method === 'Cash').length}
              </p>
              <p className="text-sm text-gray-600">Cash Payments</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search by customer or order number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Vodafone Cash">Vodafone Cash</SelectItem>
                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                <SelectItem value="Cheque">Cheque</SelectItem>
              </SelectContent>
            </Select>

            {permissions?.canExport && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleExportPDF}>
                  <Download className="mr-2 h-4 w-4" />
                  PDF
                </Button>
                <Button variant="outline" onClick={handleExportExcel}>
                  <Download className="mr-2 h-4 w-4" />
                  Excel
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Transactions ({filteredPayments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Order Number</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Created By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length > 0 ? (
                  filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{payment.customerName}</TableCell>
                      <TableCell className={`font-medium ${
                        payment.type === 'payment' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {payment.type === 'payment' ? '+' : '-'}${payment.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getMethodColor(payment.method)}>
                          {payment.method}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={payment.type === 'payment' ? 'default' : 'secondary'}>
                          {payment.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{payment.orderNumber || '-'}</TableCell>
                      <TableCell className="max-w-xs truncate">{payment.notes || '-'}</TableCell>
                      <TableCell className="text-sm text-gray-600">{payment.createdBy}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No payments found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

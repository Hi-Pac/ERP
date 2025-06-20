import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Download, Filter, Calendar } from 'lucide-react';
import { transactionsService } from '@/lib/firestore';
import { exportCustomerStatementToPDF } from '@/lib/export';
import type { Customer, Transaction } from '@/types';

interface CustomerStatementProps {
  customer: Customer;
  onClose: () => void;
}

export const CustomerStatement: React.FC<CustomerStatementProps> = ({
  customer,
  onClose
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    loadTransactions();
  }, [customer.id]);

  useEffect(() => {
    filterTransactions();
  }, [transactions, dateRange]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const allTransactions = await transactionsService.getAll();
      const customerTransactions = allTransactions
        .filter(t => t.customerId === customer.id)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      setTransactions(customerTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    if (dateRange.startDate) {
      filtered = filtered.filter(t => t.date >= dateRange.startDate);
    }

    if (dateRange.endDate) {
      filtered = filtered.filter(t => t.date <= dateRange.endDate);
    }

    setFilteredTransactions(filtered);
  };

  const handleExportStatement = async () => {
    await exportCustomerStatementToPDF(
      customer,
      filteredTransactions,
      dateRange.startDate,
      dateRange.endDate
    );
  };

  const clearDateFilter = () => {
    setDateRange({ startDate: '', endDate: '' });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'invoice':
        return '📄';
      case 'payment':
        return '💰';
      case 'return':
        return '↩️';
      default:
        return '📋';
    }
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return 'text-red-600'; // Customer owes money
    if (balance < 0) return 'text-green-600'; // Customer has credit
    return 'text-gray-600'; // Balanced
  };

  const summary = {
    totalDebit: filteredTransactions.reduce((sum, t) => sum + t.debit, 0),
    totalCredit: filteredTransactions.reduce((sum, t) => sum + t.credit, 0),
    netBalance: customer.balance,
    transactionCount: filteredTransactions.length
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading statement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Customer Info */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-medium">{customer.fullName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="font-medium">{customer.phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Type</p>
              <Badge>{customer.type}</Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600">Discount</p>
              <p className="font-medium">{customer.discountRate}%</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-600">Address</p>
            <p className="font-medium">{customer.address}</p>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                ${summary.totalDebit.toFixed(2)}
              </p>
              <p className="text-sm text-gray-600">Total Charges</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                ${summary.totalCredit.toFixed(2)}
              </p>
              <p className="text-sm text-gray-600">Total Payments</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className={`text-2xl font-bold ${getBalanceColor(summary.netBalance)}`}>
                ${Math.abs(summary.netBalance).toFixed(2)}
              </p>
              <p className="text-sm text-gray-600">
                {summary.netBalance > 0 ? 'Balance Due' : 
                 summary.netBalance < 0 ? 'Credit Balance' : 'Balanced'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {summary.transactionCount}
              </p>
              <p className="text-sm text-gray-600">Transactions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Date Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={clearDateFilter}>
                <Filter className="mr-2 h-4 w-4" />
                Clear Filter
              </Button>
              <Button onClick={handleExportStatement}>
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History ({filteredTransactions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Debit</TableHead>
                  <TableHead>Credit</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {new Date(transaction.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{getTransactionIcon(transaction.type)}</span>
                          <Badge variant="outline">
                            {transaction.type}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {transaction.description}
                      </TableCell>
                      <TableCell className="text-red-600 font-medium">
                        {transaction.debit > 0 ? `$${transaction.debit.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell className="text-green-600 font-medium">
                        {transaction.credit > 0 ? `$${transaction.credit.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell className={`font-medium ${getBalanceColor(transaction.balance)}`}>
                        ${Math.abs(transaction.balance).toFixed(2)}
                        {transaction.balance > 0 && ' DR'}
                        {transaction.balance < 0 && ' CR'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {transaction.referenceId}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No transactions found for the selected period
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Final Balance Summary */}
          {filteredTransactions.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Current Balance:</span>
                <span className={`text-xl font-bold ${getBalanceColor(customer.balance)}`}>
                  ${Math.abs(customer.balance).toFixed(2)}
                  {customer.balance > 0 && ' (Due)'}
                  {customer.balance < 0 && ' (Credit)'}
                </span>
              </div>
              {customer.balance > 0 && (
                <p className="text-sm text-red-600 mt-2">
                  Customer owes ${customer.balance.toFixed(2)}
                </p>
              )}
              {customer.balance < 0 && (
                <p className="text-sm text-green-600 mt-2">
                  Customer has a credit balance of ${Math.abs(customer.balance).toFixed(2)}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4 justify-end">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import type { Payment, Customer, PaymentMethod, UserProfile } from '@/types';

interface PaymentFormProps {
  customers: Customer[];
  onSubmit: (data: Omit<Payment, 'id'>) => void;
  onCancel: () => void;
  userProfile: UserProfile | null;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  customers,
  onSubmit,
  onCancel,
  userProfile
}) => {
  const [formData, setFormData] = useState({
    customerId: '',
    orderId: '',
    orderNumber: '',
    amount: 0,
    method: 'Cash' as PaymentMethod,
    date: new Date().toISOString().split('T')[0],
    notes: '',
    type: 'payment' as 'payment' | 'refund'
  });

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    setSelectedCustomer(customer || null);
    setFormData(prev => ({ ...prev, customerId }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.customerId) {
      newErrors.customerId = 'Please select a customer';
    }

    if (formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const customer = customers.find(c => c.id === formData.customerId);
    if (!customer) return;

    const paymentData: Omit<Payment, 'id'> = {
      customerId: formData.customerId,
      customerName: customer.fullName,
      orderId: formData.orderId || undefined,
      orderNumber: formData.orderNumber || undefined,
      amount: formData.amount,
      method: formData.method,
      date: formData.date,
      notes: formData.notes || undefined,
      type: formData.type,
      createdAt: new Date().toISOString(),
      createdBy: userProfile?.displayName || 'Unknown'
    };

    onSubmit(paymentData);
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="customer">Customer *</Label>
          <Select value={formData.customerId} onValueChange={handleCustomerChange}>
            <SelectTrigger className={errors.customerId ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select customer" />
            </SelectTrigger>
            <SelectContent>
              {customers.map(customer => (
                <SelectItem key={customer.id} value={customer.id!}>
                  {customer.fullName} - {customer.phone}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.customerId && (
            <p className="text-sm text-red-500 mt-1">{errors.customerId}</p>
          )}
        </div>

        <div>
          <Label htmlFor="type">Transaction Type</Label>
          <Select value={formData.type} onValueChange={(value: 'payment' | 'refund') => 
            handleInputChange('type', value)
          }>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="payment">Payment</SelectItem>
              <SelectItem value="refund">Refund</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedCustomer && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Customer:</span>
                <span className="ml-2 font-medium">{selectedCustomer.fullName}</span>
              </div>
              <div>
                <span className="text-gray-600">Phone:</span>
                <span className="ml-2 font-medium">{selectedCustomer.phone}</span>
              </div>
              <div>
                <span className="text-gray-600">Type:</span>
                <span className="ml-2 font-medium">{selectedCustomer.type}</span>
              </div>
              <div>
                <span className="text-gray-600">Current Balance:</span>
                <span className={`ml-2 font-medium ${
                  selectedCustomer.balance > 0 ? 'text-red-600' : 
                  selectedCustomer.balance < 0 ? 'text-green-600' : 'text-gray-600'
                }`}>
                  ${selectedCustomer.balance.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="amount">Amount ($) *</Label>
          <Input
            id="amount"
            type="number"
            min="0"
            step="0.01"
            value={formData.amount}
            onChange={(e) => handleInputChange('amount', Number(e.target.value))}
            placeholder="0.00"
            className={errors.amount ? 'border-red-500' : ''}
          />
          {errors.amount && (
            <p className="text-sm text-red-500 mt-1">{errors.amount}</p>
          )}
        </div>

        <div>
          <Label htmlFor="method">Payment Method</Label>
          <Select value={formData.method} onValueChange={(value: PaymentMethod) => 
            handleInputChange('method', value)
          }>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Cash">Cash</SelectItem>
              <SelectItem value="Vodafone Cash">Vodafone Cash</SelectItem>
              <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
              <SelectItem value="Cheque">Cheque</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => handleInputChange('date', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="orderNumber">Order Number (Optional)</Label>
          <Input
            id="orderNumber"
            value={formData.orderNumber}
            onChange={(e) => handleInputChange('orderNumber', e.target.value)}
            placeholder="Link to specific order"
          />
          <p className="text-xs text-gray-500 mt-1">
            Leave empty for general account payment
          </p>
        </div>

        <div>
          <Label htmlFor="orderId">Order ID (Optional)</Label>
          <Input
            id="orderId"
            value={formData.orderId}
            onChange={(e) => handleInputChange('orderId', e.target.value)}
            placeholder="Internal order reference"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          placeholder="Additional notes about this payment..."
          rows={3}
        />
      </div>

      {/* Payment Summary */}
      <Card>
        <CardContent className="p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Payment Summary</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-600">Type:</span>
              <span className="ml-2 font-medium capitalize">{formData.type}</span>
            </div>
            <div>
              <span className="text-gray-600">Amount:</span>
              <span className={`ml-2 font-medium ${
                formData.type === 'payment' ? 'text-green-600' : 'text-red-600'
              }`}>
                {formData.type === 'payment' ? '+' : '-'}${formData.amount.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Method:</span>
              <span className="ml-2 font-medium">{formData.method}</span>
            </div>
            <div>
              <span className="text-gray-600">Date:</span>
              <span className="ml-2 font-medium">{new Date(formData.date).toLocaleDateString()}</span>
            </div>
          </div>
          
          {selectedCustomer && (
            <div className="mt-3 pt-3 border-t">
              <div className="text-sm">
                <span className="text-gray-600">New Balance:</span>
                <span className={`ml-2 font-medium ${
                  (selectedCustomer.balance - (formData.type === 'payment' ? formData.amount : -formData.amount)) > 0 ? 'text-red-600' : 
                  (selectedCustomer.balance - (formData.type === 'payment' ? formData.amount : -formData.amount)) < 0 ? 'text-green-600' : 'text-gray-600'
                }`}>
                  ${(selectedCustomer.balance - (formData.type === 'payment' ? formData.amount : -formData.amount)).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" className="flex-1">
          Record {formData.type === 'payment' ? 'Payment' : 'Refund'}
        </Button>
      </div>
    </form>
  );
};

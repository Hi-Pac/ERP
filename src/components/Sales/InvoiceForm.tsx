import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Calculator } from 'lucide-react';
import { generateOrderNumber, updateCustomerBalance, createTransaction } from '@/lib/firestore';
import type { Invoice, Customer, Product, InvoiceItem, PaymentMethod, UserProfile } from '@/types';

interface InvoiceFormProps {
  customers: Customer[];
  products: Product[];
  initialData?: Invoice;
  onSubmit: (data: Omit<Invoice, 'id'>) => void;
  onCancel: () => void;
  userProfile: UserProfile | null;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  customers,
  products,
  initialData,
  onSubmit,
  onCancel,
  userProfile
}) => {
  const [formData, setFormData] = useState({
    orderNumber: '',
    customerId: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cash' as PaymentMethod,
    notes: '',
    type: 'sale' as 'sale' | 'return',
    status: 'pending' as 'pending' | 'paid' | 'partial' | 'cancelled',
    depositPaid: false,
    depositAmount: 0,
    depositMethod: 'Cash' as PaymentMethod
  });

  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        orderNumber: initialData.orderNumber,
        customerId: initialData.customerId,
        date: initialData.date,
        paymentMethod: initialData.paymentMethod,
        notes: initialData.notes || '',
        type: initialData.type,
        status: initialData.status,
        depositPaid: initialData.deposit?.paid || false,
        depositAmount: initialData.deposit?.amount || 0,
        depositMethod: initialData.deposit?.method || 'Cash'
      });
      setItems(initialData.items);
      const customer = customers.find(c => c.id === initialData.customerId);
      setSelectedCustomer(customer || null);
    } else {
      setFormData(prev => ({
        ...prev,
        orderNumber: generateOrderNumber()
      }));
    }
  }, [initialData, customers]);

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    setSelectedCustomer(customer || null);
    setFormData(prev => ({ ...prev, customerId }));
  };

  const addItem = () => {
    setItems(prev => [...prev, {
      productId: '',
      productName: '',
      quantity: 1,
      unitPrice: 0,
      total: 0
    }]);
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item;

      const updatedItem = { ...item, [field]: value };

      if (field === 'productId') {
        const product = products.find(p => p.id === value);
        if (product) {
          updatedItem.productName = product.name;
          updatedItem.unitPrice = product.price;
        }
      }

      if (field === 'quantity' || field === 'unitPrice') {
        updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
      }

      return updatedItem;
    }));
  };

  const calculations = {
    subtotal: items.reduce((sum, item) => sum + item.total, 0),
    discountRate: selectedCustomer?.discountRate || 0,
    get discountAmount() {
      return this.subtotal * (this.discountRate / 100);
    },
    get total() {
      return this.subtotal - this.discountAmount;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerId || items.length === 0) {
      alert('Please select a customer and add at least one item');
      return;
    }

    const customer = customers.find(c => c.id === formData.customerId);
    if (!customer) return;

    const invoiceData: Omit<Invoice, 'id'> = {
      orderNumber: formData.orderNumber,
      customerId: formData.customerId,
      customerName: customer.fullName,
      date: formData.date,
      items,
      subtotal: calculations.subtotal,
      discountRate: calculations.discountRate,
      discountAmount: calculations.discountAmount,
      total: calculations.total,
      paymentMethod: formData.paymentMethod,
      notes: formData.notes,
      status: formData.status,
      type: formData.type,
      createdAt: initialData?.createdAt || new Date().toISOString(),
      createdBy: initialData?.createdBy || userProfile?.displayName || 'Unknown',
      deposit: formData.depositPaid ? {
        amount: formData.depositAmount,
        method: formData.depositMethod,
        paid: true
      } : undefined
    };

    // Update customer balance and create transaction
    if (!initialData) {
      const transactionAmount = formData.type === 'sale' ? calculations.total : -calculations.total;
      await updateCustomerBalance(formData.customerId, transactionAmount);
      await createTransaction(
        formData.customerId,
        formData.type === 'sale' ? 'invoice' : 'return',
        `${formData.type === 'sale' ? 'Invoice' : 'Return'} ${formData.orderNumber}`,
        formData.type === 'sale' ? calculations.total : 0,
        formData.type === 'return' ? calculations.total : 0,
        formData.orderNumber,
        userProfile?.displayName || 'Unknown'
      );
    }

    onSubmit(invoiceData);
  };

  const filteredProducts = (categoryId?: string) => {
    return products.filter(product => !categoryId || product.category === categoryId);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="orderNumber">Order Number</Label>
              <Input
                id="orderNumber"
                value={formData.orderNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, orderNumber: e.target.value }))}
                required
                readOnly
              />
            </div>

            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={formData.type} onValueChange={(value: 'sale' | 'return') => 
                setFormData(prev => ({ ...prev, type: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sale">Sale</SelectItem>
                  <SelectItem value="return">Return</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customer">Customer</Label>
              <Select value={formData.customerId} onValueChange={handleCustomerChange}>
                <SelectTrigger>
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
            </div>

            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select value={formData.paymentMethod} onValueChange={(value: PaymentMethod) => 
                setFormData(prev => ({ ...prev, paymentMethod: value }))
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
          </div>

          {selectedCustomer && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm"><strong>Customer:</strong> {selectedCustomer.fullName}</p>
              <p className="text-sm"><strong>Phone:</strong> {selectedCustomer.phone}</p>
              <p className="text-sm"><strong>Address:</strong> {selectedCustomer.address}</p>
              <p className="text-sm"><strong>Discount:</strong> {selectedCustomer.discountRate}%</p>
              <p className="text-sm"><strong>Current Balance:</strong> ${selectedCustomer.balance.toFixed(2)}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Invoice Items</CardTitle>
            <Button type="button" onClick={addItem} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="flex gap-4 items-end p-4 border rounded-lg">
                <div className="flex-1">
                  <Label>Product</Label>
                  <Select
                    value={item.productId}
                    onValueChange={(value) => updateItem(index, 'productId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map(product => (
                        <SelectItem key={product.id} value={product.id!}>
                          {product.name} - {product.category} (${product.price})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-24">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                  />
                </div>

                <div className="w-32">
                  <Label>Unit Price</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(index, 'unitPrice', Number(e.target.value))}
                  />
                </div>

                <div className="w-32">
                  <Label>Total</Label>
                  <Input
                    value={`$${item.total.toFixed(2)}`}
                    readOnly
                  />
                </div>

                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeItem(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {items.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No items added yet. Click "Add Item" to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Totals */}
      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Totals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-w-sm ml-auto">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${calculations.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount ({calculations.discountRate}%):</span>
                <span>-${calculations.discountAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>${calculations.total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Deposit Information */}
      <Card>
        <CardHeader>
          <CardTitle>Deposit Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="depositPaid"
              checked={formData.depositPaid}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, depositPaid: Boolean(checked) }))
              }
            />
            <Label htmlFor="depositPaid">Deposit Paid</Label>
          </div>

          {formData.depositPaid && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="depositAmount">Deposit Amount</Label>
                <Input
                  id="depositAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.depositAmount}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    depositAmount: Number(e.target.value) 
                  }))}
                />
              </div>

              <div>
                <Label htmlFor="depositMethod">Deposit Method</Label>
                <Select value={formData.depositMethod} onValueChange={(value: PaymentMethod) => 
                  setFormData(prev => ({ ...prev, depositMethod: value }))
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes and Status */}
      <Card>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value: any) => 
              setFormData(prev => ({ ...prev, status: value }))
            }>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes about this invoice..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={items.length === 0 || !formData.customerId}>
          {initialData ? 'Update Invoice' : 'Create Invoice'}
        </Button>
      </div>
    </form>
  );
};

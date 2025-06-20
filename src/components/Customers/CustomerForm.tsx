import React, { useState, useEffect } from 'react';
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
import type { Customer, CustomerType, UserProfile } from '@/types';

interface CustomerFormProps {
  initialData?: Customer;
  onSubmit: (data: Omit<Customer, 'id'>) => void;
  onCancel: () => void;
  userProfile: UserProfile | null;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  userProfile
}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    type: 'Individuals' as CustomerType,
    discountRate: 0,
    balance: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        fullName: initialData.fullName,
        phone: initialData.phone,
        address: initialData.address,
        type: initialData.type,
        discountRate: initialData.discountRate,
        balance: initialData.balance
      });
    }
  }, [initialData]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (formData.discountRate < 0 || formData.discountRate > 100) {
      newErrors.discountRate = 'Discount rate must be between 0 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const customerData: Omit<Customer, 'id'> = {
      ...formData,
      createdAt: initialData?.createdAt || new Date().toISOString(),
      createdBy: initialData?.createdBy || userProfile?.displayName || 'Unknown',
      updatedAt: initialData ? new Date().toISOString() : undefined,
      updatedBy: initialData ? userProfile?.displayName || 'Unknown' : undefined
    };

    onSubmit(customerData);
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
          <Label htmlFor="fullName">Full Name *</Label>
          <Input
            id="fullName"
            value={formData.fullName}
            onChange={(e) => handleInputChange('fullName', e.target.value)}
            placeholder="Enter customer's full name"
            className={errors.fullName ? 'border-red-500' : ''}
          />
          {errors.fullName && (
            <p className="text-sm text-red-500 mt-1">{errors.fullName}</p>
          )}
        </div>

        <div>
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="Enter phone number"
            className={errors.phone ? 'border-red-500' : ''}
          />
          {errors.phone && (
            <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="address">Address *</Label>
        <Textarea
          id="address"
          value={formData.address}
          onChange={(e) => handleInputChange('address', e.target.value)}
          placeholder="Enter customer's address"
          className={errors.address ? 'border-red-500' : ''}
          rows={3}
        />
        {errors.address && (
          <p className="text-sm text-red-500 mt-1">{errors.address}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="type">Customer Type *</Label>
          <Select 
            value={formData.type} 
            onValueChange={(value: CustomerType) => handleInputChange('type', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Institutions">Institutions</SelectItem>
              <SelectItem value="Shops">Shops</SelectItem>
              <SelectItem value="Individuals">Individuals</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="discountRate">Discount Rate (%)</Label>
          <Input
            id="discountRate"
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={formData.discountRate}
            onChange={(e) => handleInputChange('discountRate', Number(e.target.value))}
            placeholder="0"
            className={errors.discountRate ? 'border-red-500' : ''}
          />
          {errors.discountRate && (
            <p className="text-sm text-red-500 mt-1">{errors.discountRate}</p>
          )}
        </div>

        <div>
          <Label htmlFor="balance">Current Balance ($)</Label>
          <Input
            id="balance"
            type="number"
            step="0.01"
            value={formData.balance}
            onChange={(e) => handleInputChange('balance', Number(e.target.value))}
            placeholder="0.00"
            readOnly={!!initialData}
            className={initialData ? 'bg-gray-100' : ''}
          />
          {initialData && (
            <p className="text-xs text-gray-500 mt-1">
              Balance is automatically calculated from transactions
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" className="flex-1">
          {initialData ? 'Update Customer' : 'Create Customer'}
        </Button>
      </div>
    </form>
  );
};

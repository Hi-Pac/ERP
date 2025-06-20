import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Product, ProductCategory, UserProfile } from '@/types';

interface ProductFormProps {
  initialData?: Product;
  onSubmit: (data: Omit<Product, 'id'>) => void;
  onCancel: () => void;
  userProfile: UserProfile | null;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  userProfile
}) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'Structural' as ProductCategory,
    batchCode: '',
    price: 0,
    stock: 0,
    lowStockThreshold: 10
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        category: initialData.category,
        batchCode: initialData.batchCode || '',
        price: initialData.price,
        stock: initialData.stock,
        lowStockThreshold: initialData.lowStockThreshold
      });
    }
  }, [initialData]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (formData.price < 0) {
      newErrors.price = 'Price must be a positive number';
    }

    if (formData.stock < 0) {
      newErrors.stock = 'Stock must be a positive number';
    }

    if (formData.lowStockThreshold < 0) {
      newErrors.lowStockThreshold = 'Low stock threshold must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const productData: Omit<Product, 'id'> = {
      ...formData,
      batchCode: formData.batchCode || undefined,
      createdAt: initialData?.createdAt || new Date().toISOString(),
      createdBy: initialData?.createdBy || userProfile?.displayName || 'Unknown',
      updatedAt: initialData ? new Date().toISOString() : undefined,
      updatedBy: initialData ? userProfile?.displayName || 'Unknown' : undefined
    };

    onSubmit(productData);
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
          <Label htmlFor="name">Product Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Enter product name"
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && (
            <p className="text-sm text-red-500 mt-1">{errors.name}</p>
          )}
        </div>

        <div>
          <Label htmlFor="category">Category *</Label>
          <Select 
            value={formData.category} 
            onValueChange={(value: ProductCategory) => handleInputChange('category', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Structural">Structural</SelectItem>
              <SelectItem value="Exterior">Exterior</SelectItem>
              <SelectItem value="Decorative">Decorative</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="batchCode">Batch Code (Optional)</Label>
          <Input
            id="batchCode"
            value={formData.batchCode}
            onChange={(e) => handleInputChange('batchCode', e.target.value)}
            placeholder="Enter batch code"
          />
          <p className="text-xs text-gray-500 mt-1">
            Leave empty for unlimited codes
          </p>
        </div>

        <div>
          <Label htmlFor="price">Price ($) *</Label>
          <Input
            id="price"
            type="number"
            min="0"
            step="0.01"
            value={formData.price}
            onChange={(e) => handleInputChange('price', Number(e.target.value))}
            placeholder="0.00"
            className={errors.price ? 'border-red-500' : ''}
          />
          {errors.price && (
            <p className="text-sm text-red-500 mt-1">{errors.price}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="stock">Current Stock *</Label>
          <Input
            id="stock"
            type="number"
            min="0"
            value={formData.stock}
            onChange={(e) => handleInputChange('stock', Number(e.target.value))}
            placeholder="0"
            className={errors.stock ? 'border-red-500' : ''}
          />
          {errors.stock && (
            <p className="text-sm text-red-500 mt-1">{errors.stock}</p>
          )}
        </div>

        <div>
          <Label htmlFor="lowStockThreshold">Low Stock Alert Threshold *</Label>
          <Input
            id="lowStockThreshold"
            type="number"
            min="0"
            value={formData.lowStockThreshold}
            onChange={(e) => handleInputChange('lowStockThreshold', Number(e.target.value))}
            placeholder="10"
            className={errors.lowStockThreshold ? 'border-red-500' : ''}
          />
          {errors.lowStockThreshold && (
            <p className="text-sm text-red-500 mt-1">{errors.lowStockThreshold}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Alert when stock falls to or below this number
          </p>
        </div>
      </div>

      {/* Product Information Summary */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Product Summary</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-600">Category:</span>
            <span className="ml-2 font-medium">{formData.category}</span>
          </div>
          <div>
            <span className="text-gray-600">Price:</span>
            <span className="ml-2 font-medium">${formData.price.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-gray-600">Stock:</span>
            <span className="ml-2 font-medium">{formData.stock} units</span>
          </div>
          <div>
            <span className="text-gray-600">Alert Level:</span>
            <span className="ml-2 font-medium">{formData.lowStockThreshold} units</span>
          </div>
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" className="flex-1">
          {initialData ? 'Update Product' : 'Create Product'}
        </Button>
      </div>
    </form>
  );
};

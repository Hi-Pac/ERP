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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ROLE_PERMISSIONS } from '@/types';
import type { User, UserRole, UserProfile } from '@/types';

interface UserFormProps {
  initialData?: User;
  onSubmit: (data: Omit<User, 'id'>) => void;
  onCancel: () => void;
  currentUser: UserProfile | null;
}

export const UserForm: React.FC<UserFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  currentUser
}) => {
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    role: 'user' as UserRole
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        displayName: initialData.displayName,
        email: initialData.email,
        role: initialData.role
      });
    }
  }, [initialData]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Prevent non-admin users from creating admin accounts
    if (currentUser?.role !== 'admin' && formData.role === 'admin') {
      newErrors.role = 'Only administrators can create admin accounts';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const userData: Omit<User, 'id'> = {
      ...formData,
      createdAt: initialData?.createdAt || new Date().toISOString(),
      createdBy: initialData?.createdBy || currentUser?.displayName || 'Unknown',
      lastLogin: initialData?.lastLogin
    };

    onSubmit(userData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getAvailableRoles = (): UserRole[] => {
    if (currentUser?.role === 'admin') {
      return ['admin', 'supervisor', 'user'];
    } else if (currentUser?.role === 'supervisor') {
      return ['supervisor', 'user'];
    } else {
      return ['user'];
    }
  };

  const getRoleDescription = (role: UserRole): string => {
    switch (role) {
      case 'admin':
        return 'Full access to all modules including user management';
      case 'supervisor':
        return 'View, add, and edit access (no delete permissions)';
      case 'user':
        return 'View and add only access';
      default:
        return '';
    }
  };

  const getRolePermissions = (role: UserRole) => {
    const permissions = ROLE_PERMISSIONS[role];
    const modules = Object.keys(permissions);
    
    return modules.map(module => ({
      module: module.charAt(0).toUpperCase() + module.slice(1),
      canView: permissions[module].canView,
      canAdd: permissions[module].canAdd,
      canEdit: permissions[module].canEdit,
      canDelete: permissions[module].canDelete,
      canExport: permissions[module].canExport
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="displayName">Display Name *</Label>
          <Input
            id="displayName"
            value={formData.displayName}
            onChange={(e) => handleInputChange('displayName', e.target.value)}
            placeholder="Enter user's display name"
            className={errors.displayName ? 'border-red-500' : ''}
          />
          {errors.displayName && (
            <p className="text-sm text-red-500 mt-1">{errors.displayName}</p>
          )}
        </div>

        <div>
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="Enter email address"
            className={errors.email ? 'border-red-500' : ''}
            readOnly={!!initialData}
          />
          {errors.email && (
            <p className="text-sm text-red-500 mt-1">{errors.email}</p>
          )}
          {initialData && (
            <p className="text-xs text-gray-500 mt-1">
              Email cannot be changed after account creation
            </p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="role">User Role *</Label>
        <Select 
          value={formData.role} 
          onValueChange={(value: UserRole) => handleInputChange('role', value)}
        >
          <SelectTrigger className={errors.role ? 'border-red-500' : ''}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {getAvailableRoles().map(role => (
              <SelectItem key={role} value={role}>
                <div className="flex items-center gap-2">
                  <span className="capitalize">{role}</span>
                  {role === 'admin' && <Badge variant="destructive">Admin</Badge>}
                  {role === 'supervisor' && <Badge variant="secondary">Supervisor</Badge>}
                  {role === 'user' && <Badge variant="outline">User</Badge>}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.role && (
          <p className="text-sm text-red-500 mt-1">{errors.role}</p>
        )}
        <p className="text-sm text-gray-600 mt-1">
          {getRoleDescription(formData.role)}
        </p>
      </div>

      {/* Role Permissions Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Permissions for {formData.role.charAt(0).toUpperCase() + formData.role.slice(1)} Role
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getRolePermissions(formData.role).map(({ module, canView, canAdd, canEdit, canDelete, canExport }) => (
              <div key={module} className="p-3 border rounded-lg">
                <h4 className="font-medium mb-2">{module}</h4>
                <div className="flex flex-wrap gap-1">
                  {canView && <Badge variant="outline">View</Badge>}
                  {canAdd && <Badge variant="secondary">Add</Badge>}
                  {canEdit && <Badge variant="secondary">Edit</Badge>}
                  {canDelete && <Badge variant="destructive">Delete</Badge>}
                  {canExport && <Badge variant="outline">Export</Badge>}
                  {!canView && <Badge variant="outline" className="opacity-50">No Access</Badge>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Note */}
      {!initialData && (
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-amber-800 bg-amber-50 p-3 rounded-lg">
              <p className="font-medium mb-1">Security Note:</p>
              <p>
                This will create a new user account. The user will need to sign up using the provided email address
                to set their password and activate their account.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" className="flex-1">
          {initialData ? 'Update User' : 'Create User'}
        </Button>
      </div>
    </form>
  );
};

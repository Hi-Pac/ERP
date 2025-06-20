import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Shield, Users as UsersIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { usersService } from '@/lib/firestore';
import { UserForm } from '@/components/Users/UserForm';
import type { User, UserRole } from '@/types';
import Swal from 'sweetalert2';

export const Users: React.FC = () => {
  const { userProfile } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const permissions = userProfile?.role ? ROLE_PERMISSIONS[userProfile.role].users : null;

  useEffect(() => {
    // Only load if user has permission to view users
    if (permissions?.canView) {
      loadUsers();
    }
  }, [permissions]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await usersService.getAll();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
      Swal.fire('Error', 'Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const handleCreateUser = async (userData: Omit<User, 'id'>) => {
    try {
      await usersService.create(userData);
      await loadUsers();
      setIsCreateModalOpen(false);
      
      Swal.fire({
        title: 'Success!',
        text: 'User created successfully',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error creating user:', error);
      Swal.fire('Error', 'Failed to create user', 'error');
    }
  };

  const handleEditUser = async (userData: Omit<User, 'id'>) => {
    if (!editingUser) return;

    try {
      await usersService.update(editingUser.id!, userData);
      await loadUsers();
      setEditingUser(null);
      
      Swal.fire({
        title: 'Success!',
        text: 'User updated successfully',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error updating user:', error);
      Swal.fire('Error', 'Failed to update user', 'error');
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (user.id === userProfile?.uid) {
      Swal.fire('Error', 'You cannot delete your own account', 'error');
      return;
    }

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Delete user ${user.displayName}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await usersService.delete(user.id!);
        await loadUsers();
        
        Swal.fire({
          title: 'Deleted!',
          text: 'User has been deleted.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
      } catch (error) {
        console.error('Error deleting user:', error);
        Swal.fire('Error', 'Failed to delete user', 'error');
      }
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'supervisor':
        return 'bg-blue-100 text-blue-800';
      case 'user':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRolePermissions = (role: UserRole) => {
    const rolePerms = ROLE_PERMISSIONS[role];
    const moduleCount = Object.keys(rolePerms).filter(module => rolePerms[module].canView).length;
    return `${moduleCount} modules`;
  };

  // Check if user has permission to access this page
  if (!permissions?.canView) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Alert className="max-w-md">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access user management. Please contact your administrator.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage system users and their permissions</p>
        </div>
        
        {permissions?.canAdd && (
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Create a new user account and assign permissions.
                </DialogDescription>
              </DialogHeader>
              <UserForm
                onSubmit={handleCreateUser}
                onCancel={() => setIsCreateModalOpen(false)}
                currentUser={userProfile}
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
              <UsersIcon className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                <p className="text-sm text-gray-600">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {users.filter(u => u.role === 'admin').length}
              </p>
              <p className="text-sm text-gray-600">Administrators</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {users.filter(u => u.role === 'supervisor').length}
              </p>
              <p className="text-sm text-gray-600">Supervisors</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {users.filter(u => u.role === 'user').length}
              </p>
              <p className="text-sm text-gray-600">Regular Users</p>
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
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Administrators</SelectItem>
                <SelectItem value="supervisor">Supervisors</SelectItem>
                <SelectItem value="user">Users</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>System Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.displayName}
                        {user.id === userProfile?.uid && (
                          <Badge variant="outline" className="ml-2">You</Badge>
                        )}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {getRolePermissions(user.role)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{user.createdBy}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              Actions
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {permissions?.canEdit && (
                              <DropdownMenuItem onClick={() => setEditingUser(user)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            
                            {permissions?.canDelete && user.id !== userProfile?.uid && (
                              <DropdownMenuItem 
                                onClick={() => handleDeleteUser(user)}
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
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Modal */}
      {editingUser && (
        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit User: {editingUser.displayName}</DialogTitle>
              <DialogDescription>
                Update user details and permissions.
              </DialogDescription>
            </DialogHeader>
            <UserForm
              initialData={editingUser}
              onSubmit={handleEditUser}
              onCancel={() => setEditingUser(null)}
              currentUser={userProfile}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

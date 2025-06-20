import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_PERMISSIONS } from '@/types';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  Calculator,
  UserCog,
  FileBarChart,
  LogOut,
  Building2
} from 'lucide-react';

interface SidebarItem {
  title: string;
  href: string;
  icon: React.ElementType;
  module: string;
}

const sidebarItems: SidebarItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    module: 'dashboard'
  },
  {
    title: 'Sales',
    href: '/sales',
    icon: ShoppingCart,
    module: 'sales'
  },
  {
    title: 'Customers',
    href: '/customers',
    icon: Users,
    module: 'customers'
  },
  {
    title: 'Inventory',
    href: '/inventory',
    icon: Package,
    module: 'inventory'
  },
  {
    title: 'Accounting',
    href: '/accounting',
    icon: Calculator,
    module: 'accounting'
  },
  {
    title: 'Users',
    href: '/users',
    icon: UserCog,
    module: 'users'
  },
  {
    title: 'Reports',
    href: '/reports',
    icon: FileBarChart,
    module: 'reports'
  }
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { userProfile, logout } = useAuth();

  const hasAccess = (module: string): boolean => {
    if (!userProfile?.role) return false;
    const permissions = ROLE_PERMISSIONS[userProfile.role][module];
    return permissions?.canView || false;
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="flex h-screen w-64 flex-col bg-gray-900 text-white">
      {/* Logo and Company Name */}
      <div className="flex items-center gap-3 border-b border-gray-700 p-6">
        <Building2 className="h-8 w-8 text-blue-400" />
        <div>
          <h1 className="text-xl font-bold text-white">HCP ERP</h1>
          <p className="text-sm text-gray-400">Company Solutions</p>
        </div>
      </div>

      {/* User Info */}
      <div className="border-b border-gray-700 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600">
            <span className="text-sm font-semibold">
              {userProfile?.displayName?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {userProfile?.displayName || 'User'}
            </p>
            <p className="text-xs text-gray-400 capitalize">
              {userProfile?.role || 'user'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {sidebarItems.map((item) => {
          if (!hasAccess(item.module)) return null;

          const isActive = location.pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="border-t border-gray-700 p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
};

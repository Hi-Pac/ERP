import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Users, 
  Package, 
  AlertTriangle, 
  ShoppingCart,
  DollarSign
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { invoicesService, customersService, productsService } from '@/lib/firestore';
import type { DashboardStats, Invoice, Customer, Product } from '@/types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalCustomers: 0,
    totalProducts: 0,
    lowStockProducts: 0,
    pendingOrders: 0,
    todayRevenue: 0,
    monthlyRevenue: 0,
    topSellingProducts: [],
    recentOrders: [],
    salesChart: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Get all data in parallel
      const [invoices, customers, products] = await Promise.all([
        invoicesService.getAll(),
        customersService.getAll(),
        productsService.getAll()
      ]);

      // Calculate statistics
      const today = new Date().toISOString().split('T')[0];
      const currentMonth = new Date().toISOString().substring(0, 7);

      const todayRevenue = invoices
        .filter(inv => inv.date.startsWith(today) && inv.status === 'paid')
        .reduce((sum, inv) => sum + inv.total, 0);

      const monthlyRevenue = invoices
        .filter(inv => inv.date.startsWith(currentMonth) && inv.status === 'paid')
        .reduce((sum, inv) => sum + inv.total, 0);

      const pendingOrders = invoices.filter(inv => inv.status === 'pending').length;
      const lowStockProducts = products.filter(prod => prod.stock <= prod.lowStockThreshold).length;

      // Calculate top selling products
      const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
      
      invoices.forEach(invoice => {
        invoice.items.forEach(item => {
          if (!productSales[item.productId]) {
            productSales[item.productId] = {
              name: item.productName,
              quantity: 0,
              revenue: 0
            };
          }
          productSales[item.productId].quantity += item.quantity;
          productSales[item.productId].revenue += item.total;
        });
      });

      const topSellingProducts = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Generate sales chart data for last 7 days
      const salesChart = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayInvoices = invoices.filter(inv => inv.date.startsWith(dateStr));
        const daySales = dayInvoices.length;
        const dayRevenue = dayInvoices.reduce((sum, inv) => sum + inv.total, 0);
        
        salesChart.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          sales: daySales,
          revenue: dayRevenue
        });
      }

      const recentOrders = invoices
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      setStats({
        totalSales: invoices.length,
        totalCustomers: customers.length,
        totalProducts: products.length,
        lowStockProducts,
        pendingOrders,
        todayRevenue,
        monthlyRevenue,
        topSellingProducts,
        recentOrders,
        salesChart
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: 'Total Sales',
      value: stats.totalSales,
      icon: ShoppingCart,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      title: 'Total Customers',
      value: stats.totalCustomers,
      icon: Users,
      color: 'text-green-600 bg-green-100'
    },
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'text-purple-600 bg-purple-100'
    },
    {
      title: 'Low Stock Alert',
      value: stats.lowStockProducts,
      icon: AlertTriangle,
      color: 'text-red-600 bg-red-100'
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders,
      icon: ShoppingCart,
      color: 'text-yellow-600 bg-yellow-100'
    },
    {
      title: 'Today Revenue',
      value: `$${stats.todayRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-green-600 bg-green-100'
    }
  ];

  const salesChartData = {
    labels: stats.salesChart.map(item => item.date),
    datasets: [
      {
        label: 'Sales Count',
        data: stats.salesChart.map(item => item.sales),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        yAxisID: 'y',
      },
      {
        label: 'Revenue ($)',
        data: stats.salesChart.map(item => item.revenue),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        yAxisID: 'y1',
      }
    ]
  };

  const salesChartOptions = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Date'
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Sales Count'
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Revenue ($)'
        },
        grid: {
          drawOnChartArea: false,
        },
      }
    }
  };

  const topProductsData = {
    labels: stats.topSellingProducts.map(product => product.name),
    datasets: [
      {
        label: 'Revenue',
        data: stats.topSellingProducts.map(product => product.revenue),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)'
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
          'rgb(239, 68, 68)',
          'rgb(139, 92, 246)'
        ],
        borderWidth: 2
      }
    ]
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Trend (Last 7 Days)</CardTitle>
            <CardDescription>Daily sales count and revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Line data={salesChartData} options={salesChartOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Top Products Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>Revenue by product</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {stats.topSellingProducts.length > 0 ? (
                <Doughnut data={topProductsData} />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-500">
                  No sales data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders and Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest customer orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentOrders.length > 0 ? (
                stats.recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{order.orderNumber}</p>
                      <p className="text-sm text-gray-600">{order.customerName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${order.total.toFixed(2)}</p>
                      <Badge variant={order.status === 'paid' ? 'default' : 'secondary'}>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No recent orders</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Products List */}
        <Card>
          <CardHeader>
            <CardTitle>Product Performance</CardTitle>
            <CardDescription>Top selling products by revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topSellingProducts.length > 0 ? (
                stats.topSellingProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-600">Qty: {product.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${product.revenue.toFixed(2)}</p>
                      <Badge variant="outline">#{index + 1}</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No product data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

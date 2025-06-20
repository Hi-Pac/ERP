import React, { useState, useEffect } from 'react';
import { Download, Filter, FileText, BarChart3, Calendar, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_PERMISSIONS } from '@/types';
import { 
  invoicesService, 
  customersService, 
  productsService, 
  paymentsService, 
  getFilteredData 
} from '@/lib/firestore';
import { exportToPDF, exportToExcel } from '@/lib/export';
import type { Invoice, Customer, Product, Payment, ReportFilter } from '@/types';

type ReportType = 'sales' | 'customers' | 'inventory' | 'payments' | 'summary';

export const Reports: React.FC = () => {
  const { userProfile } = useAuth();
  const [reportType, setReportType] = useState<ReportType>('summary');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any[]>([]);
  const [filters, setFilters] = useState<ReportFilter>({
    startDate: '',
    endDate: '',
    customerId: '',
    productId: '',
    category: undefined,
    paymentMethod: undefined,
    status: ''
  });
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const permissions = userProfile?.role ? ROLE_PERMISSIONS[userProfile.role].reports : null;

  useEffect(() => {
    loadMetadata();
  }, []);

  useEffect(() => {
    if (reportType) {
      generateReport();
    }
  }, [reportType]);

  const loadMetadata = async () => {
    try {
      const [customersData, productsData] = await Promise.all([
        customersService.getAll(),
        productsService.getAll()
      ]);
      
      setCustomers(customersData);
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading metadata:', error);
    }
  };

  const generateReport = async () => {
    if (!permissions?.canView) return;

    setLoading(true);
    try {
      let data: any[] = [];
      
      switch (reportType) {
        case 'sales':
          data = await getFilteredData(invoicesService, filters);
          break;
        case 'customers':
          data = await getFilteredData(customersService, filters);
          break;
        case 'inventory':
          data = await getFilteredData(productsService, filters);
          break;
        case 'payments':
          data = await getFilteredData(paymentsService, filters);
          break;
        case 'summary':
          data = await generateSummaryReport();
          break;
      }
      
      setReportData(data);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSummaryReport = async () => {
    const [invoices, customers, products, payments] = await Promise.all([
      invoicesService.getAll(),
      customersService.getAll(),
      productsService.getAll(),
      paymentsService.getAll()
    ]);

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Filter by date range if specified
    let filteredInvoices = invoices;
    let filteredPayments = payments;

    if (filters.startDate) {
      filteredInvoices = filteredInvoices.filter(inv => inv.date >= filters.startDate!);
      filteredPayments = filteredPayments.filter(pay => pay.date >= filters.startDate!);
    }

    if (filters.endDate) {
      filteredInvoices = filteredInvoices.filter(inv => inv.date <= filters.endDate!);
      filteredPayments = filteredPayments.filter(pay => pay.date <= filters.endDate!);
    }

    return [
      {
        metric: 'Total Sales',
        value: filteredInvoices.length,
        amount: filteredInvoices.reduce((sum, inv) => sum + inv.total, 0),
        period: filters.startDate ? 'Filtered Period' : 'All Time'
      },
      {
        metric: 'Total Revenue',
        value: `$${filteredInvoices.reduce((sum, inv) => sum + inv.total, 0).toFixed(2)}`,
        amount: filteredInvoices.reduce((sum, inv) => sum + inv.total, 0),
        period: filters.startDate ? 'Filtered Period' : 'All Time'
      },
      {
        metric: 'Total Customers',
        value: customers.length,
        amount: 0,
        period: 'Current'
      },
      {
        metric: 'Total Products',
        value: products.length,
        amount: 0,
        period: 'Current'
      },
      {
        metric: 'Total Payments',
        value: filteredPayments.length,
        amount: filteredPayments.reduce((sum, pay) => sum + pay.amount, 0),
        period: filters.startDate ? 'Filtered Period' : 'All Time'
      },
      {
        metric: 'Pending Orders',
        value: filteredInvoices.filter(inv => inv.status === 'pending').length,
        amount: filteredInvoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + inv.total, 0),
        period: filters.startDate ? 'Filtered Period' : 'Current'
      }
    ];
  };

  const handleExportPDF = async () => {
    if (reportData.length === 0) return;

    let columns: Array<{ header: string; key: string }> = [];
    let title = '';

    switch (reportType) {
      case 'sales':
        title = 'Sales Report';
        columns = [
          { header: 'Order Number', key: 'orderNumber' },
          { header: 'Customer', key: 'customerName' },
          { header: 'Date', key: 'date' },
          { header: 'Total', key: 'total' },
          { header: 'Status', key: 'status' }
        ];
        break;
      case 'customers':
        title = 'Customers Report';
        columns = [
          { header: 'Name', key: 'fullName' },
          { header: 'Phone', key: 'phone' },
          { header: 'Type', key: 'type' },
          { header: 'Balance', key: 'balance' }
        ];
        break;
      case 'inventory':
        title = 'Inventory Report';
        columns = [
          { header: 'Product', key: 'name' },
          { header: 'Category', key: 'category' },
          { header: 'Price', key: 'price' },
          { header: 'Stock', key: 'stock' }
        ];
        break;
      case 'payments':
        title = 'Payments Report';
        columns = [
          { header: 'Date', key: 'date' },
          { header: 'Customer', key: 'customerName' },
          { header: 'Amount', key: 'amount' },
          { header: 'Method', key: 'method' }
        ];
        break;
      case 'summary':
        title = 'Summary Report';
        columns = [
          { header: 'Metric', key: 'metric' },
          { header: 'Value', key: 'value' },
          { header: 'Period', key: 'period' }
        ];
        break;
    }

    await exportToPDF(reportData, title, columns);
  };

  const handleExportExcel = () => {
    if (reportData.length === 0) return;

    const filename = `${reportType}_report`;
    const sheetName = `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`;
    
    exportToExcel(reportData, filename, sheetName);
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      customerId: '',
      productId: '',
      category: undefined,
      paymentMethod: undefined,
      status: ''
    });
  };

  const getReportColumns = () => {
    switch (reportType) {
      case 'sales':
        return ['Order Number', 'Customer', 'Date', 'Items', 'Total', 'Status', 'Type'];
      case 'customers':
        return ['Name', 'Phone', 'Type', 'Discount', 'Balance', 'Created'];
      case 'inventory':
        return ['Product', 'Category', 'Price', 'Stock', 'Status', 'Created'];
      case 'payments':
        return ['Date', 'Customer', 'Amount', 'Method', 'Type', 'Created'];
      case 'summary':
        return ['Metric', 'Value', 'Amount', 'Period'];
      default:
        return [];
    }
  };

  const renderTableRow = (item: any, index: number) => {
    switch (reportType) {
      case 'sales':
        return (
          <TableRow key={index}>
            <TableCell className="font-medium">{item.orderNumber}</TableCell>
            <TableCell>{item.customerName}</TableCell>
            <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
            <TableCell>{item.items?.length || 0} items</TableCell>
            <TableCell className="font-medium">${item.total?.toFixed(2)}</TableCell>
            <TableCell>
              <Badge variant={item.status === 'paid' ? 'default' : 'secondary'}>
                {item.status}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant={item.type === 'sale' ? 'default' : 'outline'}>
                {item.type}
              </Badge>
            </TableCell>
          </TableRow>
        );
      case 'customers':
        return (
          <TableRow key={index}>
            <TableCell className="font-medium">{item.fullName}</TableCell>
            <TableCell>{item.phone}</TableCell>
            <TableCell>
              <Badge variant="outline">{item.type}</Badge>
            </TableCell>
            <TableCell>{item.discountRate}%</TableCell>
            <TableCell className={`font-medium ${
              item.balance > 0 ? 'text-red-600' : 
              item.balance < 0 ? 'text-green-600' : 'text-gray-600'
            }`}>
              ${item.balance?.toFixed(2)}
            </TableCell>
            <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
          </TableRow>
        );
      case 'inventory':
        return (
          <TableRow key={index}>
            <TableCell className="font-medium">{item.name}</TableCell>
            <TableCell>
              <Badge variant="outline">{item.category}</Badge>
            </TableCell>
            <TableCell>${item.price?.toFixed(2)}</TableCell>
            <TableCell>{item.stock}</TableCell>
            <TableCell>
              <Badge variant={
                item.stock === 0 ? 'destructive' :
                item.stock <= item.lowStockThreshold ? 'secondary' : 'default'
              }>
                {item.stock === 0 ? 'Out of Stock' :
                 item.stock <= item.lowStockThreshold ? 'Low Stock' : 'In Stock'}
              </Badge>
            </TableCell>
            <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
          </TableRow>
        );
      case 'payments':
        return (
          <TableRow key={index}>
            <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
            <TableCell>{item.customerName}</TableCell>
            <TableCell className={`font-medium ${
              item.type === 'payment' ? 'text-green-600' : 'text-red-600'
            }`}>
              {item.type === 'payment' ? '+' : '-'}${item.amount?.toFixed(2)}
            </TableCell>
            <TableCell>
              <Badge variant="outline">{item.method}</Badge>
            </TableCell>
            <TableCell>
              <Badge variant={item.type === 'payment' ? 'default' : 'secondary'}>
                {item.type}
              </Badge>
            </TableCell>
            <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
          </TableRow>
        );
      case 'summary':
        return (
          <TableRow key={index}>
            <TableCell className="font-medium">{item.metric}</TableCell>
            <TableCell className="font-medium text-blue-600">{item.value}</TableCell>
            <TableCell className="font-medium">
              {item.amount > 0 ? `$${item.amount.toFixed(2)}` : '-'}
            </TableCell>
            <TableCell>{item.period}</TableCell>
          </TableRow>
        );
      default:
        return null;
    }
  };

  if (!permissions?.canView) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">You don't have permission to access reports.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Generate and export comprehensive business reports</p>
        </div>
      </div>

      {/* Report Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Report Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="reportType">Report Type</Label>
              <Select value={reportType} onValueChange={(value: ReportType) => setReportType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Summary Report</SelectItem>
                  <SelectItem value="sales">Sales Report</SelectItem>
                  <SelectItem value="customers">Customers Report</SelectItem>
                  <SelectItem value="inventory">Inventory Report</SelectItem>
                  <SelectItem value="payments">Payments Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="customer">Customer (Optional)</Label>
              <Select value={filters.customerId} onValueChange={(value) => 
                setFilters(prev => ({ ...prev, customerId: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="All customers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Customers</SelectItem>
                  {customers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id!}>
                      {customer.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={generateReport} disabled={loading} className="flex-1">
                {loading ? 'Generating...' : 'Generate Report'}
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Results */}
      {reportData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report Results
              </CardTitle>
              
              {permissions?.canExport && (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleExportPDF}>
                    <Download className="mr-2 h-4 w-4" />
                    Export PDF
                  </Button>
                  <Button variant="outline" onClick={handleExportExcel}>
                    <Download className="mr-2 h-4 w-4" />
                    Export Excel
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Badge variant="outline">
                {reportData.length} records found
              </Badge>
              {(filters.startDate || filters.endDate) && (
                <Badge variant="secondary" className="ml-2">
                  Date filtered
                </Badge>
              )}
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {getReportColumns().map((column, index) => (
                      <TableHead key={index}>{column}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.map((item, index) => renderTableRow(item, index))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Generating report...</p>
          </div>
        </div>
      )}

      {!loading && reportData.length === 0 && reportType && (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                No data available for the selected criteria. Try adjusting your filters.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

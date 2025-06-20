import React, { useState, useEffect } from 'react';
import { Plus, Search, Download, Edit, Trash2, AlertTriangle, Package } from 'lucide-react';
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
import { productsService } from '@/lib/firestore';
import { exportToPDF, exportToExcel } from '@/lib/export';
import { ProductForm } from '@/components/Inventory/ProductForm';
import type { Product, ProductCategory } from '@/types';
import Swal from 'sweetalert2';

export const Inventory: React.FC = () => {
  const { userProfile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const permissions = userProfile?.role ? ROLE_PERMISSIONS[userProfile.role].inventory : null;

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productsService.getAll();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
      Swal.fire('Error', 'Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.batchCode && product.batchCode.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    
    let matchesStock = true;
    if (stockFilter === 'low') {
      matchesStock = product.stock <= product.lowStockThreshold;
    } else if (stockFilter === 'out') {
      matchesStock = product.stock === 0;
    }
    
    return matchesSearch && matchesCategory && matchesStock;
  });

  const handleCreateProduct = async (productData: Omit<Product, 'id'>) => {
    try {
      await productsService.create(productData);
      await loadProducts();
      setIsCreateModalOpen(false);
      
      Swal.fire({
        title: 'Success!',
        text: 'Product created successfully',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error creating product:', error);
      Swal.fire('Error', 'Failed to create product', 'error');
    }
  };

  const handleEditProduct = async (productData: Omit<Product, 'id'>) => {
    if (!editingProduct) return;

    try {
      await productsService.update(editingProduct.id!, {
        ...productData,
        updatedBy: userProfile?.displayName || 'Unknown'
      });
      await loadProducts();
      setEditingProduct(null);
      
      Swal.fire({
        title: 'Success!',
        text: 'Product updated successfully',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error updating product:', error);
      Swal.fire('Error', 'Failed to update product', 'error');
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Delete product ${product.name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await productsService.delete(product.id!);
        await loadProducts();
        
        Swal.fire({
          title: 'Deleted!',
          text: 'Product has been deleted.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
      } catch (error) {
        console.error('Error deleting product:', error);
        Swal.fire('Error', 'Failed to delete product', 'error');
      }
    }
  };

  const handleExportPDF = async () => {
    const columns = [
      { header: 'Name', key: 'name' },
      { header: 'Category', key: 'category' },
      { header: 'Batch Code', key: 'batchCode' },
      { header: 'Price', key: 'price' },
      { header: 'Stock', key: 'stock' },
      { header: 'Low Stock Threshold', key: 'lowStockThreshold' },
      { header: 'Created By', key: 'createdBy' }
    ];
    
    await exportToPDF(filteredProducts, 'Inventory Report', columns);
  };

  const handleExportExcel = () => {
    const exportData = filteredProducts.map(product => ({
      name: product.name,
      category: product.category,
      batchCode: product.batchCode || '',
      price: product.price,
      stock: product.stock,
      lowStockThreshold: product.lowStockThreshold,
      createdBy: product.createdBy,
      createdAt: product.createdAt,
      updatedBy: product.updatedBy || '',
      updatedAt: product.updatedAt || ''
    }));
    
    exportToExcel(exportData, 'inventory_report', 'Inventory Data');
  };

  const getCategoryColor = (category: ProductCategory) => {
    switch (category) {
      case 'Structural':
        return 'bg-blue-100 text-blue-800';
      case 'Exterior':
        return 'bg-green-100 text-green-800';
      case 'Decorative':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStockStatus = (product: Product) => {
    if (product.stock === 0) {
      return { label: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    } else if (product.stock <= product.lowStockThreshold) {
      return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { label: 'In Stock', color: 'bg-green-100 text-green-800' };
    }
  };

  const lowStockProducts = products.filter(p => p.stock <= p.lowStockThreshold && p.stock > 0);
  const outOfStockProducts = products.filter(p => p.stock === 0);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600">Manage products and stock levels</p>
        </div>
        
        {permissions?.canAdd && (
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>
                  Fill in the product details below.
                </DialogDescription>
              </DialogHeader>
              <ProductForm
                onSubmit={handleCreateProduct}
                onCancel={() => setIsCreateModalOpen(false)}
                userProfile={userProfile}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Alerts */}
      {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
        <div className="space-y-3">
          {outOfStockProducts.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>{outOfStockProducts.length} products are out of stock:</strong> {' '}
                {outOfStockProducts.slice(0, 3).map(p => p.name).join(', ')}
                {outOfStockProducts.length > 3 && ` and ${outOfStockProducts.length - 3} more`}
              </AlertDescription>
            </Alert>
          )}
          
          {lowStockProducts.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>{lowStockProducts.length} products are running low:</strong> {' '}
                {lowStockProducts.slice(0, 3).map(p => p.name).join(', ')}
                {lowStockProducts.length > 3 && ` and ${lowStockProducts.length - 3} more`}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
                <p className="text-sm text-gray-600">Total Products</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {products.filter(p => p.category === 'Structural').length}
              </p>
              <p className="text-sm text-gray-600">Structural</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {products.filter(p => p.category === 'Exterior').length}
              </p>
              <p className="text-sm text-gray-600">Exterior</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {products.filter(p => p.category === 'Decorative').length}
              </p>
              <p className="text-sm text-gray-600">Decorative</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {lowStockProducts.length + outOfStockProducts.length}
              </p>
              <p className="text-sm text-gray-600">Alerts</p>
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
                  placeholder="Search by name or batch code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Structural">Structural</SelectItem>
                <SelectItem value="Exterior">Exterior</SelectItem>
                <SelectItem value="Decorative">Decorative</SelectItem>
              </SelectContent>
            </Select>

            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock Levels</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="out">Out of Stock</SelectItem>
              </SelectContent>
            </Select>

            {permissions?.canExport && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={handleExportPDF}>
                    Export as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportExcel}>
                    Export as Excel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products ({filteredProducts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Batch Code</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Low Stock Alert</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => {
                    const stockStatus = getStockStatus(product);
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>
                          <Badge className={getCategoryColor(product.category)}>
                            {product.category}
                          </Badge>
                        </TableCell>
                        <TableCell>{product.batchCode || '-'}</TableCell>
                        <TableCell className="font-medium">${product.price.toFixed(2)}</TableCell>
                        <TableCell className="font-medium">{product.stock}</TableCell>
                        <TableCell>
                          <Badge className={stockStatus.color}>
                            {stockStatus.label}
                          </Badge>
                        </TableCell>
                        <TableCell>{product.lowStockThreshold}</TableCell>
                        <TableCell className="text-sm text-gray-600">{product.createdBy}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                Actions
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              {permissions?.canEdit && (
                                <DropdownMenuItem onClick={() => setEditingProduct(product)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                              )}
                              
                              {permissions?.canDelete && (
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteProduct(product)}
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
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      No products found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Product Modal */}
      {editingProduct && (
        <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Product: {editingProduct.name}</DialogTitle>
              <DialogDescription>
                Update the product details below.
              </DialogDescription>
            </DialogHeader>
            <ProductForm
              initialData={editingProduct}
              onSubmit={handleEditProduct}
              onCancel={() => setEditingProduct(null)}
              userProfile={userProfile}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

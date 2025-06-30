import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { AlertCircle, Package, Upload, Download, Plus, Minus, Save, FileSpreadsheet } from 'lucide-react';

interface Warehouse {
  id: number;
  name: string;
}

interface StockItem {
  ingredient_id: number;
  ingredient_name: string;
  unit: string;
  quantity: number;
  category_name: string;
  minimum_stock: number;
  maximum_stock: number;
  package_size: number;
}

interface StockUpdateItem {
  ingredient_id: number;
  quantity: number;
  operation: 'set' | 'add' | 'subtract';
  reason: string;
}

interface StockManagementProps {
  warehouses: Warehouse[];
  onNotification: (type: 'success' | 'error' | 'info', message: string) => void;
}

const StockManagement: React.FC<StockManagementProps> = ({ warehouses, onNotification }) => {
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<StockItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [stockUpdates, setStockUpdates] = useState<{ [key: number]: StockUpdateItem }>({});
  const [loading, setLoading] = useState(false);
  const [bulkReason, setBulkReason] = useState<string>('');

  // Get unique categories
  const categories = Array.from(new Set(stockItems.map(item => item.category_name))).sort();

  useEffect(() => {
    if (selectedWarehouse) {
      loadStockItems();
    }
  }, [selectedWarehouse]);

  useEffect(() => {
    filterItems();
  }, [stockItems, searchTerm, categoryFilter, stockFilter]);

  const loadStockItems = async () => {
    setLoading(true);
    try {
      console.log('Loading stock for warehouse:', selectedWarehouse);
      const response = await fetch(`http://localhost:8000/api/warehouse/warehouses/${selectedWarehouse}/stock`);
      if (!response.ok) throw new Error('Failed to load stock items');
      const data = await response.json();
      console.log('Raw stock data:', data);
      
      // Filter out items with empty names and add default values
      const validItems = data
        .filter((item: any) => item.ingredient_name && item.ingredient_name.trim() !== '')
        .map((item: any) => ({
          ingredient_id: item.ingredient_id,
          ingredient_name: item.ingredient_name.trim(),
          unit: item.unit || 'units',
          quantity: item.quantity || 0,
          category_name: item.category_name || 'Uncategorized',
          minimum_stock: item.minimum_stock || 10,
          maximum_stock: item.maximum_stock || 100,
          package_size: item.package_size || 1
        }));
      
      console.log('Processed stock items:', validItems);
      setStockItems(validItems);
      setStockUpdates({});
      
      if (validItems.length === 0) {
        onNotification('info', 'No stock items found for this warehouse');
      } else {
        onNotification('success', `Loaded ${validItems.length} stock items`);
      }
    } catch (error) {
      console.error('Error loading stock items:', error);
      onNotification('error', 'Failed to load stock items');
      setStockItems([]);
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = stockItems;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.ingredient_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter && categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category_name === categoryFilter);
    }

    // Stock level filter
    switch (stockFilter) {
      case 'low':
        filtered = filtered.filter(item => item.quantity <= item.minimum_stock);
        break;
      case 'empty':
        filtered = filtered.filter(item => item.quantity === 0);
        break;
      case 'normal':
        filtered = filtered.filter(item => 
          item.quantity > item.minimum_stock && item.quantity <= item.maximum_stock
        );
        break;
      case 'high':
        filtered = filtered.filter(item => item.quantity > item.maximum_stock);
        break;
    }

    setFilteredItems(filtered);
  };

  const updateStockItem = (ingredientId: number, operation: 'set' | 'add' | 'subtract', value: number, reason: string = '') => {
    setStockUpdates(prev => ({
      ...prev,
      [ingredientId]: {
        ingredient_id: ingredientId,
        quantity: value,
        operation,
        reason: reason || bulkReason
      }
    }));
  };

  const addPackage = (item: StockItem) => {
    if (item.package_size <= 0) {
      onNotification('error', 'Package size not defined for this item');
      return;
    }
    
    const currentUpdate = stockUpdates[item.ingredient_id];
    const newQuantity = currentUpdate ? currentUpdate.quantity + item.package_size : item.package_size;
    
    updateStockItem(item.ingredient_id, 'add', newQuantity, 'Added package');
  };

  const subtractPackage = (item: StockItem) => {
    if (item.package_size <= 0) {
      onNotification('error', 'Package size not defined for this item');
      return;
    }
    
    const currentUpdate = stockUpdates[item.ingredient_id];
    const newQuantity = Math.max(0, currentUpdate ? currentUpdate.quantity - item.package_size : item.package_size);
    
    updateStockItem(item.ingredient_id, 'subtract', newQuantity, 'Removed package');
  };

  const handleManualUpdate = (ingredientId: number, value: string) => {
    const quantity = parseFloat(value) || 0;
    updateStockItem(ingredientId, 'set', quantity, 'Manual update');
  };

  const applyStockUpdates = async () => {
    const updates = Object.values(stockUpdates);
    if (updates.length === 0) {
      onNotification('error', 'No stock updates to apply');
      return;
    }

    // Validate all updates have reasons
    const missingReasons = updates.filter(update => !update.reason.trim());
    if (missingReasons.length > 0) {
      onNotification('error', 'Please provide reasons for all stock updates');
      return;
    }

    setLoading(true);
    try {
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // Process each update individually
      for (const update of updates as StockUpdateItem[]) {
        try {
          // Calculate new quantity based on operation
          const currentItem = stockItems.find(item => item.ingredient_id === update.ingredient_id);
          let newQuantity = update.quantity;
          
          if (currentItem) {
            switch (update.operation) {
              case 'add':
                newQuantity = currentItem.quantity + update.quantity;
                break;
              case 'subtract':
                newQuantity = Math.max(0, currentItem.quantity - update.quantity);
                break;
              case 'set':
                newQuantity = update.quantity;
                break;
            }
          }

          const requestBody = {
            warehouse_id: parseInt(selectedWarehouse),
            ingredient_id: update.ingredient_id,
            new_quantity: newQuantity,
            reason: update.reason
          };
          
          console.log('Stock update request:', requestBody);
          
          const response = await fetch('http://localhost:8000/api/warehouse/stock/update', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error('Stock update error response:', errorData);
            
            // Handle validation errors properly
            if (response.status === 422 && errorData.detail) {
              if (Array.isArray(errorData.detail)) {
                const errorMessages = errorData.detail.map((err: any) => 
                  `${err.loc?.join(' -> ') || 'Field'}: ${err.msg}`
                ).join(', ');
                throw new Error(`Validation error: ${errorMessages}`);
              } else {
                throw new Error(`Validation error: ${errorData.detail}`);
              }
            }
            
            throw new Error(errorData.detail || errorData.message || 'Failed to update stock');
          }

          successCount++;
          
        } catch (error) {
          errorCount++;
          const updateItem = update as StockUpdateItem;
          const itemName = stockItems.find(item => item.ingredient_id === updateItem.ingredient_id)?.ingredient_name || `Item ${updateItem.ingredient_id}`;
          errors.push(`${itemName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Show results
      if (successCount > 0 && errorCount === 0) {
        onNotification('success', `Successfully updated ${successCount} items`);
      } else if (successCount > 0 && errorCount > 0) {
        onNotification('info', `Updated ${successCount} items, ${errorCount} failed. Errors: ${errors.join('; ')}`);
      } else {
        onNotification('error', `All updates failed. Errors: ${errors.join('; ')}`);
      }
      
      // Reload stock items and clear updates
      await loadStockItems();
      setBulkReason('');
      
    } catch (error) {
      console.error('Error updating stock:', error);
      onNotification('error', error instanceof Error ? error.message : 'Failed to update stock');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    const csvContent = [
      ['Ingredient', 'Category', 'Current Stock', 'Unit', 'Minimum', 'Maximum', 'Package Size'],
      ...filteredItems.map(item => [
        item.ingredient_name,
        item.category_name,
        item.quantity,
        item.unit,
        item.minimum_stock,
        item.maximum_stock,
        item.package_size
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stock_${warehouses.find(w => w.id.toString() === selectedWarehouse)?.name}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    onNotification('success', 'Stock data exported successfully');
  };

  const getStockStatusColor = (item: StockItem) => {
    if (item.quantity === 0) return 'text-red-600';
    if (item.quantity <= item.minimum_stock) return 'text-yellow-600';
    if (item.quantity > item.maximum_stock) return 'text-blue-600';
    return 'text-green-600';
  };

  const getStockStatusBadge = (item: StockItem) => {
    if (item.quantity === 0) return <Badge variant="destructive">Empty</Badge>;
    if (item.quantity <= item.minimum_stock) return <Badge variant="destructive">Low</Badge>;
    if (item.quantity > item.maximum_stock) return <Badge variant="secondary">High</Badge>;
    return <Badge variant="default">Normal</Badge>;
  };

  const pendingUpdatesCount = Object.keys(stockUpdates).length;

  return (
    <div className="space-y-6">
      {/* Warehouse Selection */}
      <div className="space-y-2">
        <Label htmlFor="warehouse-select">Select Warehouse</Label>
        <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select warehouse" />
          </SelectTrigger>
          <SelectContent>
            {warehouses.map(warehouse => (
              <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                {warehouse.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedWarehouse && (
        <>
          <Separator />
          
          {/* Filters and Actions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Stock Management</h3>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={exportToExcel}
                  className="flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </Button>
                {pendingUpdatesCount > 0 && (
                  <Badge variant="outline">
                    {pendingUpdatesCount} pending updates
                  </Badge>
                )}
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Search</Label>
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search ingredients..."
                />
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Stock Level</Label>
                <Select value={stockFilter} onValueChange={setStockFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All items</SelectItem>
                    <SelectItem value="empty">Empty</SelectItem>
                    <SelectItem value="low">Low stock</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Bulk Reason</Label>
                <Input
                  value={bulkReason}
                  onChange={(e) => setBulkReason(e.target.value)}
                  placeholder="Default reason for updates"
                />
              </div>
            </div>

            {/* Pending Updates Actions */}
            {pendingUpdatesCount > 0 && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-blue-900">Pending Stock Updates</h4>
                      <p className="text-sm text-blue-700">
                        {pendingUpdatesCount} items ready to be updated
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setStockUpdates({})}
                      >
                        Clear All
                      </Button>
                      <Button
                        onClick={applyStockUpdates}
                        disabled={loading}
                        className="flex items-center space-x-2"
                      >
                        <Save className="h-4 w-4" />
                        <span>{loading ? 'Applying...' : 'Apply Updates'}</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Stock Items */}
          <div className="space-y-4">
            {loading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading stock items...</p>
                  </div>
                </CardContent>
              </Card>
            ) : filteredItems.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">No items found</p>
                    <p className="text-sm text-gray-400 mt-2">
                      {stockItems.length === 0 ? 'This warehouse has no stock items' : 'Try adjusting your filters'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredItems.map(item => {
                  const pendingUpdate = stockUpdates[item.ingredient_id];
                  const hasUpdate = Boolean(pendingUpdate);
                  
                  return (
                    <Card key={item.ingredient_id} className={hasUpdate ? 'bg-yellow-50 border-yellow-200' : ''}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium">{item.ingredient_name}</h4>
                              {getStockStatusBadge(item)}
                              {hasUpdate && (
                                <Badge variant="outline" className="bg-yellow-100">
                                  Pending Update
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              <span className="font-medium">Category:</span> {item.category_name} | 
                              <span className="font-medium ml-2">Unit:</span> {item.unit} |
                              <span className="font-medium ml-2">Min:</span> {item.minimum_stock} |
                              <span className="font-medium ml-2">Max:</span> {item.maximum_stock}
                              {item.package_size > 0 && (
                                <> | <span className="font-medium">Package:</span> {item.package_size}</>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-4">
                            {/* Current Stock */}
                            <div className="text-center">
                              <div className="text-sm text-gray-500">Current</div>
                              <div className={`font-bold ${getStockStatusColor(item)}`}>
                                {item.quantity}
                              </div>
                            </div>

                            {/* Package Operations */}
                            {item.package_size > 0 && (
                              <div className="flex items-center space-x-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => subtractPackage(item)}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <div className="text-xs text-center min-w-[40px]">
                                  {item.package_size}
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addPackage(item)}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            )}

                            {/* Manual Update */}
                            <div className="flex items-center space-x-2">
                              <Input
                                type="number"
                                value={pendingUpdate?.quantity || ''}
                                onChange={(e) => handleManualUpdate(item.ingredient_id, e.target.value)}
                                placeholder="New quantity"
                                className="w-24"
                                min="0"
                                step="0.1"
                              />
                              <span className="text-sm text-gray-500">{item.unit}</span>
                            </div>

                            {/* Remove pending update */}
                            {hasUpdate && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const { [item.ingredient_id]: removed, ...rest } = stockUpdates;
                                  setStockUpdates(rest);
                                }}
                              >
                                Clear
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Pending Update Info */}
                        {hasUpdate && (
                          <div className="mt-3 p-2 bg-yellow-100 rounded text-sm">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-medium">Pending:</span> {pendingUpdate.operation} {pendingUpdate.quantity} {item.unit}
                                {pendingUpdate.reason && <> | <span className="font-medium">Reason:</span> {pendingUpdate.reason}</>}
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default StockManagement; 

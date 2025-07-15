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
  const { t } = useTranslation();
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
      const response = await fetch(`http://100.29.4.72:8000/api/warehouse/warehouses/${selectedWarehouse}/stock`);
      if (!response.ok) throw new Error(t('warehouse.stock.loadingItems'));
      const data = await response.json();
      console.log('Raw stock data:', data);
      
      // Filter out items with empty names and add default values
      const validItems = data
        .filter((item: any) => item.ingredient_name && item.ingredient_name.trim() !== '')
        .map((item: any) => ({
          ingredient_id: item.ingredient_id,
          ingredient_name: item.ingredient_name.trim(),
          unit: item.unit || t('createTransferOrder.units'),
          quantity: item.quantity || 0,
          category_name: item.category_name || t('notifications.noItemsFound'),
          minimum_stock: item.minimum_stock || 10,
          maximum_stock: item.maximum_stock || 100,
          package_size: item.package_size || 1
        }));
      
      console.log('Processed stock items:', validItems);
      setStockItems(validItems);
      setStockUpdates({});
      
      if (validItems.length === 0) {
        onNotification('info', t('warehouse.stock.noItemsFound'));
      } else {
        onNotification('success', `${t('notifications.loadingData')} ${validItems.length} ${t('warehouse.stock.loadingItems')}`);
      }
    } catch (error) {
      console.error('Error loading stock items:', error);
      onNotification('error', t('warehouse.stock.noItemsFound'));
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
      onNotification('error', t('warehouse.stock.packageSizeNotDefined'));
      return;
    }
    
    const currentUpdate = stockUpdates[item.ingredient_id];
    const newQuantity = currentUpdate ? currentUpdate.quantity + item.package_size : item.package_size;
    
    updateStockItem(item.ingredient_id, 'add', newQuantity, t('warehouse.stock.addedPackage'));
  };

  const subtractPackage = (item: StockItem) => {
    if (item.package_size <= 0) {
      onNotification('error', t('warehouse.stock.packageSizeNotDefined'));
      return;
    }
    
    const currentUpdate = stockUpdates[item.ingredient_id];
    const newQuantity = Math.max(0, currentUpdate ? currentUpdate.quantity - item.package_size : item.package_size);
    
    updateStockItem(item.ingredient_id, 'subtract', newQuantity, t('warehouse.stock.removedPackage'));
  };

  const handleManualUpdate = (ingredientId: number, value: string) => {
    const quantity = parseFloat(value) || 0;
    updateStockItem(ingredientId, 'set', quantity, t('warehouse.stock.manualUpdateReason'));
  };

  const applyStockUpdates = async () => {
    const updates = Object.values(stockUpdates);
    if (updates.length === 0) {
      onNotification('error', t('warehouse.stock.noStockUpdates'));
      return;
    }

    // Validate all updates have reasons
    const missingReasons = updates.filter(update => !update.reason.trim());
    if (missingReasons.length > 0) {
      onNotification('error', t('warehouse.stock.provideReasons'));
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
          
          const response = await fetch('http://100.29.4.72:8000/api/warehouse/stock/update', {
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
                throw new Error(`${t('warehouse.categories.validationError')}: ${errorMessages}`);
              } else {
                throw new Error(`${t('warehouse.categories.validationError')}: ${errorData.detail}`);
              }
            }
            
            throw new Error(errorData.detail || errorData.message || t('warehouse.stock.noStockUpdates'));
          }

          successCount++;
          
        } catch (error) {
          errorCount++;
          const updateItem = update as StockUpdateItem;
          const itemName = stockItems.find(item => item.ingredient_id === updateItem.ingredient_id)?.ingredient_name || `Item ${updateItem.ingredient_id}`;
          errors.push(`${itemName}: ${error instanceof Error ? error.message : t('kitchenProduction.productionCommon.errorLoading')}`);
        }
      }

      // Show results
      if (successCount > 0 && errorCount === 0) {
        onNotification('success', `${t('warehouse.stock.updatedItems')} ${successCount} ${t('common.items')}`);
      } else if (successCount > 0 && errorCount > 0) {
        onNotification('info', `${t('warehouse.stock.updatedItems')} ${successCount} ${t('common.items')}, ${errorCount} ${t('warehouse.stock.failedItems')}. ${t('notifications.error')}: ${errors.join('; ')}`);
      } else {
        onNotification('error', `${t('warehouse.stock.allUpdatesFailed')}. ${t('notifications.error')}: ${errors.join('; ')}`);
      }
      
      // Reload stock items and clear updates
      await loadStockItems();
      setBulkReason('');
      
    } catch (error) {
      console.error('Error updating stock:', error);
      onNotification('error', error instanceof Error ? error.message : t('warehouse.stock.noStockUpdates'));
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    const csvContent = [
      [t('kitchenProduction.productionCommon.ingredient'), t('warehouse.stock.category'), t('warehouse.stock.current') + ' ' + t('warehouse.stock.title'), t('kitchenProduction.productionCommon.unit'), t('warehouse.stock.min'), t('warehouse.stock.max'), t('warehouse.stock.package')],
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
    
    onNotification('success', t('warehouse.stock.exportSuccess'));
  };

  const getStockStatusColor = (item: StockItem) => {
    if (item.quantity === 0) return 'text-red-600';
    if (item.quantity <= item.minimum_stock) return 'text-yellow-600';
    if (item.quantity > item.maximum_stock) return 'text-blue-600';
    return 'text-green-600';
  };

  const getStockStatusBadge = (item: StockItem) => {
    if (item.quantity === 0) return <Badge variant="destructive">{t('warehouse.stock.badgeEmpty')}</Badge>;
    if (item.quantity <= item.minimum_stock) return <Badge variant="destructive">{t('warehouse.stock.badgeLow')}</Badge>;
    if (item.quantity > item.maximum_stock) return <Badge variant="secondary">{t('warehouse.stock.badgeHigh')}</Badge>;
    return <Badge variant="default">{t('warehouse.stock.badgeNormal')}</Badge>;
  };

  const pendingUpdatesCount = Object.keys(stockUpdates).length;

  return (
    <div className="space-y-6">
      {/* Warehouse Selection */}
      <div className="space-y-2">
        <Label htmlFor="warehouse-select">{t('warehouse.stock.selectWarehouse')}</Label>
        <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t('warehouse.stock.selectWarehouse')} />
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
              <h3 className="text-lg font-medium">{t('warehouse.stock.title')}</h3>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={exportToExcel}
                  className="flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>{t('warehouse.stock.export')}</span>
                </Button>
                {pendingUpdatesCount > 0 && (
                  <Badge variant="outline">
                    {pendingUpdatesCount} {t('warehouse.stock.pendingUpdates')}
                  </Badge>
                )}
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>{t('common.search')}</Label>
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('warehouse.stock.search')}
                />
              </div>

              <div className="space-y-2">
                <Label>{t('warehouse.stock.category')}</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('warehouse.stock.allCategories')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('warehouse.stock.allCategories')}</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('warehouse.stock.stockLevel')}</Label>
                <Select value={stockFilter} onValueChange={setStockFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('warehouse.stock.allItems')}</SelectItem>
                    <SelectItem value="empty">{t('warehouse.stock.empty')}</SelectItem>
                    <SelectItem value="low">{t('warehouse.stock.low')}</SelectItem>
                    <SelectItem value="normal">{t('warehouse.stock.normal')}</SelectItem>
                    <SelectItem value="high">{t('warehouse.stock.high')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('warehouse.stock.bulkReason')}</Label>
                <Input
                  value={bulkReason}
                  onChange={(e) => setBulkReason(e.target.value)}
                  placeholder={t('warehouse.stock.defaultReason')}
                />
              </div>
            </div>

            {/* Pending Updates Actions */}
            {pendingUpdatesCount > 0 && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-blue-900">{t('warehouse.stock.pendingUpdates')}</h4>
                      <p className="text-sm text-blue-700">
                        {pendingUpdatesCount} {t('warehouse.stock.readyToUpdate')}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setStockUpdates({})}
                      >
                        {t('warehouse.stock.clearAll')}
                      </Button>
                      <Button
                        onClick={applyStockUpdates}
                        disabled={loading}
                        className="flex items-center space-x-2"
                      >
                        <Save className="h-4 w-4" />
                        <span>{loading ? t('warehouse.stock.applying') : t('warehouse.stock.applyUpdates')}</span>
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
                    <p className="text-gray-500">{t('warehouse.stock.loadingItems')}</p>
                  </div>
                </CardContent>
              </Card>
            ) : filteredItems.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">{t('warehouse.stock.noItemsFound')}</p>
                    <p className="text-sm text-gray-400 mt-2">
                      {stockItems.length === 0 ? t('warehouse.stock.thisWarehouseEmpty') : t('warehouse.stock.adjustFilters')}
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
                                  {t('warehouse.stock.pendingUpdate')}
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              <span className="font-medium">{t('warehouse.stock.category')}:</span> {item.category_name} | 
                              <span className="font-medium ml-2">{t('kitchenProduction.productionCommon.unit')}:</span> {item.unit} |
                              <span className="font-medium ml-2">{t('warehouse.stock.min')}:</span> {item.minimum_stock} |
                              <span className="font-medium ml-2">{t('warehouse.stock.max')}:</span> {item.maximum_stock}
                              {item.package_size > 0 && (
                                <> | <span className="font-medium">{t('warehouse.stock.package')}:</span> {item.package_size}</>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-4">
                            {/* Current Stock */}
                            <div className="text-center">
                              <div className="text-sm text-gray-500">{t('warehouse.stock.current')}</div>
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
                                placeholder={t('warehouse.stock.newQuantity')}
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
                                {t('warehouse.stock.clear')}
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Pending Update Info */}
                        {hasUpdate && (
                          <div className="mt-3 p-2 bg-yellow-100 rounded text-sm">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-medium">{t('warehouse.stock.pendingUpdate')}:</span> {pendingUpdate.operation} {pendingUpdate.quantity} {item.unit}
                                {pendingUpdate.reason && <> | <span className="font-medium">{t('common.notes')}:</span> {pendingUpdate.reason}</>}
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

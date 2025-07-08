import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Edit2, Trash2, Plus, Building, MapPin, Store, RefreshCw, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface Warehouse {
  id: number;
  name: string;
  location?: string;
  is_shop?: boolean;
  foodics_branch_id?: string;
  auto_sync?: boolean;
  created_at?: string;
}

interface WarehouseSettingsProps {
  warehouses: Warehouse[];
  onWarehouseChange: () => void;
  onNotification: (type: 'success' | 'error' | 'info', message: string) => void;
}

interface SyncStatus {
  [warehouseId: number]: {
    status: 'idle' | 'syncing' | 'success' | 'error';
    lastSync?: string;
    message?: string;
  };
}

const WarehouseSettings: React.FC<WarehouseSettingsProps> = ({
  warehouses,
  onWarehouseChange,
  onNotification
}) => {
  const { t } = useTranslation();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isShopSettingsModalOpen, setIsShopSettingsModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [editingShop, setEditingShop] = useState<Warehouse | null>(null);
  const [createForm, setCreateForm] = useState({
    name: '',
    location: ''
  });
  const [editForm, setEditForm] = useState({
    name: '',
    location: ''
  });
  const [shopForm, setShopForm] = useState({
    is_shop: false,
    foodics_branch_id: '',
    auto_sync: true
  });
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({});

  const handleCreateWarehouse = async () => {
    if (!createForm.name.trim()) {
      onNotification('error', t('warehouse.warehouses.nameRequired'));
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('http://100.29.4.72:8000/api/warehouse/warehouses', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: createForm.name.trim(),
          location: createForm.location.trim()
        }),
      });

      if (!response.ok) {
        let errorMessage = t('notifications.errorLoading');
        try {
          const error = await response.json();
          errorMessage = error.detail || error.message || errorMessage;
        } catch {
          errorMessage = response.status === 405 ? 'Method not allowed - server may be restarting' : 
                        response.status === 401 ? 'Authentication required' :
                        `Server error: ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      onNotification('success', result.message || t('warehouse.warehouses.createSuccess'));
      setCreateForm({ name: '', location: '' });
      setIsCreateModalOpen(false);
      onWarehouseChange();
    } catch (error) {
      console.error('Warehouse creation error:', error);
      onNotification('error', error instanceof Error ? error.message : t('notifications.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  const handleEditWarehouse = async () => {
    if (!editingWarehouse || !editForm.name.trim()) {
      onNotification('error', t('warehouse.warehouses.nameRequired'));
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`http://100.29.4.72:8000/api/warehouse/warehouses/${editingWarehouse.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          name: editForm.name.trim(),
          location: editForm.location.trim()
        }),
      });

      if (!response.ok) {
        let errorMessage = t('notifications.errorLoading');
        try {
          const error = await response.json();
          errorMessage = error.detail || error.message || errorMessage;
        } catch {
          errorMessage = response.status === 405 ? 'Method not allowed - server may be restarting' : 
                        response.status === 401 ? 'Authentication required' :
                        response.status === 404 ? 'Warehouse not found' :
                        `Server error: ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      onNotification('success', result.message || t('warehouse.warehouses.updateSuccess'));
      setEditForm({ name: '', location: '' });
      setEditingWarehouse(null);
      setIsEditModalOpen(false);
      onWarehouseChange();
    } catch (error) {
      console.error('Warehouse update error:', error);
      onNotification('error', error instanceof Error ? error.message : t('notifications.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateShopSettings = async () => {
    if (!editingShop) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`http://100.29.4.72:8000/api/warehouse/warehouses/${editingShop.id}/shop-settings`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(shopForm),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to update shop settings';
        try {
          const error = await response.json();
          errorMessage = error.detail || error.message || errorMessage;
        } catch {
          errorMessage = `Server error: ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      onNotification('success', result.message || 'Shop settings updated successfully');
      setIsShopSettingsModalOpen(false);
      setEditingShop(null);
      onWarehouseChange();
    } catch (error) {
      console.error('Shop settings update error:', error);
      onNotification('error', error instanceof Error ? error.message : 'Failed to update shop settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncWithFoodics = async (warehouse: Warehouse) => {
    if (!warehouse.is_shop || !warehouse.foodics_branch_id) {
      onNotification('error', 'This warehouse is not configured as a shop or missing Foodics branch ID');
      return;
    }

    setSyncStatus(prev => ({
      ...prev,
      [warehouse.id]: { status: 'syncing', message: 'Initiating sync...' }
    }));

    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`http://100.29.4.72:8000/api/warehouse/shops/${warehouse.id}/sync-foodics`, {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.status}`);
      }

      const result = await response.json();
      setSyncStatus(prev => ({
        ...prev,
        [warehouse.id]: { 
          status: 'success', 
          message: result.message || 'Sync completed successfully',
          lastSync: new Date().toISOString()
        }
      }));
      onNotification('success', result.message || 'Foodics sync completed successfully');
    } catch (error) {
      console.error('Foodics sync error:', error);
      setSyncStatus(prev => ({
        ...prev,
        [warehouse.id]: { 
          status: 'error', 
          message: error instanceof Error ? error.message : 'Sync failed'
        }
      }));
      onNotification('error', error instanceof Error ? error.message : 'Failed to sync with Foodics');
    }
  };

  const handleDeleteWarehouse = async (warehouse: Warehouse) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`http://100.29.4.72:8000/api/warehouse/warehouses/${warehouse.id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        let errorMessage = t('notifications.errorLoading');
        try {
          const error = await response.json();
          errorMessage = error.detail || error.message || errorMessage;
        } catch {
          errorMessage = response.status === 405 ? 'Method not allowed - server may be restarting' : 
                        response.status === 401 ? 'Authentication required' :
                        response.status === 404 ? 'Warehouse not found' :
                        `Server error: ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      onNotification('success', result.message || t('warehouse.warehouses.deleteSuccess'));
      onWarehouseChange();
    } catch (error) {
      console.error('Warehouse deletion error:', error);
      onNotification('error', error instanceof Error ? error.message : t('notifications.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setEditForm({
      name: warehouse.name,
      location: warehouse.location || ''
    });
    setIsEditModalOpen(true);
  };

  const openShopSettingsModal = (warehouse: Warehouse) => {
    setEditingShop(warehouse);
    setShopForm({
      is_shop: warehouse.is_shop || false,
      foodics_branch_id: warehouse.foodics_branch_id || '',
      auto_sync: warehouse.auto_sync !== false
    });
    setIsShopSettingsModalOpen(true);
  };

  const getSyncStatusIcon = (status: string) => {
    switch (status) {
      case 'syncing':
        return <Clock className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatLastSync = (lastSync?: string) => {
    if (!lastSync) return 'Never';
    const date = new Date(lastSync);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-6 w-6" />
                {t('warehouse.warehouses.title')}
              </CardTitle>
              <CardDescription>
                {t('warehouse.description')}
              </CardDescription>
            </div>
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  {t('warehouse.warehouses.createNew')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('warehouse.warehouses.createNew')}</DialogTitle>
                  <DialogDescription>
                    Create a new warehouse location for Recipe Management
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="create-name">{t('warehouse.warehouses.name')} *</Label>
                    <Input
                      id="create-name"
                      value={createForm.name}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder={t('warehouse.warehouses.name')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-location">{t('warehouse.warehouses.location')}</Label>
                    <Input
                      id="create-location"
                      value={createForm.location}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, location: e.target.value }))}
                      placeholder={t('warehouse.warehouses.location')}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateModalOpen(false)}
                      disabled={loading}
                    >
                      {t('common.cancel')}
                    </Button>
                    <Button onClick={handleCreateWarehouse} disabled={loading}>
                      {loading ? t('common.loading') : t('common.create')}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Warehouses List */}
      <div className="grid gap-4">
        {warehouses.map((warehouse) => (
          <Card key={warehouse.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      {warehouse.is_shop ? (
                        <Store className="h-5 w-5 text-blue-500" />
                      ) : (
                        <Building className="h-5 w-5 text-muted-foreground" />
                      )}
                      {warehouse.name}
                    </h3>
                                         {warehouse.is_shop && (
                       <Badge variant="secondary">
                         <Store className="h-3 w-3 mr-1" />
                         Shop
                       </Badge>
                     )}
                  </div>
                  
                  {warehouse.location && (
                    <p className="text-muted-foreground flex items-center gap-2 mt-1">
                      <MapPin className="h-4 w-4" />
                      {warehouse.location}
                    </p>
                  )}
                  
                  <p className="text-sm text-muted-foreground mt-2">
                    {t('warehouse.warehouses.warehouseId')}: {warehouse.id}
                  </p>

                  {/* Shop-specific information */}
                  {warehouse.is_shop && (
                    <div className="mt-3 space-y-2">
                      {warehouse.foodics_branch_id && (
                                                 <div className="flex items-center gap-2 text-sm">
                           <Badge variant="outline">
                             Foodics ID: {warehouse.foodics_branch_id}
                           </Badge>
                           {warehouse.auto_sync && (
                             <Badge variant="outline">
                               Auto-sync enabled
                             </Badge>
                           )}
                         </div>
                      )}
                      
                      {/* Sync Status */}
                      {syncStatus[warehouse.id] && (
                        <div className="flex items-center gap-2 text-sm">
                          {getSyncStatusIcon(syncStatus[warehouse.id].status)}
                          <span className={`${
                            syncStatus[warehouse.id].status === 'success' ? 'text-green-600' :
                            syncStatus[warehouse.id].status === 'error' ? 'text-red-600' :
                            syncStatus[warehouse.id].status === 'syncing' ? 'text-blue-600' :
                            'text-gray-600'
                          }`}>
                            {syncStatus[warehouse.id].message}
                          </span>
                          {syncStatus[warehouse.id].lastSync && (
                            <span className="text-xs text-muted-foreground">
                              • Last sync: {formatLastSync(syncStatus[warehouse.id].lastSync)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Dialog open={isEditModalOpen && editingWarehouse?.id === warehouse.id} onOpenChange={setIsEditModalOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(warehouse)}
                          className="flex items-center gap-1"
                        >
                          <Edit2 className="h-4 w-4" />
                          {t('common.edit')}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{t('warehouse.warehouses.editWarehouse')}</DialogTitle>
                          <DialogDescription>
                            Update the warehouse information below
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-name">{t('warehouse.warehouses.name')} *</Label>
                            <Input
                              id="edit-name"
                              value={editForm.name}
                              onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                              placeholder={t('warehouse.warehouses.name')}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-location">{t('warehouse.warehouses.location')}</Label>
                            <Input
                              id="edit-location"
                              value={editForm.location}
                              onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                              placeholder={t('warehouse.warehouses.location')}
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setIsEditModalOpen(false);
                                setEditingWarehouse(null);
                              }}
                              disabled={loading}
                            >
                              {t('common.cancel')}
                            </Button>
                            <Button onClick={handleEditWarehouse} disabled={loading}>
                              {loading ? t('common.loading') : t('common.update')}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Shop Settings Button */}
                    <Dialog open={isShopSettingsModalOpen && editingShop?.id === warehouse.id} onOpenChange={setIsShopSettingsModalOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openShopSettingsModal(warehouse)}
                          className="flex items-center gap-1"
                        >
                          <Store className="h-4 w-4" />
                          Shop Settings
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Shop Settings - {warehouse.name}</DialogTitle>
                          <DialogDescription>
                            Configure shop and Foodics integration settings
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label>Enable Shop Mode</Label>
                              <p className="text-sm text-muted-foreground">
                                Convert this warehouse to a shop for sales tracking
                              </p>
                            </div>
                            <Switch
                              checked={shopForm.is_shop}
                              onCheckedChange={(checked) => setShopForm(prev => ({ ...prev, is_shop: checked }))}
                            />
                          </div>

                          {shopForm.is_shop && (
                            <>
                              <div className="space-y-2">
                                <Label htmlFor="foodics-branch-id">Foodics Branch ID</Label>
                                <Input
                                  id="foodics-branch-id"
                                  value={shopForm.foodics_branch_id}
                                  onChange={(e) => setShopForm(prev => ({ ...prev, foodics_branch_id: e.target.value }))}
                                  placeholder="Enter Foodics branch ID"
                                />
                                <p className="text-xs text-muted-foreground">
                                  Link this shop to a specific Foodics branch for inventory sync
                                </p>
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                  <Label>Auto-sync with Foodics</Label>
                                  <p className="text-sm text-muted-foreground">
                                    Automatically sync inventory changes
                                  </p>
                                </div>
                                <Switch
                                  checked={shopForm.auto_sync}
                                  onCheckedChange={(checked) => setShopForm(prev => ({ ...prev, auto_sync: checked }))}
                                />
                              </div>
                            </>
                          )}

                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setIsShopSettingsModalOpen(false);
                                setEditingShop(null);
                              }}
                              disabled={loading}
                            >
                              Cancel
                            </Button>
                            <Button onClick={handleUpdateShopSettings} disabled={loading}>
                              {loading ? 'Updating...' : 'Update Settings'}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Trash2 className="h-4 w-4" />
                          {t('common.delete')}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('warehouse.warehouses.deleteWarehouse')}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('warehouse.warehouses.deleteConfirm')}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteWarehouse(warehouse)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={loading}
                          >
                            {loading ? t('common.loading') : t('common.delete')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  {/* Foodics Sync Button for Shops */}
                  {warehouse.is_shop && warehouse.foodics_branch_id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSyncWithFoodics(warehouse)}
                      disabled={syncStatus[warehouse.id]?.status === 'syncing'}
                      className="flex items-center gap-1 w-full"
                    >
                      <RefreshCw className={`h-4 w-4 ${syncStatus[warehouse.id]?.status === 'syncing' ? 'animate-spin' : ''}`} />
                      {syncStatus[warehouse.id]?.status === 'syncing' ? 'Syncing...' : 'Sync with Foodics'}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {warehouses.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('notifications.noItemsFound')}</h3>
            <p className="text-muted-foreground mb-4">
              {t('warehouse.description')}
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('warehouse.warehouses.createNew')}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WarehouseSettings; 

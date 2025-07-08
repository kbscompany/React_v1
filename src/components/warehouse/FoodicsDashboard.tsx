import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { RefreshCw, Store, CheckCircle, XCircle, Clock, AlertCircle, Settings } from 'lucide-react';
import FoodicsConfiguration from './FoodicsConfiguration';

interface Warehouse {
  id: number;
  name: string;
  location?: string;
  is_shop?: boolean;
  foodics_branch_id?: string;
  auto_sync?: boolean;
}

interface SyncStatus {
  [warehouseId: number]: {
    status: 'idle' | 'syncing' | 'success' | 'error';
    lastSync?: string;
    message?: string;
  };
}

interface FoodicsDashboardProps {
  warehouses: Warehouse[];
  onNotification: (type: 'success' | 'error' | 'info', message: string) => void;
}

const FoodicsDashboard: React.FC<FoodicsDashboardProps> = ({
  warehouses,
  onNotification
}) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({});
  const [isGlobalSyncing, setIsGlobalSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Filter shops from warehouses
  const shops = warehouses.filter(w => w.is_shop);

  const handleSyncShop = async (shopId: number) => {
    setSyncStatus(prev => ({
      ...prev,
      [shopId]: { status: 'syncing', message: 'Syncing with Foodics...' }
    }));

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://100.29.4.72:8000/api/warehouse/shops/${shopId}/sync-foodics`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setSyncStatus(prev => ({
          ...prev,
          [shopId]: { 
            status: 'success', 
            lastSync: new Date().toISOString(),
            message: result.message || 'Successfully synced with Foodics'
          }
        }));
        onNotification('success', result.message || 'Shop synced successfully');
      } else {
        throw new Error(`Sync failed: ${response.status}`);
      }
    } catch (error) {
      setSyncStatus(prev => ({
        ...prev,
        [shopId]: { 
          status: 'error', 
          message: error instanceof Error ? error.message : 'Failed to sync with Foodics'
        }
      }));
      onNotification('error', error instanceof Error ? error.message : 'Failed to sync shop');
    }
  };

  const handleGlobalSync = async () => {
    if (shops.length === 0) {
      onNotification('info', 'No shops available for synchronization');
      return;
    }

    setIsGlobalSyncing(true);
    
    try {
      // Sync all shops sequentially
      for (const shop of shops) {
        if (shop.foodics_branch_id) {
          await handleSyncShop(shop.id);
          // Small delay between syncs to avoid overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      onNotification('success', `Completed synchronization for ${shops.length} shops`);
    } catch (error) {
      onNotification('error', 'Global sync completed with errors');
    } finally {
      setIsGlobalSyncing(false);
    }
  };

  const getSyncStatusIcon = (status: string) => {
    switch (status) {
      case 'syncing':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatLastSync = (lastSync?: string) => {
    if (!lastSync) return 'Never';
    const date = new Date(lastSync);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-6 w-6" />
                Foodics Integration Center
              </CardTitle>
              <CardDescription>
                Manage Foodics API configuration and shop synchronization
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            Shop Dashboard
          </TabsTrigger>
          <TabsTrigger value="configuration" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            API Configuration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Store className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Total Shops</p>
                    <p className="text-2xl font-bold">{shops.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">Configured Shops</p>
                    <p className="text-2xl font-bold">
                      {shops.filter(s => s.foodics_branch_id).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Auto-Sync Enabled</p>
                    <p className="text-2xl font-bold">
                      {shops.filter(s => s.auto_sync).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-600">Last Sync</p>
                    <p className="text-sm font-medium">
                      {Object.values(syncStatus).some((s: any) => s.lastSync) 
                        ? 'Recently'
                        : 'Never'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Shop Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Shop Synchronization</CardTitle>
                  <CardDescription>
                    Monitor and manage individual shop sync status with Foodics
                  </CardDescription>
                </div>
                {shops.length > 0 && (
                  <Button
                    onClick={handleGlobalSync}
                    disabled={isGlobalSyncing}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${isGlobalSyncing ? 'animate-spin' : ''}`} />
                    {isGlobalSyncing ? 'Syncing All...' : 'Sync All Shops'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {shops.length === 0 ? (
                <div className="text-center py-8">
                  <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Shops Found</h3>
                  <p className="text-gray-600 mb-4">
                    Convert warehouses to shops to start using Foodics integration
                  </p>
                  <p className="text-sm text-gray-500">
                    Go to the <strong>Warehouses</strong> tab to configure shop settings
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {shops.map((shop) => {
                    const status = syncStatus[shop.id];
                    
                    return (
                      <div
                        key={shop.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            {getSyncStatusIcon(status?.status || 'idle')}
                            <div>
                              <h4 className="font-medium">{shop.name}</h4>
                              <p className="text-sm text-gray-600">{shop.location}</p>
                              {status?.message && (
                                <p className="text-xs text-gray-500 mt-1">{status.message}</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            {shop.foodics_branch_id && (
                              <Badge variant="outline">
                                ID: {shop.foodics_branch_id}
                              </Badge>
                            )}
                            
                            {shop.auto_sync && (
                              <Badge variant="outline">
                                Auto-sync
                              </Badge>
                            )}

                            {!shop.foodics_branch_id && (
                              <Badge variant="destructive">
                                Not Configured
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {status?.lastSync && (
                            <div className="text-right">
                              <p className="text-xs text-gray-500">Last sync:</p>
                              <p className="text-xs font-mono">{formatLastSync(status.lastSync)}</p>
                            </div>
                          )}

                          <Button
                            size="sm"
                            onClick={() => handleSyncShop(shop.id)}
                            disabled={status?.status === 'syncing' || !shop.foodics_branch_id}
                            className="flex items-center gap-1"
                          >
                            <RefreshCw className={`h-3 w-3 ${status?.status === 'syncing' ? 'animate-spin' : ''}`} />
                            {status?.status === 'syncing' ? 'Syncing...' : 'Sync'}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuration">
          <FoodicsConfiguration onNotification={onNotification} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FoodicsDashboard;

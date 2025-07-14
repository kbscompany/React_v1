import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ChevronDown } from 'lucide-react';
import CreateTransferOrder from './warehouse/CreateTransferOrder';
import ReceiveTransferOrder from './warehouse/ReceiveTransferOrder';
import ReceiveFromSupplier from './warehouse/ReceiveFromSupplier';
import StockManagement from './warehouse/StockManagement';
import CategoryManagement from './warehouse/CategoryManagement';
import WarehouseSettings from './warehouse/WarehouseSettings';
import WarehouseManagerAssignment from './warehouse/WarehouseManagerAssignment';
import FoodicsDashboard from './warehouse/FoodicsDashboard';
import LanguageSwitcher from './LanguageSwitcher';

interface Warehouse {
  id: number;
  name: string;
  location?: string;
  is_shop?: boolean;
  foodics_branch_id?: string;
  auto_sync?: boolean;
}

interface NotificationState {
  show: boolean;
  type: 'success' | 'error' | 'info';
  message: string;
}

const WarehouseManagement: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>('warehouse-settings');
  const [activeOrderTab, setActiveOrderTab] = useState<string>('create-transfer');
  const [showOrdersDropdown, setShowOrdersDropdown] = useState<boolean>(false);
  
  // Helper function to get translation with proper fallback
  const getTranslation = (key: string, fallback: string) => {
    try {
      const translation = t(key);
      const shouldUseFallback = !translation || translation === key || translation.includes('missingKey') || translation.includes('undefined');
      return shouldUseFallback ? fallback : translation;
    } catch (error) {
      return fallback;
    }
  };

  // Hardcoded translations as ultimate fallback
  const translations = {
    'warehouse.title': 'Warehouse Management System',
    'warehouse.description': 'Manage your warehouse locations and inventory',
    'warehouse.tabs.warehouses': '🏢 Warehouses',
    'warehouse.tabs.createTransfer': '📦 Create Transfer', 
    'warehouse.tabs.receiveOrders': '📥 Receive Orders',
    'warehouse.tabs.receiveFromSupplier': '🚚 Receive from Supplier',
    'warehouse.tabs.stockManagement': '📊 Stock Management',
    'warehouse.tabs.categories': '🏷️ Categories',
    'warehouse.tabs.managerAssignments': '👥 Manager Assignments',
    'warehouse.tabs.foodicsDashboard': '🏪 Foodics Dashboard'
  };

  const getTranslationSafe = (key: string) => {
    const translation = getTranslation(key, translations[key as keyof typeof translations] || key);
    
    // If translation still equals the key, use hardcoded fallback directly
    if (translation === key || translation.includes('warehouse.tabs') || translation.includes('warehouse.title') || translation.includes('warehouse.description')) {
      const fallback = translations[key as keyof typeof translations];
      return fallback || key;
    }
    
    return translation;
  };
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showOrdersDropdown && !(event.target as Element).closest('.relative')) {
        setShowOrdersDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showOrdersDropdown]);
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    type: 'info',
    message: ''
  });

  useEffect(() => {
    loadWarehouses();
  }, []);

  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification.show]);

  const loadWarehouses = async () => {
    try {
      const response = await fetch('http://100.29.4.72:8000/api/warehouse/warehouses');
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Warehouse API error:', errorText);
        throw new Error(`Failed to load warehouses: ${response.status}`);
      }
      
      const data = await response.json();
      setWarehouses(data);
      
      if (data.length === 0) {
        showNotification('info', t('notifications.noItemsFound'));
      } else {
        showNotification('success', `${t('notifications.loadingData')} ${data.length} warehouses successfully`);
      }
    } catch (error) {
      console.error('Error loading warehouses:', error);
      showNotification('error', error instanceof Error ? error.message : t('notifications.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({
      show: true,
      type,
      message
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-muted-foreground">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg shadow-lg ${
          notification.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : notification.type === 'error'
            ? 'bg-red-50 text-red-800 border border-red-200'
            : 'bg-blue-50 text-blue-800 border border-blue-200'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                {getTranslationSafe('warehouse.title')}
              </CardTitle>
              <CardDescription>
                {getTranslationSafe('warehouse.description')}
              </CardDescription>
            </div>
            <LanguageSwitcher />
          </div>
        </CardHeader>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="warehouse-settings">
            {getTranslationSafe('warehouse.tabs.warehouses')}
          </TabsTrigger>
          <TabsTrigger value="foodics-dashboard">
            {getTranslationSafe('warehouse.tabs.foodicsDashboard')}
          </TabsTrigger>
          
          {/* Orders Dropdown */}
          <div className="relative">
            <TabsTrigger 
              value="orders" 
              onClick={() => setShowOrdersDropdown(!showOrdersDropdown)}
              className="flex items-center gap-2"
            >
              {getTranslationSafe('warehouse.tabs.orders')}
              <ChevronDown className="h-4 w-4" />
            </TabsTrigger>
            {showOrdersDropdown && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                <button
                  onClick={() => {
                    setActiveTab('orders');
                    setActiveOrderTab('create-transfer');
                    setShowOrdersDropdown(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {getTranslationSafe('warehouse.tabs.createTransfer')}
                </button>
                <button
                  onClick={() => {
                    setActiveTab('orders');
                    setActiveOrderTab('receive-transfer');
                    setShowOrdersDropdown(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {getTranslationSafe('warehouse.tabs.receiveOrders')}
                </button>
                <button
                  onClick={() => {
                    setActiveTab('orders');
                    setActiveOrderTab('receive-from-supplier');
                    setShowOrdersDropdown(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {getTranslationSafe('warehouse.tabs.receiveFromSupplier')}
                </button>
              </div>
            )}
          </div>
          
          <TabsTrigger value="stock-management">
            {getTranslationSafe('warehouse.tabs.stockManagement')}
          </TabsTrigger>
          <TabsTrigger value="categories">
            {getTranslationSafe('warehouse.tabs.categories')}
          </TabsTrigger>
          <TabsTrigger value="manager-assignments">
            {getTranslationSafe('warehouse.tabs.managerAssignments')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="warehouse-settings" className="mt-6">
          <WarehouseSettings
            warehouses={warehouses}
            onWarehouseChange={loadWarehouses}
            onNotification={showNotification}
          />
        </TabsContent>

        <TabsContent value="foodics-dashboard" className="mt-6">
          <FoodicsDashboard
            warehouses={warehouses}
            onNotification={showNotification}
          />
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          {activeOrderTab === 'create-transfer' && (
            <CreateTransferOrder
              warehouses={warehouses}
              onNotification={showNotification}
            />
          )}
          {activeOrderTab === 'receive-transfer' && (
            <ReceiveTransferOrder
              warehouses={warehouses}
              onNotification={showNotification}
            />
          )}
          {activeOrderTab === 'receive-from-supplier' && (
            <ReceiveFromSupplier
              warehouses={warehouses}
              onNotification={showNotification}
            />
          )}
        </TabsContent>

        <TabsContent value="stock-management" className="mt-6">
          <StockManagement
            warehouses={warehouses}
            onNotification={showNotification}
          />
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <CategoryManagement
            onNotification={showNotification}
          />
        </TabsContent>

        <TabsContent value="manager-assignments" className="mt-6">
          <WarehouseManagerAssignment />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WarehouseManagement; 

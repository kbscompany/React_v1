import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Textarea } from '../ui/textarea';
import { AlertCircle, Package, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface Warehouse {
  id: number;
  name: string;
}

interface TransferOrderItem {
  ingredient_id: number;
  ingredient_name: string;
  unit: string;
  quantity: number;
}

interface PendingTransferOrder {
  id: number;
  source_warehouse_name: string;
  target_warehouse_name: string;
  created_at: string;
  source_warehouse_id: number;
  target_warehouse_id: number;
  items: TransferOrderItem[];
}

interface ReceiveItem {
  ingredient_id: number;
  accepted: number;
  returned: number;
  wasted: number;
}

interface ReceiveTransferOrderProps {
  warehouses: Warehouse[];
  onNotification: (type: 'success' | 'error' | 'info', message: string) => void;
}

const ReceiveTransferOrder: React.FC<ReceiveTransferOrderProps> = ({ warehouses, onNotification }) => {
  const { t } = useTranslation();
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [pendingOrders, setPendingOrders] = useState<PendingTransferOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<PendingTransferOrder | null>(null);
  const [receiveItems, setReceiveItems] = useState<{ [key: number]: ReceiveItem }>({});
  const [wasteReason, setWasteReason] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedWarehouse) {
      loadPendingOrders();
    }
  }, [selectedWarehouse]);

  const loadPendingOrders = async () => {
    if (!selectedWarehouse) return;
    
    setLoading(true);
    try {
      const response = await fetch(`http://100.29.4.72:8000/api/warehouse/transfer-orders/pending/${selectedWarehouse}`);
      if (!response.ok) throw new Error('Failed to load pending orders');
      const result = await response.json();
      
      // Handle both direct array and {success: true, data: [...]} response formats
      const ordersData = result.data || result;
      
      // Type guard to ensure we have valid transfer order data
      if (Array.isArray(ordersData)) {
        const validOrders: PendingTransferOrder[] = ordersData.filter((item: any) => 
          item && 
          typeof item === 'object' && 
          typeof item.id === 'number' &&
          Array.isArray(item.items)
        ).map((item: any) => ({
          id: item.id,
          source_warehouse_name: item.source_warehouse_name || 'Unknown',
          target_warehouse_name: item.target_warehouse_name || 'Unknown', 
          created_at: item.created_at || new Date().toISOString(),
          source_warehouse_id: item.source_warehouse_id || 0,
          target_warehouse_id: item.target_warehouse_id || 0,
          items: Array.isArray(item.items) ? item.items.filter((orderItem: any) =>
            orderItem &&
            typeof orderItem === 'object' &&
            typeof orderItem.ingredient_id === 'number'
          ).map((orderItem: any) => ({
            ingredient_id: orderItem.ingredient_id,
            ingredient_name: orderItem.ingredient_name || 'Unknown',
            unit: orderItem.unit || 'units',
            quantity: Number(orderItem.quantity) || 0
          })) : []
        }));
        
        setPendingOrders(validOrders);
      } else {
        setPendingOrders([]);
      }
      
      setSelectedOrder(null);
      setReceiveItems({});
    } catch (error) {
      console.error('Error loading pending orders:', error);
      onNotification('error', 'Failed to load pending transfer orders');
      setPendingOrders([]); // Ensure it's always an array
    } finally {
      setLoading(false);
    }
  };

  const selectOrder = (order: PendingTransferOrder) => {
    setSelectedOrder(order);
    
    // Initialize receive items with default values
    const initialReceiveItems: { [key: number]: ReceiveItem } = {};
    order.items.forEach(item => {
      initialReceiveItems[item.ingredient_id] = {
        ingredient_id: item.ingredient_id,
        accepted: item.quantity, // Default to accepting full quantity
        returned: 0,
        wasted: 0
      };
    });
    setReceiveItems(initialReceiveItems);
    setWasteReason('');
  };

  const updateReceiveItem = (ingredientId: number, field: 'accepted' | 'returned' | 'wasted', value: number) => {
    const item = selectedOrder?.items.find(i => i.ingredient_id === ingredientId);
    if (!item) return;

    const updatedItem = { ...receiveItems[ingredientId] };
    const oldValue = updatedItem[field];
    updatedItem[field] = Math.max(0, value);

    // Ensure total doesn't exceed sent quantity
    const total = updatedItem.accepted + updatedItem.returned + updatedItem.wasted;
    if (total > item.quantity) {
      // Reduce the field being updated to keep within bounds
      updatedItem[field] = Math.max(0, item.quantity - (total - updatedItem[field]));
    }

    // Auto-adjust accepted quantity when other fields change
    if (field !== 'accepted') {
      updatedItem.accepted = Math.max(0, item.quantity - updatedItem.returned - updatedItem.wasted);
    }

    setReceiveItems(prev => ({
      ...prev,
      [ingredientId]: updatedItem
    }));
  };

  const processTransferOrder = async () => {
    if (!selectedOrder) {
      onNotification('error', 'Please select a transfer order');
      return;
    }

    // Validate totals
    const hasWaste = Object.values(receiveItems).some(item => item.wasted > 0);
    if (hasWaste && !wasteReason.trim()) {
      onNotification('error', 'Please provide a reason for waste');
      return;
    }

    // Check if all items are processed
    const unprocessedItems = selectedOrder.items.filter(item => {
      const receiveItem = receiveItems[item.ingredient_id];
      if (!receiveItem) return true;
      const total = receiveItem.accepted + receiveItem.returned + receiveItem.wasted;
      return Math.abs(total - item.quantity) > 0.001; // Small tolerance for floating point
    });

    if (unprocessedItems.length > 0) {
      onNotification('error', `Please process all items. ${unprocessedItems.length} items have incorrect quantities.`);
      return;
    }

    setLoading(true);
    try {
              const response = await fetch('http://100.29.4.72:8000/api/warehouse/transfer-orders/receive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transfer_order_id: selectedOrder.id,
          items: Object.values(receiveItems),
          waste_reason: wasteReason.trim() || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to process transfer order');
      }

      const result = await response.json();
      onNotification('success', result.message);
      
      // Refresh pending orders and reset form
      await loadPendingOrders();
      
    } catch (error) {
      console.error('Error processing transfer order:', error);
      onNotification('error', error instanceof Error ? error.message : 'Failed to process transfer order');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (item: TransferOrderItem) => {
    const receiveItem = receiveItems[item.ingredient_id];
    if (!receiveItem) return 'text-gray-500';
    
    if (receiveItem.wasted > 0) return 'text-red-600';
    if (receiveItem.returned > 0) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusIcon = (item: TransferOrderItem) => {
    const receiveItem = receiveItems[item.ingredient_id];
    if (!receiveItem) return <AlertCircle className="h-4 w-4 text-gray-500" />;
    
    if (receiveItem.wasted > 0) return <XCircle className="h-4 w-4 text-red-600" />;
    if (receiveItem.returned > 0) return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    return <CheckCircle className="h-4 w-4 text-green-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Warehouse Selection */}
      <div className="space-y-2">
        <Label htmlFor="warehouse-select">{t('warehouse.receive.selectWarehouse')}</Label>
        <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t('warehouse.receive.selectWarehouse')} />
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

      {/* Pending Orders List */}
      {selectedWarehouse && (
        <>
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">{t('warehouse.receive.pendingOrders')}</h3>
              <Badge variant="outline">
                {pendingOrders.length} {t('warehouse.receive.ordersPending')}
              </Badge>
            </div>

            {pendingOrders.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-6">
                  <div className="text-center">
                    <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">{t('warehouse.receive.noPendingOrders')}</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {pendingOrders.map(order => (
                  <Card 
                    key={order.id} 
                    className={`cursor-pointer transition-colors ${
                      selectedOrder?.id === order.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => selectOrder(order)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Transfer Order #{order.id}</h4>
                          <p className="text-sm text-gray-600">
                            From {order.source_warehouse_name} • {order.items.length} items
                          </p>
                          <p className="text-xs text-gray-500">
                            Created: {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={selectedOrder?.id === order.id ? 'default' : 'secondary'}>
                          {selectedOrder?.id === order.id ? 'Selected' : 'Select'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Selected Order Processing */}
      {selectedOrder && (
        <>
          <Separator />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Process Transfer Order #{selectedOrder.id}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Order Info */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">From:</span> {selectedOrder.source_warehouse_name}
                  </div>
                  <div>
                    <span className="font-medium">To:</span> {selectedOrder.target_warehouse_name}
                  </div>
                  <div>
                    <span className="font-medium">Created:</span> {new Date(selectedOrder.created_at).toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Items:</span> {selectedOrder.items.length}
                  </div>
                </div>
              </div>

              {/* Items Processing */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Process Items</h4>
                {selectedOrder.items.map(item => {
                  const receiveItem = receiveItems[item.ingredient_id];
                  return (
                    <Card key={item.ingredient_id} className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(item)}
                            <div>
                              <h5 className="font-medium">{item.ingredient_name}</h5>
                              <p className="text-sm text-gray-600">
                                Sent: {item.quantity} {item.unit}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className="text-green-700">Accepted</Label>
                            <Input
                              type="number"
                              value={receiveItem?.accepted || 0}
                              onChange={(e) => updateReceiveItem(
                                item.ingredient_id, 
                                'accepted', 
                                parseFloat(e.target.value) || 0
                              )}
                              min="0"
                              max={item.quantity}
                              step="0.1"
                              className="border-green-200"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-yellow-700">Returned</Label>
                            <Input
                              type="number"
                              value={receiveItem?.returned || 0}
                              onChange={(e) => updateReceiveItem(
                                item.ingredient_id, 
                                'returned', 
                                parseFloat(e.target.value) || 0
                              )}
                              min="0"
                              max={item.quantity}
                              step="0.1"
                              className="border-yellow-200"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-red-700">Wasted</Label>
                            <Input
                              type="number"
                              value={receiveItem?.wasted || 0}
                              onChange={(e) => updateReceiveItem(
                                item.ingredient_id, 
                                'wasted', 
                                parseFloat(e.target.value) || 0
                              )}
                              min="0"
                              max={item.quantity}
                              step="0.1"
                              className="border-red-200"
                            />
                          </div>
                        </div>

                        {/* Total validation */}
                        {receiveItem && (
                          <div className="text-sm">
                            <span className="font-medium">Total: </span>
                            <span className={`${
                              Math.abs((receiveItem.accepted + receiveItem.returned + receiveItem.wasted) - item.quantity) < 0.001
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {(receiveItem.accepted + receiveItem.returned + receiveItem.wasted).toFixed(2)} / {item.quantity} {item.unit}
                            </span>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Waste Reason */}
              {Object.values(receiveItems).some(item => item.wasted > 0) && (
                <div className="space-y-2">
                  <Label htmlFor="waste-reason">Waste Reason *</Label>
                  <Textarea
                    id="waste-reason"
                    value={wasteReason}
                    onChange={(e) => setWasteReason(e.target.value)}
                    placeholder="Explain the reason for waste (required when there is waste)"
                    className="border-red-200"
                  />
                </div>
              )}

              {/* Process Button */}
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedOrder(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={processTransferOrder}
                  disabled={loading}
                  className="min-w-[120px]"
                >
                  {loading ? 'Processing...' : 'Process Order'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ReceiveTransferOrder; 

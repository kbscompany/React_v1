import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Package, Truck, AlertCircle, CheckCircle, XCircle, Edit, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '../ui/use-toast';

interface Warehouse {
  id: number;
  name: string;
  location?: string;
}

interface Supplier {
  id: number;
  name: string;
  contact_person?: string;
  phone?: string;
}

interface PurchaseOrderItem {
  id: number;
  item_id: number;
  item: {
    id: number;
    name: string;
    unit: string;
  };
  quantity_ordered: number;
  quantity_received?: number;
  unit_price: number;
  total_price: number;
  status?: 'pending' | 'received' | 'partial' | 'returned';
}

interface PurchaseOrder {
  id: number;
  supplier_id: number;
  supplier: Supplier;
  warehouse_id: number;
  warehouse?: Warehouse;
  order_date: string;
  expected_date?: string;
  status: string;
  total_amount: number;
  items: PurchaseOrderItem[];
  received_date?: string;
  received_by?: string;
}

interface ReceiveFromSupplierProps {
  warehouses: Warehouse[];
  onNotification: (type: 'success' | 'error' | 'info', message: string) => void;
}

const ReceiveFromSupplier: React.FC<ReceiveFromSupplierProps> = ({ warehouses, onNotification }) => {
  const { t } = useTranslation();
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | null>(null);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [editingItems, setEditingItems] = useState<{ [key: number]: number }>({});
  const [showReceiveDialog, setShowReceiveDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    if (selectedWarehouse) {
      loadPurchaseOrders();
    }
  }, [selectedWarehouse, activeTab]);

  const loadPurchaseOrders = async () => {
    if (!selectedWarehouse) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const statusFilter = activeTab === 'pending' ? 'Pending' : 'Received';
      
      const response = await fetch(
        `/api/purchase-orders/?warehouse_id=${selectedWarehouse}&status=${statusFilter}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setPurchaseOrders(data);
    } catch (error) {
      console.error('Error loading purchase orders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch purchase orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReceiveOrder = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    // Initialize editing items with ordered quantities
    const initialQuantities: { [key: number]: number } = {};
    order.items.forEach(item => {
      initialQuantities[item.id] = item.quantity_ordered;
    });
    setEditingItems(initialQuantities);
    setShowReceiveDialog(true);
  };

  const handleQuantityChange = (itemId: number, newQuantity: number) => {
    setEditingItems(prev => ({
      ...prev,
      [itemId]: Math.max(0, newQuantity)
    }));
  };

  const calculateNewTotal = () => {
    if (!selectedOrder) return 0;
    
    return selectedOrder.items.reduce((total, item) => {
      const receivedQty = editingItems[item.id] || 0;
      return total + (receivedQty * Number(item.unit_price || 0));
    }, 0);
  };

  const handleConfirmReceive = async () => {
    if (!selectedOrder) return;

    try {
      const token = localStorage.getItem('token');
      
      // Prepare the receive data with updated quantities
      const receiveData = {
        items: selectedOrder.items.map(item => ({
          id: item.id,
          quantity_received: editingItems[item.id] || 0,
          status: editingItems[item.id] === 0 ? 'returned' : 
                  editingItems[item.id] < item.quantity_ordered ? 'partial' : 'received'
        }))
      };

      const response = await fetch(
        `/api/purchase-orders/${selectedOrder.id}/receive-with-details`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(receiveData)
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast({
        title: "Success",
        description: "Purchase order received successfully",
      });
      setShowReceiveDialog(false);
      setSelectedOrder(null);
      setEditingItems({});
      loadPurchaseOrders();
    } catch (error) {
      console.error('Error receiving order:', error);
      toast({
        title: "Error",
        description: "Failed to receive purchase order",
        variant: "destructive",
      });
    }
  };

  const handleReturnOrder = async (orderId: number) => {
    if (!confirm(t('confirmations.returnOrder'))) return;

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        `/api/purchase-orders/${orderId}/return`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast({
        title: "Success",
        description: "Purchase order returned successfully",
      });
      loadPurchaseOrders();
    } catch (error) {
      console.error('Error returning order:', error);
      toast({
        title: "Error",
        description: "Failed to return purchase order",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Pending': { variant: 'secondary' as const, icon: AlertCircle },
      'Received': { variant: 'default' as const, icon: CheckCircle },
      'Cancelled': { variant: 'destructive' as const, icon: XCircle },
      'draft': { variant: 'outline' as const, icon: Edit }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['draft'];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant}>
        <span className="flex items-center gap-1">
          <Icon className="w-3 h-3" />
          {status}
        </span>
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Warehouse Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            {t('warehouse.receiveFromSupplier.title', 'Receive from Supplier')}
          </CardTitle>
          <CardDescription>
            {t('warehouse.receiveFromSupplier.description', 'Receive purchase orders and update stock')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>{t('warehouse.selectWarehouse', 'Select Warehouse')}</Label>
              <Select
                value={selectedWarehouse?.toString() || ''}
                onValueChange={(value) => setSelectedWarehouse(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('warehouse.selectWarehousePlaceholder', 'Choose a warehouse')} />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                      {warehouse.name} {warehouse.location && `- ${warehouse.location}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Orders Tabs */}
      {selectedWarehouse && (
        <Card>
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pending">
                  {t('warehouse.pendingOrders', 'Pending Orders')}
                </TabsTrigger>
                <TabsTrigger value="received">
                  {t('warehouse.receivedOrders', 'Received Orders')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="mt-6">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t('common.loading')}
                  </div>
                ) : purchaseOrders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t('warehouse.noPendingOrders', 'No pending orders')}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {purchaseOrders.map((order) => (
                      <Card key={order.id}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">
                                {t('warehouse.orderNumber', 'Order #')}{order.id}
                              </CardTitle>
                              <CardDescription>
                                {order.supplier.name} • {format(new Date(order.order_date), 'PPP')}
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(order.status)}
                              <Badge variant="outline">
                                {order.items.length} {t('common.items', 'items')}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>{t('common.item', 'Item')}</TableHead>
                                  <TableHead>{t('common.quantity', 'Quantity')}</TableHead>
                                  <TableHead>{t('common.unitPrice', 'Unit Price')}</TableHead>
                                  <TableHead>{t('common.total', 'Total')}</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {order.items.map((item) => (
                                  <TableRow key={item.id}>
                                    <TableCell>{item.item.name}</TableCell>
                                    <TableCell>
                                      {item.quantity_ordered} {item.item.unit}
                                    </TableCell>
                                    <TableCell>${Number(item.unit_price || 0).toFixed(2)}</TableCell>
                                    <TableCell>${Number(item.total_price || 0).toFixed(2)}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>

                            <div className="flex justify-between items-center pt-4 border-t">
                              <div className="text-lg font-semibold">
                                {t('common.totalAmount', 'Total Amount')}: ${Number(order.total_amount || 0).toFixed(2)}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => handleReturnOrder(order.id)}
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  {t('warehouse.returnOrder', 'Return Order')}
                                </Button>
                                <Button
                                  onClick={() => handleReceiveOrder(order)}
                                >
                                  <Package className="w-4 h-4 mr-2" />
                                  {t('warehouse.receiveOrder', 'Receive Order')}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="received" className="mt-6">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t('common.loading')}
                  </div>
                ) : purchaseOrders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t('warehouse.noReceivedOrders', 'No received orders')}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {purchaseOrders.map((order) => (
                      <Card key={order.id}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">
                                {t('warehouse.orderNumber', 'Order #')}{order.id}
                              </CardTitle>
                              <CardDescription>
                                {order.supplier.name} • {format(new Date(order.order_date), 'PPP')}
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(order.status)}
                              <Badge variant="outline">
                                {order.items.length} {t('common.items', 'items')}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>{t('common.item', 'Item')}</TableHead>
                                <TableHead>{t('common.ordered', 'Ordered')}</TableHead>
                                <TableHead>{t('common.received', 'Received')}</TableHead>
                                <TableHead>{t('common.status', 'Status')}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {order.items.map((item) => (
                                <TableRow key={item.id}>
                                  <TableCell>{item.item.name}</TableCell>
                                  <TableCell>
                                    {item.quantity_ordered} {item.item.unit}
                                  </TableCell>
                                  <TableCell>
                                    {item.quantity_received || item.quantity_ordered} {item.item.unit}
                                  </TableCell>
                                  <TableCell>
                                    {item.status === 'partial' && (
                                      <Badge variant="outline">Partial</Badge>
                                    )}
                                    {item.status === 'received' && (
                                      <Badge variant="outline">Complete</Badge>
                                    )}
                                    {item.status === 'returned' && (
                                      <Badge variant="outline">Returned</Badge>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Receive Order Dialog */}
      <Dialog open={showReceiveDialog} onOpenChange={setShowReceiveDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {t('warehouse.receiveOrder', 'Receive Order')} #{selectedOrder?.id}
            </DialogTitle>
            <DialogDescription>
              {t('warehouse.adjustQuantities', 'Adjust quantities received or return items')}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">{t('common.supplier', 'Supplier')}:</span> {selectedOrder.supplier.name}
                </div>
                <div>
                  <span className="font-medium">{t('common.orderDate', 'Order Date')}:</span> {format(new Date(selectedOrder.order_date), 'PPP')}
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('common.item', 'Item')}</TableHead>
                    <TableHead>{t('common.ordered', 'Ordered')}</TableHead>
                    <TableHead>{t('common.receiving', 'Receiving')}</TableHead>
                    <TableHead>{t('common.unitPrice', 'Unit Price')}</TableHead>
                    <TableHead>{t('common.newTotal', 'New Total')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedOrder.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.item.name}</TableCell>
                      <TableCell>
                        {item.quantity_ordered} {item.item.unit}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={editingItems[item.id] || 0}
                          onChange={(e) => handleQuantityChange(item.id, parseFloat(e.target.value) || 0)}
                          className="w-24"
                          min="0"
                          step="0.01"
                        />
                      </TableCell>
                      <TableCell>${Number(item.unit_price || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        ${((editingItems[item.id] || 0) * Number(item.unit_price || 0)).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex justify-between items-center pt-4 border-t">
                <div>
                  <div className="text-sm text-muted-foreground">
                    {t('common.originalTotal', 'Original Total')}: ${Number(selectedOrder.total_amount || 0).toFixed(2)}
                  </div>
                  <div className="text-lg font-semibold">
                    {t('common.newTotal', 'New Total')}: ${calculateNewTotal().toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReceiveDialog(false)}>
              <X className="w-4 h-4 mr-2" />
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button onClick={handleConfirmReceive}>
              <CheckCircle className="w-4 h-4 mr-2" />
              {t('warehouse.confirmReceive', 'Confirm Receive')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReceiveFromSupplier; 
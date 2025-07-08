import React, { useState, useEffect } from 'react';
import { X, Search, Plus, Trash2, Package, Calculator, AlertCircle, CheckCircle } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { getAuthToken, getAuthHeaders } from '../utils/auth';
import 'react-toastify/dist/ReactToastify.css';

interface Supplier {
  id: number;
  name: string;
  contact_phone?: string;
  contact_email?: string;
  default_currency: string;
  payment_terms?: string;
  total_orders?: number;
  total_amount?: number;
}

interface SupplierItem {
  id: number;
  supplier_id: number;
  name: string;
  unit: string;
  price_per_unit: number;
  currency: string;
  is_active: boolean;
}

interface SupplierPackage {
  id: number;
  supplier_id: number;
  supplier_item_id: number;
  package_name: string;
  quantity_per_package: number;
  price_per_package: number;
  currency: string;
  price_per_unit: number;
  is_active: boolean;
  supplier_item?: SupplierItem;
}

interface PurchaseOrderItem {
  id?: number;
  supplier_item_id: number;
  supplier_package_id?: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
  supplier_item?: SupplierItem;
  supplier_package?: SupplierPackage;
}

interface CreatePurchaseOrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreatePurchaseOrderForm: React.FC<CreatePurchaseOrderFormProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierPackages, setSupplierPackages] = useState<SupplierPackage[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [items, setItems] = useState<PurchaseOrderItem[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [templateLoading, setTemplateLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    supplier_id: 0,
    warehouse_id: null,
    expected_date: '',  // Fixed: matches database schema
    priority: 'medium' as 'low' | 'medium' | 'high',
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchSuppliers();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedSupplier) {
      fetchSupplierPackages();
    }
  }, [selectedSupplier]);

  // Fetch warehouses on mount
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const res = await fetch('http://100.29.4.72:8000/api/warehouse/warehouses', {
          headers: getAuthHeaders()
        });
        if (res.ok) {
          const data = await res.json();
          setWarehouses(data);
        } else {
          console.error('Failed to fetch warehouses:', res.status);
        }
      } catch (err) {
        console.error('Error fetching warehouses', err);
      }
    };
    fetchWarehouses();
  }, []);

  // Search for items when search term changes
  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchItems();
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/purchase-orders/suppliers', {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setSuppliers(data);
      } else {
        console.error('Failed to fetch suppliers:', response.status);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const searchItems = async () => {
    if (!searchTerm || searchTerm.length < 2) return;
    
    setSearchLoading(true);
    try {
      const response = await fetch(`/api/purchase-orders/items/search?q=${encodeURIComponent(searchTerm)}`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      }
    } catch (error) {
      console.error('Error searching items:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const fetchSupplierPackages = async () => {
    if (!selectedSupplier) return;
    try {
      const response = await fetch(`/api/purchase-orders/suppliers/${selectedSupplier.id}/packages`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setSupplierPackages(data);
      }
    } catch (error) {
      console.error('Error fetching supplier packages:', error);
    }
  };

  // Use search results directly
  const filteredItems = searchResults;

  const addItem = (searchItem: any, package_?: SupplierPackage) => {
    const unitPrice = package_?.price_per_unit || searchItem.price_per_unit || 0;
    const quantity = package_?.quantity_per_package || 1;
    
    const newItem: PurchaseOrderItem = {
      supplier_item_id: searchItem.id,
      supplier_package_id: package_?.id,
      quantity: quantity,
      unit_price: unitPrice,
      total_price: unitPrice * quantity,
      supplier_item: {
        id: searchItem.id,
        supplier_id: selectedSupplier?.id || 0,
        name: searchItem.name,
        unit: searchItem.unit,
        price_per_unit: searchItem.price_per_unit || 0,
        currency: selectedSupplier?.default_currency || 'USD',
        is_active: true
      },
      supplier_package: package_
    };

    setItems(prev => [...prev, newItem]);
    setSearchTerm('');
    setSearchResults([]);
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    setItems(prev => prev.map((item, i) => {
      if (i === index) {
        const total_price = item.unit_price * quantity;
        return { ...item, quantity, total_price };
      }
      return item;
    }));
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const getTotalAmount = () => {
    return items.reduce((sum, item) => sum + item.total_price, 0);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedSupplier) {
      newErrors.supplier = t('purchaseOrders.create.validation.selectSupplier');
    }

    if (items.length === 0) {
      newErrors.items = t('purchaseOrders.create.validation.addItems');
    }

    if (!formData.expected_date) {
      newErrors.expected_date = t('purchaseOrders.create.validation.expectedDate');
    }

    if (!selectedWarehouse) {
      newErrors.warehouse_id = t('purchaseOrders.create.validation.warehouse');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const orderData = {
        supplier_id: selectedSupplier!.id,
        warehouse_id: selectedWarehouse,
        order_date: new Date().toISOString().split('T')[0],  // Current date
        expected_date: formData.expected_date,
        status: "Pending",  // Default status for new orders
        items: items.map(item => ({
          item_id: item.supplier_item_id,  // Fixed: API expects item_id
          quantity_ordered: item.quantity,  // Fixed: API expects quantity_ordered
          unit_price: item.unit_price
        }))
      };

      const response = await fetch('/api/purchase-orders/', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        toast.success(t('purchaseOrders.create.messages.created'));
        onSuccess();
        handleClose();
      } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.detail || t('purchaseOrders.create.messages.failed') });
      }
    } catch (error) {
      setErrors({ submit: t('purchaseOrders.create.messages.networkError') });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setSelectedSupplier(null);
    setSelectedWarehouse(null);
    setSupplierPackages([]);
    setSearchTerm('');
    setSearchResults([]);
    setItems([]);
    setFormData({
      supplier_id: 0,
      warehouse_id: null,
      expected_date: '',  // Fixed: matches database schema
      priority: 'medium',
      notes: ''
    });
    setErrors({});
    onClose();
  };

  const getPackagesForItem = (itemId: number) => {
    return supplierPackages.filter(pkg => pkg.supplier_item_id === itemId);
  };

  const handleLoadTemplate = async () => {
    if (!selectedSupplier) return;
    setTemplateLoading(true);
    try {
      // 1. get template
      const tplRes = await fetch(`/api/purchase-orders/suppliers/${selectedSupplier.id}/po-template`, {
        headers: getAuthHeaders()
      });
      if (!tplRes.ok) {
        toast.error(t('purchaseOrders.create.step2.templates.failed'));
        return;
      }
      const tplData = await tplRes.json();
      if (!tplData.items || tplData.items.length === 0) {
        toast.info(t('purchaseOrders.create.step2.templates.noTemplate'));
        return;
      }
      // 2. fetch item details
      const ids = tplData.items.map((i: any) => i.item_id).join(',');
      const itemsRes = await fetch(`/api/purchase-orders/items/by-ids?ids=${ids}`, {
        headers: getAuthHeaders()
      });
      if (!itemsRes.ok) {
        toast.error(t('purchaseOrders.create.step2.templates.failed'));
        return;
      }
      const itemDetails = await itemsRes.json();
      // 3. build PO items
      const newPoItems: PurchaseOrderItem[] = tplData.items.map((tplItem: any) => {
        const detail = itemDetails.find((d: any) => d.id === tplItem.item_id);
        const qty = tplItem.default_quantity || 1;
        const unitPrice = detail?.price_per_unit || 0;
        return {
          supplier_item_id: tplItem.item_id,
          quantity: qty,
          unit_price: unitPrice,
          total_price: qty * unitPrice,
          supplier_item: {
            id: detail.id,
            supplier_id: selectedSupplier?.id || 0,
            name: detail.name,
            unit: detail.unit,
            price_per_unit: unitPrice,
            currency: selectedSupplier?.default_currency || 'USD',
            is_active: true
          }
        } as PurchaseOrderItem;
      });
      setItems(newPoItems);
      toast.success(t('purchaseOrders.create.step2.templates.loaded'));
    } catch (err) {
      toast.error(t('purchaseOrders.create.step2.templates.failed'));
    } finally {
      setTemplateLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!selectedSupplier || items.length === 0) {
      toast.info(t('purchaseOrders.create.step2.templates.addItemsFirst'));
      return;
    }
    setTemplateLoading(true);
    try {
      const payload = {
        items: items.map(i => ({ item_id: i.supplier_item_id, default_quantity: i.quantity }))
      };
      const res = await fetch(`/api/purchase-orders/suppliers/${selectedSupplier.id}/po-template`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        toast.success(t('purchaseOrders.create.step2.templates.saved'));
      } else {
        toast.error(t('purchaseOrders.create.step2.templates.failed'));
      }
    } catch (err) {
      toast.error(t('purchaseOrders.create.step2.templates.failed'));
    } finally {
      setTemplateLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{t('purchaseOrders.create.title')}</h2>
            <div className="flex items-center mt-2 space-x-4">
              <div className={`flex items-center space-x-2 ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>1</div>
                <span className="text-sm">{t('purchaseOrders.create.steps.supplier')}</span>
              </div>
              <div className={`flex items-center space-x-2 ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>2</div>
                <span className="text-sm">{t('purchaseOrders.create.steps.items')}</span>
              </div>
              <div className={`flex items-center space-x-2 ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>3</div>
                <span className="text-sm">{t('purchaseOrders.create.steps.review')}</span>
              </div>
            </div>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Step 1: Supplier Selection */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('purchaseOrders.create.step1.selectSupplier')}
                </label>
                {errors.supplier && (
                  <p className="text-red-600 text-sm mb-2">{errors.supplier}</p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {suppliers.map(supplier => (
                    <div
                      key={supplier.id}
                      onClick={() => setSelectedSupplier(supplier)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedSupplier?.id === supplier.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">{supplier.name}</h3>
                        {selectedSupplier?.id === supplier.id && (
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        {supplier.contact_phone && (
                          <p>📞 {supplier.contact_phone}</p>
                        )}
                        {supplier.contact_email && (
                          <p>📧 {supplier.contact_email}</p>
                        )}
                        <p>💰 {supplier.default_currency}</p>
                        <p>📦 {supplier.total_orders || 0} orders</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('purchaseOrders.create.step1.expectedDate')}
                  </label>
                  <input
                    type="date"
                    value={formData.expected_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, expected_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {errors.expected_date && (
                    <p className="text-red-600 text-sm mt-1">{errors.expected_date}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('purchaseOrders.create.step1.priority')}
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">{t('purchaseOrders.priority.low')}</option>
                    <option value="medium">{t('purchaseOrders.priority.medium')}</option>
                    <option value="high">{t('purchaseOrders.priority.high')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('purchaseOrders.create.step1.warehouse')}
                </label>
                <select
                  value={selectedWarehouse || ''}
                  onChange={(e) => setSelectedWarehouse(Number(e.target.value) || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t('purchaseOrders.create.step1.selectWarehouse')}</option>
                  {warehouses.map(warehouse => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name} - {warehouse.location}
                    </option>
                  ))}
                </select>
                {errors.warehouse_id && (
                  <p className="text-red-600 text-sm mt-1">{errors.warehouse_id}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('purchaseOrders.create.step1.notes')}
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setCurrentStep(2)}
                  disabled={!selectedSupplier}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {t('purchaseOrders.create.buttons.next')}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Items Selection */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Template Actions */}
              <div className="flex gap-4 mb-4">
                <button
                  onClick={handleLoadTemplate}
                  disabled={templateLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Package className="w-4 h-4" />
                  <span>{templateLoading ? t('purchaseOrders.create.step2.templates.loading') : t('purchaseOrders.create.step2.templates.load')}</span>
                </button>
                <button
                  onClick={handleSaveTemplate}
                  disabled={templateLoading || items.length === 0}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Package className="w-4 h-4" />
                  <span>{templateLoading ? t('purchaseOrders.create.step2.templates.loading') : t('purchaseOrders.create.step2.templates.save')}</span>
                </button>
              </div>

              {/* Search Items */}
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('purchaseOrders.create.step2.searchItems')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {searchLoading && (
                  <div className="absolute right-3 top-3">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>

              {/* Search Results */}
              {filteredItems.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                  {filteredItems.map((item: any) => {
                    const packages = getPackagesForItem(item.id);
                    return (
                      <div key={item.id} className="p-4 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{item.name}</h4>
                            <p className="text-sm text-gray-600">{item.unit} • ${item.price_per_unit || 0}</p>
                          </div>
                          <button
                            onClick={() => addItem(item)}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                          >
                            {t('purchaseOrders.create.step2.addItem')}
                          </button>
                        </div>
                        
                        {/* Package Options */}
                        {packages.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <p className="text-sm font-medium text-gray-700">{t('purchaseOrders.create.step2.package')} {t('common.options')}:</p>
                            {packages.map(pkg => (
                              <div key={pkg.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                <div className="text-sm">
                                  <span className="font-medium">{pkg.package_name}</span>
                                  <span className="text-gray-600 ml-2">
                                    {pkg.quantity_per_package} {item.unit} • ${pkg.price_per_package}
                                  </span>
                                </div>
                                <button
                                  onClick={() => addItem(item, pkg)}
                                  className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                >
                                  {t('purchaseOrders.create.step2.addItem')}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Selected Items */}
              {items.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <h3 className="font-medium text-gray-900">{t('purchaseOrders.create.step3.itemsList')} ({items.length})</h3>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {items.map((item, index) => (
                      <div key={index} className="p-4 flex items-center space-x-4">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.supplier_item?.name}</h4>
                          {item.supplier_package && (
                            <p className="text-sm text-green-600">{item.supplier_package.package_name}</p>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <label className="text-sm text-gray-600">{t('purchaseOrders.create.step2.quantity')}:</label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItemQuantity(index, Number(e.target.value))}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            min="0.1"
                            step="0.1"
                          />
                          <span className="text-sm text-gray-600">{item.supplier_item?.unit}</span>
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          <span>{t('purchaseOrders.create.step2.unitPrice')}: ${item.unit_price}</span>
                        </div>
                        
                        <div className="text-sm font-medium text-gray-900">
                          <span>{t('purchaseOrders.create.step2.total')}: ${item.total_price.toFixed(2)}</span>
                        </div>
                        
                        <button
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-800"
                          title={t('purchaseOrders.create.step2.removeItem')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {errors.items && (
                <p className="text-red-600 text-sm">{errors.items}</p>
              )}

              <div className="flex justify-between">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {t('purchaseOrders.create.buttons.previous')}
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  disabled={items.length === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {t('purchaseOrders.create.buttons.next')}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Supplier Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">{t('purchaseOrders.details.supplierInfo')}</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">{t('purchaseOrders.details.supplierName')}</span> {selectedSupplier?.name}</p>
                    <p><span className="font-medium">{t('purchaseOrders.details.currency')}</span> {selectedSupplier?.default_currency}</p>
                    <p><span className="font-medium">{t('purchaseOrders.create.step1.expectedDate')}</span> {formData.expected_date}</p>
                    <p><span className="font-medium">{t('purchaseOrders.create.step1.priority')}</span> {t(`purchaseOrders.priority.${formData.priority}`)}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">{t('purchaseOrders.create.step3.orderSummary')}</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>{t('purchaseOrders.create.step3.totalItems')}</span>
                      <span className="font-medium">{items.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('purchaseOrders.create.step3.totalQuantity')}</span>
                      <span className="font-medium">
                        {items.reduce((sum, item) => sum + item.quantity, 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between text-lg font-bold">
                        <span>{t('purchaseOrders.create.step3.totalAmount')}</span>
                        <span>{getTotalAmount().toFixed(2)} {selectedSupplier?.default_currency}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <h3 className="font-medium text-gray-900">{t('purchaseOrders.create.step3.itemsList')}</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">{t('purchaseOrders.details.item')}</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">{t('purchaseOrders.details.quantity')}</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">{t('purchaseOrders.details.unitPrice')}</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">{t('purchaseOrders.details.total')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3">
                            <div>
                              <div className="font-medium text-gray-900">{item.supplier_item?.name}</div>
                              {item.supplier_package && (
                                <div className="text-sm text-green-600">{item.supplier_package.package_name}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {item.quantity} {item.supplier_item?.unit}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            ${item.unit_price}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            ${item.total_price.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {errors.submit && (
                <p className="text-red-600 text-sm">{errors.submit}</p>
              )}

              <div className="flex justify-between">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {t('purchaseOrders.create.buttons.previous')}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{t('purchaseOrders.create.buttons.submitting')}</span>
                    </>
                  ) : (
                    <span>{t('purchaseOrders.create.buttons.submit')}</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default CreatePurchaseOrderForm; 
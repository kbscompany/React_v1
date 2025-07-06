import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Eye, Edit, Trash2, FileText, CreditCard, Package, Calendar, DollarSign, User, AlertCircle, CheckCircle, Printer } from 'lucide-react';
import CreatePurchaseOrderForm from './CreatePurchaseOrderForm';
import { useTranslation } from 'react-i18next';
import { getAuthToken, getAuthHeaders } from '../utils/auth';

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

interface PurchaseOrder {
  id: number;
  supplier_id: number;
  supplier_name: string;
  total_amount: number;
  status: string;
  created_at: string;
  expected_date?: string;  // Fixed: matches database schema
  priority: string;
  notes?: string;
  item_count: number;
  supplier?: Supplier;
}

interface PurchaseOrderItem {
  id: number;
  supplier_item_id: number;
  supplier_package_id?: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
  supplier_item_name: string;
  supplier_package_name?: string;
  unit: string;
}

interface BankAccount {
  id: number;
  bank_name: string;
  account_number: string;
  account_holder: string;
  iban?: string;
  swift_code?: string;
  is_active: boolean;
}

const PurchaseOrderManagement: React.FC = () => {
  const { t } = useTranslation();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showChequeModal, setShowChequeModal] = useState(false);
  const [poItems, setPoItems] = useState<PurchaseOrderItem[]>([]);
  const [selectedBankAccount, setSelectedBankAccount] = useState<number>(0);
  const [selectedSafe, setSelectedSafe] = useState<number>(0);
  const [chequeGenerating, setChequeGenerating] = useState(false);
  const [safes, setSafes] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchPurchaseOrders(),
        fetchSuppliers(),
        fetchBankAccounts(),
        fetchSafes()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchaseOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (supplierFilter) params.append('supplier_id', supplierFilter);
      
      const response = await fetch(`http://localhost:8000/api/purchase-orders/?${params.toString()}`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setPurchaseOrders(data);
      }
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/purchase-orders/suppliers', {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setSuppliers(data);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchBankAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/bank-accounts-simple', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        // Ensure data is an array before filtering
        const accounts = Array.isArray(data) ? data : [];
        setBankAccounts(accounts.filter((account: BankAccount) => account.is_active));
      } else {
        console.error('Failed to fetch bank accounts:', response.status);
        setBankAccounts([]);
      }
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      setBankAccounts([]);
    }
  };

  const fetchSafes = async () => {
    try {
      const response = await fetch('http://localhost:8000/safes-simple', {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setSafes(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch safes:', response.status);
        setSafes([]);
      }
    } catch (error) {
      console.error('Error fetching safes:', error);
      setSafes([]);
    }
  };

  const fetchPODetails = async (poId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/purchase-orders/${poId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedPO(data);
        setPoItems(data.items || []);
        setShowDetailsModal(true);
      }
    } catch (error) {
      console.error('Error fetching PO details:', error);
    }
  };

  const updatePOStatus = async (poId: number, status: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/purchase-orders/${poId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        fetchPurchaseOrders();
        if (selectedPO?.id === poId) {
          setSelectedPO(prev => prev ? { ...prev, status } : null);
        }
      }
    } catch (error) {
      console.error('Error updating PO status:', error);
    }
  };

  const generateCheque = async () => {
    if (!selectedPO || !selectedBankAccount || !selectedSafe) return;

    setChequeGenerating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/purchase-orders/${selectedPO.id}/generate-cheque`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bank_account_id: selectedBankAccount,
          safe_id: selectedSafe,
          description: `Payment for Purchase Order #${selectedPO.id} - ${selectedPO.supplier_name}`,
          cheque_number: null  // Let backend generate it
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Auto-print the cheque
        if (data.cheque_id) {
          const token = localStorage.getItem('token');
          window.open(`/api/purchase-orders/${selectedPO.id}/cheque/${data.cheque_id}/arabic-pdf?token=${token}`, '_blank');
        }
        setShowChequeModal(false);
        setSelectedBankAccount(0);
        setSelectedSafe(0);
        // Refresh purchase orders to update status
        fetchPurchaseOrders();
      } else {
        const errorData = await response.json();
        alert(`Error generating cheque: ${errorData.detail}`);
      }
    } catch (error) {
      console.error('Error generating cheque:', error);
      alert('Network error occurred while generating cheque');
    } finally {
      setChequeGenerating(false);
    }
  };

  const receivePurchaseOrder = async (poId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/purchase-orders/${poId}/receive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (response.ok) {
        fetchPurchaseOrders();
        if (selectedPO?.id === poId) {
          setSelectedPO(prev => prev ? { ...prev, status: 'Received' } : null);
        }
      }
    } catch (error) {
      console.error('Error receiving purchase order:', error);
    }
  };

  const filteredPOs = purchaseOrders.filter(po => {
    const matchesSearch = po.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         po.id.toString().includes(searchTerm);
    return matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'received': return 'bg-green-100 text-green-800 border-green-300';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-gray-600">{t('purchaseOrders.loading')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('purchaseOrders.title')}</h1>
          <p className="text-gray-600 mt-1">{t('purchaseOrders.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>{t('purchaseOrders.createOrder')}</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('purchaseOrders.stats.totalOrders')}</p>
              <p className="text-2xl font-bold text-gray-900">{purchaseOrders.length}</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('purchaseOrders.stats.received')}</p>
              <p className="text-2xl font-bold text-gray-900">
                {purchaseOrders.filter(po => po.status === 'Received' || po.status === 'received').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('purchaseOrders.stats.pending')}</p>
              <p className="text-2xl font-bold text-gray-900">
                {purchaseOrders.filter(po => po.status === 'Pending' || po.status === 'draft').length}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('purchaseOrders.stats.totalValue')}</p>
              <p className="text-2xl font-bold text-gray-900">
                ${(purchaseOrders.reduce((sum, po) => sum + (Number(po.total_amount) || 0), 0)).toFixed(0)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('purchaseOrders.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t('purchaseOrders.filters.allStatus')}</option>
            <option value="Pending">{t('purchaseOrders.status.pending')}</option>
            <option value="Received">{t('purchaseOrders.status.received')}</option>
            <option value="Cancelled">{t('purchaseOrders.status.cancelled')}</option>
          </select>
          
          <select
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t('purchaseOrders.filters.allSuppliers')}</option>
            {suppliers.map(supplier => (
              <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
            ))}
          </select>
          
          <button
            onClick={fetchPurchaseOrders}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>{t('purchaseOrders.filters.applyFilters')}</span>
          </button>
        </div>
      </div>

      {/* Purchase Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('purchaseOrders.table.poDetails')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('purchaseOrders.table.supplier')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('purchaseOrders.table.amount')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('purchaseOrders.table.status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('purchaseOrders.table.priority')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('purchaseOrders.table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPOs.map((po) => (
                <tr key={po.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{t('purchaseOrders.table.poNumber')} #{po.id}</div>
                      <div className="text-sm text-gray-500">
                        {po.item_count} {t('common.items', { count: po.item_count })}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(po.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-gray-400 mr-2" />
                      <div className="text-sm font-medium text-gray-900">{po.supplier_name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ${(Number(po.total_amount) || 0).toFixed(2)} {po.supplier?.default_currency || 'USD'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(po.status)}`}>
                      {t(`purchaseOrders.status.${po.status.toLowerCase()}`, po.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${getPriorityColor(po.priority)}`}>
                      {t(`purchaseOrders.priority.${po.priority.toLowerCase()}`, po.priority)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => fetchPODetails(po.id)}
                      className="text-blue-600 hover:text-blue-900"
                      title={t('purchaseOrders.actions.viewDetails')}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => {
                        const token = localStorage.getItem('token');
                        window.open(`/api/purchase-orders/${po.id}/html?language=ar&token=${token}`, '_blank');
                      }}
                      className="text-gray-600 hover:text-gray-900"
                      title={t('purchaseOrders.actions.printOrder')}
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    
                    {po.status === 'Pending' && (
                      <button
                        onClick={() => receivePurchaseOrder(po.id)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title={t('purchaseOrders.actions.markReceived')}
                      >
                        <Package className="w-4 h-4" />
                      </button>
                    )}
                    
                    {(po.status === 'Pending' || po.status === 'Received') && (
                      <button
                        onClick={() => {
                          setSelectedPO(po);
                          setShowChequeModal(true);
                        }}
                        className="text-purple-600 hover:text-purple-900"
                        title={t('purchaseOrders.actions.generateCheque')}
                      >
                        <CreditCard className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredPOs.length === 0 && (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">{t('purchaseOrders.noOrders')}</h3>
              <p className="mt-1 text-sm text-gray-500">
                {t('purchaseOrders.noOrdersDescription')}
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t('purchaseOrders.newOrder')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Purchase Order Form */}
      <CreatePurchaseOrderForm
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSuccess={() => {
          fetchPurchaseOrders();
          setShowCreateForm(false);
        }}
      />

      {/* PO Details Modal */}
      {showDetailsModal && selectedPO && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {t('purchaseOrders.details.title', { id: selectedPO.id })}
              </h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* PO Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">{t('purchaseOrders.details.orderInfo')}</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <p><span className="font-medium">{t('purchaseOrders.details.status')}</span> 
                        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getStatusColor(selectedPO.status)}`}>
                          {t(`purchaseOrders.status.${selectedPO.status.toLowerCase()}`, selectedPO.status)}
                        </span>
                      </p>
                      <p><span className="font-medium">{t('purchaseOrders.details.priority')}</span> 
                        <span className={`ml-2 ${getPriorityColor(selectedPO.priority)}`}>
                          {t(`purchaseOrders.priority.${selectedPO.priority.toLowerCase()}`, selectedPO.priority)}
                        </span>
                      </p>
                      <p><span className="font-medium">{t('purchaseOrders.details.created')}</span> {new Date(selectedPO.created_at).toLocaleDateString()}</p>
                      {selectedPO.expected_date && (
                        <p><span className="font-medium">{t('purchaseOrders.details.expectedDelivery')}</span> {selectedPO.expected_date}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">{t('purchaseOrders.details.supplierInfo')}</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <p><span className="font-medium">{t('purchaseOrders.details.supplierName')}</span> {selectedPO.supplier_name}</p>
                      {selectedPO.supplier?.contact_phone && (
                        <p><span className="font-medium">{t('purchaseOrders.details.phone')}</span> {selectedPO.supplier.contact_phone}</p>
                      )}
                      {selectedPO.supplier?.contact_email && (
                        <p><span className="font-medium">{t('purchaseOrders.details.email')}</span> {selectedPO.supplier.contact_email}</p>
                      )}
                      <p><span className="font-medium">{t('purchaseOrders.details.currency')}</span> {selectedPO.supplier?.default_currency}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="font-medium text-gray-900 mb-4">{t('purchaseOrders.details.orderItems', { count: poItems.length })}</h3>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
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
                      {poItems.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3">
                            <div>
                              <div className="font-medium text-gray-900">{item.supplier_item_name}</div>
                              {item.supplier_package_name && (
                                <div className="text-sm text-green-600">{item.supplier_package_name}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {item.unit_price} {selectedPO.supplier?.default_currency}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {(Number(item.total_price) || 0).toFixed(2)} {selectedPO.supplier?.default_currency}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-right font-medium text-gray-900">
                          {t('purchaseOrders.details.totalAmount')}
                        </td>
                        <td className="px-4 py-3 font-bold text-gray-900">
                          {(Number(selectedPO.total_amount) || 0).toFixed(2)} {selectedPO.supplier?.default_currency}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {selectedPO.notes && (
                <div className="mt-6">
                  <h3 className="font-medium text-gray-900 mb-2">{t('purchaseOrders.details.notes')}</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{selectedPO.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Generate Cheque Modal */}
      {showChequeModal && selectedPO && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">{t('purchaseOrders.chequeGeneration.title')}</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">{t('purchaseOrders.chequeGeneration.orderDetails')}</h3>
                <p className="text-blue-800">{t('purchaseOrders.table.poNumber')} #{selectedPO.id} - {selectedPO.supplier_name}</p>
                <p className="text-blue-800">{t('purchaseOrders.table.amount')}: {(Number(selectedPO.total_amount) || 0).toFixed(2)} {selectedPO.supplier?.default_currency}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('purchaseOrders.chequeGeneration.selectBankAccount')}
                </label>
                <select
                  value={selectedBankAccount}
                  onChange={(e) => setSelectedBankAccount(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value={0}>{t('purchaseOrders.chequeGeneration.selectBankAccountOption')}</option>
                  {bankAccounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.bank_name} - {account.account_number}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('purchaseOrders.chequeGeneration.selectSafe')}
                </label>
                <select
                  value={selectedSafe}
                  onChange={(e) => setSelectedSafe(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value={0}>{t('purchaseOrders.chequeGeneration.selectSafeOption')}</option>
                  {safes.map(safe => (
                    <option key={safe.id} value={safe.id}>
                      {safe.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">{t('purchaseOrders.chequeGeneration.title')}</p>
                    <p>{t('purchaseOrders.chequeGeneration.info')}</p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowChequeModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={generateCheque}
                  disabled={!selectedBankAccount || !selectedSafe || chequeGenerating}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {chequeGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{t('purchaseOrders.chequeGeneration.generating')}</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>{t('purchaseOrders.chequeGeneration.generate')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrderManagement; 
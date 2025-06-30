import React, { useState, useEffect } from 'react'
import { CreditCard, Package, Search, Eye, CheckCircle, AlertCircle, FileText, Printer, Calendar, DollarSign, FileDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import ArabicChequeGenerator from './ArabicChequeGenerator'
import api from '../services/api'

interface Supplier {
  id: number
  name: string
  contact_person?: string
  phone?: string
  email?: string
  address?: string
  default_currency: string
}

interface PurchaseOrder {
  id: number
  supplier_id: number
  supplier?: Supplier
  supplier_name?: string
  order_date: string
  expected_date?: string
  status: string
  payment_status?: string
  payment_date?: string
  payment_cheque_id?: number
  paid_by?: number
  total_amount: number
  warehouse_id?: number
  items?: any[]
  calculated_total?: number
}

interface BankAccount {
  id: number
  account_name: string
  account_number: string
  bank_name: string
  branch?: string
  is_active: boolean
}

interface Safe {
  id: number
  name: string
  description?: string
  is_active: boolean
  current_balance: number
}

interface SupplierPaymentsProps {
  user: any
}

const SupplierPayments: React.FC<SupplierPaymentsProps> = ({ user }) => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'unpaid' | 'paid'>('unpaid')
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [paidPurchaseOrders, setPaidPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [safes, setSafes] = useState<Safe[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [paidSearchTerm, setPaidSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('')
  const [paidSupplierFilter, setPaidSupplierFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedBankAccount, setSelectedBankAccount] = useState<number>(0)
  const [selectedSafe, setSelectedSafe] = useState<number>(0)
  const [paymentDescription, setPaymentDescription] = useState('')
  const [chequeGenerating, setChequeGenerating] = useState(false)
  const [generatedChequeId, setGeneratedChequeId] = useState<number | null>(null)
  const [showChequePreview, setShowChequePreview] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'new' | 'existing'>('new')
  const [selectedCheque, setSelectedCheque] = useState<number>(0)
  const [unassignedCheques, setUnassignedCheques] = useState<any[]>([])
  const [chequeAmount, setChequeAmount] = useState<string>('')
  const [loadingCheques, setLoadingCheques] = useState(false)

  const token = localStorage.getItem('token')

  useEffect(() => {
    fetchData()
  }, [statusFilter, supplierFilter, paidSupplierFilter, dateFrom, dateTo, activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        activeTab === 'unpaid' ? fetchUnpaidPurchaseOrders() : fetchPaidPurchaseOrders(),
        fetchSuppliers(),
        fetchBankAccounts(),
        fetchSafes()
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUnpaidPurchaseOrders = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      if (supplierFilter) params.append('supplier_id', supplierFilter)
      params.append('payment_status', 'unpaid')
      
      const { data } = await api.get('/api/purchase-orders', { params: Object.fromEntries(params) })
      const payableOrders = data.filter((po: PurchaseOrder) => 
        (po.status === 'draft' || po.status === 'received') && 
        (!po.payment_status || po.payment_status === 'unpaid')
      )
      setPurchaseOrders(payableOrders)
    } catch (error) {
      console.error('Error fetching unpaid purchase orders:', error)
    }
  }

  const fetchPaidPurchaseOrders = async () => {
    try {
      const params = new URLSearchParams()
      params.append('payment_status', 'paid')
      if (paidSupplierFilter) params.append('supplier_id', paidSupplierFilter)
      if (dateFrom) params.append('payment_date_from', dateFrom)
      if (dateTo) params.append('payment_date_to', dateTo)
      
      const { data } = await api.get('/api/purchase-orders', { params: Object.fromEntries(params) })
      setPaidPurchaseOrders(data)
    } catch (error) {
      console.error('Error fetching paid purchase orders:', error)
    }
  }

  const fetchSuppliers = async () => {
    try {
      const { data } = await api.get('/api/purchase-orders/suppliers')
      setSuppliers(data)
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    }
  }

  const fetchBankAccounts = async () => {
    try {
      const { data } = await api.get('/bank-accounts-simple')
      const accounts = Array.isArray(data) ? data : data?.data || []
      setBankAccounts(accounts.filter((account: BankAccount) => account.is_active))
    } catch (error) {
      console.error('Error fetching bank accounts:', error)
    }
  }

  const fetchSafes = async () => {
    try {
      const { data } = await api.get('/safes-simple')
      setSafes(Array.isArray(data) ? data : data?.data || [])
    } catch (error) {
      console.error('Error fetching safes:', error)
    }
  }

  const fetchUnassignedCheques = async () => {
    setLoadingCheques(true)
    try {
      const { data } = await api.get('/cheques-unassigned-simple')
      const cheques = Array.isArray(data) ? data : data?.data || []
      setUnassignedCheques(cheques)
    } catch (error) {
      console.error('Error fetching unassigned cheques:', error)
    } finally {
      setLoadingCheques(false)
    }
  }

  const fetchPODetails = async (poId: number) => {
    try {
      const { data } = await api.get(`/api/purchase-orders/${poId}`)
      setSelectedPO(data)
      setShowDetailsModal(true)
    } catch (error) {
      console.error('Error fetching PO details:', error)
    }
  }

  const generatePaymentCheque = async () => {
    if (!selectedPO || !selectedSafe) return
    
    // For existing cheque, we need a cheque selected
    if (paymentMethod === 'existing' && !selectedCheque) {
      alert('Please select a cheque')
      return
    }
    
    // For new cheque, we need a bank account
    if (paymentMethod === 'new' && !selectedBankAccount) {
      alert('Please select a bank account')
      return
    }

    setChequeGenerating(true)
    try {
      const { data } = await api.post(`/api/purchase-orders/${selectedPO.id}/generate-cheque`, {
        bank_account_id: paymentMethod === 'new' ? selectedBankAccount : null,
        safe_id: selectedSafe,
        description: paymentDescription || `Payment for Purchase Order #${selectedPO.id} - ${selectedPO.supplier_name || selectedPO.supplier?.name}`,
        cheque_number: null,
        existing_cheque_id: paymentMethod === 'existing' ? selectedCheque : null,
        amount: parseFloat(chequeAmount) || Number(selectedPO.total_amount)
      })

      if (data.cheque_id) {
        const token = localStorage.getItem('token')
        window.open(`/api/purchase-orders/${selectedPO.id}/cheque/${data.cheque_id}/arabic-pdf?token=${token}`, '_blank')
      }
    } catch (error) {
      console.error('Error generating cheque:', error)
      alert('Failed to generate cheque')
    } finally {
      setChequeGenerating(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'received': return 'bg-green-100 text-green-800 border-green-300'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getPaymentStatusColor = (paymentStatus: string) => {
    switch (paymentStatus?.toLowerCase()) {
      case 'paid': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'unpaid': return 'bg-gray-100 text-gray-800 border-gray-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const filteredPurchaseOrders = purchaseOrders.filter(po => {
    const matchesSearch = po.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         po.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         po.id.toString().includes(searchTerm)
    return matchesSearch
  })

  const filteredPaidPurchaseOrders = paidPurchaseOrders.filter(po => {
    const matchesSearch = po.supplier_name?.toLowerCase().includes(paidSearchTerm.toLowerCase()) ||
                         po.supplier?.name.toLowerCase().includes(paidSearchTerm.toLowerCase()) ||
                         po.id.toString().includes(paidSearchTerm)
    return matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('supplierPayments.title')}</h2>
        <p className="text-gray-600">{t('supplierPayments.subtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('unpaid')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'unpaid'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Package className="w-4 h-4" />
              <span>{t('supplierPayments.tabs.unpaidOrders')}</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('paid')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'paid'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>{t('supplierPayments.tabs.paidOrders')}</span>
            </div>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {activeTab === 'unpaid' ? (
            <>
              {/* Unpaid POs Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder={t('supplierPayments.search.placeholder')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <select
                  value={supplierFilter}
                  onChange={(e) => setSupplierFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t('supplierPayments.filters.allSuppliers')}</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t('supplierPayments.filters.allStatuses')}</option>
                  <option value="draft">{t('supplierPayments.status.pending')}</option>
                  <option value="received">{t('supplierPayments.status.received')}</option>
                </select>
              </div>

              {/* Unpaid Purchase Orders List */}
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-gray-500">{t('supplierPayments.loading.unpaidOrders')}</div>
                </div>
              ) : filteredPurchaseOrders.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">{t('supplierPayments.emptyStates.noUnpaidOrders')}</p>
                </div>
              ) : (
                <div className="overflow-hidden border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('supplierPayments.table.poDetails')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('supplierPayments.table.supplier')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('supplierPayments.table.amount')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('supplierPayments.table.status')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('supplierPayments.table.actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredPurchaseOrders.map((po) => (
                        <tr key={po.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">PO #{po.id}</div>
                              <div className="text-sm text-gray-500">
                                {new Date(po.order_date).toLocaleDateString()}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {po.supplier_name || po.supplier?.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              ${(Number(po.total_amount) || 0).toFixed(2)} {po.supplier?.default_currency || 'USD'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(po.status)}`}>
                              {po.status === 'draft' ? t('supplierPayments.status.pending') : po.status.charAt(0).toUpperCase() + po.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => fetchPODetails(po.id)}
                                className="text-blue-600 hover:text-blue-900"
                                title={t('supplierPayments.actions.viewDetails')}
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              
                              <button
                                onClick={() => {
                                  const token = localStorage.getItem('token')
                                  window.open(`/api/purchase-orders/${po.id}/html?language=ar&token=${token}`, '_blank')
                                }}
                                className="text-gray-600 hover:text-gray-900"
                                title={t('supplierPayments.actions.printPO')}
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                              
                              <button
                                onClick={() => {
                                  setSelectedPO(po)
                                  setPaymentDescription(`Payment for Purchase Order #${po.id} - ${po.supplier_name || po.supplier?.name}`)
                                  setChequeAmount((Number(po.total_amount) || 0).toFixed(2))
                                  setPaymentMethod('existing')
                                  setSelectedCheque(0)
                                  fetchUnassignedCheques()
                                  setShowPaymentModal(true)
                                }}
                                className="text-green-600 hover:text-green-900"
                                title={t('supplierPayments.actions.generateCheque')}
                              >
                                <CreditCard className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Paid POs Filters */}
              <div className="space-y-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search by supplier name or PO number..."
                        value={paidSearchTerm}
                        onChange={(e) => setPaidSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <select
                    value={paidSupplierFilter}
                    onChange={(e) => setPaidSupplierFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Suppliers</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <label className="text-sm font-medium text-gray-700">Payment Date Range:</label>
                  </div>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="From date"
                  />
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="To date"
                  />
                  <button
                    onClick={() => {
                      setDateFrom('')
                      setDateTo('')
                    }}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Clear dates
                  </button>
                </div>
              </div>

              {/* Paid Purchase Orders List */}
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-gray-500">Loading paid purchase orders...</div>
                </div>
              ) : filteredPaidPurchaseOrders.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No paid purchase orders found</p>
                </div>
              ) : (
                <div className="overflow-hidden border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          PO Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Supplier
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cheque
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredPaidPurchaseOrders.map((po) => (
                        <tr key={po.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">PO #{po.id}</div>
                              <div className="text-sm text-gray-500">
                                Order: {new Date(po.order_date).toLocaleDateString()}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {po.supplier_name || po.supplier?.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              ${(Number(po.total_amount) || 0).toFixed(2)} {po.supplier?.default_currency || 'USD'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {po.payment_date ? new Date(po.payment_date).toLocaleDateString() : 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-1">
                              <DollarSign className="w-4 h-4 text-green-600" />
                              <span className="text-sm text-gray-900">
                                {po.payment_cheque_id ? `Cheque #${po.payment_cheque_id}` : 'N/A'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-3">
                                                             <button
                                 onClick={() => fetchPODetails(po.id)}
                                 className="text-blue-600 hover:text-blue-900"
                                 title="View Details"
                               >
                                 <Eye className="w-4 h-4" />
                               </button>
                               
                               <button
                                 onClick={() => {
                                   const token = localStorage.getItem('token')
                                   window.open(`/api/purchase-orders/${po.id}/html?language=ar&token=${token}`, '_blank')
                                 }}
                                 className="text-purple-600 hover:text-purple-900"
                                 title="Print Purchase Order"
                               >
                                 <FileDown className="w-4 h-4" />
                               </button>
                               
                               {po.payment_cheque_id && (
                                 <button
                                   onClick={() => {
                                     const token = localStorage.getItem('token')
                                     window.open(`/api/purchase-orders/${po.id}/cheque/${po.payment_cheque_id}/arabic-pdf?token=${token}`, '_blank')
                                   }}
                                   className="text-gray-600 hover:text-gray-900"
                                   title="Print Cheque"
                                 >
                                   <Printer className="w-4 h-4" />
                                 </button>
                               )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedPO && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Generate Payment Cheque</h3>
            
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Purchase Order:</strong> #{selectedPO.id}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Supplier:</strong> {selectedPO.supplier_name || selectedPO.supplier?.name}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Amount:</strong> ${(Number(selectedPO.total_amount) || 0).toFixed(2)} {selectedPO.supplier?.default_currency || 'USD'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Only existing unassigned cheques can be used for purchase order payments.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Unassigned Cheque *
                </label>
                {loadingCheques ? (
                  <div className="text-center py-2">Loading cheques...</div>
                ) : (
                  <select
                    value={selectedCheque}
                    onChange={(e) => {
                      const chequeId = parseInt(e.target.value)
                      setSelectedCheque(chequeId)
                      // Update amount when cheque is selected
                      const cheque = unassignedCheques.find(c => c.id === chequeId)
                      if (cheque && cheque.amount > 0) {
                        setChequeAmount(cheque.amount.toString())
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value={0}>Select a cheque...</option>
                    {unassignedCheques.map(cheque => (
                      <option key={cheque.id} value={cheque.id}>
                        {cheque.cheque_number} - {cheque.bank_account} 
                        {cheque.amount > 0 && ` (Amount: $${cheque.amount.toFixed(2)})`}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Safe *
                </label>
                <select
                  value={selectedSafe}
                  onChange={(e) => setSelectedSafe(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value={0}>Select a safe...</option>
                  {safes.map(safe => (
                    <option key={safe.id} value={safe.id}>
                      {safe.name} (Balance: ${(Number(safe.current_balance) || 0).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cheque Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={chequeAmount}
                  onChange={(e) => setChequeAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter amount..."
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  PO Amount: ${(Number(selectedPO.total_amount) || 0).toFixed(2)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Description
                </label>
                <textarea
                  value={paymentDescription}
                  onChange={(e) => setPaymentDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter payment description..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowPaymentModal(false)
                  setSelectedBankAccount(0)
                  setSelectedSafe(0)
                  setPaymentDescription('')
                  setPaymentMethod('existing')
                  setSelectedCheque(0)
                  setChequeAmount('')
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={generatePaymentCheque}
                disabled={
                  !selectedSafe || 
                  chequeGenerating || 
                  !chequeAmount ||
                  !selectedCheque
                }
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {chequeGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Generate Cheque</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PO Details Modal */}
      {showDetailsModal && selectedPO && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Purchase Order Details</h3>
              <button
                onClick={() => {
                  setShowDetailsModal(false)
                  setSelectedPO(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <AlertCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">PO Number</p>
                  <p className="font-medium">#{selectedPO.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedPO.status)}`}>
                    {selectedPO.status === 'draft' ? 'Pending' : selectedPO.status.charAt(0).toUpperCase() + selectedPO.status.slice(1)}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Supplier</p>
                  <p className="font-medium">{selectedPO.supplier_name || selectedPO.supplier?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="font-medium">${(Number(selectedPO.total_amount) || 0).toFixed(2)} {selectedPO.supplier?.default_currency || 'USD'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Order Date</p>
                  <p className="font-medium">{new Date(selectedPO.order_date).toLocaleDateString()}</p>
                </div>
                {selectedPO.expected_date && (
                  <div>
                    <p className="text-sm text-gray-500">Expected Date</p>
                    <p className="font-medium">{new Date(selectedPO.expected_date).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              {selectedPO.items && selectedPO.items.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Order Items</h4>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedPO.items.map((item: any, index: number) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm">{item.item?.name || 'Unknown'}</td>
                          <td className="px-4 py-2 text-sm">{item.quantity} {item.unit}</td>
                          <td className="px-4 py-2 text-sm">${(Number(item.unit_price) || 0).toFixed(2)}</td>
                          <td className="px-4 py-2 text-sm font-medium">${(Number(item.total_price) || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setShowDetailsModal(false)
                  setSelectedPO(null)
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cheque Preview Modal */}
      {showChequePreview && generatedChequeId && selectedPO && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Payment Cheque Generated</h3>
              <button
                onClick={() => {
                  setShowChequePreview(false)
                  setGeneratedChequeId(null)
                  setSelectedPO(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <AlertCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <p className="text-green-800">
                  Payment cheque has been successfully generated for Purchase Order #{selectedPO.id}
                </p>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              <p><strong>Cheque ID:</strong> {generatedChequeId}</p>
              <p><strong>Supplier:</strong> {selectedPO.supplier_name || selectedPO.supplier?.name}</p>
              <p><strong>Amount:</strong> ${(Number(selectedPO.total_amount) || 0).toFixed(2)} {selectedPO.supplier?.default_currency || 'USD'}</p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  const token = localStorage.getItem('token')
                  window.open(`/api/purchase-orders/${selectedPO.id}/cheque/${generatedChequeId}/arabic-pdf?token=${token}`, '_blank')
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print Arabic Cheque</span>
              </button>
              <button
                onClick={() => {
                  setShowChequePreview(false)
                  setGeneratedChequeId(null)
                  setSelectedPO(null)
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SupplierPayments 
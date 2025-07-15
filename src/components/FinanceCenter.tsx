import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import axios from 'axios'
import CategorySelector from './CategorySelector'
import ChequeManagement from './ChequeManagement'
import BankHierarchyManagement from './BankHierarchyManagement'
import ChequePrintManager from './ChequePrintManager'
import { Building2, Receipt, TrendingUp, Plus, Search, Eye, CheckCircle, Clock, AlertCircle, X, Shield, DollarSign, FileText, Settings, FolderTree, CreditCard, PenSquare, Printer } from 'lucide-react'
import LanguageSwitcher from './LanguageSwitcher'
import ExpenseCategoryManagement from './ExpenseCategoryManagement.tsx'
import ExpenseManagement from './ExpenseManagement'
import SupplierPayments from './SupplierPayments'
import { extractResponseData, extractErrorMessage } from '../lib/apiUtils'
import { safesAPI, authAPI } from '../services/api'

// API Configuration
const API_BASE_URL = 'http://100.29.4.72:8000'

interface BankAccount {
  id: number
  account_name: string
  account_number: string
  bank_name: string
  branch?: string
  available_balance?: number
}

interface Bank {
  id: number
  name: string
  short_name: string
  swift_code?: string
  country: string
  address?: string
  contact_phone?: string
  contact_email?: string
  website?: string
  is_active: boolean
  created_at: string
}

interface Safe {
  id: number
  name: string
  description?: string
  is_active: boolean
  current_balance: number
}

interface Cheque {
  id: number
  cheque_number: string
  bank_account_id: number
  bank_account?: BankAccount
  issue_date: string
  amount: string
  status: string
  department?: string
  issued_to?: string
  due_date?: string
  safe_id?: number
  safe?: Safe
}

interface Expense {
  id: number
  cheque_id: number
  cheque?: Cheque
  category_id?: number
  category?: ExpenseCategory
  amount: number
  description: string
  expense_date: string
  status: string
  notes?: string
  created_by?: number
}

interface ExpenseCategory {
  id: number
  name: string
  description?: string
  parent_id?: number
  path: string
  level: number
  sort_order: number
  icon?: string
  color?: string
  is_active: boolean
  expense_count: number
  total_expense_count: number
  can_delete: boolean
  full_path: string
  created_at: string
  updated_at: string
  children?: ExpenseCategory[]
}

interface User {
  id: number;
  username: string;
  role: {
    id: number;
    name: string;
  };
}

const FinanceCenter = () => {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.dir() === 'rtl'
  const [activeTab, setActiveTab] = useState('cheque-management')
  const [cheques, setCheques] = useState<Cheque[]>([])
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [banks, setBanks] = useState<Bank[]>([])
  const [safes, setSafes] = useState<Safe[]>([])
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showChequeModal, setShowChequeModal] = useState(false)
  const [showSafeModal, setShowSafeModal] = useState(false)
  const [chequeMode, setChequeMode] = useState<'single' | 'batch'>('single')
  const [showBankAccountModal, setShowBankAccountModal] = useState(false)
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null)
  
  const [chequeForm, setChequeForm] = useState({
    cheque_number: '',
    bank_account_id: '',
    amount: '',
    description: '',
    issue_date: new Date().toISOString().split('T')[0]
  })

  const [batchForm, setBatchForm] = useState({
    bank_account_id: '',
    start_number: '',
    end_number: '',
    prefix: '',
    description: ''
  })

  const [safeForm, setSafeForm] = useState({
    name: '',
    description: '',
    initial_balance: '0'
  })

  const [bankAccountForm, setBankAccountForm] = useState({
    account_name: '',
    account_number: '',
    bank_name: '',
    branch: '',
    available_balance: '',
    selected_bank_id: '', // For existing bank selection
    is_new_bank: false // Toggle between existing/new bank
  })

  const token = localStorage.getItem('token')
  const headers = token ? { Authorization: `Bearer ${token}` } : {}

  useEffect(() => {
    fetchUser()
    fetchBankAccounts()
    fetchBanks()
    fetchSafes()
    fetchExpenseCategories()
  }, [activeTab])

  const fetchUser = async () => {
    try {
      const response = await authAPI.getCurrentUser()
      setUser(response.data)
    } catch (error) {
      console.error('Error fetching user:', error)
      // Clear user on error to avoid stale state
      setUser(null)
    }
  }

  const fetchCheques = async () => {
    setLoading(true)
    try {
      const allCheques: Cheque[] = []
      
      // Fetch cheques from all safes
      try {
        const safesResponse = await axios.get(`${API_BASE_URL}/safes-simple`, { headers })
        const safesData = extractResponseData<Safe>(safesResponse.data)
        
        // For each safe, fetch its cheques
        for (const safe of safesData) {
          try {
            const chequesResponse = await axios.get(`${API_BASE_URL}/safes/${safe.id}/cheques`, { headers })
            const chequesWithSafe = chequesResponse.data.map((cheque: any) => ({
              ...cheque,
              safe: safe // Ensure safe info is attached
            }))
            allCheques.push(...chequesWithSafe)
          } catch (error) {
            console.error(`Error fetching cheques for safe ${safe.id}:`, error)
          }
        }
      } catch (error) {
        console.error('Error fetching safes:', error)
      }
      
      // Also fetch unassigned cheques using the simpler endpoint
      try {
        const unassignedResponse = await axios.get(`${API_BASE_URL}/cheques-unassigned-simple`, { headers })
        const unassignedData = extractResponseData(unassignedResponse.data)
        const unassignedCheques = unassignedData.map((cheque: any) => ({
          id: cheque.id,
          cheque_number: cheque.cheque_number,
          bank_account_id: cheque.bank_account_id,
          amount: cheque.amount || 0,
          status: cheque.status || 'created',
          issue_date: new Date().toISOString(),
          safe_id: undefined,
          safe: undefined,
          bank_account: {
            id: 0, // placeholder for unassigned cheques
            bank_name: cheque.bank_account?.split(' (')[1]?.replace(')', '') || 'Unknown',
            account_name: cheque.bank_account?.split(' (')[0] || 'Unknown',
            account_number: 'N/A',
            branch: undefined,
            available_balance: undefined
          }
        } as Cheque))
        allCheques.push(...unassignedCheques)
      } catch (error) {
        console.error('Error fetching unassigned cheques:', error)
      }
      
      setCheques(allCheques)
    } catch (error) {
      console.error('Error fetching cheques:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchBankAccounts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/bank-accounts-simple`, { headers })
      const bankAccountsData = extractResponseData(response.data)
      console.log('🏛️ Bank accounts extracted:', bankAccountsData)
      setBankAccounts(bankAccountsData)
    } catch (error: any) {
      console.error('Error fetching bank accounts:', error)
      const errorMessage = extractErrorMessage(error)
      console.error('Bank accounts error:', errorMessage)
    }
  }

  const fetchBanks = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/banks`, { headers })
      const banksData = extractResponseData(response.data)
      console.log('🏦 Banks extracted:', banksData)
      setBanks(banksData)
    } catch (error: any) {
      console.error('Error fetching banks:', error)
      const errorMessage = extractErrorMessage(error)
      console.error('Banks error:', errorMessage)
    }
  }

  const fetchSafes = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/safes-simple`, { headers })
      const safesData = extractResponseData(response.data)
      console.log('🏦 Safes extracted:', safesData)
      setSafes(safesData)
    } catch (error: any) {
      console.error('Error fetching safes:', error)
      const errorMessage = extractErrorMessage(error)
      console.error('Safes error:', errorMessage)
    }
  }

  const fetchExpenseCategories = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/expense-categories-simple`)
      const categoriesData = extractResponseData(response.data)
      console.log('📂 Expense categories extracted:', categoriesData)
      setExpenseCategories(categoriesData)
    } catch (error: any) {
      console.error('Error fetching expense categories:', error)
      const errorMessage = extractErrorMessage(error)
      console.error('Expense categories error:', errorMessage)
    }
  }

  const handleCreateCheque = async () => {
    if (chequeMode === 'single') {
      // Single cheque creation
      if (!chequeForm.cheque_number || !chequeForm.bank_account_id) {
        showNotification('error', 'Please fill in all required fields')
        return
      }

      try {
        const payload = {
          cheque_number: chequeForm.cheque_number,
          bank_account_id: parseInt(chequeForm.bank_account_id),
          description: chequeForm.description || ''
        }
        
        await axios.post(`${API_BASE_URL}/cheques-simple`, payload, { headers })
        setShowChequeModal(false)
        resetChequeForms()
        fetchCheques()
        showNotification('success', 'Cheque created successfully!')
      } catch (error: any) {
        console.error('Error creating cheque:', error)
        const errorMessage = extractErrorMessage(error)
        showNotification('error', `Failed to create cheque: ${errorMessage}`)
      }
    } else {
      // Batch cheque creation
      if (!batchForm.bank_account_id || !batchForm.start_number || !batchForm.end_number) {
        showNotification('error', 'Please fill in all required fields')
        return
      }

      const startNum = parseInt(batchForm.start_number)
      const endNum = parseInt(batchForm.end_number)

      if (startNum >= endNum) {
        showNotification('error', 'Start number must be less than end number')
        return
      }

      if (endNum - startNum > 1000) {
        showNotification('error', 'Cannot create more than 1000 cheques at once')
        return
      }

      try {
        const payload = {
          bank_account_id: parseInt(batchForm.bank_account_id),
          start_number: startNum,
          end_number: endNum,
          prefix: batchForm.prefix || '',
          description: batchForm.description || ''
        }

        await axios.post(`${API_BASE_URL}/cheques/create-range-simple`, payload)
        setShowChequeModal(false)
        resetChequeForms()
        fetchCheques()
        showNotification('success', `Successfully created ${endNum - startNum + 1} cheques!`)
      } catch (error: any) {
        console.error('Error creating cheque batch:', error)
        const errorMessage = extractErrorMessage(error)
        showNotification('error', `Failed to create cheque batch: ${errorMessage}`)
      }
    }
  }

  const resetChequeForms = () => {
    setChequeForm({
      cheque_number: '',
      bank_account_id: '',
      amount: '',
      description: '',
      issue_date: new Date().toISOString().split('T')[0]
    })
    setBatchForm({
      bank_account_id: '',
      start_number: '',
      end_number: '',
      prefix: '',
      description: ''
    })
  }

  const handleCreateSafe = async () => {
    if (!safeForm.name) {
      showNotification('error', 'Please enter a safe name')
      return
    }

    try {
      await axios.post(`${API_BASE_URL}/safes-simple`, {
        name: safeForm.name,
        description: safeForm.description,
        initial_balance: parseFloat(safeForm.initial_balance) || 0
      })
      
      setShowSafeModal(false)
      setSafeForm({ name: '', description: '', initial_balance: '0' })
      fetchSafes()
      showNotification('success', 'Safe created successfully!')
    } catch (error: any) {
      console.error('Error creating safe:', error)
      showNotification('error', error.response?.data?.detail || 'Failed to create safe')
    }
  }

  const handleCreateBankAccount = async () => {
    if (!bankAccountForm.account_name || !bankAccountForm.account_number) {
      showNotification('error', 'Please fill in all required fields')
      return
    }

    // Validate bank selection
    if (!bankAccountForm.is_new_bank && !bankAccountForm.selected_bank_id) {
      showNotification('error', 'Please select a bank')
      return
    }

    if (bankAccountForm.is_new_bank && !bankAccountForm.bank_name) {
      showNotification('error', 'Please enter a bank name')
      return
    }

    try {
      let bank_name = bankAccountForm.bank_name
      
      // If using existing bank, get the bank name from the selected bank
      if (!bankAccountForm.is_new_bank && bankAccountForm.selected_bank_id) {
        const selectedBank = banks.find(bank => bank.id === parseInt(bankAccountForm.selected_bank_id))
        if (selectedBank) {
          bank_name = selectedBank.name
        }
      }

      const payload = {
        account_name: bankAccountForm.account_name,
        account_number: bankAccountForm.account_number,
        bank_name: bank_name,
        branch: bankAccountForm.branch || null,
        available_balance: bankAccountForm.available_balance ? parseFloat(bankAccountForm.available_balance) : 0
      }

      await axios.post(`${API_BASE_URL}/bank-accounts-simple`, payload)
      setShowBankAccountModal(false)
      setBankAccountForm({
        account_name: '',
        account_number: '',
        bank_name: '',
        branch: '',
        available_balance: '',
        selected_bank_id: '',
        is_new_bank: false
      })
      fetchBankAccounts()
      showNotification('success', 'Bank account created successfully!')
    } catch (error: any) {
      console.error('Error creating bank account:', error)
      showNotification('error', error.response?.data?.detail || 'Failed to create bank account')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50'
      case 'assigned': return 'text-blue-600 bg-blue-50'
      case 'settled': return 'text-gray-600 bg-gray-50'
      case 'overspent': return 'text-red-600 bg-red-50'
      case 'pending': return 'text-yellow-600 bg-yellow-50'
      case 'approved': return 'text-green-600 bg-green-50'
      case 'rejected': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
              currency: 'EGP'
    }).format(num || 0)
  }

  const filteredCheques = cheques.filter(cheque =>
    cheque.cheque_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cheque.bank_account?.bank_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cheque.safe?.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Show notification helper
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000) // Auto-dismiss after 5 seconds
  }

  // Helper to rename a safe
  const handleRenameSafe = async (safe: Safe) => {
    const newName = prompt(t('finance.renameSafePrompt', 'Enter new name for the safe'), safe.name)
    if (!newName || newName.trim() === '' || newName.trim() === safe.name) return
    try {
      await safesAPI.update(safe.id, { name: newName.trim() })
      setSafes(prev => prev.map(s => s.id === safe.id ? { ...s, name: newName.trim() } : s))
      showNotification('success', t('finance.safeRenamedSuccess', 'Safe renamed successfully'))
    } catch (error) {
      console.error('Failed to rename safe', error)
      showNotification('error', t('finance.safeRenamedError', 'Failed to rename safe'))
    }
  }

  return (
    <div dir={i18n.dir()} className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <header className={`bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl shadow-lg mb-6 sm:mb-8`}>
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 ${isRTL ? 'sm:flex-row-reverse sm:justify-between' : 'sm:justify-between'}`}>
              <div className={`${isRTL ? 'text-right' : 'text-left'} flex-1`}>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">{t('finance.description')}</h1>
                <p className="text-amber-100 mt-1 sm:mt-2 text-sm sm:text-base">
                  {t('finance.subtitle', 'Comprehensive financial management for your bakery')}
                </p>
              </div>
              <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
                <LanguageSwitcher />
                <div className={`${isRTL ? 'text-right' : 'text-left'} hidden sm:block`}>
                  <div className="text-sm text-amber-100">
                    {t('auth.welcome', 'Welcome')}
                  </div>
                </div>
              </div>
            </div>

            <nav 
              className={`flex items-center gap-0.5 sm:gap-1 md:gap-2 lg:gap-4 mt-4 sm:mt-6 overflow-x-auto ${isRTL ? 'flex-row-reverse' : ''} pb-4 -mb-4 px-1`}
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#f59e0b #fef3c7',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {[
                { id: 'cheque-management', labelKey: 'finance.tabs.chequeManagement', icon: <Settings className="w-3 h-3 sm:w-4 sm:h-4" />, shortLabel: 'Cheque Mgmt' },
                { id: 'bank-hierarchy', labelKey: 'finance.tabs.bankHierarchy', icon: <Building2 className="w-3 h-3 sm:w-4 sm:h-4" />, shortLabel: 'Banks' },
                { id: 'safes', labelKey: 'finance.tabs.safes', icon: <Shield className="w-3 h-3 sm:w-4 sm:h-4" />, shortLabel: 'Safes' },
                { id: 'expenses', labelKey: 'finance.tabs.expenses', icon: <DollarSign className="w-3 h-3 sm:w-4 sm:h-4" />, shortLabel: 'Expense' },
                { id: 'expense-categories', labelKey: 'finance.tabs.expenseCategories', icon: <FolderTree className="w-3 h-3 sm:w-4 sm:h-4" />, shortLabel: 'Categories' },
                { id: 'supplier-payments', labelKey: 'finance.tabs.supplierPayments', icon: <CreditCard className="w-3 h-3 sm:w-4 sm:h-4" />, shortLabel: 'Suppliers' },
                { id: 'summary', labelKey: 'finance.tabs.summary', icon: <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />, shortLabel: 'Stats' },
                { id: 'cheque-print', labelKey: 'finance.tabs.chequePrint', icon: <Printer className="w-3 h-3 sm:w-4 sm:h-4" />, shortLabel: 'Print' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-1 px-1.5 sm:py-2 sm:px-3 md:py-3 md:px-4 lg:px-6 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap flex-shrink-0 min-w-0 ${
                    activeTab === tab.id
                      ? 'border-white text-white'
                      : 'border-transparent text-amber-100 hover:text-white hover:border-amber-200'
                  }`}
                >
                  <div className={`flex flex-col sm:flex-row items-center gap-0 sm:gap-1 md:gap-2 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
                    {tab.icon}
                    <span className="hidden md:inline text-xs sm:text-sm">{tab.id === 'supplier-payments' ? 'Supplier Payments' : t(tab.labelKey)}</span>
                    <span className="md:hidden text-xs leading-tight">{tab.shortLabel}</span>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </header>

        <main className="w-full">
          <div className="mb-6">
            <div className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-3 flex-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder={
                    activeTab === 'expenses' ? t('finance.search.expenses') :
                    activeTab === 'expense-categories' ? 'Search categories...' :
                    'Search...'
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${isRTL ? 'text-right' : 'text-left'}`}
                />
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {activeTab === 'cheque-management' && (
                  <button
                    onClick={() => setShowChequeModal(true)}
                    className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4 inline mr-1" />
                    <span className="hidden sm:inline">{t('finance.buttons.newCheque')}</span>
                    <span className="sm:hidden">New</span>
                  </button>
                )}
                {activeTab === 'bank-hierarchy' && (
                  <button
                    onClick={() => setShowBankAccountModal(true)}
                    className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4 inline mr-1" />
                    <span className="hidden sm:inline">{t('finance.buttons.newBankAccount')}</span>
                    <span className="sm:hidden">New</span>
                  </button>
                )}
                {activeTab === 'safes' && (
                  <button
                    onClick={() => setShowSafeModal(true)}
                    className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4 inline mr-1" />
                    <span className="hidden sm:inline">{t('finance.buttons.newSafe')}</span>
                    <span className="sm:hidden">New</span>
                  </button>
                )}

              </div>
            </div>
          </div>

          <div className="w-full">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-500">{t('finance.content.loading')}</div>
              </div>
            ) : (
              <>
                {/* Cheque Management */}
                {activeTab === 'cheque-management' && user && (
                  <div className="w-full">
                    <ChequeManagement user={user} />
                  </div>
                )}

                {/* Bank Hierarchy Management */}
                {activeTab === 'bank-hierarchy' && (
                  <div className="w-full">
                    <BankHierarchyManagement />
                  </div>
                )}

                {/* Safes */}
                {activeTab === 'safes' && (
                  <div className="w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                      {safes.length === 0 ? (
                        <div className="col-span-full text-center py-8 text-gray-500">
                          {t('finance.content.noSafes')}
                        </div>
                      ) : (
                        safes.map(safe => (
                          <div key={safe.id} className="bg-white rounded-lg shadow-sm border p-6">
                            <div>
                              <div className="flex items-center gap-1">
                                <h3 className="font-semibold text-gray-900">{safe.name}</h3>
                                <button
                                  onClick={() => handleRenameSafe(safe)}
                                  className="text-gray-400 hover:text-gray-600"
                                  title={t('finance.safeCard.editName', 'Edit name')}
                                >
                                  <PenSquare className="w-4 h-4" />
                                </button>
                              </div>
                              <p className="text-sm text-gray-500">{t('finance.safeCard.title')}</p>
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">{t('finance.safeCard.currentBalance')}:</span>
                                <span className="font-semibold text-lg text-gray-900">
                                  {formatCurrency(safe.current_balance)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">{t('finance.safeCard.status')}:</span>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  safe.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600'
                                }`}>
                                  {safe.is_active ? t('finance.status.active') : t('finance.status.inactive')}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Expenses Tab */}
                {activeTab === 'expenses' && user && (
                  <div className="w-full">
                    <ExpenseManagement user={user} />
                  </div>
                )}

                {/* Expense Categories Tab */}
                {activeTab === 'expense-categories' && (
                  <div className="w-full">
                    <ExpenseCategoryManagement />
                  </div>
                )}

                {/* Supplier Payments Tab */}
                {activeTab === 'supplier-payments' && user && (
                  <div className="w-full">
                    <SupplierPayments user={user} />
                  </div>
                )}

                {/* Cheque Print Management Tab */}
                {activeTab === 'cheque-print' && (
                  <div className="w-full">
                    <ChequePrintManager />
                  </div>
                )}

                {/* Summary Tab */}
                {activeTab === 'summary' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <Building2 className="w-10 h-10 text-blue-600" />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{t('finance.summary.bankAccounts')}</h3>
                          <p className="text-3xl font-bold text-gray-900">{bankAccounts.length}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <Receipt className="w-10 h-10 text-green-600" />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{t('finance.summary.totalCheques')}</h3>
                          <p className="text-3xl font-bold text-gray-900">{cheques.length}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <Shield className="w-10 h-10 text-purple-600" />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{t('finance.summary.activeSafes')}</h3>
                          <p className="text-3xl font-bold text-gray-900">{safes.filter(s => s.is_active).length}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 max-w-md animate-in slide-in-from-top-2 fade-in duration-300`}>
          <div className={`rounded-lg shadow-lg p-4 ${
            notification.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center gap-3">
              {notification.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              )}
              <p className={`text-sm font-medium ${
                notification.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {notification.message}
              </p>
              <button
                onClick={() => setNotification(null)}
                className={`ml-auto -m-1.5 p-1.5 rounded-lg hover:bg-opacity-20 ${
                  notification.type === 'success' 
                    ? 'text-green-600 hover:bg-green-600' 
                    : 'text-red-600 hover:bg-red-600'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Cheque Modal */}
      {showChequeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{t('finance.modals.createCheque.title')}</h2>
              <button
                onClick={() => {
                  setShowChequeModal(false)
                  resetChequeForms()
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <div className="flex gap-4 mb-4">
                <button
                  onClick={() => setChequeMode('single')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    chequeMode === 'single'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t('finance.modals.createCheque.singleCheque')}
                </button>
                <button
                  onClick={() => setChequeMode('batch')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    chequeMode === 'batch'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t('finance.modals.createCheque.batchRange')}
                </button>
              </div>
            </div>

            {chequeMode === 'single' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Account *
                  </label>
                  <select
                    value={chequeForm.bank_account_id}
                    onChange={(e) => setChequeForm({ ...chequeForm, bank_account_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select bank account</option>
                    {bankAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.account_name} - {account.bank_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cheque Number *
                  </label>
                  <input
                    type="text"
                    value={chequeForm.cheque_number}
                    onChange={(e) => setChequeForm({ ...chequeForm, cheque_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter cheque number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={chequeForm.amount}
                    onChange={(e) => setChequeForm({ ...chequeForm, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Issue Date
                  </label>
                  <input
                    type="date"
                    value={chequeForm.issue_date}
                    onChange={(e) => setChequeForm({ ...chequeForm, issue_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={chequeForm.description}
                    onChange={(e) => setChequeForm({ ...chequeForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Optional description"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                  Create blank cheques in a range. Details will be added when issuing to safes.
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Account *
                  </label>
                  <select
                    value={batchForm.bank_account_id}
                    onChange={(e) => setBatchForm({ ...batchForm, bank_account_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select bank account</option>
                    {bankAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.account_name} - {account.bank_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prefix (Optional)
                  </label>
                  <input
                    type="text"
                    value={batchForm.prefix}
                    onChange={(e) => setBatchForm({ ...batchForm, prefix: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., CHQ-"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Number *
                    </label>
                    <input
                      type="number"
                      value={batchForm.start_number}
                      onChange={(e) => setBatchForm({ ...batchForm, start_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Number *
                    </label>
                    <input
                      type="number"
                      value={batchForm.end_number}
                      onChange={(e) => setBatchForm({ ...batchForm, end_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="100"
                    />
                  </div>
                </div>

                {batchForm.start_number && batchForm.end_number && (
                  <div className="text-sm text-gray-600">
                    This will create {parseInt(batchForm.end_number) - parseInt(batchForm.start_number) + 1} cheques
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={batchForm.description}
                    onChange={(e) => setBatchForm({ ...batchForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Optional batch description"
                  />
                </div>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowChequeModal(false)
                  resetChequeForms()
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCheque}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create {chequeMode === 'batch' ? 'Cheques' : 'Cheque'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Safe Modal */}
      {showSafeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{t('finance.modals.createSafe.title')}</h2>
              <button
                onClick={() => setShowSafeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Safe Name *
                </label>
                <input
                  type="text"
                  value={safeForm.name}
                  onChange={(e) => setSafeForm({ ...safeForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter safe name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={safeForm.description}
                  onChange={(e) => setSafeForm({ ...safeForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Optional description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Initial Balance
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={safeForm.initial_balance}
                  onChange={(e) => setSafeForm({ ...safeForm, initial_balance: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowSafeModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSafe}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Create Safe
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Bank Account Modal */}
      {showBankAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{t('finance.modals.createBankAccount.title')}</h2>
              <button
                onClick={() => setShowBankAccountModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Name *
                </label>
                <input
                  type="text"
                  value={bankAccountForm.account_name}
                  onChange={(e) => setBankAccountForm({ ...bankAccountForm, account_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Business Checking"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Number *
                </label>
                <input
                  type="text"
                  value={bankAccountForm.account_number}
                  onChange={(e) => setBankAccountForm({ ...bankAccountForm, account_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter account number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bank Selection *
                </label>
                
                {/* Toggle between existing and new bank */}
                <div className="flex gap-4 mb-3">
                  <button
                    type="button"
                    onClick={() => setBankAccountForm({ 
                      ...bankAccountForm, 
                      is_new_bank: false, 
                      bank_name: '',
                      selected_bank_id: '' 
                    })}
                    className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors ${
                      !bankAccountForm.is_new_bank
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Existing Bank
                  </button>
                  <button
                    type="button"
                    onClick={() => setBankAccountForm({ 
                      ...bankAccountForm, 
                      is_new_bank: true, 
                      selected_bank_id: '',
                      bank_name: '' 
                    })}
                    className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors ${
                      bankAccountForm.is_new_bank
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    New Bank
                  </button>
                </div>

                {!bankAccountForm.is_new_bank ? (
                  /* Existing Bank Dropdown */
                  <select
                    value={bankAccountForm.selected_bank_id}
                    onChange={(e) => setBankAccountForm({ ...bankAccountForm, selected_bank_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select an existing bank...</option>
                    {banks.map((bank) => (
                      <option key={bank.id} value={bank.id}>
                        {bank.name} ({bank.short_name})
                      </option>
                    ))}
                  </select>
                ) : (
                  /* New Bank Input */
                <input
                  type="text"
                  value={bankAccountForm.bank_name}
                  onChange={(e) => setBankAccountForm({ ...bankAccountForm, bank_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Bank of America"
                />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Branch (Optional)
                </label>
                <input
                  type="text"
                  value={bankAccountForm.branch}
                  onChange={(e) => setBankAccountForm({ ...bankAccountForm, branch: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Branch location"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Available Balance
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={bankAccountForm.available_balance}
                  onChange={(e) => setBankAccountForm({ ...bankAccountForm, available_balance: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowBankAccountModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBankAccount}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FinanceCenter

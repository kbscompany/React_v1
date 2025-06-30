import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  Building2, Plus, Search, Edit2, Trash2, X, 
  CreditCard, CheckCircle2, AlertCircle, ChevronDown,
  ChevronRight, BookOpen, DollarSign, Globe,
  Phone, Mail, Link
} from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { extractResponseData, extractErrorMessage } from '../lib/apiUtils'
import axios from 'axios'
import { Loader2 } from 'lucide-react'

const API_BASE_URL = 'http://localhost:8000'

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
  bank_accounts?: BankAccount[]
}

interface BankAccount {
  id: number
  bank_id: number
  account_name: string
  account_number: string
  iban?: string
  branch?: string
  branch_code?: string
  account_type: string
  currency: string
  opening_balance: number
  current_balance: number
  overdraft_limit: number
  is_active: boolean
  cheque_books?: ChequeBook[]
  bank?: Bank
}

interface ChequeBook {
  id: number
  book_number: string
  bank_account_id: number
  status: 'active' | 'closed' | 'cancelled'
  start_cheque_number: string
  end_cheque_number: string
  total_cheques: number
  used_cheques: number
  cancelled_cheques: number
  remaining_cheques: number
  created_at: string
  closed_at?: string
  bank_account?: BankAccount
}

const BankHierarchyManagement: React.FC = () => {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.dir() === 'rtl'
  
  const [banks, setBanks] = useState<Bank[]>([])
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null)
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedBanks, setExpandedBanks] = useState<Set<number>>(new Set())
  const [expandedAccounts, setExpandedAccounts] = useState<Set<number>>(new Set())
  
  // Modals
  const [showBankModal, setShowBankModal] = useState(false)
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [showChequeBookModal, setShowChequeBookModal] = useState(false)
  const [editingBank, setEditingBank] = useState<Bank | null>(null)
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null)
  
  // Forms
  const [bankForm, setBankForm] = useState({
    name: '',
    short_name: '',
    swift_code: '',
    country: 'Egypt',
    address: '',
    contact_phone: '',
    contact_email: '',
    website: ''
  })
  
  const [accountForm, setAccountForm] = useState({
    bank_id: '',
    account_name: '',
    account_number: '',
    iban: '',
    branch: '',
    branch_code: '',
    account_type: 'checking',
    currency: 'EGP',
    opening_balance: '0',
    overdraft_limit: '0'
  })
  
  const [chequeBookForm, setChequeBookForm] = useState({
    book_number: '',
    bank_account_id: '',
    start_cheque_number: '',
    end_cheque_number: '',
    prefix: '',
    series: '',
    book_type: 'standard'
  })
  
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null)
  
  const token = localStorage.getItem('token')
  const headers = { Authorization: `Bearer ${token}` }
  
  useEffect(() => {
    fetchBanks()
  }, [])
  
  const fetchBanks = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_BASE_URL}/banks`, { headers })
      const banksData = extractResponseData<Bank>(response.data)
      setBanks(banksData)
    } catch (error) {
      console.error('Error fetching banks:', error)
      showNotification('error', t('bankHierarchy.messages.fetchFailed'))
    } finally {
      setLoading(false)
    }
  }
  
  const handleCreateBank = async () => {
    if (!bankForm.name || !bankForm.short_name) {
      showNotification('error', t('bankHierarchy.messages.fillRequired'))
      return
    }
    
    try {
      if (editingBank) {
        await axios.put(`${API_BASE_URL}/banks/${editingBank.id}`, bankForm, { headers })
        showNotification('success', t('bankHierarchy.messages.bankUpdated'))
      } else {
        await axios.post(`${API_BASE_URL}/banks`, bankForm, { headers })
        showNotification('success', t('bankHierarchy.messages.bankCreated'))
      }
      
      setShowBankModal(false)
      resetBankForm()
      fetchBanks()
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error)
      showNotification('error', errorMessage)
    }
  }
  
  const handleCreateAccount = async () => {
    if (!accountForm.bank_id || !accountForm.account_name || !accountForm.account_number) {
      showNotification('error', t('bankHierarchy.messages.fillRequired'))
      return
    }
    
    try {
      const payload = {
        ...accountForm,
        bank_id: parseInt(accountForm.bank_id),
        opening_balance: parseFloat(accountForm.opening_balance) || 0,
        overdraft_limit: parseFloat(accountForm.overdraft_limit) || 0
      }
      
      if (editingAccount) {
        await axios.put(`${API_BASE_URL}/bank-accounts/${editingAccount.id}`, payload, { headers })
        showNotification('success', t('bankHierarchy.messages.accountUpdated'))
      } else {
        await axios.post(`${API_BASE_URL}/bank-accounts`, payload, { headers })
        showNotification('success', t('bankHierarchy.messages.accountCreated'))
      }
      
      setShowAccountModal(false)
      resetAccountForm()
      fetchBanks()
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error)
      showNotification('error', errorMessage)
    }
  }
  
  const handleCreateChequeBook = async () => {
    if (!chequeBookForm.book_number || !chequeBookForm.bank_account_id || 
        !chequeBookForm.start_cheque_number || !chequeBookForm.end_cheque_number) {
      showNotification('error', t('bankHierarchy.messages.fillRequired'))
      return
    }
    
    try {
      const payload = {
        ...chequeBookForm,
        bank_account_id: parseInt(chequeBookForm.bank_account_id)
      }
      
      await axios.post(`${API_BASE_URL}/cheque-books`, payload, { headers })
      showNotification('success', t('bankHierarchy.messages.chequeBookCreated'))
      
      setShowChequeBookModal(false)
      resetChequeBookForm()
      fetchBanks()
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error)
      showNotification('error', errorMessage)
    }
  }
  
  const handleDeleteBank = async (bankId: number) => {
    if (!confirm(t('bankHierarchy.confirmDelete.bank'))) return
    
    try {
      await axios.delete(`${API_BASE_URL}/banks/${bankId}`, { headers })
      showNotification('success', t('bankHierarchy.messages.bankDeleted'))
      fetchBanks()
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error)
      showNotification('error', errorMessage)
    }
  }
  
  const handleDeleteAccount = async (accountId: number) => {
    if (!confirm(t('bankHierarchy.confirmDelete.account'))) return
    
    try {
      await axios.delete(`${API_BASE_URL}/bank-accounts/${accountId}`, { headers })
      showNotification('success', t('bankHierarchy.messages.accountDeleted'))
      fetchBanks()
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error)
      showNotification('error', errorMessage)
    }
  }
  
  const toggleBankExpansion = (bankId: number) => {
    const newExpanded = new Set(expandedBanks)
    if (newExpanded.has(bankId)) {
      newExpanded.delete(bankId)
    } else {
      newExpanded.add(bankId)
    }
    setExpandedBanks(newExpanded)
  }
  
  const toggleAccountExpansion = (accountId: number) => {
    const newExpanded = new Set(expandedAccounts)
    if (newExpanded.has(accountId)) {
      newExpanded.delete(accountId)
    } else {
      newExpanded.add(accountId)
    }
    setExpandedAccounts(newExpanded)
  }
  
  const resetBankForm = () => {
    setBankForm({
      name: '',
      short_name: '',
      swift_code: '',
      country: 'Egypt',
      address: '',
      contact_phone: '',
      contact_email: '',
      website: ''
    })
    setEditingBank(null)
  }
  
  const resetAccountForm = () => {
    setAccountForm({
      bank_id: '',
      account_name: '',
      account_number: '',
      iban: '',
      branch: '',
      branch_code: '',
      account_type: 'checking',
      currency: 'EGP',
      opening_balance: '0',
      overdraft_limit: '0'
    })
    setEditingAccount(null)
  }
  
  const resetChequeBookForm = () => {
    setChequeBookForm({
      book_number: '',
      bank_account_id: '',
      start_cheque_number: '',
      end_cheque_number: '',
      prefix: '',
      series: '',
      book_type: 'standard'
    })
  }
  
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }
  
  const filteredBanks = banks.filter(bank =>
    bank.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bank.short_name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(isRTL ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount)
  }
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="w-6 h-6" />
            {t('bankHierarchy.title')}
          </h2>
          <p className="text-gray-600">{t('bankHierarchy.subtitle')}</p>
        </div>
        
        <Button
          onClick={() => {
            resetBankForm()
            setShowBankModal(true)
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('bankHierarchy.addBank')}
        </Button>
      </div>
      
      {/* Search */}
      <div className="relative">
        <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5`} />
        <Input
          type="text"
          placeholder={t('bankHierarchy.searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`${isRTL ? 'pr-10' : 'pl-10'}`}
        />
      </div>
      
      {/* Banks List */}
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : filteredBanks.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Building2 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">{t('bankHierarchy.noBanks')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredBanks.map(bank => (
            <Card key={bank.id} className="overflow-hidden">
              <CardHeader 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => toggleBankExpansion(bank.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {expandedBanks.has(bank.id) ? (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-500" />
                    )}
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <div>
                      <h3 className="font-semibold">{bank.name}</h3>
                      <p className="text-sm text-gray-500">{bank.short_name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={bank.is_active ? 'default' : 'secondary'}>
                      {bank.is_active ? t('common.active') : t('common.inactive')}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingBank(bank)
                        setBankForm({
                          name: bank.name,
                          short_name: bank.short_name,
                          swift_code: bank.swift_code || '',
                          country: bank.country,
                          address: bank.address || '',
                          contact_phone: bank.contact_phone || '',
                          contact_email: bank.contact_email || '',
                          website: bank.website || ''
                        })
                        setShowBankModal(true)
                      }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteBank(bank.id)
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {expandedBanks.has(bank.id) && (
                <CardContent className="border-t">
                  {/* Bank Details */}
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    {bank.swift_code && (
                      <div>
                        <span className="text-gray-600">{t('bankHierarchy.bank.swift')}:</span>
                        <span className="ml-2 font-medium">{bank.swift_code}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-600">{t('bankHierarchy.bank.country')}:</span>
                      <span className="ml-2 font-medium">{bank.country}</span>
                    </div>
                    {bank.contact_phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span>{bank.contact_phone}</span>
                      </div>
                    )}
                    {bank.contact_email && (
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span>{bank.contact_email}</span>
                      </div>
                    )}
                    {bank.website && (
                      <div className="flex items-center gap-1">
                        <Link className="w-4 h-4 text-gray-500" />
                        <a href={bank.website} target="_blank" rel="noopener noreferrer" 
                           className="text-blue-600 hover:underline">
                          {bank.website}
                        </a>
                      </div>
                    )}
                  </div>
                  
                  {/* Bank Accounts */}
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium">{t('bankHierarchy.bankAccounts')}</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          resetAccountForm()
                          setAccountForm(prev => ({ ...prev, bank_id: bank.id.toString() }))
                          setShowAccountModal(true)
                        }}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        {t('bankHierarchy.addAccount')}
                      </Button>
                    </div>
                    
                    {bank.bank_accounts && bank.bank_accounts.length > 0 ? (
                      <div className="space-y-2">
                        {bank.bank_accounts.map(account => (
                          <div key={account.id} className="border rounded-lg p-3 hover:bg-gray-50">
                            <div 
                              className="cursor-pointer"
                              onClick={() => toggleAccountExpansion(account.id)}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                  {expandedAccounts.has(account.id) ? (
                                    <ChevronDown className="w-4 h-4 text-gray-500" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-gray-500" />
                                  )}
                                  <CreditCard className="w-4 h-4 text-green-600" />
                                  <div>
                                    <p className="font-medium">{account.account_name}</p>
                                    <p className="text-sm text-gray-500">{account.account_number}</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {account.currency}
                                  </Badge>
                                  <Badge variant={account.is_active ? 'default' : 'secondary'} className="text-xs">
                                    {account.is_active ? t('common.active') : t('common.inactive')}
                                  </Badge>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setEditingAccount(account)
                                      setAccountForm({
                                        bank_id: account.bank_id.toString(),
                                        account_name: account.account_name,
                                        account_number: account.account_number,
                                        iban: account.iban || '',
                                        branch: account.branch || '',
                                        branch_code: account.branch_code || '',
                                        account_type: account.account_type,
                                        currency: account.currency,
                                        opening_balance: account.opening_balance.toString(),
                                        overdraft_limit: account.overdraft_limit.toString()
                                      })
                                      setShowAccountModal(true)
                                    }}
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeleteAccount(account.id)
                                    }}
                                  >
                                    <Trash2 className="w-3 h-3 text-red-500" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                            
                            {expandedAccounts.has(account.id) && (
                              <div className="mt-3 pt-3 border-t">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  {account.iban && (
                                    <div>
                                      <span className="text-gray-600">{t('bankHierarchy.account.iban')}:</span>
                                      <span className="ml-2 font-mono">{account.iban}</span>
                                    </div>
                                  )}
                                  {account.branch && (
                                    <div>
                                      <span className="text-gray-600">{t('bankHierarchy.account.branch')}:</span>
                                      <span className="ml-2">{account.branch}</span>
                                    </div>
                                  )}
                                  <div>
                                    <span className="text-gray-600">{t('bankHierarchy.account.balance')}:</span>
                                    <span className="ml-2 font-medium">{formatCurrency(account.current_balance)}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">{t('bankHierarchy.account.overdraft')}:</span>
                                    <span className="ml-2">{formatCurrency(account.overdraft_limit)}</span>
                                  </div>
                                </div>
                                
                                {/* Cheque Books for this account */}
                                <div className="mt-3">
                                  <div className="flex justify-between items-center mb-2">
                                    <p className="text-sm font-medium">{t('bankHierarchy.chequeBooks')}</p>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-xs"
                                      onClick={() => {
                                        resetChequeBookForm()
                                        setChequeBookForm(prev => ({ 
                                          ...prev, 
                                          bank_account_id: account.id.toString() 
                                        }))
                                        setShowChequeBookModal(true)
                                      }}
                                    >
                                      <BookOpen className="w-3 h-3 mr-1" />
                                      {t('bankHierarchy.addChequeBook')}
                                    </Button>
                                  </div>
                                  
                                  {account.cheque_books && account.cheque_books.length > 0 ? (
                                    <div className="space-y-1">
                                      {account.cheque_books.map(book => (
                                        <div key={book.id} className="bg-gray-50 rounded p-2 text-xs">
                                          <div className="flex justify-between items-center">
                                            <div>
                                              <span className="font-medium">{book.book_number}</span>
                                              <span className="mx-2">•</span>
                                              <span>{book.start_cheque_number} - {book.end_cheque_number}</span>
                                            </div>
                                            <Badge 
                                              variant={
                                                book.status === 'active' ? 'default' : 
                                                book.status === 'closed' ? 'secondary' : 
                                                'destructive'
                                              }
                                              className="text-xs"
                                            >
                                              {t(`bankHierarchy.chequeBook.status.${book.status}`)}
                                            </Badge>
                                          </div>
                                          <div className="mt-1 text-gray-600">
                                            {t('bankHierarchy.chequeBook.used')}: {book.used_cheques}/{book.total_cheques}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-gray-500">{t('bankHierarchy.noChequeBooks')}</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">{t('bankHierarchy.noAccounts')}</p>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
      
      {/* Bank Modal */}
      {showBankModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingBank ? t('bankHierarchy.editBank') : t('bankHierarchy.createBank')}
              </h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowBankModal(false)
                  resetBankForm()
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('bankHierarchy.bank.name')} *</Label>
                  <Input
                    value={bankForm.name}
                    onChange={(e) => setBankForm({ ...bankForm, name: e.target.value })}
                    placeholder={t('bankHierarchy.bank.namePlaceholder')}
                  />
                </div>
                <div>
                  <Label>{t('bankHierarchy.bank.shortName')} *</Label>
                  <Input
                    value={bankForm.short_name}
                    onChange={(e) => setBankForm({ ...bankForm, short_name: e.target.value })}
                    placeholder={t('bankHierarchy.bank.shortNamePlaceholder')}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('bankHierarchy.bank.swift')}</Label>
                  <Input
                    value={bankForm.swift_code}
                    onChange={(e) => setBankForm({ ...bankForm, swift_code: e.target.value })}
                    placeholder="AAAA-BB-CC-123"
                  />
                </div>
                <div>
                  <Label>{t('bankHierarchy.bank.country')}</Label>
                  <Input
                    value={bankForm.country}
                    onChange={(e) => setBankForm({ ...bankForm, country: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <Label>{t('bankHierarchy.bank.address')}</Label>
                <Input
                  value={bankForm.address}
                  onChange={(e) => setBankForm({ ...bankForm, address: e.target.value })}
                  placeholder={t('bankHierarchy.bank.addressPlaceholder')}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('bankHierarchy.bank.phone')}</Label>
                  <Input
                    value={bankForm.contact_phone}
                    onChange={(e) => setBankForm({ ...bankForm, contact_phone: e.target.value })}
                    placeholder="+20 123 456 7890"
                  />
                </div>
                <div>
                  <Label>{t('bankHierarchy.bank.email')}</Label>
                  <Input
                    type="email"
                    value={bankForm.contact_email}
                    onChange={(e) => setBankForm({ ...bankForm, contact_email: e.target.value })}
                    placeholder="contact@bank.com"
                  />
                </div>
              </div>
              
              <div>
                <Label>{t('bankHierarchy.bank.website')}</Label>
                <Input
                  type="url"
                  value={bankForm.website}
                  onChange={(e) => setBankForm({ ...bankForm, website: e.target.value })}
                  placeholder="https://www.bank.com"
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowBankModal(false)
                    resetBankForm()
                  }}
                >
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleCreateBank}>
                  {editingBank ? t('common.update') : t('common.create')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Account Modal */}
      {showAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingAccount ? t('bankHierarchy.editAccount') : t('bankHierarchy.createAccount')}
              </h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowAccountModal(false)
                  resetAccountForm()
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label>{t('bankHierarchy.account.bank')} *</Label>
                <Select
                  value={accountForm.bank_id}
                  onValueChange={(value) => setAccountForm({ ...accountForm, bank_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('bankHierarchy.account.selectBank')} />
                  </SelectTrigger>
                  <SelectContent>
                    {banks.map(bank => (
                      <SelectItem key={bank.id} value={bank.id.toString()}>
                        {bank.name} ({bank.short_name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('bankHierarchy.account.name')} *</Label>
                  <Input
                    value={accountForm.account_name}
                    onChange={(e) => setAccountForm({ ...accountForm, account_name: e.target.value })}
                    placeholder={t('bankHierarchy.account.namePlaceholder')}
                  />
                </div>
                <div>
                  <Label>{t('bankHierarchy.account.number')} *</Label>
                  <Input
                    value={accountForm.account_number}
                    onChange={(e) => setAccountForm({ ...accountForm, account_number: e.target.value })}
                    placeholder="1234567890"
                  />
                </div>
              </div>
              
              <div>
                <Label>{t('bankHierarchy.account.iban')}</Label>
                <Input
                  value={accountForm.iban}
                  onChange={(e) => setAccountForm({ ...accountForm, iban: e.target.value })}
                  placeholder="EG123456789012345678901234567"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('bankHierarchy.account.branch')}</Label>
                  <Input
                    value={accountForm.branch}
                    onChange={(e) => setAccountForm({ ...accountForm, branch: e.target.value })}
                    placeholder={t('bankHierarchy.account.branchPlaceholder')}
                  />
                </div>
                <div>
                  <Label>{t('bankHierarchy.account.branchCode')}</Label>
                  <Input
                    value={accountForm.branch_code}
                    onChange={(e) => setAccountForm({ ...accountForm, branch_code: e.target.value })}
                    placeholder="001"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('bankHierarchy.account.type')}</Label>
                  <Select
                    value={accountForm.account_type}
                    onValueChange={(value) => setAccountForm({ ...accountForm, account_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checking">{t('bankHierarchy.account.types.checking')}</SelectItem>
                      <SelectItem value="savings">{t('bankHierarchy.account.types.savings')}</SelectItem>
                      <SelectItem value="business">{t('bankHierarchy.account.types.business')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t('bankHierarchy.account.currency')}</Label>
                  <Select
                    value={accountForm.currency}
                    onValueChange={(value) => setAccountForm({ ...accountForm, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EGP">EGP</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('bankHierarchy.account.openingBalance')}</Label>
                  <Input
                    type="number"
                    value={accountForm.opening_balance}
                    onChange={(e) => setAccountForm({ ...accountForm, opening_balance: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>{t('bankHierarchy.account.overdraftLimit')}</Label>
                  <Input
                    type="number"
                    value={accountForm.overdraft_limit}
                    onChange={(e) => setAccountForm({ ...accountForm, overdraft_limit: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAccountModal(false)
                    resetAccountForm()
                  }}
                >
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleCreateAccount}>
                  {editingAccount ? t('common.update') : t('common.create')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Cheque Book Modal */}
      {showChequeBookModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{t('bankHierarchy.createChequeBook')}</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowChequeBookModal(false)
                  resetChequeBookForm()
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label>{t('bankHierarchy.chequeBook.bookNumber')} *</Label>
                <Input
                  value={chequeBookForm.book_number}
                  onChange={(e) => setChequeBookForm({ ...chequeBookForm, book_number: e.target.value })}
                  placeholder="CB-2024-001"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('bankHierarchy.chequeBook.startNumber')} *</Label>
                  <Input
                    value={chequeBookForm.start_cheque_number}
                    onChange={(e) => setChequeBookForm({ ...chequeBookForm, start_cheque_number: e.target.value })}
                    placeholder="0001"
                  />
                </div>
                <div>
                  <Label>{t('bankHierarchy.chequeBook.endNumber')} *</Label>
                  <Input
                    value={chequeBookForm.end_cheque_number}
                    onChange={(e) => setChequeBookForm({ ...chequeBookForm, end_cheque_number: e.target.value })}
                    placeholder="0050"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('bankHierarchy.chequeBook.prefix')}</Label>
                  <Input
                    value={chequeBookForm.prefix}
                    onChange={(e) => setChequeBookForm({ ...chequeBookForm, prefix: e.target.value })}
                    placeholder="CHQ-"
                  />
                </div>
                <div>
                  <Label>{t('bankHierarchy.chequeBook.series')}</Label>
                  <Input
                    value={chequeBookForm.series}
                    onChange={(e) => setChequeBookForm({ ...chequeBookForm, series: e.target.value })}
                    placeholder="A"
                  />
                </div>
              </div>
              
              <div>
                <Label>{t('bankHierarchy.chequeBook.type')}</Label>
                <Select
                  value={chequeBookForm.book_type}
                  onValueChange={(value) => setChequeBookForm({ ...chequeBookForm, book_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">{t('bankHierarchy.chequeBook.types.standard')}</SelectItem>
                    <SelectItem value="business">{t('bankHierarchy.chequeBook.types.business')}</SelectItem>
                    <SelectItem value="personal">{t('bankHierarchy.chequeBook.types.personal')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowChequeBookModal(false)
                    resetChequeBookForm()
                  }}
                >
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleCreateChequeBook}>
                  {t('common.create')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Notification */}
      {notification && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default BankHierarchyManagement 
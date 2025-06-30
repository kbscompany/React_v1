import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import axios from 'axios'
import { 
  Coffee, 
  Cake, 
  Cookie, 
  Wheat, 
  Search, 
  CalendarDays, 
  Plus,
  PiggyBank,
  Receipt,
  ChefHat,
  Croissant,
  Heart,
  Star,
  MapPin,
  Phone,
  Clock,
  DollarSign
} from 'lucide-react'

interface BankAccount {
  id: number
  account_name: string
  account_number: string
  bank_name: string
  branch?: string
  total_cheques?: number
  active_cheques?: number
}

interface Cheque {
  id: number
  cheque_number: string
  bank_account_id: number
  bank_account?: BankAccount
  issue_date: string
  amount: string
  status: string
}

const BankAccountsCheques: React.FC = () => {
  const { t } = useTranslation()
  const [banks, setBanks] = useState<BankAccount[]>([])
  const [cheques, setCheques] = useState<Cheque[]>([])
  
  const [selectedBankId, setSelectedBankId] = useState<number | null>(null)
  const [searchText, setSearchText] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadBankAccounts()
    loadCheques()
  }, [])

  useEffect(() => {
    loadCheques()
  }, [selectedBankId, searchText, startDate, endDate])

  const loadBankAccounts = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/bank-accounts')
      setBanks(response.data)
    } catch (error) {
      console.error('Failed to load bank accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCheques = async () => {
    try {
      setLoading(true)
      const params: any = {}
      if (selectedBankId) params.bank_account_id = selectedBankId
      const response = await axios.get('/cheques/unassigned', { params })
      setCheques(response.data)
    } catch (error) {
      console.error('Failed to load cheques:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCheques = useMemo(() => {
    return cheques.filter(cheque => {
      const matchesSearch = searchText === '' || 
        cheque.cheque_number.toLowerCase().includes(searchText.toLowerCase())
      
      const matchesDateRange = (!startDate || cheque.issue_date >= startDate) &&
        (!endDate || cheque.issue_date <= endDate)
      
      return matchesSearch && matchesDateRange
    })
  }, [cheques, searchText, startDate, endDate])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'created': return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'assigned': return 'bg-green-100 text-green-800 border-green-200'
      case 'active': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'settled': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'created': return <Cookie className="w-4 h-4" />
      case 'assigned': return <Wheat className="w-4 h-4" />
      case 'active': return <Cake className="w-4 h-4" />
      case 'settled': return <Coffee className="w-4 h-4" />
      default: return <Heart className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      {/* Bakery Header */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 text-white py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-full">
                <ChefHat className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{t('finance.title')}</h1>
                <p className="text-amber-100">{t('finance.subtitle')}</p>
              </div>
            </div>
            <div className="flex items-center space-x-6 text-amber-100">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{t('bankAccountsCheques.header.freshFinancial')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm">{t('bankAccountsCheques.header.sweetSupport')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Bakery Bank Accounts Section */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-amber-200">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 p-3 rounded-full">
                  <PiggyBank className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{t('bankAccountsCheques.bankAccounts.title')}</h2>
                  <p className="text-amber-100">{t('bankAccountsCheques.bankAccounts.subtitle')}</p>
                </div>
              </div>
              <button className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-full flex items-center space-x-2 transition-all">
                <Plus className="w-5 h-5" />
                <span>{t('bankAccountsCheques.bankAccounts.addNew')}</span>
              </button>
            </div>
          </div>

          <div className="p-8">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
                <span className="ml-4 text-amber-600 font-medium">{t('bankAccountsCheques.bankAccounts.loading')}</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {banks.map((bank) => (
                  <div
                    key={bank.id}
                    className="bg-gradient-to-br from-white to-amber-50 rounded-2xl p-6 shadow-lg border border-amber-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-3 rounded-full">
                        <Wheat className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-1 text-amber-600">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="text-sm font-medium">{t('bankAccountsCheques.bankAccounts.labels.active')}</span>
                        </div>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{bank.account_name}</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center justify-between">
                        <span>{t('bankAccountsCheques.bankAccounts.labels.bank')}:</span>
                        <span className="font-medium text-gray-800">{bank.bank_name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{t('bankAccountsCheques.bankAccounts.labels.accountNumber')}:</span>
                        <span className="font-mono text-gray-800">{bank.account_number}</span>
                      </div>
                      {bank.branch && (
                        <div className="flex items-center justify-between">
                          <span>{t('bankAccountsCheques.bankAccounts.labels.branch')}:</span>
                          <span className="font-medium text-gray-800">{bank.branch}</span>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-amber-200 mt-4 pt-4">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="bg-amber-100 rounded-lg p-3">
                          <div className="text-2xl font-bold text-amber-700">{bank.total_cheques || 0}</div>
                          <div className="text-xs text-amber-600">{t('bankAccountsCheques.bankAccounts.labels.totalCheques')}</div>
                        </div>
                        <div className="bg-green-100 rounded-lg p-3">
                          <div className="text-2xl font-bold text-green-700">{bank.active_cheques || 0}</div>
                          <div className="text-xs text-green-600">{t('bankAccountsCheques.bankAccounts.labels.active')}</div>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => setSelectedBankId(selectedBankId === bank.id ? null : bank.id)}
                      className={`w-full mt-4 py-3 px-4 rounded-xl font-medium transition-all ${
                        selectedBankId === bank.id
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                          : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                      }`}
                    >
                      {selectedBankId === bank.id ? t('bankAccountsCheques.bankAccounts.labels.selectedAccount') : t('bankAccountsCheques.bankAccounts.labels.viewCheques')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bakery Cheques Section */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-amber-200">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 p-3 rounded-full">
                  <Receipt className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{t('bankAccountsCheques.cheques.title')}</h2>
                  <p className="text-orange-100">{t('bankAccountsCheques.cheques.subtitle')}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-orange-100">
                <Croissant className="w-5 h-5" />
                <span className="font-medium">{filteredCheques.length} {t('bankAccountsCheques.cheques.count')}</span>
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* Bakery Search & Filter Controls */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 mb-8 border border-amber-200">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-3 flex-1 min-w-64">
                  <div className="bg-white p-2 rounded-full border border-amber-300">
                    <Search className="w-5 h-5 text-amber-600" />
                  </div>
                  <input
                    type="text"
                    placeholder={t('bankAccountsCheques.cheques.searchPlaceholder')}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl border border-amber-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none bg-white"
                  />
                </div>

                <div className="flex items-center space-x-3">
                  <CalendarDays className="w-5 h-5 text-amber-600" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-4 py-3 rounded-xl border border-amber-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none bg-white"
                  />
                  <span className="text-amber-600 font-medium">{t('bankAccountsCheques.cheques.dateRange')}</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-4 py-3 rounded-xl border border-amber-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none bg-white"
                  />
                </div>

                <button
                  onClick={() => {
                    setSearchText('')
                    setStartDate('')
                    setEndDate('')
                    setSelectedBankId(null)
                  }}
                  className="bg-amber-200 hover:bg-amber-300 text-amber-800 px-6 py-3 rounded-xl font-medium transition-all"
                >
                  {t('bankAccountsCheques.cheques.clearFilters')}
                </button>
              </div>
            </div>

            {/* Cheques Display */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600"></div>
                <span className="ml-4 text-orange-600 font-medium text-lg">{t('bankAccountsCheques.cheques.loading')}</span>
              </div>
            ) : filteredCheques.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-amber-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Cookie className="w-12 h-12 text-amber-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('bankAccountsCheques.cheques.emptyState.title')}</h3>
                <p className="text-gray-600">{t('bankAccountsCheques.cheques.emptyState.subtitle')}</p>
                <button className="mt-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-8 py-3 rounded-xl font-medium hover:shadow-lg transition-all">
                  {t('finance.buttons.newCheque')}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl p-4 border border-amber-200">
                  <div className="grid grid-cols-5 gap-4 text-sm font-semibold text-amber-800">
                    <div className="flex items-center space-x-2">
                      <Receipt className="w-4 h-4" />
                      <span>{t('bankAccountsCheques.cheques.headers.chequeNumber')}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CalendarDays className="w-4 h-4" />
                      <span>{t('bankAccountsCheques.cheques.headers.issueDate')}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4" />
                      <span>{t('bankAccountsCheques.cheques.headers.amount')}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <ChefHat className="w-4 h-4" />
                      <span>{t('bankAccountsCheques.cheques.headers.status')}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <PiggyBank className="w-4 h-4" />
                      <span>{t('bankAccountsCheques.cheques.headers.bankAccount')}</span>
                    </div>
                  </div>
                </div>

                {/* Cheque Rows */}
                {filteredCheques.map((cheque) => (
                  <div
                    key={cheque.id}
                    className="bg-white rounded-xl p-6 shadow-md border border-amber-200 hover:shadow-lg transition-all duration-200 hover:border-amber-300"
                  >
                    <div className="grid grid-cols-5 gap-4 items-center">
                      <div className="font-mono text-lg font-bold text-gray-800">
                        {cheque.cheque_number}
                      </div>
                      
                      <div className="text-gray-600">
                        {new Date(cheque.issue_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                      
                      <div className="text-lg font-semibold text-green-600">
                        ${parseFloat(cheque.amount || '0').toLocaleString()}
                      </div>
                      
                      <div>
                        <span className={`inline-flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium border ${getStatusColor(cheque.status)}`}>
                          {getStatusIcon(cheque.status)}
                          <span className="capitalize">{cheque.status}</span>
                        </span>
                      </div>
                      
                      <div className="text-sm">
                        <div className="font-medium text-gray-800">
                          {cheque.bank_account?.account_name || t('bankAccountsCheques.cheques.unknownAccount')}
                        </div>
                        <div className="text-gray-500">
                          {cheque.bank_account?.bank_name || t('bankAccountsCheques.cheques.unknownBank')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bakery Footer */}
      <div className="bg-gradient-to-r from-amber-800 via-orange-800 to-red-800 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <ChefHat className="w-6 h-6" />
            <span className="text-xl font-bold">{t('bankAccountsCheques.footer.title')}</span>
            <Heart className="w-6 h-6 fill-current" />
          </div>
          <p className="text-amber-200">
            {t('bankAccountsCheques.footer.subtitle')}
          </p>
        </div>
      </div>
    </div>
  )
}

export default BankAccountsCheques 
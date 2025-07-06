import React, { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import {
  CreditCard,
  Building,
  Shield,
  ClipboardList,
  CheckCircle,
  XCircle,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { extractResponseData, extractErrorMessage } from '../lib/apiUtils'

interface BankAccount {
  id: number
  account_name: string
  account_number: string
  bank_name: string
  branch?: string
  available_balance?: string
}

interface Safe {
  id: number
  name: string
  description?: string
}

interface Cheque {
  id: number
  cheque_number: string
  bank_account_id: number
  bank_account?: BankAccount
  issue_date: string
  amount: string
  status?: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onIssued?: () => void
}

// Custom Searchable Select Component
interface SearchableSelectProps {
  options: Cheque[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  required?: boolean
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Choose...",
  className = "",
  required = false
}) => {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredOptions, setFilteredOptions] = useState<Cheque[]>(options)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedOption = options.find(option => option.id.toString() === value)

  useEffect(() => {
    setFilteredOptions(options)
  }, [options])

  useEffect(() => {
    const filtered = options.filter(option =>
      option.cheque_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (option.bank_account && option.bank_account.toString().toLowerCase().includes(searchTerm.toLowerCase())) ||
      (option.status && option.status.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    setFilteredOptions(filtered)
  }, [searchTerm, options])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleOptionSelect = (option: Cheque) => {
    onChange(option.id.toString())
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleInputClick = () => {
    setIsOpen(true)
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const getDisplayText = () => {
    if (selectedOption) {
      return `${selectedOption.cheque_number} | ${t('finance.bankCard.bank')}: ${selectedOption.bank_account || t('finance.cheques.unknownBank')} | ${t('finance.issueChequeModal.status')}: ${selectedOption.status || 'created'}`
    }
    return ''
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div 
        className="w-full border border-gray-300 rounded-md px-3 py-2 cursor-pointer flex items-center justify-between bg-white"
        onClick={handleInputClick}
      >
        <div className="flex items-center flex-1">
          <Search className="w-4 h-4 text-gray-400 mr-2" />
          {selectedOption ? (
            <span className="text-gray-900">{getDisplayText()}</span>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-gray-200">
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('finance.issueChequeModal.searchChequesPlaceholder')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => (
                <div
                  key={option.id}
                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  onClick={() => handleOptionSelect(option)}
                >
                  <div className="font-medium text-gray-900">
                    {option.cheque_number}
                  </div>
                  <div className="text-sm text-gray-600">
                    {t('finance.bankCard.bank')}: {option.bank_account || t('finance.cheques.unknownBank')} | {t('finance.issueChequeModal.status')}: {option.status || 'created'}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-gray-500 text-center">
                {t('finance.issueChequeModal.noChequesFound')} "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const IssueChequeModal: React.FC<Props> = ({ isOpen, onClose, onIssued }) => {
  const { t, i18n } = useTranslation()
  
  // Force Arabic language for testing - remove this after testing
  React.useEffect(() => {
    if (isOpen && i18n.language !== 'ar') {
      console.log('🔧 Forcing Arabic language for testing...')
      i18n.changeLanguage('ar')
      document.documentElement.dir = 'rtl'
      document.documentElement.lang = 'ar'
      document.body.classList.remove('ltr', 'rtl')
      document.body.classList.add('rtl')
    }
  }, [isOpen, i18n])
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [cheques, setCheques] = useState<Cheque[]>([])
  const [safes, setSafes] = useState<Safe[]>([])
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])

  const [form, setForm] = useState({
    cheque_id: '',
    safe_id: '',
    amount: '',
    department: '',
    issued_to: '',
    due_date: new Date().toISOString().split('T')[0]
  })

  const selectedCheque = cheques.find(c => c.id === Number(form.cheque_id))

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setError('')
      setSuccess('')
      return
    }
    loadInitial()
  }, [isOpen])

  const loadInitial = async () => {
    try {
      console.log('🔄 Loading initial data...')
      const [cq, sf, ba] = await Promise.all([
        axios.get('http://localhost:8000/cheques-unassigned-simple'),
        axios.get('http://localhost:8000/safes-simple'),
        axios.get('http://localhost:8000/bank-accounts-simple')
      ])
      console.log('📄 Cheques raw response:', cq.data)
      console.log('🏦 Safes raw response:', sf.data)
      console.log('💳 Bank accounts raw response:', ba.data)
      
      // Use utility functions to handle response format inconsistencies
      const chequesData = extractResponseData(cq.data)
      const safesData = extractResponseData(sf.data)
      const bankAccountsData = extractResponseData(ba.data)
      
      console.log('📄 Cheques extracted:', chequesData)
      console.log('🏦 Safes extracted:', safesData)
      console.log('💳 Bank accounts extracted:', bankAccountsData)
      
      setCheques(chequesData)
      setSafes(safesData)
      setBankAccounts(bankAccountsData)
      setError('') // Clear any previous errors
      console.log('✅ Data loaded successfully')
    } catch (e: any) {
      console.error('❌ Error loading data:', e)
      const errorMessage = extractErrorMessage(e)
      setError(`${t('finance.issueChequeModal.loadingDataFailed')}: ${errorMessage}`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.cheque_id) return setError(t('finance.issueChequeModal.validationErrors.selectCheque'))
    if (!form.safe_id) return setError(t('finance.issueChequeModal.validationErrors.selectSafe'))
    if (!form.amount) return setError(t('finance.issueChequeModal.validationErrors.enterAmount'))
    if (!form.issued_to) return setError(t('finance.issueChequeModal.validationErrors.enterIssuedTo'))

    try {
      setLoading(true)
      setError('')
      console.log('🚀 Starting cheque issue process...', { form })
      
      // 1) update cheque with all details (amount, status, issued_to, department, issue_date)
      console.log('📝 Updating cheque with all details...')
      const updateResponse = await axios.put(`http://localhost:8000/cheques-simple/${form.cheque_id}`, {
        amount: parseFloat(form.amount),
        status: 'assigned',
        issued_to: form.issued_to,
        issue_date: form.due_date,  // Using due_date as issue_date
        department: form.department
      })
      console.log('✅ Cheque updated with all details:', updateResponse.data)
      
      // 2) assign to safe (only if a safe is selected)
      if (form.safe_id) {
        console.log('🏦 Assigning cheque to safe...')
        const assignResponse = await axios.post('http://localhost:8000/cheques/assign-to-safe-simple', {
          safe_id: Number(form.safe_id),
          cheque_ids: [Number(form.cheque_id)]
        })
        console.log('✅ Cheque assigned to safe:', assignResponse.data)
      }
      
      console.log('🎉 Cheque issued successfully!')
      setSuccess(t('finance.issueChequeModal.chequeIssuedSuccess'))
      setTimeout(() => setSuccess(''), 4000)
      if (onIssued) onIssued()
      // reset form
      setForm({
        cheque_id: '',
        safe_id: '',
        amount: '',
        department: '',
        issued_to: '',
        due_date: new Date().toISOString().split('T')[0]
      })
      setCheques(prev => prev.filter(c => c.id !== Number(form.cheque_id)))
    } catch (e: any) {
      console.error('❌ Error issuing cheque:', e)
      console.error('❌ Error response:', e.response?.data)
      const errorMessage = extractErrorMessage(e)
      setError(`${t('finance.issueChequeModal.issueChequeFailed')}: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center overflow-auto py-10">
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-xl p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-blue-600" /> {t('finance.issueChequeModal.title')}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">×</button>
        </div>

        {/* Stats bar */}
        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-md text-sm font-medium">
          {t('finance.issueChequeModal.availableCheques')}: {cheques.length} | {t('finance.issueChequeModal.accessibleSafes')}: {safes.length}
        </div>

        {/* Error / Success */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2 rounded-md text-sm">
            <XCircle className="w-4 h-4" /> {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-md text-sm">
            <CheckCircle className="w-4 h-4" /> {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8 overflow-y-auto max-h-[70vh] pr-2">
          {/* Select Cheque */}
          <section>
            <header className="flex items-center gap-2 mb-3 font-semibold text-gray-700">
              <CreditCard className="w-5 h-5" /> {t('finance.issueChequeModal.selectChequeNumber')}
            </header>
            <SearchableSelect
              options={cheques}
              value={form.cheque_id}
              onChange={(value) => setForm({ ...form, cheque_id: value })}
              placeholder={t('finance.issueChequeModal.searchSelectCheque')}
              required
            />
          </section>

          {/* Bank Account Info */}
          {selectedCheque && (
            <section>
              <header className="flex items-center gap-2 mb-3 font-semibold text-gray-700">
                <Building className="w-5 h-5" /> {t('finance.issueChequeModal.bankAccountDetails')}
              </header>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-900 text-sm bg-gray-50 p-4 rounded-md">
                <div>
                  <div className="text-xs text-gray-500">{t('finance.issueChequeModal.bankAccount')}</div>
                  {selectedCheque.bank_account || 'N/A'}
                </div>
                <div>
                  <div className="text-xs text-gray-500">{t('finance.issueChequeModal.chequeAmount')}</div>
                  ${selectedCheque.amount || '0.00'}
                </div>
                <div>
                  <div className="text-xs text-gray-500">{t('finance.issueChequeModal.status')}</div>
                  {selectedCheque.status || 'created'}
                </div>
              </div>
            </section>
          )}

          {/* Safe Assignment */}
          <section>
            <header className="flex items-center gap-2 mb-3 font-semibold text-gray-700">
              <Shield className="w-5 h-5" /> {t('finance.issueChequeModal.safeAssignment')}
            </header>
            <select
              value={form.safe_id}
              onChange={(e) => setForm({ ...form, safe_id: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">{t('finance.issueChequeModal.noSafe')}</option>
              {safes.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {!form.safe_id && (
              <div className="mt-2 text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded">
                {t('finance.issueChequeModal.chequeNotAssigned')}
              </div>
            )}
          </section>

          {/* Allocation Details */}
          <section>
            <header className="flex items-center gap-2 mb-3 font-semibold text-gray-700">
              <ClipboardList className="w-5 h-5" /> {t('finance.issueChequeModal.allocationDetails')}
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('finance.issueChequeModal.department')}</label>
                <input
                  type="text"
                  placeholder={t('finance.issueChequeModal.departmentPlaceholder')}
                  value={form.department}
                  onChange={e => setForm({ ...form, department: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('finance.issueChequeModal.issuedTo')} *</label>
                <input
                  type="text"
                  placeholder={t('finance.issueChequeModal.issuedToPlaceholder')}
                  value={form.issued_to}
                  onChange={e => setForm({ ...form, issued_to: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('finance.issueChequeModal.chequeAmount')}</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('finance.issueChequeModal.dueDate')}</label>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={e => setForm({ ...form, due_date: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
            >{t('common.cancel')}</button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >{loading ? t('finance.issueChequeModal.issuing') : t('finance.issueChequeModal.issueCheque')}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default IssueChequeModal 

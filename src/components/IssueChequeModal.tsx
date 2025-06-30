import React, { useEffect, useState } from 'react'
import axios from 'axios'
import {
  CreditCard,
  Building,
  Shield,
  ClipboardList,
  CheckCircle,
  XCircle
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
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onIssued?: () => void
}

const IssueChequeModal: React.FC<Props> = ({ isOpen, onClose, onIssued }) => {
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
      setError(`Failed to load data: ${errorMessage}`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.cheque_id) return setError('Please select a cheque')
    if (!form.safe_id) return setError('Please select a safe')
    if (!form.amount) return setError('Please enter amount')
    if (!form.issued_to) return setError('Please enter who the cheque is issued to')

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
      setSuccess('Cheque issued successfully!')
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
      setError(`Failed to issue cheque: ${errorMessage}`)
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
            <CreditCard className="w-6 h-6 text-blue-600" /> Issue Department Safe Cheque
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">×</button>
        </div>

        {/* Stats bar */}
        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-md text-sm font-medium">
          Available cheques: {cheques.length} | Accessible safes: {safes.length}
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
              <CreditCard className="w-5 h-5" /> Select Cheque Number
            </header>
            <select
              value={form.cheque_id}
              onChange={(e) => setForm({ ...form, cheque_id: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required
            >
              <option value="">Choose cheque...</option>
              {cheques.map(ch => (
                <option key={ch.id} value={ch.id}>
                  {ch.cheque_number} | Bank: {ch.bank_account || 'Unknown'} | Status: {ch.status}
                </option>
              ))}
            </select>
          </section>

          {/* Bank Account Info */}
          {selectedCheque && (
            <section>
              <header className="flex items-center gap-2 mb-3 font-semibold text-gray-700">
                <Building className="w-5 h-5" /> Bank Account Details
              </header>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-900 text-sm bg-gray-50 p-4 rounded-md">
                <div>
                  <div className="text-xs text-gray-500">Bank Account</div>
                  {selectedCheque.bank_account || 'N/A'}
                </div>
                <div>
                  <div className="text-xs text-gray-500">Cheque Amount</div>
                  ${selectedCheque.amount || '0.00'}
                </div>
                <div>
                  <div className="text-xs text-gray-500">Status</div>
                  {selectedCheque.status || 'Created'}
                </div>
              </div>
            </section>
          )}

          {/* Safe Assignment */}
          <section>
            <header className="flex items-center gap-2 mb-3 font-semibold text-gray-700">
              <Shield className="w-5 h-5" /> Safe Assignment (Optional)
            </header>
            <select
              value={form.safe_id}
              onChange={(e) => setForm({ ...form, safe_id: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">No Safe</option>
              {safes.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {!form.safe_id && (
              <div className="mt-2 text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded">
                Cheque will not be assigned to any safe
              </div>
            )}
          </section>

          {/* Allocation Details */}
          <section>
            <header className="flex items-center gap-2 mb-3 font-semibold text-gray-700">
              <ClipboardList className="w-5 h-5" /> Allocation Details
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input
                  type="text"
                  placeholder="e.g., Accounting"
                  value={form.department}
                  onChange={e => setForm({ ...form, department: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Issued To (Person or Entity) *</label>
                <input
                  type="text"
                  placeholder="e.g., Ahmed Mohammed"
                  value={form.issued_to}
                  onChange={e => setForm({ ...form, issued_to: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cheque Amount</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
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
            >Cancel</button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >{loading ? 'Issuing...' : 'Issue Cheque'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default IssueChequeModal 

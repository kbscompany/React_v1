import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import IssueChequeModal from './IssueChequeModal'
import CategorySelector from './CategorySelector'
import ExpenseSearchAndSummary from './ExpenseSearchAndSummary'
import { extractResponseData, extractErrorMessage } from '../lib/apiUtils'

// API Configuration
const API_BASE_URL = 'http://100.29.4.72:8000'

function ExpenseManagement({ user }) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [activeView, setActiveView] = useState('dashboard')
  const [activeExpenseTab, setActiveExpenseTab] = useState('list')
  const [safes, setSafes] = useState([])
  const [selectedSafe, setSelectedSafe] = useState(null)
  const [cheques, setCheques] = useState([])
  const [expenses, setExpenses] = useState([])
  const [categories, setCategories] = useState([])
  const [summary, setSummary] = useState({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [userSafes, setUserSafes] = useState([])  // Safes the user has access to

  // Form states
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [showIssueModal, setShowIssueModal] = useState(false)
  const [showSettleModal, setShowSettleModal] = useState(false)
  const [chequeToSettle, setChequeToSettle] = useState(null)
  const [settlementForm, setSettlementForm] = useState({
    cheque_number: '',
    bank_account_id: '',
    notes: ''
  })
  const [expenseForm, setExpenseForm] = useState({
    safe_id: '',
    cheque_id: '',
    category_id: '',
    amount: '',
    description: '',
    paid_to: '',
    notes: ''
    // expense_date removed - server will set automatically
  })
  const [chequeForm, setChequeForm] = useState({
    cheque_number: '',
    safe_id: '',
    amount: '',
    issue_date: new Date().toISOString().split('T')[0],
    description: ''
  })

  // Get authentication headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  useEffect(() => {
    loadInitialData()
  }, [])
  
  // Auto-select safe if user only has access to one
  useEffect(() => {
    if (safes.length === 1 && !expenseForm.safe_id) {
      setExpenseForm(prev => ({
        ...prev,
        safe_id: safes[0].id.toString()
      }))
      setUserSafes(safes)
    } else if (safes.length > 1) {
      setUserSafes(safes)
    }
  }, [safes])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadSafes(),
        loadCategories(),
        loadSummary(),
        loadExpenses()
      ])
    } catch (error) {
      setError('Failed to load data')
      console.error('Failed to load initial data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSafes = async () => {
    try {
      const headers = getAuthHeaders()
      const response = await axios.get(`${API_BASE_URL}/api/safes`, { headers })
      const safesData = extractResponseData(response.data)
      console.log('🏦 Safes extracted for ExpenseManagement:', safesData)
      setSafes(safesData)
      if (safesData.length > 0) {
        setSelectedSafe(safesData[0])
        loadCheques(safesData[0].id)
      }
    } catch (error) {
      console.error('Failed to load safes:', error)
      const errorMessage = extractErrorMessage(error)
      setError(`Failed to load safes: ${errorMessage}`)
    }
  }

  const loadCategories = async () => {
    try {
      const headers = getAuthHeaders()
      const response = await axios.get(`${API_BASE_URL}/api/expense-categories-simple`, { headers })
      const categoriesData = extractResponseData(response.data)
      console.log('📂 Categories extracted for ExpenseManagement:', categoriesData)
      setCategories(categoriesData)
    } catch (error) {
      console.error('Failed to load categories:', error)
      const errorMessage = extractErrorMessage(error)
      setError(`Failed to load categories: ${errorMessage}`)
    }
  }

  const loadSummary = async () => {
    try {
      const headers = getAuthHeaders()
      const response = await axios.get(`${API_BASE_URL}/api/expenses/summary`, { headers })
      setSummary(response.data)
    } catch (error) {
      console.error('Failed to load summary:', error)
    }
  }

  const loadExpenses = async () => {
    try {
      const headers = getAuthHeaders()
      const response = await axios.get(`${API_BASE_URL}/api/expenses?limit=50`, { headers })
      const expensesData = extractResponseData(response.data)
      console.log('💰 Expenses extracted for ExpenseManagement:', expensesData)
      setExpenses(expensesData)
    } catch (error) {
      console.error('Failed to load expenses:', error)
      const errorMessage = extractErrorMessage(error)
      setError(`Failed to load expenses: ${errorMessage}`)
    }
  }

  const loadCheques = async (safeId) => {
    try {
      const headers = getAuthHeaders()
      const response = await axios.get(`${API_BASE_URL}/safes/${safeId}/cheques`, { headers })
      const chequesData = extractResponseData(response.data)
      console.log('📄 Cheques extracted for ExpenseManagement:', chequesData)
      setCheques(chequesData)
    } catch (error) {
      console.error('Failed to load cheques:', error)
      const errorMessage = extractErrorMessage(error)
      setError(`Failed to load cheques: ${errorMessage}`)
    }
  }

  const getAvailableChequesForExpense = () => {
    // If no safe is selected, return empty array
    if (!expenseForm.safe_id) {
      return []
    }
    
    // Filter cheques based on selected safe in expense form
    // Since cheques are loaded per safe, we already have the right cheques
    return cheques.filter(cheque => !cheque.is_settled)
  }

  const getChequeStatusBadge = (cheque) => {
    if (cheque.is_settled) {
      return <span className="badge badge-secondary">{t('expenseManagement.chequeStatus.settled')}</span>
    } else if (cheque.is_overspent) {
      return <span className="badge badge-danger">{t('expenseManagement.chequeStatus.overspent')}</span>
    } else if (cheque.total_expenses > 0) {
      return <span className="badge badge-warning">{t('expenseManagement.chequeStatus.active')}</span>
    } else {
      return <span className="badge badge-success">{t('expenseManagement.chequeStatus.available')}</span>
    }
  }

  const getChequeDisplayInfo = (cheque) => {
    const percentage = cheque.amount > 0 ? (cheque.total_expenses / cheque.amount * 100).toFixed(0) : 0
    const remainingClass = cheque.remaining_amount < 0 ? 'text-danger' : 'text-success'
    
    return {
      percentage,
      remainingClass,
      displayText: `${cheque.cheque_number} - ${formatCurrency(cheque.amount)} (${remainingClass === 'text-danger' ? t('expenseManagement.chequeStatus.overspent') + ' ' + t('expenseManagement.chequeView.overspent') : t('expenseManagement.chequeView.remaining')}: ${formatCurrency(Math.abs(cheque.remaining_amount))})`
    }
  }

  const handleSafeChange = (safe) => {
    setSelectedSafe(safe)
    loadCheques(safe.id)
  }

  const handleCreateExpense = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const headers = getAuthHeaders()
      await axios.post(`${API_BASE_URL}/api/expenses`, {
        cheque_id: parseInt(expenseForm.cheque_id),
        category_id: expenseForm.category_id ? parseInt(expenseForm.category_id) : null,
        amount: parseFloat(expenseForm.amount),
        description: expenseForm.description,
        paid_to: expenseForm.paid_to,
        notes: expenseForm.notes
        // expense_date will be auto-set by server
      }, { headers })

      setSuccess(t('expenseManagement.messages.expenseCreated'))
      setShowExpenseForm(false)
      setExpenseForm({
        safe_id: '',
        cheque_id: '',
        category_id: '',
        amount: '',
        description: '',
        paid_to: '',
        notes: ''
        // expense_date removed - server will set automatically
      })

      // Reload data
      await Promise.all([
        loadSafes(),
        loadSummary(),
        loadExpenses(),
        selectedSafe && loadCheques(selectedSafe.id)
      ])
    } catch (error) {
      const errorMessage = extractErrorMessage(error)
      setError(`Failed to create expense: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCheque = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const headers = getAuthHeaders()
      await axios.post(`${API_BASE_URL}/cheques`, {
        ...chequeForm,
        amount: parseFloat(chequeForm.amount),
        safe_id: parseInt(chequeForm.safe_id)
      }, { headers })

      setSuccess('Cheque created successfully!')
      setShowIssueModal(false)
      setChequeForm({
        cheque_number: '',
        safe_id: '',
        amount: '',
        issue_date: new Date().toISOString().split('T')[0],
        description: ''
      })

      // Reload data
      if (selectedSafe) {
        await loadCheques(selectedSafe.id)
      }
    } catch (error) {
      const errorMessage = extractErrorMessage(error)
      setError(`Failed to create cheque: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSettleCheque = (cheque) => {
    setChequeToSettle(cheque)
    setSettlementForm({
      cheque_number: '',
      bank_account_id: cheque.bank_account_id || '',
      notes: `Settlement for overspent cheque ${cheque.cheque_number}`
    })
    setShowSettleModal(true)
  }

  const handleSettlementSubmit = async () => {
    if (!settlementForm.cheque_number) {
      setError('Please enter a settlement cheque number')
      return
    }

    try {
      setLoading(true)
      const headers = getAuthHeaders()
      const response = await axios.post(
        `${API_BASE_URL}/cheques/${chequeToSettle.id}/settle`,
        settlementForm,
        { headers }
      )
      
      setSuccess('Cheque settled successfully!')
      setShowSettleModal(false)
      setChequeToSettle(null)
      setSettlementForm({ cheque_number: '', bank_account_id: '', notes: '' })
      
      // Reload data
      if (selectedSafe) {
        await loadCheques(selectedSafe.id)
        await loadSafes()
      }
    } catch (error) {
      console.error('Failed to settle cheque:', error)
      const errorMessage = extractErrorMessage(error)
      setError(`Failed to settle cheque: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (loading && activeView === 'dashboard') {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div>{t('expenseManagement.loading')}</div>
      </div>
    )
  }

  return (
    <div>
      {/* Navigation */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem',
        borderBottom: '1px solid #e9ecef',
        paddingBottom: '1rem'
      }}>
        {['dashboard', 'expenses', 'cheques'].map(view => (
          <button
            key={view}
            onClick={() => setActiveView(view)}
            style={{
              padding: '0.5rem 1rem',
              background: activeView === view ? '#007bff' : 'transparent',
              color: activeView === view ? 'white' : '#495057',
              border: activeView === view ? 'none' : '1px solid #dee2e6',
              borderRadius: '4px',
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {t(`expenseManagement.navigation.${view}`)}
          </button>
        ))}
      </div>

      {/* Alerts */}
      {error && (
        <div style={{
          background: '#f8d7da',
          color: '#721c24',
          padding: '0.75rem',
          borderRadius: '4px',
          marginBottom: '1rem',
          border: '1px solid #f5c6cb'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          background: '#d4edda',
          color: '#155724',
          padding: '0.75rem',
          borderRadius: '4px',
          marginBottom: '1rem',
          border: '1px solid #c3e6cb'
        }}>
          {success}
        </div>
      )}

      {/* Dashboard View */}
      {activeView === 'dashboard' && (
        <div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            {/* Summary Cards */}
            <div style={{
              background: '#007bff',
              color: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <h3 style={{ margin: '0 0 0.5rem' }}>{t('expenseManagement.summary.totalSafes')}</h3>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {summary.total_safes || 0}
              </div>
            </div>

            <div style={{
              background: '#28a745',
              color: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <h3 style={{ margin: '0 0 0.5rem' }}>{t('expenseManagement.summary.totalExpenses')}</h3>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {summary.total_expenses || 0}
              </div>
            </div>

            <div style={{
              background: '#17a2b8',
              color: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <h3 style={{ margin: '0 0 0.5rem' }}>{t('expenseManagement.summary.totalAmount')}</h3>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {formatCurrency(summary.total_amount || 0)}
              </div>
            </div>

            <div style={{
              background: '#ffc107',
              color: '#212529',
              padding: '1.5rem',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <h3 style={{ margin: '0 0 0.5rem' }}>{t('expenseManagement.summary.pendingAmount')}</h3>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {formatCurrency(summary.pending_amount || 0)}
              </div>
            </div>
          </div>

          {/* Safes Overview */}
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 1rem' }}>{t('expenseManagement.safesOverview.title')}</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1rem'
            }}>
              {safes.map(safe => (
                <div key={safe.id} style={{
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  padding: '1rem'
                }}>
                  <h4 style={{ margin: '0 0 0.5rem' }}>{safe.name}</h4>
                  <p style={{ margin: '0 0 0.5rem', color: '#666' }}>{safe.description}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{t('expenseManagement.safesOverview.balance')}</span>
                    <strong>{formatCurrency(safe.current_balance)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Cheques:</span>
                    <span>{safe.total_cheques || 0}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Expenses:</span>
                    <span>{safe.total_expenses || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Expenses View */}
      {activeView === 'expenses' && (
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <h3 style={{ margin: 0 }}>{t('expenseManagement.expenseView.title')}</h3>
            {activeExpenseTab === 'list' && (
              <button
                onClick={() => setShowExpenseForm(true)}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {t('expenseManagement.expenseView.createExpense')}
              </button>
            )}
          </div>

          {/* Sub-navigation for Expenses */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1.5rem',
            borderBottom: '1px solid #e9ecef',
            paddingBottom: '0.5rem'
          }}>
            {['list', 'search'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveExpenseTab(tab)}
                style={{
                  padding: '0.5rem 1rem',
                  background: activeExpenseTab === tab ? '#007bff' : 'transparent',
                  color: activeExpenseTab === tab ? 'white' : '#495057',
                  border: activeExpenseTab === tab ? 'none' : '1px solid #dee2e6',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                {t(`expenseManagement.navigation.${tab === 'list' ? 'expenses' : 'search'}`)}
              </button>
            ))}
          </div>

          {/* Expense List Tab */}
          {activeExpenseTab === 'list' && (
            <div>
              {/* Safe Selection */}
              <div style={{
                background: 'white',
                padding: '1rem',
                borderRadius: '4px',
                marginBottom: '1rem',
                border: '1px solid #dee2e6'
              }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  {t('expenseManagement.expenseView.selectSafe')}
                </label>
                <select
                  value={selectedSafe?.id || ''}
                  onChange={(e) => {
                    const safe = safes.find(s => s.id === parseInt(e.target.value))
                    handleSafeChange(safe)
                  }}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ced4da',
                    borderRadius: '4px'
                  }}
                >
                  <option value="">{t('expenseManagement.expenseView.selectSafePlaceholder')}</option>
                  {safes.map(safe => (
                    <option key={safe.id} value={safe.id}>
                      {safe.name} - {formatCurrency(safe.current_balance)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Recent Expenses */}
              <div style={{
                background: 'white',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <div style={{
                  padding: '1rem',
                  borderBottom: '1px solid #dee2e6',
                  background: '#f8f9fa'
                }}>
                  <h4 style={{ margin: 0 }}>{t('expenseManagement.expenseView.recentExpenses')}</h4>
                </div>
                <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                  {expenses.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f8f9fa' }}>
                          <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>ID</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>{t('expenseManagement.expenseView.tableHeaders.date')}</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>{t('expenseManagement.expenseView.tableHeaders.description')}</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>{t('expenseManagement.expenseView.tableHeaders.paidTo')}</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>{t('expenseManagement.expenseView.tableHeaders.category')}</th>
                          <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>{t('expenseManagement.expenseView.tableHeaders.amount')}</th>
                          <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>{t('expenseManagement.expenseView.tableHeaders.status')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expenses.map(expense => (
                          <tr key={expense.id}>
                            <td style={{ padding: '0.75rem', borderBottom: '1px solid #f8f9fa', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                              #{expense.id}
                            </td>
                            <td style={{ padding: '0.75rem', borderBottom: '1px solid #f8f9fa' }}>
                              {formatDate(expense.expense_date)}
                            </td>
                            <td style={{ padding: '0.75rem', borderBottom: '1px solid #f8f9fa' }}>
                              {expense.description}
                            </td>
                            <td style={{ padding: '0.75rem', borderBottom: '1px solid #f8f9fa' }}>
                              {expense.paid_to || '-'}
                            </td>
                            <td style={{ padding: '0.75rem', borderBottom: '1px solid #f8f9fa' }}>
                              {expense.category_name || t('expenseManagement.expenseView.categoryNA')}
                            </td>
                            <td style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #f8f9fa' }}>
                              {formatCurrency(expense.amount)}
                            </td>
                            <td style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #f8f9fa' }}>
                              <span style={{
                                padding: '0.25rem 0.5rem',
                                borderRadius: '12px',
                                fontSize: '0.875rem',
                                background: expense.status === 'approved' ? '#d4edda' : 
                                          expense.status === 'rejected' ? '#f8d7da' : '#fff3cd',
                                color: expense.status === 'approved' ? '#155724' : 
                                       expense.status === 'rejected' ? '#721c24' : '#856404'
                              }}>
                                {expense.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                      {t('expenseManagement.expenseView.noExpenses')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Expense Search Tab */}
          {activeExpenseTab === 'search' && (
            <ExpenseSearchAndSummary />
          )}
        </div>
      )}

      {/* Cheques View */}
      {activeView === 'cheques' && (
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <h3 style={{ margin: 0 }}>{t('expenseManagement.chequeView.title')}</h3>
            <div style={{ color: '#6c757d', fontSize: '0.875rem' }}>
              💡 To issue cheques to safes, use Cheque Management → Issue to Safe
            </div>
          </div>

          {/* Safe Selection */}
          <div style={{
            background: 'white',
            padding: '1rem',
            borderRadius: '4px',
            marginBottom: '1rem',
            border: '1px solid #dee2e6'
          }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              {t('expenseManagement.chequeView.selectSafe')}
            </label>
            <select
              value={selectedSafe?.id || ''}
              onChange={(e) => {
                const safe = safes.find(s => s.id === parseInt(e.target.value))
                handleSafeChange(safe)
              }}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ced4da',
                borderRadius: '4px'
              }}
            >
              <option value="">{t('expenseManagement.chequeView.selectSafePlaceholder')}</option>
              {safes.map(safe => (
                <option key={safe.id} value={safe.id}>
                  {safe.name} - {formatCurrency(safe.current_balance)}
                </option>
              ))}
            </select>
          </div>

          {/* Cheques List */}
          {selectedSafe && (
            <div style={{
              background: 'white',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <div style={{
                padding: '1rem',
                borderBottom: '1px solid #dee2e6',
                background: '#f8f9fa'
              }}>
                <h4 style={{ margin: 0 }}>{t('expenseManagement.chequeView.chequesFor')} {selectedSafe.name}</h4>
              </div>
              <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                {cheques.length > 0 ? (
                  <div className="row">
                    {cheques.map(cheque => (
                      <div key={cheque.id} className="col-md-6 mb-3">
                        <div className={`card ${cheque.is_overspent ? 'border-danger' : cheque.is_settled ? 'border-secondary' : ''}`}>
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <h6 className="card-title mb-0">{cheque.cheque_number}</h6>
                              {getChequeStatusBadge(cheque)}
                            </div>
                            <p className="text-muted small mb-2">
                              {typeof cheque.bank_account === 'object' 
                                ? `${cheque.bank_account.account_name} - ${cheque.bank_account.bank_name}`
                                : cheque.bank_account}
                            </p>
                            <div className="mb-2">
                              <div className="d-flex justify-content-between">
                                <span>{t('expenseManagement.chequeView.amount')}:</span>
                                <strong>{formatCurrency(cheque.amount)}</strong>
                              </div>
                              <div className="d-flex justify-content-between">
                                <span>{t('expenseManagement.chequeView.spent')}:</span>
                                <strong>{formatCurrency(cheque.total_expenses)}</strong>
                              </div>
                              <div className={`d-flex justify-content-between ${cheque.remaining_amount < 0 ? 'text-danger' : 'text-success'}`}>
                                <span>{cheque.remaining_amount < 0 ? t('expenseManagement.chequeView.overspent') : t('expenseManagement.chequeView.remaining')}:</span>
                                <strong>{formatCurrency(Math.abs(cheque.remaining_amount))}</strong>
                              </div>
                            </div>
                            {cheque.is_overspent && !cheque.is_settled && (
                              <button
                                className="btn btn-sm btn-danger w-100"
                                onClick={() => handleSettleCheque(cheque)}
                              >
                                {t('expenseManagement.chequeView.settleOverspent')}
                              </button>
                            )}
                            {cheque.is_settled && cheque.settlement_date && (
                              <div className="text-muted small">
                                {t('expenseManagement.chequeView.settledOn')} {new Date(cheque.settlement_date).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                    {t('expenseManagement.chequeView.noCheques')}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}



      {/* Create Expense Modal */}
      {showExpenseForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '2.5rem',
            borderRadius: '8px',
            width: '95%',
            maxWidth: '700px',
            maxHeight: '95vh',
            overflow: 'auto'
          }}>
            <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.5rem' }}>{t('expenseManagement.createExpenseModal.title')}</h2>
            <form onSubmit={handleCreateExpense}>
              {/* Safe Selection - only show if user has access to multiple safes */}
              {userSafes.length > 1 && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.95rem' }}>
                    {t('expenseManagement.createExpenseModal.safe') || 'Select Safe'}
                  </label>
                  <select
                    value={expenseForm.safe_id}
                    onChange={(e) => {
                      setExpenseForm({...expenseForm, safe_id: e.target.value, cheque_id: ''})
                      // Load cheques for selected safe
                      if (e.target.value) {
                        loadCheques(parseInt(e.target.value))
                      }
                    }}
                    required
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ced4da',
                      borderRadius: '4px'
                    }}
                  >
                    <option value="">{t('expenseManagement.createExpenseModal.selectSafe') || 'Select a safe'}</option>
                    {userSafes.map(safe => (
                      <option key={safe.id} value={safe.id}>
                        {safe.name} - {formatCurrency(safe.current_balance)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Show selected safe name if only one safe is available */}
              {userSafes.length === 1 && (
                <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#f8f9fa', borderRadius: '4px' }}>
                  <small style={{ color: '#6c757d' }}>
                    {t('expenseManagement.createExpenseModal.safeLabel') || 'Safe'}: <strong>{userSafes[0].name}</strong>
                  </small>
                </div>
              )}
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.95rem' }}>{t('expenseManagement.createExpenseModal.cheque')}</label>
                <select
                  value={expenseForm.cheque_id}
                  onChange={(e) => setExpenseForm({...expenseForm, cheque_id: e.target.value})}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ced4da',
                    borderRadius: '4px'
                  }}
                >
                  <option value="">{t('expenseManagement.createExpenseModal.selectCheque')}</option>
                  {!expenseForm.safe_id && userSafes.length > 1 ? (
                    <option value="" disabled>{t('expenseManagement.createExpenseModal.selectSafeFirst') || 'Please select a safe first'}</option>
                  ) : getAvailableChequesForExpense().length === 0 ? (
                    <option value="" disabled>{t('expenseManagement.createExpenseModal.noAvailableCheques') || 'No available cheques in this safe'}</option>
                  ) : (
                    getAvailableChequesForExpense().map(cheque => {
                      const info = getChequeDisplayInfo(cheque)
                      return (
                        <option key={cheque.id} value={cheque.id}>
                          {info.displayText}
                        </option>
                      )
                    })
                  )}
                </select>
                {expenseForm.cheque_id && (() => {
                  const selectedCheque = cheques.find(c => c.id === parseInt(expenseForm.cheque_id))
                  if (selectedCheque && selectedCheque.remaining_amount < parseFloat(expenseForm.amount || 0)) {
                    const overspendAmount = parseFloat(expenseForm.amount || 0) - selectedCheque.remaining_amount
                    const currentSafe = safes.find(s => s.id === selectedSafe.id)
                    const canOverspend = currentSafe && overspendAmount <= currentSafe.current_balance
                    
                    return (
                      <div className={`alert ${canOverspend ? 'alert-warning' : 'alert-danger'} mt-2`}>
                        <strong>{t('expenseManagement.createExpenseModal.overspendWarning')}</strong> {formatCurrency(overspendAmount)}.
                        {canOverspend ? (
                          <span> {t('expenseManagement.createExpenseModal.sufficientBalance')} {formatCurrency(currentSafe?.current_balance || 0)} {t('expenseManagement.createExpenseModal.available')}</span>
                        ) : (
                          <span> {t('expenseManagement.createExpenseModal.insufficientBalance')} {formatCurrency(currentSafe?.current_balance || 0)} {t('expenseManagement.createExpenseModal.available')}</span>
                        )}
                      </div>
                    )
                  }
                  return null
                })()}
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.95rem' }}>{t('expenseManagement.createExpenseModal.category')}</label>
                <CategorySelector
                  categories={categories}
                  value={expenseForm.category_id}
                  onChange={(categoryId) => setExpenseForm({...expenseForm, category_id: categoryId})}
                  placeholder={t('expenseManagement.createExpenseModal.searchCategory')}
                  required={false}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.95rem' }}>{t('expenseManagement.createExpenseModal.amount')}</label>
                <input
                  type="number"
                  step="0.01"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ced4da',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.95rem' }}>{t('expenseManagement.createExpenseModal.paidTo')}</label>
                <input
                  type="text"
                  value={expenseForm.paid_to}
                  onChange={(e) => setExpenseForm({...expenseForm, paid_to: e.target.value})}
                  placeholder={t('expenseManagement.createExpenseModal.paidToPlaceholder')}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ced4da',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.95rem' }}>{t('expenseManagement.createExpenseModal.description')}</label>
                <textarea
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                  required
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Expense Date - Auto-set by server, no user input needed */}

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.95rem' }}>{t('expenseManagement.createExpenseModal.notes')}</label>
                <textarea
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({...expenseForm, notes: e.target.value})}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowExpenseForm(false)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {t('expenseManagement.createExpenseModal.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '0.5rem 1rem',
                    background: loading ? '#6c757d' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? t('expenseManagement.createExpenseModal.creating') : t('expenseManagement.createExpenseModal.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showIssueModal && (
        <IssueChequeModal
          isOpen={showIssueModal}
          onClose={() => setShowIssueModal(false)}
          onIssued={async () => {
            setTimeout(() => setShowIssueModal(false), 1500)
            await loadSafes()
            if (selectedSafe) {
              await loadCheques(selectedSafe.id)
            }
            setSuccess('Cheque issued successfully to safe!')
            setTimeout(() => setSuccess(''), 4000)
          }}
        />
      )}

      {/* Settlement Modal */}
      {showSettleModal && chequeToSettle && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowSettleModal(false)}
        >
          <div 
            style={{
              background: 'white',
              borderRadius: '8px',
              padding: '2rem',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: '1.5rem' }}>{t('expenseManagement.settlementModal.title')}</h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <p><strong>{t('expenseManagement.settlementModal.cheque')}:</strong> {chequeToSettle.cheque_number}</p>
              <p><strong>{t('expenseManagement.settlementModal.originalAmount')}:</strong> {formatCurrency(chequeToSettle.amount)}</p>
              <p><strong>{t('expenseManagement.settlementModal.totalExpenses')}:</strong> {formatCurrency(chequeToSettle.total_expenses)}</p>
              <p className="text-danger">
                <strong>{t('expenseManagement.settlementModal.overspentAmount')}:</strong> {formatCurrency(chequeToSettle.overspent_amount)}
              </p>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                {t('expenseManagement.settlementModal.settlementChequeNumber')} <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={settlementForm.cheque_number}
                onChange={(e) => setSettlementForm({...settlementForm, cheque_number: e.target.value})}
                placeholder={t('expenseManagement.settlementModal.enterChequeNumber')}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ced4da',
                  borderRadius: '4px'
                }}
                required
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>{t('expenseManagement.settlementModal.notes')}:</label>
              <textarea
                value={settlementForm.notes}
                onChange={(e) => setSettlementForm({...settlementForm, notes: e.target.value})}
                rows="3"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ced4da',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div className="alert alert-info">
              A new cheque for {formatCurrency(chequeToSettle.overspent_amount)} will be created 
              and assigned to the same safe to restore the balance.
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-secondary"
                onClick={() => setShowSettleModal(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger"
                onClick={handleSettlementSubmit}
                disabled={loading || !settlementForm.cheque_number}
              >
                {loading ? 'Settling...' : 'Settle Cheque'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExpenseManagement 

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface Expense {
  id: number;
  description: string;
  amount: number;
  expense_date: string;
  status: string;
  notes: string;
  category_name: string;
  safe_name: string;
  cheque_number: string;
  cheque_id: number;
  category_id: number;
  safe_id: number;
}

interface Cheque {
  id: number;
  cheque_number: string;
  amount: number;
  description: string;
  issue_date: string;
  safe_name: string;
  expense_count: number;
  total_expenses: number;
}

interface Category {
  id: number;
  name: string;
}

interface Safe {
  id: number;
  name: string;
}

const ExpenseSearchAndSummary: React.FC = () => {
  const { t } = useTranslation();
  
  // States
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [cheques, setCheques] = useState<Cheque[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [safes, setSafes] = useState<Safe[]>([]);
  const [selectedExpenses, setSelectedExpenses] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filter states
  const [filters, setFilters] = useState({
    from_date: '',
    to_date: '',
    cheque_id: '',
    cheque_number: '',
    category_id: '',
    status: '',
    safe_id: '',
    search_term: ''
  });
  
  // Search mode state
  const [searchMode, setSearchMode] = useState<'date' | 'cheque' | 'advanced'>('date');
  
  // Local text filter for results
  const [localTextFilter, setLocalTextFilter] = useState('');

  // Get auth token
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : { Authorization: '' };
  };

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      await Promise.all([
        loadCheques(),
        loadCategories(),
        loadSafes()
      ]);
    } catch (error) {
      setError('Failed to load initial data');
      console.error('Failed to load initial data:', error);
    }
  };

  const loadCheques = async () => {
    try {
      const response = await fetch('http://100.29.4.72:8000/api/expenses/cheques', {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (data.success) {
        setCheques(data.data);
      }
    } catch (error) {
      console.error('Failed to load cheques:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch('http://100.29.4.72:8000/api/expense-categories-simple', {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadSafes = async () => {
    try {
      const response = await fetch('http://100.29.4.72:8000/api/safes', {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (data.success) {
        setSafes(data.data);
      }
    } catch (error) {
      console.error('Failed to load safes:', error);
    }
  };

  // Search expenses
  const searchExpenses = async () => {
    setLoading(true);
    setError('');
    
    try {
      const queryParams = new URLSearchParams();
      
      // Add non-empty filters to query
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value.toString().trim() !== '') {
          queryParams.append(key, value.toString());
        }
      });
      
      const response = await fetch(`http://100.29.4.72:8000/api/expenses/search?${queryParams.toString()}`, {
        headers: getAuthHeaders()
      });
      
      const data = await response.json();
      
      if (data.success) {
        setExpenses(data.data);
        setSelectedExpenses(new Set()); // Clear selection
        setSuccess(`Found ${data.count} expenses`);
      } else {
        setError(data.error || 'Failed to search expenses');
      }
    } catch (error) {
      setError('Failed to search expenses');
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter by cheque
  const filterByCheque = async (chequeId: number) => {
    setFilters(prev => ({ ...prev, cheque_id: chequeId.toString() }));
    setSearchMode('cheque');
    
    setLoading(true);
    try {
      const response = await fetch(`http://100.29.4.72:8000/api/expenses/search?cheque_id=${chequeId}`, {
        headers: getAuthHeaders()
      });
      
      const data = await response.json();
      
      if (data.success) {
        setExpenses(data.data);
        setSelectedExpenses(new Set(data.data.map((e: Expense) => e.id))); // Auto-select all
        setSuccess(`Found ${data.count} expenses for selected cheque`);
      } else {
        setError(data.error || 'Failed to filter expenses by cheque');
      }
    } catch (error) {
      setError('Failed to filter expenses by cheque');
      console.error('Filter error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      from_date: '',
      to_date: '',
      cheque_id: '',
      cheque_number: '',
      category_id: '',
      status: '',
      safe_id: '',
      search_term: ''
    });
    setExpenses([]);
    setSelectedExpenses(new Set());
    setSearchMode('date');
    setLocalTextFilter('');
  };

  // Filter expenses based on local text filter
  const getFilteredExpenses = () => {
    if (!localTextFilter.trim()) {
      return expenses;
    }
    
    const searchTerm = localTextFilter.toLowerCase();
    return expenses.filter(expense => 
      expense.description.toLowerCase().includes(searchTerm) ||
      expense.notes.toLowerCase().includes(searchTerm) ||
      expense.category_name.toLowerCase().includes(searchTerm) ||
      expense.cheque_number.toLowerCase().includes(searchTerm) ||
      expense.safe_name.toLowerCase().includes(searchTerm)
    );
  };

  // Toggle expense selection
  const toggleExpenseSelection = (expenseId: number) => {
    const newSelection = new Set(selectedExpenses);
    if (newSelection.has(expenseId)) {
      newSelection.delete(expenseId);
    } else {
      newSelection.add(expenseId);
    }
    setSelectedExpenses(newSelection);
  };

  // Select all expenses
  const selectAllExpenses = () => {
    if (selectedExpenses.size === expenses.length) {
      setSelectedExpenses(new Set());
    } else {
      setSelectedExpenses(new Set(expenses.map(e => e.id)));
    }
  };

  // Generate summary
  const generateSummary = async (download = false) => {
    if (selectedExpenses.size === 0) {
      setError('Please select at least one expense');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const selectedExpenseData = expenses.filter(e => selectedExpenses.has(e.id));
      
      // Prepare summary info
      const summaryInfo: any = {
        description: `Expense Summary - ${selectedExpenses.size} expenses selected`
      };

      // Add date range if applicable
      if (filters.from_date || filters.to_date) {
        const fromDate = filters.from_date || 'Start';
        const toDate = filters.to_date || 'End';
        summaryInfo.date_range = `${fromDate} to ${toDate}`;
      }

      // Add cheque info if filtering by cheque
      if (filters.cheque_id) {
        const selectedCheque = cheques.find(c => c.id.toString() === filters.cheque_id);
        if (selectedCheque) {
          summaryInfo.cheque_info = `Cheque #${selectedCheque.cheque_number}`;
        }
      }

      const requestData = {
        expense_ids: Array.from(selectedExpenses),
        summary_info: summaryInfo
      };

      const endpoint = download ? 'http://100.29.4.72:8000/api/expenses/summary/download' : 'http://100.29.4.72:8000/api/expenses/summary/html';
      const response = await fetch(`${endpoint}?language=ar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(requestData)
      });

      if (download) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `expense_summary_${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        setSuccess('Expense summary downloaded successfully');
      } else {
        const htmlContent = await response.text();
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(htmlContent);
          newWindow.document.close();
        }
        setSuccess('Expense summary opened in new window');
      }
    } catch (error) {
      setError('Failed to generate expense summary');
      console.error('Summary generation error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Highlight search terms
  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm.trim() || !text) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} style={{ backgroundColor: '#fef08a', padding: '0 2px' }}>
          {part}
        </mark>
      ) : part
    );
  };

  // Get status badge style
  const getStatusBadgeStyle = (status: string) => {
    const baseStyle = {
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: '600',
      textTransform: 'uppercase' as const
    };

    switch (status.toLowerCase()) {
      case 'approved': 
        return { ...baseStyle, backgroundColor: '#d4edda', color: '#155724' };
      case 'rejected': 
        return { ...baseStyle, backgroundColor: '#f8d7da', color: '#721c24' };
      default: 
        return { ...baseStyle, backgroundColor: '#fff3cd', color: '#856404' };
    }
  };

  return (
    <>
      {/* Print-specific styles */}
      <style>
        {`
          @media print {
            * {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            .expense-search-container {
              padding: 0 !important;
            }
            
            .search-section {
              display: none !important;
            }
            
            .filter-section {
              display: none !important;
            }
            
            .results-header {
              margin-bottom: 1rem !important;
            }
            
            .print-buttons {
              display: none !important;
            }
            
            .expenses-table {
              width: 100% !important;
              border-collapse: collapse !important;
              font-size: 12px !important;
            }
            
            .expenses-table th {
              background: #28a745 !important;
              color: white !important;
              padding: 8px 6px !important;
              font-weight: 600 !important;
              border: 1px solid #ddd !important;
            }
            
            .expenses-table td {
              padding: 6px !important;
              border: 1px solid #ddd !important;
              font-size: 11px !important;
            }
            
            .status-badge {
              padding: 2px 4px !important;
              border-radius: 3px !important;
              font-size: 9px !important;
            }
          }
        `}
      </style>
      
      <div className="expense-search-container" style={{ padding: '1.5rem', maxWidth: '100%' }}>
        {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
          Expense Search & Summary
        </h2>
        <button
          onClick={clearFilters}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'white',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
        >
          🔄 Clear Filters
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '0.75rem',
          borderRadius: '0.375rem',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}
      
      {success && (
        <div style={{
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          color: '#16a34a',
          padding: '0.75rem',
          borderRadius: '0.375rem',
          marginBottom: '1rem'
        }}>
          {success}
        </div>
      )}

      {/* Search Tabs */}
      <div className="search-section" style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
          Search Expenses
        </h3>
        
        {/* Tab Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSearchMode('date')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: searchMode === 'date' ? '#3b82f6' : 'white',
              color: searchMode === 'date' ? 'white' : '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            📅 Date Range
          </button>
          <button
            onClick={() => setSearchMode('cheque')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: searchMode === 'cheque' ? '#3b82f6' : 'white',
              color: searchMode === 'cheque' ? 'white' : '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            📝 By Cheque
          </button>
          <button
            onClick={() => setSearchMode('advanced')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: searchMode === 'advanced' ? '#3b82f6' : 'white',
              color: searchMode === 'advanced' ? 'white' : '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            🔍 Advanced
          </button>
        </div>

        {/* Date Range Search */}
        {searchMode === 'date' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                From Date
              </label>
              <input
                type="date"
                value={filters.from_date}
                onChange={(e) => setFilters(prev => ({ ...prev, from_date: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                To Date
              </label>
              <input
                type="date"
                value={filters.to_date}
                onChange={(e) => setFilters(prev => ({ ...prev, to_date: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem'
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'end' }}>
              <button
                onClick={searchExpenses}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.5rem 1rem',
                  backgroundColor: loading ? '#9ca3af' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                {loading ? 'Searching...' : '🔍 Search'}
              </button>
            </div>
          </div>
        )}

        {/* Cheque Search */}
        {searchMode === 'cheque' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            {cheques.map(cheque => (
              <div
                key={cheque.id}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  backgroundColor: '#f9fafb',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div>
                    <h4 style={{ fontWeight: '600', margin: '0 0 0.25rem 0' }}>
                      Cheque #{cheque.cheque_number}
                    </h4>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>
                      {cheque.description}
                    </p>
                    <p style={{ fontSize: '0.875rem', color: '#9ca3af', margin: 0 }}>
                      {cheque.safe_name}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: '500', margin: '0 0 0.25rem 0' }}>
                      {formatCurrency(cheque.amount)}
                    </p>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>
                      {cheque.expense_count} expenses
                    </p>
                    <p style={{ fontSize: '0.875rem', color: '#9ca3af', margin: 0 }}>
                      {formatCurrency(cheque.total_expenses)} spent
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => filterByCheque(cheque.id)}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    backgroundColor: loading ? '#9ca3af' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  View Expenses
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Advanced Search */}
        {searchMode === 'advanced' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                Search Description
              </label>
              <input
                type="text"
                placeholder="Search in description or notes..."
                value={filters.search_term}
                onChange={(e) => setFilters(prev => ({ ...prev, search_term: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                Category
              </label>
              <select
                value={filters.category_id}
                onChange={(e) => setFilters(prev => ({ ...prev, category_id: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem'
                }}
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id.toString()}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem'
                }}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                Cheque Number
              </label>
              <input
                type="text"
                placeholder="Enter cheque number..."
                value={filters.cheque_number}
                onChange={(e) => setFilters(prev => ({ ...prev, cheque_number: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'end' }}>
              <button
                onClick={searchExpenses}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.5rem 1rem',
                  backgroundColor: loading ? '#9ca3af' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                {loading ? 'Searching...' : '🔍 Search'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results Section */}
      {expenses.length > 0 && (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          {/* Text Filter */}
          <div className="filter-section" style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            backgroundColor: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '0.375rem'
          }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: '500', 
              marginBottom: '0.5rem',
              color: '#374151'
            }}>
              🔍 Filter Results
            </label>
            <input
              type="text"
              placeholder="Filter by description, notes, category, cheque, or safe..."
              value={localTextFilter}
              onChange={(e) => setLocalTextFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                backgroundColor: 'white'
              }}
            />
            {localTextFilter && (
              <div style={{ 
                marginTop: '0.5rem', 
                fontSize: '0.75rem', 
                color: '#6b7280' 
              }}>
                Showing {getFilteredExpenses().length} of {expenses.length} expenses
              </div>
            )}
          </div>

          {/* Results Header */}
          <div className="results-header" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: '0 0 0.5rem 0' }}>
                Search Results ({localTextFilter ? `${getFilteredExpenses().length} filtered from ${expenses.length}` : expenses.length} expenses)
              </h3>
              {selectedExpenses.size > 0 && (
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                  Total Selected: {formatCurrency(
                    getFilteredExpenses()
                      .filter(e => selectedExpenses.has(e.id))
                      .reduce((sum, e) => sum + e.amount, 0)
                  )}
                </p>
              )}
            </div>
            <div className="print-buttons" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  const filteredExpenses = getFilteredExpenses();
                  const allFilteredSelected = filteredExpenses.every(e => selectedExpenses.has(e.id));
                  if (allFilteredSelected) {
                    // Deselect all filtered expenses
                    const newSelection = new Set(selectedExpenses);
                    filteredExpenses.forEach(e => newSelection.delete(e.id));
                    setSelectedExpenses(newSelection);
                  } else {
                    // Select all filtered expenses
                    const newSelection = new Set(selectedExpenses);
                    filteredExpenses.forEach(e => newSelection.add(e.id));
                    setSelectedExpenses(newSelection);
                  }
                }}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                {getFilteredExpenses().every(e => selectedExpenses.has(e.id)) && getFilteredExpenses().length > 0 
                  ? '☐ Deselect All Visible' 
                  : '☑ Select All Visible'}
              </button>
              <button
                onClick={() => generateSummary(false)}
                disabled={selectedExpenses.size === 0 || loading}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: selectedExpenses.size === 0 || loading ? '#9ca3af' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: selectedExpenses.size === 0 || loading ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                🖨 Print Summary ({selectedExpenses.size})
              </button>
              <button
                onClick={() => generateSummary(true)}
                disabled={selectedExpenses.size === 0 || loading}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: selectedExpenses.size === 0 || loading ? '#9ca3af' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: selectedExpenses.size === 0 || loading ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                💾 Download
              </button>
            </div>
          </div>

          {/* Results Table */}
          <div style={{ overflowX: 'auto' }}>
            <table className="expenses-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={getFilteredExpenses().every(e => selectedExpenses.has(e.id)) && getFilteredExpenses().length > 0}
                      onChange={() => {
                        const filteredExpenses = getFilteredExpenses();
                        const allFilteredSelected = filteredExpenses.every(e => selectedExpenses.has(e.id));
                        if (allFilteredSelected) {
                          const newSelection = new Set(selectedExpenses);
                          filteredExpenses.forEach(e => newSelection.delete(e.id));
                          setSelectedExpenses(newSelection);
                        } else {
                          const newSelection = new Set(selectedExpenses);
                          filteredExpenses.forEach(e => newSelection.add(e.id));
                          setSelectedExpenses(newSelection);
                        }
                      }}
                    />
                  </th>
                  <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem', fontWeight: '600' }}>Expense ID</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem', fontWeight: '600' }}>Date</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem', fontWeight: '600' }}>Description</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem', fontWeight: '600' }}>Category</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem', fontWeight: '600' }}>Cheque Number</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem', fontWeight: '600' }}>Safe</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem', fontWeight: '600' }}>Status</th>
                  <th style={{ textAlign: 'right', padding: '0.75rem 0.5rem', fontWeight: '600' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredExpenses().map(expense => (
                  <tr key={expense.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <input
                        type="checkbox"
                        checked={selectedExpenses.has(expense.id)}
                        onChange={() => toggleExpenseSelection(expense.id)}
                      />
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                      #{expense.id}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.875rem' }}>
                      {formatDate(expense.expense_date)}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <div>
                        <p style={{ fontWeight: '500', margin: '0 0 0.25rem 0' }}>
                          {highlightText(expense.description, localTextFilter)}
                        </p>
                        {expense.notes && (
                          <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                            {highlightText(expense.notes, localTextFilter)}
                          </p>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.875rem' }}>
                      {highlightText(expense.category_name, localTextFilter)}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                      {highlightText(expense.cheque_number, localTextFilter)}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.875rem' }}>
                      {highlightText(expense.safe_name, localTextFilter)}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <span className="status-badge" style={getStatusBadgeStyle(expense.status)}>
                        {expense.status}
                      </span>
                    </td>
                    <td style={{ 
                      padding: '0.75rem 0.5rem', 
                      textAlign: 'right', 
                      fontFamily: 'monospace',
                      fontWeight: '600'
                    }}>
                      {formatCurrency(expense.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default ExpenseSearchAndSummary; 
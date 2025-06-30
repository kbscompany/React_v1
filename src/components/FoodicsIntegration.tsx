import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import axios from 'axios'

interface Branch {
  id: string
  name: string
  is_active?: boolean
  is_default?: boolean
}

interface SalesData {
  total_sales: number
  total_orders: number
  average_order: number
  orders?: any[]
}

interface FoodicsStatus {
  configured: boolean
  api_token_configured: boolean
  mode: string
  service_available: boolean
}

function FoodicsIntegration() {
  const { t } = useTranslation()
  const [activeSection, setActiveSection] = useState('status')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Foodics state
  const [foodicsStatus, setFoodicsStatus] = useState<FoodicsStatus | null>(null)
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null)
  const [salesData, setSalesData] = useState<SalesData | null>(null)
  const [apiToken, setApiToken] = useState('')
  
  // Dates for sales queries
  const [startDate, setStartDate] = useState('2024-01-01')
  const [endDate, setEndDate] = useState('2024-12-31')

  useEffect(() => {
    checkFoodicsStatus()
    loadBranches()
  }, [])

  const showMessage = (message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      setSuccess(message)
      setError('')
    } else {
      setError(message)
      setSuccess('')
    }
    setTimeout(() => {
      setSuccess('')
      setError('')
    }, 5000)
  }

  const checkFoodicsStatus = async () => {
    try {
      const response = await axios.get('/api/foodics/status')
      setFoodicsStatus(response.data)
    } catch (err: any) {
      console.error('Failed to check Foodics status:', err)
      setError(err.response?.data?.detail || 'Failed to check status')
    }
  }

  const configureApiToken = async () => {
    if (!apiToken.trim()) {
      setError('Please enter a valid API token')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('api_token', apiToken)

      const response = await axios.post('/api/foodics/configure', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })

      showMessage('Foodics API configured successfully!', 'success')
      await checkFoodicsStatus()
      await loadBranches()
      setApiToken('') // Clear the token input for security
    } catch (err: any) {
      console.error('Failed to configure Foodics:', err)
      setError(err.response?.data?.detail || 'Configuration failed')
    } finally {
      setLoading(false)
    }
  }

  const testConnection = async () => {
    setLoading(true)
    try {
      const response = await axios.post('/api/foodics/test-connection')
      showMessage(`Connection test successful: ${response.data.message}`, 'success')
    } catch (err: any) {
      console.error('Connection test failed:', err)
      setError(err.response?.data?.detail || 'Connection test failed')
    } finally {
      setLoading(false)
    }
  }

  const loadBranches = async () => {
    try {
      const response = await axios.get('/api/foodics/branches')
      if (response.data.success) {
        setBranches(response.data.branches || [])
      } else {
        setBranches([])
      }
    } catch (err: any) {
      console.error('Failed to load branches:', err)
      setBranches([])
    }
  }

  const configureBranch = async (branch: Branch) => {
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('branch_id', branch.id)
      formData.append('branch_name', branch.name)

      await axios.post('/api/foodics/configure-branch', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })

      showMessage(`${branch.name} configured as default branch successfully!`, 'success')
      setSelectedBranch(branch)
      await loadSalesData(branch)
    } catch (err: any) {
      console.error('Failed to configure branch:', err)
      setError(err.response?.data?.detail || 'Failed to configure branch')
    } finally {
      setLoading(false)
    }
  }

  const loadSalesData = async (branch: Branch) => {
    setLoading(true)
    try {
      const response = await axios.get(
        `/api/foodics/default-branch/sales?start_date=${startDate}&end_date=${endDate}`
      )
      setSalesData(response.data)
    } catch (err: any) {
      console.error('Failed to load sales data:', err)
      // Don't show error for sales data as it might not be available in basic mode
      setSalesData(null)
    } finally {
      setLoading(false)
    }
  }

  const sections = [
    { id: 'status', label: '📊 Status & Configuration' },
    { id: 'branches', label: '🏢 Branch Management' },
    { id: 'sales', label: '💰 Sales Data' },
  ]

  const sectionStyle = {
    marginBottom: '2rem',
    background: 'white',
    borderRadius: '8px',
    padding: '1.5rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  }

  const buttonStyle = {
    padding: '0.75rem 1.5rem',
    background: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    margin: '0.5rem 0.5rem 0.5rem 0',
  }

  const dangerButtonStyle = {
    ...buttonStyle,
    background: '#dc3545',
  }

  const successButtonStyle = {
    ...buttonStyle,
    background: '#28a745',
  }

  const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    marginBottom: '1rem',
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ margin: '0 0 1rem 0', color: '#333' }}>
          🍔 Foodics Integration
        </h2>
        <p style={{ color: '#666', margin: 0 }}>
          Manage your Foodics API integration and view sales data from your branches.
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div style={{
          background: '#f8d7da',
          color: '#721c24',
          padding: '1rem',
          borderRadius: '4px',
          marginBottom: '1rem',
          border: '1px solid #f5c6cb',
        }}>
          ❌ {error}
        </div>
      )}

      {success && (
        <div style={{
          background: '#d4edda',
          color: '#155724',
          padding: '1rem',
          borderRadius: '4px',
          marginBottom: '1rem',
          border: '1px solid #c3e6cb',
        }}>
          ✅ {success}
        </div>
      )}

      {/* Navigation */}
      <div style={{
        display: 'flex',
        marginBottom: '2rem',
        background: 'white',
        borderRadius: '8px',
        padding: '0.5rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}>
        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            style={{
              ...buttonStyle,
              background: activeSection === section.id ? '#007bff' : 'transparent',
              color: activeSection === section.id ? 'white' : '#495057',
              margin: '0.25rem',
            }}
          >
            {section.label}
          </button>
        ))}
      </div>

      {/* Status & Configuration Section */}
      {activeSection === 'status' && (
        <div style={sectionStyle}>
          <h3 style={{ marginBottom: '1rem', color: '#333' }}>🔗 Integration Status</h3>
          
          {/* Current Status */}
          {foodicsStatus && (
            <div style={{
              background: foodicsStatus.configured ? '#d4edda' : '#fff3cd',
              color: foodicsStatus.configured ? '#155724' : '#856404',
              padding: '1rem',
              borderRadius: '4px',
              marginBottom: '1.5rem',
              border: `1px solid ${foodicsStatus.configured ? '#c3e6cb' : '#ffeaa7'}`,
            }}>
              <h4 style={{ margin: '0 0 0.5rem 0' }}>
                {foodicsStatus.configured ? '✅ Foodics Connected' : '⚠️ Setup Required'}
              </h4>
              <div style={{ fontSize: '14px' }}>
                <div><strong>Mode:</strong> {foodicsStatus.mode}</div>
                <div><strong>API Token Configured:</strong> {foodicsStatus.api_token_configured ? 'Yes' : 'No'}</div>
                <div><strong>Service Available:</strong> {foodicsStatus.service_available ? 'Yes' : 'No'}</div>
              </div>
            </div>
          )}

          {/* API Token Configuration */}
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ marginBottom: '1rem', color: '#333' }}>🔑 Configure Foodics API Token</h4>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Foodics API Token:
              </label>
              <input
                type="password"
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                placeholder="Enter your Foodics API token here..."
                style={inputStyle}
              />
              <small style={{ color: '#666', fontSize: '12px' }}>
                Get your API token from your Foodics dashboard under Settings → API
              </small>
            </div>
            <button
              onClick={configureApiToken}
              disabled={loading || !apiToken.trim()}
              style={{
                ...successButtonStyle,
                opacity: loading || !apiToken.trim() ? 0.6 : 1,
                cursor: loading || !apiToken.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? '⏳ Configuring...' : '🔧 Configure API Token'}
            </button>
          </div>

          {/* Connection Test */}
          <div>
            <h4 style={{ marginBottom: '1rem', color: '#333' }}>🧪 Test Connection</h4>
            <button
              onClick={testConnection}
              disabled={loading || !foodicsStatus?.configured}
              style={{
                ...buttonStyle,
                opacity: loading || !foodicsStatus?.configured ? 0.6 : 1,
                cursor: loading || !foodicsStatus?.configured ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? '⏳ Testing...' : '🔍 Test Foodics Connection'}
            </button>
          </div>
        </div>
      )}

      {/* Branch Management Section */}
      {activeSection === 'branches' && (
        <div style={sectionStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, color: '#333' }}>🏢 Branch Management</h3>
            <button onClick={loadBranches} style={buttonStyle}>
              🔄 Refresh Branches
            </button>
          </div>

          {branches.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: '#666',
              background: '#f8f9fa',
              borderRadius: '4px',
            }}>
              <h4>No branches found</h4>
              <p>Make sure your Foodics API is properly configured.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {branches.map((branch) => (
                <div
                  key={branch.id}
                  style={{
                    border: '1px solid #e9ecef',
                    borderRadius: '6px',
                    padding: '1.5rem',
                    background: selectedBranch?.id === branch.id ? '#e7f3ff' : '#fafafa',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>
                        {branch.name || 'Unknown Branch'}
                      </h4>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        <span style={{ background: '#e9ecef', padding: '2px 6px', borderRadius: '3px' }}>
                          ID: {branch.id}
                        </span>
                        {selectedBranch?.id === branch.id && (
                          <span style={{ 
                            background: '#d4edda', 
                            color: '#155724', 
                            padding: '2px 6px', 
                            borderRadius: '3px', 
                            marginLeft: '0.5rem' 
                          }}>
                            ✅ Default Branch
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <button
                        onClick={() => configureBranch(branch)}
                        disabled={loading}
                        style={{
                          ...successButtonStyle,
                          opacity: loading ? 0.6 : 1,
                          cursor: loading ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {loading ? '⏳ Configuring...' : '📊 Configure & View Sales'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sales Data Section */}
      {activeSection === 'sales' && (
        <div style={sectionStyle}>
          <h3 style={{ marginBottom: '1.5rem', color: '#333' }}>💰 Sales Data</h3>

          {!selectedBranch ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: '#666',
              background: '#f8f9fa',
              borderRadius: '4px',
            }}>
              <h4>No branch selected</h4>
              <p>Please go to Branch Management and configure a branch first.</p>
              <button
                onClick={() => setActiveSection('branches')}
                style={buttonStyle}
              >
                📋 Go to Branch Management
              </button>
            </div>
          ) : (
            <div>
              <div style={{
                background: '#e7f3ff',
                border: '1px solid #b3d9ff',
                borderRadius: '4px',
                padding: '1rem',
                marginBottom: '2rem',
              }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#0056b3' }}>
                  📊 Current Branch: {selectedBranch.name}
                </h4>
                <p style={{ margin: 0, color: '#0056b3', fontSize: '14px' }}>
                  Branch ID: {selectedBranch.id}
                </p>
              </div>

              {/* Date Range Selector */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr auto',
                gap: '1rem',
                marginBottom: '2rem',
                alignItems: 'end',
              }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Start Date:
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    End Date:
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <button
                  onClick={() => loadSalesData(selectedBranch)}
                  disabled={loading}
                  style={{
                    ...buttonStyle,
                    opacity: loading ? 0.6 : 1,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    marginBottom: '1rem',
                  }}
                >
                  {loading ? '⏳ Loading...' : '📈 Load Sales Data'}
                </button>
              </div>

              {/* Sales Data Display */}
              {salesData ? (
                <div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                    marginBottom: '2rem',
                  }}>
                    <div style={{
                      background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                      color: 'white',
                      padding: '1.5rem',
                      borderRadius: '6px',
                      textAlign: 'center',
                    }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '14px', opacity: 0.9 }}>
                        Total Sales
                      </h4>
                      <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                        ${salesData.total_sales || 0}
                      </div>
                    </div>
                    <div style={{
                      background: 'linear-gradient(135deg, #28a745 0%, #1e7e34 100%)',
                      color: 'white',
                      padding: '1.5rem',
                      borderRadius: '6px',
                      textAlign: 'center',
                    }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '14px', opacity: 0.9 }}>
                        Total Orders
                      </h4>
                      <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                        {salesData.total_orders || 0}
                      </div>
                    </div>
                    <div style={{
                      background: 'linear-gradient(135deg, #ffc107 0%, #e0a800 100%)',
                      color: 'white',
                      padding: '1.5rem',
                      borderRadius: '6px',
                      textAlign: 'center',
                    }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '14px', opacity: 0.9 }}>
                        Average Order
                      </h4>
                      <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                        ${salesData.average_order || 0}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    background: '#d4edda',
                    color: '#155724',
                    padding: '1rem',
                    borderRadius: '4px',
                    border: '1px solid #c3e6cb',
                  }}>
                    ✅ <strong>Sales data integration ready!</strong><br />
                    Your Foodics branch is configured and connected. You can now access sales data through the API endpoints.
                  </div>
                </div>
              ) : (
                <div style={{
                  background: '#fff3cd',
                  color: '#856404',
                  padding: '1rem',
                  borderRadius: '4px',
                  border: '1px solid #ffeaa7',
                }}>
                  <h4 style={{ margin: '0 0 0.5rem 0' }}>⚠️ Sales Data Access</h4>
                  <p style={{ margin: '0 0 1rem 0' }}>
                    Sales data access requires additional setup:
                  </p>
                  <ul style={{ margin: '0', paddingLeft: '1.5rem' }}>
                    <li>Ensure your Foodics API token has sales data access permissions</li>
                    <li>Check date range restrictions in your Foodics settings</li>
                    <li>Verify branch configuration is complete</li>
                  </ul>
                  <div style={{ marginTop: '1rem' }}>
                    <strong>✅ Branch is configured!</strong> You can access sales endpoints programmatically.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default FoodicsIntegration 
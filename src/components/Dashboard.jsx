import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import '../styles/navigation.css'
import { useRole } from '../hooks/useRole'
import { PERMISSIONS } from '../lib/roleManager'
import IngredientManagement from './IngredientManagement'
// import ExpenseManagement from './ExpenseManagement' // Moved to Finance Center
// import ExpenseCategoryManagement from './ExpenseCategoryManagement.tsx' // Moved to Finance Center
import FinanceCenter from './FinanceCenter.tsx'
import SuperAdminPanel from './SuperAdminPanel'
import ItemManagement from './ItemManagement'
import WarehouseManagement from './WarehouseManagement.tsx'
import KitchenProduction from './warehouse/KitchenProduction.tsx'
// import BatchProductionCalculator from './BatchProductionCalculator.jsx' // Hidden as requested
import ArabicChequeGenerator from './ArabicChequeGenerator.tsx'
import ChequePrintManager from './ChequePrintManager.tsx'
import PurchaseOrderManagement from './PurchaseOrderManagement.tsx'
import FoodicsIntegration from './FoodicsIntegration.jsx'
import LanguageSwitcher from './LanguageSwitcher'
import LanguagePreference from './LanguagePreference'

function Dashboard({ user, onLogout }) {
  const { t } = useTranslation()
  const { hasPermission, setUser } = useRole()
  const [activeTab, setActiveTab] = useState('dashboard')
  
  // Initialize role manager with user data
  React.useEffect(() => {
    if (user) {
      // Convert user role object to string for roleManager
      const userForRoleManager = {
        ...user,
        role: user.role?.name || 'Staff'
      }
      setUser(userForRoleManager)
    }
  }, [user, setUser])
  
  // Debug: Log user data to see role structure
  console.log('Dashboard - User data:', user)
  console.log('Dashboard - User role:', user?.role)
  console.log('Dashboard - User role name:', user?.role?.name)

  // Define tabs with their required permissions
  const allTabs = [
    { 
      id: 'dashboard', 
      label: t('navigation.dashboard'), 
      permissions: [PERMISSIONS.ACCESS_DASHBOARD] // Basic dashboard access for everyone
    },
    { 
      id: 'finance', 
      label: t('navigation.finance'), 
      permissions: [PERMISSIONS.ACCESS_FINANCE_CENTER] 
    },
    { 
      id: 'purchase-orders', 
      label: t('navigation.purchaseOrders'), 
      permissions: [PERMISSIONS.ACCESS_PURCHASE_ORDERS] 
    },
    { 
      id: 'arabic-cheques', 
      label: t('navigation.arabicCheques'), 
      permissions: [PERMISSIONS.PRINT_CHEQUE, PERMISSIONS.ARABIC_CHEQUE_GENERATION] 
    },
    { 
      id: 'cheque-print', 
      label: t('navigation.chequePrint'), 
      permissions: [PERMISSIONS.PRINT_CHEQUE] 
    },
    { 
      id: 'foodics', 
      label: t('navigation.foodicsIntegration'), 
      permissions: [PERMISSIONS.ACCESS_FOODICS] 
    },
    { 
      id: 'inventory', 
      label: t('navigation.inventory'), 
      permissions: [PERMISSIONS.ACCESS_INVENTORY] 
    },
    { 
      id: 'warehouse', 
      label: t('navigation.warehouse'), 
      permissions: [PERMISSIONS.ACCESS_WAREHOUSE] 
    },
    { 
      id: 'kitchen', 
      label: t('navigation.kitchenProduction'), 
      permissions: [PERMISSIONS.ACCESS_KITCHEN_PRODUCTION] 
    },
    { 
      id: 'super-admin', 
      label: t('navigation.superAdmin'), 
      permissions: [PERMISSIONS.ACCESS_SUPER_ADMIN, PERMISSIONS.MANAGE_USERS] 
    },
    { 
      id: 'ingredients', 
      label: t('navigation.ingredients'), 
      permissions: [PERMISSIONS.ACCESS_INVENTORY, PERMISSIONS.CREATE_ITEM] 
    }
  ]

  // Filter tabs based on user permissions
  const tabs = allTabs.filter(tab => {
    // If no permissions specified, show to everyone
    if (!tab.permissions || tab.permissions.length === 0) return true
    
    // Check if user has any of the required permissions for this tab
    const hasAccess = tab.permissions.some(permission => hasPermission(permission))
    
    // Debug logging
    console.log(`🔍 Tab "${tab.id}": Required permissions:`, tab.permissions)
    console.log(`🔍 Tab "${tab.id}": User has access:`, hasAccess)
    
    return hasAccess
  })

  // Auto-select first available tab if current tab is not accessible
  React.useEffect(() => {
    if (tabs.length > 0 && !tabs.find(tab => tab.id === activeTab)) {
      // Prefer dashboard tab if available, otherwise first tab
      const dashboardTab = tabs.find(tab => tab.id === 'dashboard')
      setActiveTab(dashboardTab ? dashboardTab.id : tabs[0].id)
    }
  }, [tabs, activeTab])

  // Show total available tabs for debugging
  console.log(`🎯 Dashboard: User "${user?.role?.name}" has access to ${tabs.length} tabs:`, tabs.map(t => t.id))
  
  // If user has no accessible tabs, show basic dashboard
  if (tabs.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '2rem', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h2 style={{ color: '#dc3545', marginBottom: '1rem' }}>⚠️ Access Restricted</h2>
          <p style={{ color: '#666', marginBottom: '1rem' }}>
            Your role "{user?.role?.name || 'Unknown'}" doesn't have access to any dashboard sections.
          </p>
          <p style={{ color: '#666', marginBottom: '2rem' }}>
            Please contact an administrator to request appropriate permissions.
          </p>
          <button
            onClick={onLogout}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            {t('auth.logout')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Header */}
      <header style={{
        background: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        padding: '1rem 2rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <h1 style={{
            margin: 0,
            color: '#333',
            fontSize: '24px'
          }}>
            {t('navigation.dashboard')}
          </h1>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <span style={{ color: '#666' }}>
              {t('auth.welcome')}, <strong>{user?.username}</strong> ({user?.role?.name || 'User'})
            </span>
            <LanguagePreference 
              user={user} 
              onLanguageChange={(lang) => {
                // Update user object locally to reflect language change
                if (user) {
                  user.preferred_language = lang;
                }
              }} 
            />
            <button
              onClick={onLogout}
              style={{
                padding: '0.5rem 1rem',
                background: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {t('auth.logout')}
            </button>
          </div>
        </div>
      </header>

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 2rem'
      }}>
        {/* Navigation Tabs */}
        <div style={{
          background: 'white',
          borderRadius: '8px',
          marginBottom: '2rem',
          overflow: 'hidden',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'flex',
            borderBottom: '1px solid #e9ecef',
            overflowX: 'auto'
          }}
          className="navigation-tabs"
          >
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '1rem 2rem',
                  background: activeTab === tab.id ? (tab.id === 'super-admin' ? '#dc2626' : '#007bff') : 'transparent',
                  color: activeTab === tab.id ? 'white' : (tab.id === 'super-admin' ? '#dc2626' : '#495057'),
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                  transition: 'all 0.2s',
                  fontWeight: tab.id === 'super-admin' ? 'bold' : 'normal',
                  flexShrink: 0,
                  minWidth: 'fit-content',
                  whiteSpace: 'nowrap'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ padding: '2rem' }}>
            {activeTab === 'dashboard' && (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <h2 style={{ color: '#333', marginBottom: '1rem' }}>
                  👋 {t('auth.welcome')}, {user?.username}!
                </h2>
                <p style={{ color: '#666', fontSize: '18px', marginBottom: '2rem' }}>
                  {t('dashboard.welcome')} - Role: <strong>{user?.role?.name || 'User'}</strong>
                </p>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                  gap: '1rem',
                  maxWidth: '800px',
                  margin: '0 auto'
                }}>
                  {tabs.filter(tab => tab.id !== 'dashboard').map(tab => (
                    <div 
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        padding: '1.5rem',
                        background: 'white',
                        border: '1px solid #e9ecef',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textAlign: 'center'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-2px)'
                        e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)'
                        e.target.style.boxShadow = 'none'
                      }}
                    >
                      <h4 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>{tab.label}</h4>
                      <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                        Click to access {tab.label.toLowerCase()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeTab === 'finance' && <FinanceCenter />}
            {activeTab === 'purchase-orders' && <PurchaseOrderManagement />}
            {activeTab === 'arabic-cheques' && <ArabicChequeGenerator />}
            {activeTab === 'cheque-print' && <ChequePrintManager />}
            {activeTab === 'foodics' && <FoodicsIntegration />}
            {activeTab === 'inventory' && <ItemManagement />}
            {activeTab === 'warehouse' && <WarehouseManagement />}
            {activeTab === 'kitchen' && <KitchenProduction />}
            {activeTab === 'super-admin' && <SuperAdminPanel />}
            {activeTab === 'ingredients' && <IngredientManagement />}
            {activeTab === 'stock' && (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <h3>{t('navigation.stock')}</h3>
                <p style={{ color: '#666' }}>{t('common.comingSoon')}</p>
              </div>
            )}
            {activeTab === 'warehouses' && (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <h3>{t('navigation.warehouse')}</h3>
                <p style={{ color: '#666' }}>{t('common.comingSoon')}</p>
              </div>
            )}
            {activeTab === 'categories' && (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <h3>{t('navigation.categories')}</h3>
                <p style={{ color: '#666' }}>{t('common.comingSoon')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard 
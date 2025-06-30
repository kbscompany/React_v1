import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
import PurchaseOrderManagement from './PurchaseOrderManagement.tsx'
import FoodicsIntegration from './FoodicsIntegration.jsx'
import LanguageSwitcher from './LanguageSwitcher'

function Dashboard({ user, onLogout }) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('finance')
  
  // Debug: Log user data to see role structure
  console.log('Dashboard - User data:', user)
  console.log('Dashboard - User role:', user?.role)
  console.log('Dashboard - User role name:', user?.role?.name)

  const tabs = [
    { id: 'finance', label: t('navigation.finance') },
    { id: 'purchase-orders', label: '📋 Purchase Orders' },
    { id: 'arabic-cheques', label: '🖨️ Arabic Cheques' },
    { id: 'foodics', label: '🍔 Foodics Integration' },
    { id: 'inventory', label: t('navigation.inventory') },
    { id: 'warehouse', label: t('navigation.warehouse') },
    { id: 'kitchen', label: '🧪 Kitchen Production' },
    { id: 'super-admin', label: '🔧 Super Admin', adminOnly: true },
    { id: 'ingredients', label: t('navigation.ingredients') }
  ]

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
            <LanguageSwitcher />
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
            borderBottom: '1px solid #e9ecef'
          }}>
            {tabs.map(tab => {
              // Debug: Log role checking
              if (tab.adminOnly) {
                console.log('Checking admin access for tab:', tab.id)
                console.log('User role:', user?.role)
                console.log('User role name:', user?.role?.name)
                console.log('Role check result:', user?.role?.name === 'Admin')
              }
              
              // Hide admin-only tabs for non-admin users
              // Temporarily disabled for debugging - always show admin tabs
              if (false && tab.adminOnly && user?.role?.name !== 'Admin') {
                return null;
              }
              
              return (
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
                    fontWeight: tab.id === 'super-admin' ? 'bold' : 'normal'
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div style={{ padding: '2rem' }}>
            {activeTab === 'finance' && <FinanceCenter />}
            {activeTab === 'purchase-orders' && <PurchaseOrderManagement />}
            {activeTab === 'arabic-cheques' && <ArabicChequeGenerator />}
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
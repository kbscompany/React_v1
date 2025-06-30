import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import RoleSelector from './RoleSelector';

const SuperAdminPanel = () => {
  const { t } = useTranslation();
  const [safes, setSafes] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success', 'error', 'warning'
  const [confirmAction, setConfirmAction] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('stats'); // 'stats', 'safes', 'users', 'system'
  const [systemStats, setSystemStats] = useState({
    totalSafes: 0,
    totalCheques: 0,
    totalBalance: 0
  });

  useEffect(() => {
    loadSystemStats();
    loadUsers();
  }, []);

  const loadSystemStats = async () => {
    try {
      // Load safes
      const safesResponse = await api.get('/safes-simple');
      const safesData = safesResponse.data?.data ? safesResponse.data.data : 
                       Array.isArray(safesResponse.data) ? safesResponse.data : [];
      
      // Load unassigned cheques
      const chequesResponse = await api.get('/cheques-unassigned-simple');
      const chequesData = chequesResponse.data?.data ? chequesResponse.data.data : 
                          Array.isArray(chequesResponse.data) ? chequesResponse.data : [];
      
      setSafes(safesData);
      setSystemStats({
        totalSafes: safesData.length,
        totalCheques: chequesData.length,
        totalBalance: safesData.reduce((sum, safe) => sum + parseFloat(safe.current_balance || 0), 0)
      });
    } catch (error) {
      console.error('Error loading system stats:', error);
      console.error('Error details:', error.response?.data || error.message);
      // Set empty arrays as fallback
      setSafes([]);
      setSystemStats({
        totalSafes: 0,
        totalCheques: 0,
        totalBalance: 0
      });
      showMessage('Error loading system stats. Please check if the API endpoints are accessible.', 'error');
    }
  };

  const loadUsers = async () => {
    try {
      // For now, we'll create a mock user list since we don't have a users endpoint
      // In a real implementation, this would fetch from an API endpoint
      const mockUsers = [
        { id: 1, username: 'admin', email: 'admin@bakery.com', role: 'superAdmin', is_active: true },
        { id: 2, username: 'manager', email: 'manager@bakery.com', role: 'manager', is_active: true },
        { id: 3, username: 'accountant', email: 'accountant@bakery.com', role: 'accountant', is_active: true },
        { id: 4, username: 'warehouse_staff', email: 'warehouse@bakery.com', role: 'warehouseManager', is_active: true }
      ];
      setUsers(mockUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      showMessage('Error loading users', 'error');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      // For now, we'll update the local state
      // In a real implementation, this would make an API call
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
      showMessage(`Role updated successfully for user ${userId}`, 'success');
    } catch (error) {
      console.error('Error updating user role:', error);
      showMessage('Error updating user role', 'error');
    }
  };

  const showMessage = (text, type) => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const confirmAndExecute = (action, actionFunction) => {
    setConfirmAction(action);
    setShowConfirmDialog(true);
    window.pendingAction = actionFunction;
  };

  const executeConfirmedAction = async () => {
    setShowConfirmDialog(false);
    if (window.pendingAction) {
      await window.pendingAction();
      window.pendingAction = null;
    }
    setConfirmAction('');
  };

  const resetSpecificSafe = async (safeId, safeName) => {
    setLoading(true);
    try {
      const response = await api.post(`/admin-simple/reset-safe/${safeId}`);
      if (response.data.success) {
        showMessage(`Safe "${safeName}" has been reset successfully!`, 'success');
        await loadSystemStats();
      } else {
        showMessage('Failed to reset safe', 'error');
      }
    } catch (error) {
      console.error('Error resetting safe:', error);
      showMessage(`Error resetting safe: ${error.response?.data?.detail || error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetAllSafes = async () => {
    setLoading(true);
    try {
      const response = await api.post('/admin-simple/reset-all-safes?confirm=true');
      if (response.data.success) {
        showMessage(`All safes have been reset!`, 'success');
        await loadSystemStats();
      } else {
        showMessage('Failed to reset all safes', 'error');
      }
    } catch (error) {
      console.error('Error resetting all safes:', error);
      showMessage(`Error resetting all safes: ${error.response?.data?.detail || error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteAllCheques = async () => {
    setLoading(true);
    try {
      const response = await api.delete('/admin-simple/delete-all-cheques?confirm=true');
      if (response.data.success) {
        showMessage(`All cheques deleted!`, 'warning');
        await loadSystemStats();
      } else {
        showMessage('Failed to delete all cheques', 'error');
      }
    } catch (error) {
      console.error('Error deleting all cheques:', error);
      showMessage(`Error deleting all cheques: ${error.response?.data?.detail || error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #dc2626, #b91c1c)', 
        color: 'white', 
        padding: '20px', 
        borderRadius: '10px', 
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '28px' }}>{t('superAdmin.title')}</h1>
        <p style={{ margin: 0, opacity: 0.9 }}>{t('superAdmin.subtitle')}</p>
      </div>

      {/* Message Display */}
      {message && (
        <div style={{
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          backgroundColor: messageType === 'success' ? '#dcfce7' : 
                          messageType === 'error' ? '#fef2f2' : '#fef3c7',
          color: messageType === 'success' ? '#166534' : 
                 messageType === 'error' ? '#dc2626' : '#92400e',
          border: `1px solid ${messageType === 'success' ? '#bbf7d0' : 
                              messageType === 'error' ? '#fecaca' : '#fde68a'}`
        }}>
          {message}
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{ 
        display: 'flex', 
        borderBottom: '2px solid #e2e8f0', 
        marginBottom: '20px',
        backgroundColor: 'white',
        borderRadius: '8px 8px 0 0',
        overflow: 'hidden'
      }}>
        {[
          { id: 'stats', label: '📊 Statistics', icon: '📊' },
          { id: 'users', label: '👥 User Management', icon: '👥' },
          { id: 'safes', label: '🏦 Safe Management', icon: '🏦' },
          { id: 'system', label: '🌐 System Operations', icon: '🌐' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '15px 20px',
              border: 'none',
              backgroundColor: activeTab === tab.id ? '#dc2626' : 'transparent',
              color: activeTab === tab.id ? 'white' : '#64748b',
              cursor: 'pointer',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              transition: 'all 0.3s ease',
              fontSize: '14px'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'stats' && (
        <div>
          {/* System Statistics */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '15px', 
            marginBottom: '30px' 
          }}>
            <div style={{ 
              background: '#f8fafc', 
              padding: '20px', 
              borderRadius: '8px', 
              border: '1px solid #e2e8f0',
              textAlign: 'center'
            }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#475569' }}>{t('superAdmin.statistics.totalSafes')}</h3>
              <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>
                {systemStats.totalSafes}
              </p>
            </div>
            <div style={{ 
              background: '#f8fafc', 
              padding: '20px', 
              borderRadius: '8px', 
              border: '1px solid #e2e8f0',
              textAlign: 'center'
            }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#475569' }}>{t('superAdmin.statistics.unassignedCheques')}</h3>
              <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>
                {systemStats.totalCheques}
              </p>
            </div>
            <div style={{ 
              background: '#f8fafc', 
              padding: '20px', 
              borderRadius: '8px', 
              border: '1px solid #e2e8f0',
              textAlign: 'center'
            }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#475569' }}>{t('superAdmin.statistics.totalBalance')}</h3>
              <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>
                ${systemStats.totalBalance.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* User Management Tab */}
      {activeTab === 'users' && (
        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '8px', 
          border: '1px solid #e2e8f0',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: '0 0 20px 0', color: '#1e293b' }}>👥 User Role Management</h2>
          <p style={{ margin: '0 0 20px 0', color: '#64748b' }}>
            Manage user roles and permissions. Control who can access which features of the system.
          </p>
          
          <div style={{ display: 'grid', gap: '15px' }}>
            {users.map(user => (
              <div key={user.id} style={{
                padding: '20px',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                  <div>
                    <h4 style={{ margin: '0 0 5px 0', color: '#1e293b' }}>{user.username}</h4>
                    <p style={{ margin: '0 0 5px 0', color: '#64748b', fontSize: '14px' }}>{user.email}</p>
                    <span style={{
                      padding: '4px 8px',
                      backgroundColor: user.is_active ? '#dcfce7' : '#fef2f2',
                      color: user.is_active ? '#166534' : '#dc2626',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                
                <RoleSelector 
                  user={user}
                  onRoleChange={(newRole) => handleRoleChange(user.id, newRole)}
                  disabled={loading}
                />
              </div>
            ))}
          </div>
          
          <div style={{
            marginTop: '20px',
            padding: '15px',
            background: '#f0f9ff',
            borderRadius: '8px',
            border: '1px solid #bae6fd'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#0369a1' }}>💡 Role Management Tips</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#0369a1' }}>
              <li>Super Admin: Full system access including user management</li>
              <li>Admin: Most features with user management capabilities</li>
              <li>Manager: Supervisory access with limited admin features</li>
              <li>Accountant: Finance-focused access (expenses, cheques, reports)</li>
              <li>Warehouse Manager: Full warehouse and inventory control</li>
              <li>Viewer: Read-only access to basic features</li>
            </ul>
          </div>
        </div>
      )}

      {/* Safe Management Tab */}
      {activeTab === 'safes' && (
        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '8px', 
          border: '1px solid #e2e8f0',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: '0 0 20px 0', color: '#1e293b' }}>{t('superAdmin.safeManagement.title')}</h2>
          <div style={{ display: 'grid', gap: '10px' }}>
            {Array.isArray(safes) && safes.length > 0 ? safes.map(safe => (
              <div key={safe.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '15px',
                background: '#f8fafc',
                borderRadius: '6px',
                border: '1px solid #e2e8f0'
              }}>
                <div>
                  <strong style={{ color: '#1e293b' }}>{safe.name}</strong>
                  <span style={{ marginLeft: '15px', color: '#64748b' }}>
                    {t('superAdmin.safeManagement.balance')}: ${parseFloat(safe.current_balance || 0).toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={() => confirmAndExecute(
                    `reset safe "${safe.name}"`,
                    () => resetSpecificSafe(safe.id, safe.name)
                  )}
                  disabled={loading}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  {t('superAdmin.safeManagement.resetSafe')}
                </button>
              </div>
            )) : (
              <div style={{
                padding: '20px',
                textAlign: 'center',
                color: '#64748b',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                {Array.isArray(safes) ? 'No safes found.' : 'Loading safes...'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* System Operations Tab */}
      {activeTab === 'system' && (
        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '8px', 
          border: '1px solid #e2e8f0'
        }}>
          <h2 style={{ margin: '0 0 20px 0', color: '#1e293b' }}>🌐 System-Wide Operations</h2>
          
          <div style={{ display: 'grid', gap: '15px' }}>
            {/* Reset All Safes */}
            <div style={{
              padding: '20px',
              background: '#fef3c7',
              borderRadius: '8px',
              border: '1px solid #fde68a'
            }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#92400e' }}>⚠️ Reset All Safes</h3>
              <p style={{ margin: '0 0 15px 0', color: '#78350f' }}>
                This will reset ALL safes, remove all cheques from safes, and delete all expenses.
              </p>
              <button
                onClick={() => confirmAndExecute('reset ALL safes', resetAllSafes)}
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  fontWeight: 'bold'
                }}
              >
                {loading ? 'Processing...' : 'Reset All Safes'}
              </button>
            </div>

            {/* Delete All Cheques */}
            <div style={{
              padding: '20px',
              background: '#fef2f2',
              borderRadius: '8px',
              border: '1px solid #fecaca'
            }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#dc2626' }}>🗑️ Delete All Cheques</h3>
              <p style={{ margin: '0 0 15px 0', color: '#991b1b' }}>
                <strong>EXTREMELY DANGEROUS:</strong> This will permanently delete ALL cheques, expenses, and settlements.
              </p>
              <button
                onClick={() => confirmAndExecute('DELETE ALL CHEQUES AND DATA', deleteAllCheques)}
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  fontWeight: 'bold'
                }}
              >
                {loading ? 'Processing...' : 'Delete All Cheques'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '10px',
            maxWidth: '500px',
            width: '90%',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#dc2626' }}>⚠️ Confirm Dangerous Operation</h3>
            <p style={{ margin: '0 0 20px 0', color: '#374151' }}>
              Are you sure you want to <strong>{confirmAction}</strong>?
            </p>
            <p style={{ margin: '0 0 25px 0', color: '#dc2626', fontSize: '14px' }}>
              This action cannot be undone!
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => setShowConfirmDialog(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={executeConfirmedAction}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Yes, Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Warning */}
      <div style={{
        marginTop: '30px',
        padding: '15px',
        background: '#fef2f2',
        borderRadius: '8px',
        border: '1px solid #fecaca',
        textAlign: 'center'
      }}>
        <p style={{ margin: 0, color: '#dc2626', fontSize: '14px' }}>
          <strong>⚠️ WARNING:</strong> These operations are for testing and emergency use only. 
          Always backup your database before using these features!
        </p>
      </div>
    </div>
  );
};

export default SuperAdminPanel; 
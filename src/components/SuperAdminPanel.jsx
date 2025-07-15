import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import RoleSelector from './RoleSelector';
import PermissionsManager from './PermissionsManager';

const SuperAdminPanel = () => {
  const { t } = useTranslation();
  const [safes, setSafes] = useState([]);
  const [users, setUsers] = useState([]);
  const [userRoles, setUserRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success', 'error', 'warning'
  const [confirmAction, setConfirmAction] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('stats'); // 'stats', 'safes', 'users', 'permissions', 'system'
  const [systemStats, setSystemStats] = useState({
    totalSafes: 0,
    totalCheques: 0,
    totalBalance: 0
  });

  // User management state
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userFormData, setUserFormData] = useState({
    username: '',
    password: '',
    role_id: 7,  // Default to Staff role
    is_active: true
  });

  useEffect(() => {
    loadSystemStats();
    loadUsers();
    loadUserRoles();
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
      const response = await api.get('/admin-simple/users');
      const usersData = response.data || [];
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      showMessage('Error loading users: ' + (error.response?.data?.detail || error.message), 'error');
    }
  };

  const loadUserRoles = async () => {
    try {
      const response = await api.get('/admin-simple/user-roles-simple');
      console.log('🔧 SuperAdminPanel: Loaded roles from API:', response.data);
      const rolesData = response.data || [];
      setUserRoles(rolesData);
    } catch (error) {
      console.error('Error loading user roles:', error);
      showMessage('Error loading user roles: ' + (error.response?.data?.detail || error.message), 'error');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/admin-simple/users/${userId}`, { role_id: newRole });
      showMessage(`Role updated successfully for user ${userId}`, 'success');
      await loadUsers(); // Reload users to reflect changes
    } catch (error) {
      console.error('Error updating user role:', error);
      showMessage('Error updating user role: ' + (error.response?.data?.detail || error.message), 'error');
    }
  };

  const handleCreateUser = async () => {
    if (!userFormData.username || !userFormData.password) {
      showMessage('Username and password are required', 'error');
      return;
    }

    setLoading(true);
    try {
      await api.post('/admin-simple/users', userFormData);
      showMessage('User created successfully', 'success');
      setShowUserForm(false);
      setUserFormData({ username: '', password: '', role_id: 7, is_active: true });
      await loadUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      showMessage('Error creating user: ' + (error.response?.data?.detail || error.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!userFormData.username) {
      showMessage('Username is required', 'error');
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        username: userFormData.username,
        role_id: userFormData.role_id,
        is_active: userFormData.is_active
      };
      
      // Only include password if it's provided
      if (userFormData.password) {
        updateData.password = userFormData.password;
      }

      await api.put(`/admin-simple/users/${editingUser.id}`, updateData);
      showMessage('User updated successfully', 'success');
      setShowUserForm(false);
      setEditingUser(null);
      setUserFormData({ username: '', password: '', role_id: 7, is_active: true });
      await loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      showMessage('Error updating user: ' + (error.response?.data?.detail || error.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    confirmAndExecute(
      `delete user "${username}"`,
      async () => {
        setLoading(true);
        try {
          await api.delete(`/admin-simple/users/${userId}`);
          showMessage(`User "${username}" deleted successfully`, 'success');
          await loadUsers();
        } catch (error) {
          console.error('Error deleting user:', error);
          showMessage('Error deleting user: ' + (error.response?.data?.detail || error.message), 'error');
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleToggleUserActive = async (userId, username) => {
    setLoading(true);
    try {
      const response = await api.post(`/admin-simple/users/${userId}/toggle-active`);
      showMessage(response.data.message, 'success');
      await loadUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      showMessage('Error toggling user status: ' + (error.response?.data?.detail || error.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  const startEditUser = (user) => {
    setEditingUser(user);
    setUserFormData({
      username: user.username,
      password: '',
      role_id: user.role_id,
      is_active: user.is_active
    });
    setShowUserForm(true);
  };

  const cancelUserForm = () => {
    setShowUserForm(false);
    setEditingUser(null);
    setUserFormData({ username: '', password: '', role_id: 7, is_active: true });
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
      { id: 'permissions', label: '🔐 Permissions Manager', icon: '🔐' },
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: '0', color: '#1e293b' }}>👥 User Management</h2>
            <button
              onClick={() => setShowUserForm(true)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px'
              }}
            >
              + Create New User
            </button>
          </div>
          
          {/* User Form Modal */}
          {showUserForm && (
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
                maxHeight: '80vh',
                overflowY: 'auto'
              }}>
                <h3 style={{ margin: '0 0 20px 0', color: '#1e293b' }}>
                  {editingUser ? 'Edit User' : 'Create New User'}
                </h3>
                
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Username *
                  </label>
                  <input
                    type="text"
                    value={userFormData.username}
                    onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Password {editingUser ? '(Leave empty to keep current)' : '*'}
                  </label>
                  <input
                    type="password"
                    value={userFormData.password}
                    onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Role
                  </label>
                  <select
                    value={userFormData.role_id}
                    onChange={(e) => setUserFormData({ ...userFormData, role_id: parseInt(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  >
                    {userRoles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={userFormData.is_active}
                      onChange={(e) => setUserFormData({ ...userFormData, is_active: e.target.checked })}
                    />
                    <span style={{ fontWeight: 'bold' }}>Active User</span>
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={cancelUserForm}
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
                    onClick={editingUser ? handleUpdateUser : handleCreateUser}
                    disabled={loading}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#059669',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.6 : 1,
                      fontWeight: 'bold'
                    }}
                  >
                    {loading ? 'Saving...' : (editingUser ? 'Update User' : 'Create User')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Users List */}
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
                    <p style={{ margin: '0 0 5px 0', color: '#64748b', fontSize: '14px' }}>
                      Role: {user.role?.name || 'Unknown'}
                    </p>
                    <p style={{ margin: '0 0 5px 0', color: '#64748b', fontSize: '14px' }}>
                      Created: {new Date(user.created_at).toLocaleDateString()}
                    </p>
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
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => startEditUser(user)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#0369a1',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleUserActive(user.id, user.username)}
                      disabled={loading}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: user.is_active ? '#f59e0b' : '#059669',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.6 : 1,
                        fontSize: '12px'
                      }}
                    >
                      {user.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id, user.username)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Delete
                    </button>
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
          
          {users.length === 0 && (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              color: '#64748b',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              No users found. Create your first user!
            </div>
          )}
        </div>
              )}

        {/* Permissions Manager Tab */}
        {activeTab === 'permissions' && (
          <div style={{ padding: '1.5rem' }}>
            <PermissionsManager />
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
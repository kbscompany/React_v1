import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * RoleSelector Component - Complete User Role & Permissions Management
 * Features: Role dropdown, Page/Tab checklist, Update permissions
 */
const RoleSelector = ({ onUserUpdate }) => {
  const { t } = useTranslation();
  
  // Available roles
  const ROLES = [
    { id: 'super_admin', name: 'Super Admin', description: 'Full system access' },
    { id: 'admin', name: 'Admin', description: 'Most features + user management' },
    { id: 'manager', name: 'Manager', description: 'Management with limited admin features' },
    { id: 'accountant', name: 'Accountant', description: 'Finance and accounting focused' },
    { id: 'warehouse_manager', name: 'Warehouse Manager', description: 'Warehouse and Recipe Management' },
    { id: 'inventory_staff', name: 'Inventory Staff', description: 'Inventory operations only' },
    { id: 'finance_staff', name: 'Finance Staff', description: 'Financial operations' },
    { id: 'viewer', name: 'Viewer', description: 'Read-only access' }
  ];

  // All available pages and tabs
  const PERMISSIONS = {
    'Dashboard': {
      icon: '📊',
      pages: ['Main Dashboard']
    },
    'Finance Center': {
      icon: '💰',
      pages: ['Finance Overview', 'Quick Actions', 'Statistics']
    },
    'Expense Management': {
      icon: '💸',
      pages: ['View Expenses', 'Create Expense', 'Edit Expense', 'Delete Expense']
    },
    'Expense Categories': {
      icon: '📂',
      pages: ['View Categories', 'Create Category', 'Edit Category', 'Delete Category']
    },
    'Cheque Management': {
      icon: '🏦',
      pages: ['View Cheques', 'Issue Cheque', 'Settle Cheque', 'Update Cheque Status']
    },
    'Recipe Management': {
      icon: '📦',
      pages: ['View Inventory', 'Add Items', 'Edit Items', 'Delete Items', 'Stock Management']
    },
    'Warehouse Management': {
      icon: '🏬',
      pages: ['View Warehouses', 'Create Warehouse', 'Edit Warehouse', 'Warehouse Settings', 'Stock Levels']
    },
    'Super Admin': {
      icon: '🔧',
      pages: ['User Management', 'System Statistics', 'Safe Management', 'System Operations', 'Reset Functions']
    }
  };

  // State management
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState('viewer');
  const [permissions, setPermissions] = useState({});
  const [users, setUsers] = useState([
    { id: 1, username: 'admin', role: 'admin' },
    { id: 2, username: 'user1', role: 'accountant' },
    { id: 3, username: 'user2', role: 'viewer' }
  ]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Initialize permissions based on selected role
  useEffect(() => {
    const rolePermissions = getRolePermissions(selectedRole);
    setPermissions(rolePermissions);
  }, [selectedRole]);

  // Get default permissions for a role
  const getRolePermissions = (role) => {
    const defaultPerms = {};
    
    Object.keys(PERMISSIONS).forEach(section => {
      defaultPerms[section] = {};
      PERMISSIONS[section].pages.forEach(page => {
        // Set default permissions based on role
        if (role === 'super_admin') {
          defaultPerms[section][page] = true;
        } else if (role === 'admin') {
          defaultPerms[section][page] = section !== 'Super Admin';
        } else if (role === 'manager') {
          defaultPerms[section][page] = !['Super Admin', 'System Operations'].includes(section);
        } else if (role === 'accountant') {
          defaultPerms[section][page] = ['Finance Center', 'Expense Management', 'Expense Categories', 'Cheque Management'].includes(section);
        } else if (role === 'warehouse_manager') {
          defaultPerms[section][page] = ['Warehouse Management', 'Recipe Management'].includes(section);
        } else if (role === 'inventory_staff') {
          defaultPerms[section][page] = section === 'Recipe Management' && !page.includes('Delete');
        } else if (role === 'finance_staff') {
          defaultPerms[section][page] = ['Finance Center', 'Expense Management'].includes(section) && !page.includes('Delete');
        } else {
          defaultPerms[section][page] = section === 'Dashboard' || page.includes('View');
        }
      });
    });
    
    return defaultPerms;
  };

  // Handle permission toggle
  const togglePermission = (section, page) => {
    setPermissions(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [page]: !prev[section][page]
      }
    }));
  };

  // Handle role change
  const handleRoleChange = (newRole) => {
    setSelectedRole(newRole);
    const newPermissions = getRolePermissions(newRole);
    setPermissions(newPermissions);
  };

  // Update user permissions
  const updateUserPermissions = async () => {
    if (!selectedUser) {
      setMessage('Please select a user first!');
      return;
    }

    setLoading(true);
    try {
      // Here you would normally make an API call
      // await updateUserRoleAndPermissions(selectedUser, selectedRole, permissions);
      
      // Simulate API call
      setTimeout(() => {
        setMessage(`✅ Successfully updated permissions for user!`);
        setLoading(false);
        
        // Update local users state
        setUsers(prev => prev.map(user => 
          user.id.toString() === selectedUser 
            ? { ...user, role: selectedRole }
            : user
        ));
        
        if (onUserUpdate) {
          onUserUpdate({ userId: selectedUser, role: selectedRole, permissions });
        }
      }, 1000);
      
    } catch (error) {
      setMessage(`❌ Error updating permissions: ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: 'white', 
      borderRadius: '8px', 
      border: '1px solid #e2e8f0',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h3 style={{ 
        margin: '0 0 20px 0', 
        color: '#1a202c', 
        fontSize: '20px', 
        borderBottom: '2px solid #e2e8f0', 
        paddingBottom: '10px' 
      }}>
        👥 User Role & Permissions Management
      </h3>

      {/* User Selection */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '8px', 
          fontWeight: 'bold', 
          color: '#374151' 
        }}>
          Select User:
        </label>
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            border: '2px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            backgroundColor: 'white'
          }}
        >
          <option value="">-- Select a user --</option>
          {users.map(user => (
            <option key={user.id} value={user.id}>
              {user.username} (Current: {user.role})
            </option>
          ))}
        </select>
      </div>

      {/* Role Selection */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '8px', 
          fontWeight: 'bold', 
          color: '#374151' 
        }}>
          Assign Role:
        </label>
        <select
          value={selectedRole}
          onChange={(e) => handleRoleChange(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            border: '2px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            backgroundColor: 'white'
          }}
        >
          {ROLES.map(role => (
            <option key={role.id} value={role.id}>
              {role.name} - {role.description}
            </option>
          ))}
        </select>
      </div>

      {/* Permissions Checklist */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ 
          margin: '0 0 15px 0', 
          color: '#374151', 
          fontSize: '16px',
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: '8px'
        }}>
          📋 Page & Tab Permissions:
        </h4>
        
        <div style={{ 
          maxHeight: '400px', 
          overflowY: 'auto', 
          border: '1px solid #e5e7eb', 
          borderRadius: '6px',
          padding: '15px'
        }}>
          {Object.entries(PERMISSIONS).map(([section, data]) => (
            <div key={section} style={{ 
              marginBottom: '20px',
              padding: '15px',
              backgroundColor: '#f9fafb',
              borderRadius: '6px',
              border: '1px solid #e5e7eb'
            }}>
              <h5 style={{ 
                margin: '0 0 10px 0', 
                color: '#111827', 
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                {data.icon} {section}
              </h5>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '8px' 
              }}>
                {data.pages.map(page => (
                  <label key={page} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    cursor: 'pointer',
                    padding: '5px',
                    borderRadius: '4px',
                    backgroundColor: permissions[section]?.[page] ? '#ecfdf5' : 'white',
                    border: `1px solid ${permissions[section]?.[page] ? '#10b981' : '#d1d5db'}`
                  }}>
                    <input
                      type="checkbox"
                      checked={permissions[section]?.[page] || false}
                      onChange={() => togglePermission(section, page)}
                      style={{ 
                        marginRight: '8px',
                        transform: 'scale(1.2)'
                      }}
                    />
                    <span style={{ 
                      fontSize: '13px',
                      color: permissions[section]?.[page] ? '#065f46' : '#374151'
                    }}>
                      {page}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Update Button */}
      <div style={{ textAlign: 'center', marginBottom: '15px' }}>
        <button
          onClick={updateUserPermissions}
          disabled={loading || !selectedUser}
          style={{
            padding: '12px 30px',
            backgroundColor: loading || !selectedUser ? '#9ca3af' : '#059669',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: loading || !selectedUser ? 'not-allowed' : 'pointer',
            minWidth: '200px'
          }}
        >
          {loading ? '⏳ Updating...' : '🔄 Update Permissions'}
        </button>
      </div>

      {/* Message Display */}
      {message && (
        <div style={{
          padding: '10px',
          borderRadius: '6px',
          textAlign: 'center',
          backgroundColor: message.includes('✅') ? '#ecfdf5' : '#fef2f2',
          color: message.includes('✅') ? '#065f46' : '#dc2626',
          border: `1px solid ${message.includes('✅') ? '#10b981' : '#ef4444'}`
        }}>
          {message}
        </div>
      )}
    </div>
  );
};

export default RoleSelector; 
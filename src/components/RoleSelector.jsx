import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

/**
 * RoleSelector Component - Simple role selector for user management
 * Displays current role and allows changing it
 */
const RoleSelector = ({ user, onRoleChange, disabled = false, availableRoles = [] }) => {
  const { t } = useTranslation();
  
  // Default color mapping for roles (if not provided from API)
  const DEFAULT_ROLE_COLORS = {
    'Admin': '#dc2626',
    'Warehouse Manager': '#059669', 
    'Kitchen Manager': '#7c3aed',
    'Production Staff': '#ea580c',
    'Inventory Staff': '#0891b2',
    'Finance Staff': '#be185d',
    'Staff': '#6b7280'
  };

  const [selectedRole, setSelectedRole] = useState(user?.role_id || 3);
  const [dynamicRoles, setDynamicRoles] = useState([]);

  // Load roles from API
  useEffect(() => {
    loadRoles();
  }, []);

  // Update selected role when user changes
  useEffect(() => {
    setSelectedRole(user?.role_id || 3);
  }, [user]);

  const loadRoles = async () => {
    try {
      const response = await api.get('/admin-simple/user-roles-simple');
      const rolesData = response.data || [];
      console.log('🔧 RoleSelector: Loaded roles from API:', rolesData);
      setDynamicRoles(rolesData);
    } catch (error) {
      console.error('Error loading roles:', error);
      // Fallback to comprehensive default roles that match PermissionsManager
      setDynamicRoles([
        { id: 1, name: 'Admin' },
        { id: 2, name: 'Warehouse Manager' },
        { id: 3, name: 'Kitchen Manager' },
        { id: 4, name: 'Production Staff' },
        { id: 5, name: 'Inventory Staff' },
        { id: 6, name: 'Finance Staff' },
        { id: 7, name: 'Staff' },
        { id: 8, name: 'Manager' },
        { id: 9, name: 'Accountant' },
        { id: 10, name: 'Viewer' }
      ]);
    }
  };

  const handleRoleChange = (event) => {
    const newRoleId = parseInt(event.target.value);
    setSelectedRole(newRoleId);
    if (onRoleChange) {
      onRoleChange(newRoleId);
    }
  };

  const getCurrentRole = () => {
    const roleData = dynamicRoles.find(role => role.id === selectedRole);
    if (roleData) {
      return {
        name: roleData.name,
        color: DEFAULT_ROLE_COLORS[roleData.name] || '#6b7280',
        description: getRoleDescription(roleData.name)
      };
    }
    return { name: 'Unknown', color: '#6b7280', description: 'Unknown role' };
  };

  const getRoleDescription = (roleName) => {
    const descriptions = {
      'Admin': 'Full system access including user management',
      'Warehouse Manager': 'Warehouse and inventory management',
      'Kitchen Manager': 'Kitchen production and recipe management',
      'Production Staff': 'Kitchen production execution',
      'Inventory Staff': 'Inventory and stock management',
      'Finance Staff': 'Financial operations and reporting',
      'Staff': 'Basic system access'
    };
    return descriptions[roleName] || 'Basic system access';
  };

  const currentRole = getCurrentRole();

  // Use availableRoles if provided, otherwise use dynamically loaded roles
  const rolesToShow = availableRoles.length > 0 ? 
    availableRoles.map(role => [role.id, role]) : 
    dynamicRoles.map(role => [role.id, role]);

  return (
    <div style={{ 
      padding: '15px', 
      backgroundColor: '#f8fafc', 
      borderRadius: '8px', 
      border: '1px solid #e2e8f0',
      marginTop: '10px'
    }}>
      <h4 style={{ margin: '0 0 10px 0', color: '#1e293b', fontSize: '14px' }}>
        {t('roles.selectRole')}
      </h4>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#64748b' }}>
          Current Role:
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            padding: '4px 8px',
            backgroundColor: currentRole.color,
            color: 'white',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            {currentRole.name}
          </span>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            {currentRole.description}
          </span>
        </div>
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#64748b' }}>
          Change Role:
        </label>
        <select
          value={selectedRole}
          onChange={handleRoleChange}
          disabled={disabled}
          style={{
            width: '100%',
            padding: '6px 8px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            fontSize: '12px',
            backgroundColor: disabled ? '#f3f4f6' : 'white',
            cursor: disabled ? 'not-allowed' : 'pointer'
          }}
        >
          {rolesToShow.map(([id, role]) => (
            <option key={id} value={id}>
              {role.name} - {getRoleDescription(role.name)}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginTop: '10px', fontSize: '11px', color: '#6b7280' }}>
        <strong>Key Permissions:</strong>
        <ul style={{ margin: '5px 0 0 0', paddingLeft: '15px' }}>
          {selectedRole === 1 && (
            <>
              <li>Full system access</li>
              <li>User management</li>
              <li>System administration</li>
              <li>All financial operations</li>
            </>
          )}
          {selectedRole === 2 && (
            <>
              <li>Warehouse management</li>
              <li>Stock control & transfers</li>
              <li>Inventory operations</li>
              <li>Purchase order receiving</li>
              <li>Foodics integration</li>
            </>
          )}
          {selectedRole === 3 && (
            <>
              <li>Recipe management (all types)</li>
              <li>Production planning & scheduling</li>
              <li>Kitchen workflow management</li>
              <li>Batch production calculator</li>
            </>
          )}
          {selectedRole === 4 && (
            <>
              <li>Production execution</li>
              <li>Kitchen workflow</li>
              <li>Recipe viewing</li>
              <li>Batch calculator access</li>
            </>
          )}
          {selectedRole === 5 && (
            <>
              <li>Inventory management</li>
              <li>Stock adjustments</li>
              <li>Basic warehouse operations</li>
              <li>Purchase order receiving</li>
            </>
          )}
          {selectedRole === 6 && (
            <>
              <li>Financial operations</li>
              <li>Expense management</li>
              <li>Supplier payments</li>
              <li>Financial reporting</li>
            </>
          )}
          {selectedRole === 7 && (
            <>
              <li>Basic system access</li>
              <li>View assigned tasks</li>
              <li>Limited data access</li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
};

export default RoleSelector; 
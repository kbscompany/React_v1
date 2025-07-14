import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * RoleSelector Component - Simple role selector for user management
 * Displays current role and allows changing it
 */
const RoleSelector = ({ user, onRoleChange, disabled = false, availableRoles = [] }) => {
  const { t } = useTranslation();
  
  // Role mapping from backend IDs to display names with comprehensive roles
  const ROLE_MAPPING = {
    1: { name: 'Admin', color: '#dc2626', description: 'Full system access including user management' },
    2: { name: 'Warehouse Manager', color: '#059669', description: 'Warehouse and inventory management' },
    3: { name: 'Kitchen Manager', color: '#7c3aed', description: 'Kitchen production and recipe management' },
    4: { name: 'Production Staff', color: '#ea580c', description: 'Kitchen production execution' },
    5: { name: 'Inventory Staff', color: '#0891b2', description: 'Inventory and stock management' },
    6: { name: 'Finance Staff', color: '#be185d', description: 'Financial operations and reporting' },
    7: { name: 'Staff', color: '#6b7280', description: 'Basic system access' }
  };

  const [selectedRole, setSelectedRole] = useState(user?.role_id || 7);

  // Update selected role when user changes
  useEffect(() => {
    setSelectedRole(user?.role_id || 7);
  }, [user]);

  const handleRoleChange = (event) => {
    const newRoleId = parseInt(event.target.value);
    setSelectedRole(newRoleId);
    if (onRoleChange) {
      onRoleChange(newRoleId);
    }
  };

  const getCurrentRole = () => {
    return ROLE_MAPPING[selectedRole] || { name: 'Unknown', color: '#6b7280', description: 'Unknown role' };
  };

  const currentRole = getCurrentRole();

  // Use availableRoles if provided, otherwise use all roles
  const rolesToShow = availableRoles.length > 0 ? availableRoles : Object.entries(ROLE_MAPPING);

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
              {role.name} - {role.description}
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
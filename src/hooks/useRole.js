import { useState, useEffect, useContext, useCallback } from 'react';
import roleManager, { PERMISSIONS, ROLES } from '../lib/roleManager';

/**
 * Custom React Hook for Role-Based Access Control
 * Provides easy access to permissions and access control in components
 */
export const useRole = () => {
  const [currentRole, setCurrentRole] = useState(roleManager.getCurrentRole());
  const [permissions, setPermissions] = useState(roleManager.getCurrentPermissions());

  // Update role and permissions when they change
  const updateUserRole = useCallback((user) => {
    roleManager.setUser(user);
    setCurrentRole(roleManager.getCurrentRole());
    setPermissions(roleManager.getCurrentPermissions());
  }, []);

  return {
    // Current user info
    currentRole,
    permissions,
    roleName: roleManager.getRoleName(currentRole),
    
    // Permission checks
    hasPermission: (permission) => roleManager.hasPermission(permission),
    hasAnyPermission: (permissionList) => roleManager.hasAnyPermission(permissionList),
    hasAllPermissions: (permissionList) => roleManager.hasAllPermissions(permissionList),
    
    // Page/Tab access
    canAccessPage: (pagePath) => roleManager.canAccessPage(pagePath),
    canAccessTab: (component, tabName) => roleManager.canAccessTab(component, tabName),
    getAccessibleTabs: (component, allTabs) => roleManager.getAccessibleTabs(component, allTabs),
    
    // Role checks
    isAdmin: () => roleManager.isAdmin(),
    isSuperAdmin: () => roleManager.isSuperAdmin(),
    
    // Update functions
    setUser: updateUserRole,
    
    // Constants for easy access
    ROLES,
    PERMISSIONS
  };
};

export default useRole; 
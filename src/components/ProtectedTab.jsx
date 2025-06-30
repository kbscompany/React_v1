import React from 'react';
import { useRole } from '../hooks/useRole';

/**
 * ProtectedTab Component
 * Controls access to specific tabs within components based on user permissions
 */
const ProtectedTab = ({ 
  children, 
  component, 
  tabName, 
  requiredPermissions = [],
  requireAll = false,
  fallback = null 
}) => {
  const { canAccessTab, hasAnyPermission, hasAllPermissions } = useRole();

  // Check tab access if component and tabName are provided
  if (component && tabName && !canAccessTab(component, tabName)) {
    return fallback || null;
  }

  // Check specific permissions if provided
  if (requiredPermissions.length > 0) {
    const hasAccess = requireAll 
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions);

    if (!hasAccess) {
      return fallback || null;
    }
  }

  return children;
};

export default ProtectedTab; 
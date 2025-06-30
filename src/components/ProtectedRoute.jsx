import React from 'react';
import { useRole } from '../hooks/useRole';

/**
 * ProtectedRoute Component
 * Restricts access to pages based on user roles and permissions
 */
const ProtectedRoute = ({ 
  children, 
  requiredPermissions = [], 
  pagePath = null,
  fallback = null,
  requireAll = false 
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, canAccessPage } = useRole();

  // Check page access if pagePath is provided
  if (pagePath && !canAccessPage(pagePath)) {
    return fallback || (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center p-8 bg-red-50 rounded-lg border border-red-200">
          <div className="text-red-600 text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-red-800 mb-2">Access Denied</h2>
          <p className="text-red-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  // Check specific permissions if provided
  if (requiredPermissions.length > 0) {
    const hasAccess = requireAll 
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions);

    if (!hasAccess) {
      return fallback || (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center p-8 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="text-yellow-600 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-yellow-800 mb-2">Insufficient Permissions</h2>
            <p className="text-yellow-600">You don't have the required permissions for this feature.</p>
          </div>
        </div>
      );
    }
  }

  return children;
};

export default ProtectedRoute; 
/**
 * Role-Based Access Control (RBAC) System
 * Manages user roles and permissions for pages, tabs, and features
 */

// Define available roles in the system
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin', 
  MANAGER: 'manager',
  ACCOUNTANT: 'accountant',
  WAREHOUSE_MANAGER: 'warehouse_manager',
  INVENTORY_STAFF: 'inventory_staff',
  FINANCE_STAFF: 'finance_staff',
  VIEWER: 'viewer'
};

// Define available permissions
export const PERMISSIONS = {
  // Page Access Permissions
  ACCESS_DASHBOARD: 'access_dashboard',
  ACCESS_FINANCE_CENTER: 'access_finance_center',
  ACCESS_WAREHOUSE: 'access_warehouse',
  ACCESS_INVENTORY: 'access_inventory',
  ACCESS_SUPER_ADMIN: 'access_super_admin',
  ACCESS_CHEQUE_MANAGEMENT: 'access_cheque_management',
  ACCESS_EXPENSE_MANAGEMENT: 'access_expense_management',
  ACCESS_ITEM_MANAGEMENT: 'access_item_management',
  
  // Feature Permissions
  CREATE_EXPENSE: 'create_expense',
  EDIT_EXPENSE: 'edit_expense',
  DELETE_EXPENSE: 'delete_expense',
  VIEW_EXPENSES: 'view_expenses',
  
  CREATE_CHEQUE: 'create_cheque',
  EDIT_CHEQUE: 'edit_cheque',
  DELETE_CHEQUE: 'delete_cheque',
  CANCEL_CHEQUE: 'cancel_cheque',
  SETTLE_CHEQUE: 'settle_cheque',
  EARLY_SETTLEMENT: 'early_settlement',
  
  CREATE_BANK_ACCOUNT: 'create_bank_account',
  EDIT_BANK_ACCOUNT: 'edit_bank_account',
  DELETE_BANK_ACCOUNT: 'delete_bank_account',
  
  CREATE_SAFE: 'create_safe',
  EDIT_SAFE: 'edit_safe',
  DELETE_SAFE: 'delete_safe',
  RESET_SAFE: 'reset_safe',
  
  MANAGE_INVENTORY: 'manage_inventory',
  CREATE_ITEM: 'create_item',
  EDIT_ITEM: 'edit_item',
  DELETE_ITEM: 'delete_item',
  
  MANAGE_WAREHOUSE: 'manage_warehouse',
  CREATE_WAREHOUSE: 'create_warehouse',
  MANAGE_STOCK: 'manage_stock',
  
  VIEW_REPORTS: 'view_reports',
  EXPORT_DATA: 'export_data',
  
  // System Administration
  MANAGE_USERS: 'manage_users',
  SYSTEM_RESET: 'system_reset',
  VIEW_AUDIT_LOGS: 'view_audit_logs'
};

// Define role-permission mappings
const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: [
    // Full access to everything
    ...Object.values(PERMISSIONS)
  ],
  
  [ROLES.ADMIN]: [
    PERMISSIONS.ACCESS_DASHBOARD,
    PERMISSIONS.ACCESS_FINANCE_CENTER,
    PERMISSIONS.ACCESS_WAREHOUSE,
    PERMISSIONS.ACCESS_INVENTORY,
    PERMISSIONS.ACCESS_CHEQUE_MANAGEMENT,
    PERMISSIONS.ACCESS_EXPENSE_MANAGEMENT,
    PERMISSIONS.ACCESS_ITEM_MANAGEMENT,
    
    PERMISSIONS.CREATE_EXPENSE,
    PERMISSIONS.EDIT_EXPENSE,
    PERMISSIONS.DELETE_EXPENSE,
    PERMISSIONS.VIEW_EXPENSES,
    
    PERMISSIONS.CREATE_CHEQUE,
    PERMISSIONS.EDIT_CHEQUE,
    PERMISSIONS.DELETE_CHEQUE,
    PERMISSIONS.CANCEL_CHEQUE,
    PERMISSIONS.SETTLE_CHEQUE,
    PERMISSIONS.EARLY_SETTLEMENT,
    
    PERMISSIONS.CREATE_BANK_ACCOUNT,
    PERMISSIONS.EDIT_BANK_ACCOUNT,
    PERMISSIONS.DELETE_BANK_ACCOUNT,
    
    PERMISSIONS.CREATE_SAFE,
    PERMISSIONS.EDIT_SAFE,
    PERMISSIONS.DELETE_SAFE,
    
    PERMISSIONS.MANAGE_INVENTORY,
    PERMISSIONS.CREATE_ITEM,
    PERMISSIONS.EDIT_ITEM,
    PERMISSIONS.DELETE_ITEM,
    
    PERMISSIONS.MANAGE_WAREHOUSE,
    PERMISSIONS.CREATE_WAREHOUSE,
    PERMISSIONS.MANAGE_STOCK,
    
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.EXPORT_DATA,
    PERMISSIONS.MANAGE_USERS
  ],
  
  [ROLES.MANAGER]: [
    PERMISSIONS.ACCESS_DASHBOARD,
    PERMISSIONS.ACCESS_FINANCE_CENTER,
    PERMISSIONS.ACCESS_WAREHOUSE,
    PERMISSIONS.ACCESS_INVENTORY,
    PERMISSIONS.ACCESS_CHEQUE_MANAGEMENT,
    PERMISSIONS.ACCESS_EXPENSE_MANAGEMENT,
    PERMISSIONS.ACCESS_ITEM_MANAGEMENT,
    
    PERMISSIONS.CREATE_EXPENSE,
    PERMISSIONS.EDIT_EXPENSE,
    PERMISSIONS.VIEW_EXPENSES,
    
    PERMISSIONS.CREATE_CHEQUE,
    PERMISSIONS.EDIT_CHEQUE,
    PERMISSIONS.CANCEL_CHEQUE,
    PERMISSIONS.SETTLE_CHEQUE,
    PERMISSIONS.EARLY_SETTLEMENT,
    
    PERMISSIONS.EDIT_BANK_ACCOUNT,
    PERMISSIONS.EDIT_SAFE,
    
    PERMISSIONS.MANAGE_INVENTORY,
    PERMISSIONS.CREATE_ITEM,
    PERMISSIONS.EDIT_ITEM,
    
    PERMISSIONS.MANAGE_WAREHOUSE,
    PERMISSIONS.MANAGE_STOCK,
    
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.EXPORT_DATA
  ],
  
  [ROLES.ACCOUNTANT]: [
    PERMISSIONS.ACCESS_DASHBOARD,
    PERMISSIONS.ACCESS_FINANCE_CENTER,
    PERMISSIONS.ACCESS_CHEQUE_MANAGEMENT,
    PERMISSIONS.ACCESS_EXPENSE_MANAGEMENT,
    
    PERMISSIONS.CREATE_EXPENSE,
    PERMISSIONS.EDIT_EXPENSE,
    PERMISSIONS.VIEW_EXPENSES,
    
    PERMISSIONS.CREATE_CHEQUE,
    PERMISSIONS.EDIT_CHEQUE,
    PERMISSIONS.CANCEL_CHEQUE,
    PERMISSIONS.SETTLE_CHEQUE,
    PERMISSIONS.EARLY_SETTLEMENT,
    
    PERMISSIONS.CREATE_BANK_ACCOUNT,
    PERMISSIONS.EDIT_BANK_ACCOUNT,
    
    PERMISSIONS.CREATE_SAFE,
    PERMISSIONS.EDIT_SAFE,
    
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.EXPORT_DATA
  ],
  
  [ROLES.WAREHOUSE_MANAGER]: [
    PERMISSIONS.ACCESS_DASHBOARD,
    PERMISSIONS.ACCESS_WAREHOUSE,
    PERMISSIONS.ACCESS_INVENTORY,
    PERMISSIONS.ACCESS_ITEM_MANAGEMENT,
    
    PERMISSIONS.MANAGE_INVENTORY,
    PERMISSIONS.CREATE_ITEM,
    PERMISSIONS.EDIT_ITEM,
    PERMISSIONS.DELETE_ITEM,
    
    PERMISSIONS.MANAGE_WAREHOUSE,
    PERMISSIONS.CREATE_WAREHOUSE,
    PERMISSIONS.MANAGE_STOCK,
    
    PERMISSIONS.VIEW_REPORTS
  ],
  
  [ROLES.INVENTORY_STAFF]: [
    PERMISSIONS.ACCESS_DASHBOARD,
    PERMISSIONS.ACCESS_INVENTORY,
    PERMISSIONS.ACCESS_ITEM_MANAGEMENT,
    
    PERMISSIONS.MANAGE_INVENTORY,
    PERMISSIONS.CREATE_ITEM,
    PERMISSIONS.EDIT_ITEM,
    
    PERMISSIONS.MANAGE_STOCK
  ],
  
  [ROLES.FINANCE_STAFF]: [
    PERMISSIONS.ACCESS_DASHBOARD,
    PERMISSIONS.ACCESS_FINANCE_CENTER,
    PERMISSIONS.ACCESS_EXPENSE_MANAGEMENT,
    
    PERMISSIONS.CREATE_EXPENSE,
    PERMISSIONS.EDIT_EXPENSE,
    PERMISSIONS.VIEW_EXPENSES,
    
    PERMISSIONS.VIEW_REPORTS
  ],
  
  [ROLES.VIEWER]: [
    PERMISSIONS.ACCESS_DASHBOARD,
    PERMISSIONS.VIEW_EXPENSES,
    PERMISSIONS.VIEW_REPORTS
  ]
};

// Define page-specific access rules
export const PAGE_ACCESS = {
  '/': [PERMISSIONS.ACCESS_DASHBOARD],
  '/dashboard': [PERMISSIONS.ACCESS_DASHBOARD],
  '/finance': [PERMISSIONS.ACCESS_FINANCE_CENTER],
  '/warehouse': [PERMISSIONS.ACCESS_WAREHOUSE],
  '/inventory': [PERMISSIONS.ACCESS_INVENTORY],
  '/super-admin': [PERMISSIONS.ACCESS_SUPER_ADMIN],
  '/cheque-management': [PERMISSIONS.ACCESS_CHEQUE_MANAGEMENT],
  '/expense-management': [PERMISSIONS.ACCESS_EXPENSE_MANAGEMENT],
  '/item-management': [PERMISSIONS.ACCESS_ITEM_MANAGEMENT]
};

// Define tab-specific access rules for components
export const TAB_ACCESS = {
  finance: {
    'bank-accounts': [PERMISSIONS.ACCESS_FINANCE_CENTER],
    'cheques': [PERMISSIONS.ACCESS_CHEQUE_MANAGEMENT],
    'expenses': [PERMISSIONS.ACCESS_EXPENSE_MANAGEMENT],
    'reports': [PERMISSIONS.VIEW_REPORTS]
  },
  warehouse: {
    'settings': [PERMISSIONS.MANAGE_WAREHOUSE],
    'stock': [PERMISSIONS.MANAGE_STOCK],
    'transfers': [PERMISSIONS.MANAGE_STOCK]
  },
  inventory: {
    'items': [PERMISSIONS.ACCESS_ITEM_MANAGEMENT],
    'sub-recipes': [PERMISSIONS.MANAGE_INVENTORY],
    'mid-prep': [PERMISSIONS.MANAGE_INVENTORY],
    'cakes': [PERMISSIONS.MANAGE_INVENTORY]
  }
};

// Database role mapping - converts database roles to frontend roles
const DATABASE_ROLE_MAPPING = {
  'Admin': ROLES.SUPER_ADMIN,           // Database "Admin" = Frontend "super_admin"
  'admin': ROLES.SUPER_ADMIN,           // Fallback for lowercase
  'Warehouse Manager': ROLES.WAREHOUSE_MANAGER,
  'warehouse_manager': ROLES.WAREHOUSE_MANAGER,
  'Finance': ROLES.ACCOUNTANT,
  'finance': ROLES.ACCOUNTANT,
  'Cost Control': ROLES.MANAGER,
  'cost_control': ROLES.MANAGER,
  'User': ROLES.VIEWER,
  'user': ROLES.VIEWER
};

/**
 * Role Manager Class
 */
class RoleManager {
  constructor() {
    this.currentUser = null;
    this.currentUserRole = null;
    this.currentUserPermissions = [];
  }

  /**
   * Set the current user and their role
   */
  setUser(user) {
    this.currentUser = user;
    // Map database role to frontend role, fallback to viewer
    const databaseRole = user?.role || 'User';
    this.currentUserRole = DATABASE_ROLE_MAPPING[databaseRole] || ROLES.VIEWER;
    this.currentUserPermissions = this.getPermissionsForRole(this.currentUserRole);
    
    // Debug log to help troubleshooting
    console.log('🔧 Role Mapping:', {
      databaseRole,
      mappedRole: this.currentUserRole,
      permissions: this.currentUserPermissions.length
    });
  }

  /**
   * Get permissions for a specific role
   */
  getPermissionsForRole(role) {
    return ROLE_PERMISSIONS[role] || [];
  }

  /**
   * Check if current user has a specific permission
   */
  hasPermission(permission) {
    return this.currentUserPermissions.includes(permission);
  }

  /**
   * Check if current user has any of the given permissions
   */
  hasAnyPermission(permissions) {
    return permissions.some(permission => this.hasPermission(permission));
  }

  /**
   * Check if current user has all of the given permissions
   */
  hasAllPermissions(permissions) {
    return permissions.every(permission => this.hasPermission(permission));
  }

  /**
   * Check if current user can access a specific page
   */
  canAccessPage(pagePath) {
    const requiredPermissions = PAGE_ACCESS[pagePath];
    if (!requiredPermissions) return true; // No restrictions
    return this.hasAnyPermission(requiredPermissions);
  }

  /**
   * Check if current user can access a specific tab
   */
  canAccessTab(component, tabName) {
    const componentTabs = TAB_ACCESS[component];
    if (!componentTabs) return true; // No restrictions
    
    const requiredPermissions = componentTabs[tabName];
    if (!requiredPermissions) return true; // No restrictions
    
    return this.hasAnyPermission(requiredPermissions);
  }

  /**
   * Get accessible tabs for a component
   */
  getAccessibleTabs(component, allTabs) {
    const componentTabs = TAB_ACCESS[component];
    if (!componentTabs) return allTabs; // No restrictions
    
    return allTabs.filter(tab => this.canAccessTab(component, tab.key));
  }

  /**
   * Get user-friendly role name
   */
  getRoleName(role) {
    const roleNames = {
      [ROLES.SUPER_ADMIN]: 'Super Administrator',
      [ROLES.ADMIN]: 'Administrator',
      [ROLES.MANAGER]: 'Manager',
      [ROLES.ACCOUNTANT]: 'Accountant',
      [ROLES.WAREHOUSE_MANAGER]: 'Warehouse Manager',
      [ROLES.INVENTORY_STAFF]: 'Inventory Staff',
      [ROLES.FINANCE_STAFF]: 'Finance Staff',
      [ROLES.VIEWER]: 'Viewer'
    };
    return roleNames[role] || 'Unknown Role';
  }

  /**
   * Get current user's role
   */
  getCurrentRole() {
    return this.currentUserRole;
  }

  /**
   * Get current user's permissions
   */
  getCurrentPermissions() {
    return this.currentUserPermissions;
  }

  /**
   * Check if user is admin or higher
   */
  isAdmin() {
    return [ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(this.currentUserRole);
  }

  /**
   * Check if user is super admin
   */
  isSuperAdmin() {
    return this.currentUserRole === ROLES.SUPER_ADMIN;
  }
}

// Create singleton instance
export const roleManager = new RoleManager();

// Export for use in components
export default roleManager; 
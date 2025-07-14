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
  KITCHEN_MANAGER: 'kitchen_manager',
  PRODUCTION_STAFF: 'production_staff',
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
  ACCESS_KITCHEN_PRODUCTION: 'access_kitchen_production',
  ACCESS_PURCHASE_ORDERS: 'access_purchase_orders',
  ACCESS_BANK_HIERARCHY: 'access_bank_hierarchy',
  
  // Financial Management Permissions
  CREATE_EXPENSE: 'create_expense',
  EDIT_EXPENSE: 'edit_expense',
  DELETE_EXPENSE: 'delete_expense',
  VIEW_EXPENSES: 'view_expenses',
  APPROVE_EXPENSE: 'approve_expense',
  
  CREATE_CHEQUE: 'create_cheque',
  EDIT_CHEQUE: 'edit_cheque',
  DELETE_CHEQUE: 'delete_cheque',
  CANCEL_CHEQUE: 'cancel_cheque',
  SETTLE_CHEQUE: 'settle_cheque',
  EARLY_SETTLEMENT: 'early_settlement',
  PRINT_CHEQUE: 'print_cheque',
  ARABIC_CHEQUE_GENERATION: 'arabic_cheque_generation',
  
  CREATE_BANK_ACCOUNT: 'create_bank_account',
  EDIT_BANK_ACCOUNT: 'edit_bank_account',
  DELETE_BANK_ACCOUNT: 'delete_bank_account',
  MANAGE_BANK_HIERARCHY: 'manage_bank_hierarchy',
  MANAGE_CHEQUE_BOOKS: 'manage_cheque_books',
  
  CREATE_SAFE: 'create_safe',
  EDIT_SAFE: 'edit_safe',
  DELETE_SAFE: 'delete_safe',
  RESET_SAFE: 'reset_safe',
  
  // Inventory & Recipe Management Permissions
  MANAGE_INVENTORY: 'manage_inventory',
  CREATE_ITEM: 'create_item',
  EDIT_ITEM: 'edit_item',
  DELETE_ITEM: 'delete_item',
  VIEW_STOCK_LEVELS: 'view_stock_levels',
  ADJUST_STOCK: 'adjust_stock',
  
  CREATE_SUB_RECIPE: 'create_sub_recipe',
  EDIT_SUB_RECIPE: 'edit_sub_recipe',
  DELETE_SUB_RECIPE: 'delete_sub_recipe',
  VIEW_SUB_RECIPES: 'view_sub_recipes',
  
  CREATE_MID_PREP_RECIPE: 'create_mid_prep_recipe',
  EDIT_MID_PREP_RECIPE: 'edit_mid_prep_recipe',
  DELETE_MID_PREP_RECIPE: 'delete_mid_prep_recipe',
  VIEW_MID_PREP_RECIPES: 'view_mid_prep_recipes',
  
  CREATE_CAKE_RECIPE: 'create_cake_recipe',
  EDIT_CAKE_RECIPE: 'edit_cake_recipe',
  DELETE_CAKE_RECIPE: 'delete_cake_recipe',
  VIEW_CAKE_RECIPES: 'view_cake_recipes',
  
  MANAGE_CATEGORIES: 'manage_categories',
  CREATE_CATEGORY: 'create_category',
  EDIT_CATEGORY: 'edit_category',
  DELETE_CATEGORY: 'delete_category',
  
  // Warehouse Management Permissions
  MANAGE_WAREHOUSE: 'manage_warehouse',
  CREATE_WAREHOUSE: 'create_warehouse',
  EDIT_WAREHOUSE: 'edit_warehouse',
  DELETE_WAREHOUSE: 'delete_warehouse',
  MANAGE_STOCK: 'manage_stock',
  WAREHOUSE_SETTINGS: 'warehouse_settings',
  
  CREATE_TRANSFER_ORDER: 'create_transfer_order',
  APPROVE_TRANSFER_ORDER: 'approve_transfer_order',
  RECEIVE_TRANSFER_ORDER: 'receive_transfer_order',
  VIEW_TRANSFER_ORDERS: 'view_transfer_orders',
  MANAGE_TRANSFER_TEMPLATES: 'manage_transfer_templates',
  
  RECEIVE_FROM_SUPPLIER: 'receive_from_supplier',
  MANAGE_WAREHOUSE_ASSIGNMENTS: 'manage_warehouse_assignments',
  WASTE_MANAGEMENT: 'waste_management',
  
  // Kitchen Production Permissions
  ACCESS_KITCHEN_DASHBOARD: 'access_kitchen_dashboard',
  CREATE_PRODUCTION_ORDER: 'create_production_order',
  EDIT_PRODUCTION_ORDER: 'edit_production_order',
  DELETE_PRODUCTION_ORDER: 'delete_production_order',
  VIEW_PRODUCTION_ORDERS: 'view_production_orders',
  APPROVE_PRODUCTION: 'approve_production',
  START_PRODUCTION: 'start_production',
  COMPLETE_PRODUCTION: 'complete_production',
  
  BATCH_PRODUCTION_CALCULATOR: 'batch_production_calculator',
  PRODUCTION_PLANNING: 'production_planning',
  PRODUCTION_SCHEDULING: 'production_scheduling',
  KITCHEN_WORKFLOW: 'kitchen_workflow',
  
  // Purchase Order Permissions
  CREATE_PURCHASE_ORDER: 'create_purchase_order',
  EDIT_PURCHASE_ORDER: 'edit_purchase_order',
  DELETE_PURCHASE_ORDER: 'delete_purchase_order',
  VIEW_PURCHASE_ORDERS: 'view_purchase_orders',
  APPROVE_PURCHASE_ORDER: 'approve_purchase_order',
  RECEIVE_PURCHASE_ORDER: 'receive_purchase_order',
  CANCEL_PURCHASE_ORDER: 'cancel_purchase_order',
  
  MANAGE_SUPPLIERS: 'manage_suppliers',
  CREATE_SUPPLIER: 'create_supplier',
  EDIT_SUPPLIER: 'edit_supplier',
  DELETE_SUPPLIER: 'delete_supplier',
  VIEW_SUPPLIERS: 'view_suppliers',
  
  SUPPLIER_PAYMENTS: 'supplier_payments',
  GENERATE_CHEQUE_FROM_PO: 'generate_cheque_from_po',
  
  // Foodics Integration Permissions
  ACCESS_FOODICS: 'access_foodics',
  CONFIGURE_FOODICS: 'configure_foodics',
  SYNC_FOODICS_DATA: 'sync_foodics_data',
  VIEW_FOODICS_DASHBOARD: 'view_foodics_dashboard',
  IMPORT_FROM_FOODICS: 'import_from_foodics',
  EXPORT_TO_FOODICS: 'export_to_foodics',
  MANAGE_FOODICS_SETTINGS: 'manage_foodics_settings',
  
  // Reporting & Analytics Permissions
  VIEW_REPORTS: 'view_reports',
  VIEW_FINANCIAL_REPORTS: 'view_financial_reports',
  VIEW_INVENTORY_REPORTS: 'view_inventory_reports',
  VIEW_PRODUCTION_REPORTS: 'view_production_reports',
  VIEW_PURCHASE_REPORTS: 'view_purchase_reports',
  EXPORT_DATA: 'export_data',
  ADVANCED_ANALYTICS: 'advanced_analytics',
  
  // System Administration
  MANAGE_USERS: 'manage_users',
  SYSTEM_RESET: 'system_reset',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  SYSTEM_BACKUP: 'system_backup',
  SYSTEM_SETTINGS: 'system_settings'
};

// Define role-permission mappings
const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: [
    // Full access to everything
    ...Object.values(PERMISSIONS)
  ],
  
  [ROLES.ADMIN]: [
    // Dashboard & Core Access
    PERMISSIONS.ACCESS_DASHBOARD,
    PERMISSIONS.ACCESS_FINANCE_CENTER,
    PERMISSIONS.ACCESS_WAREHOUSE,
    PERMISSIONS.ACCESS_INVENTORY,
    PERMISSIONS.ACCESS_CHEQUE_MANAGEMENT,
    PERMISSIONS.ACCESS_EXPENSE_MANAGEMENT,
    PERMISSIONS.ACCESS_ITEM_MANAGEMENT,
    PERMISSIONS.ACCESS_KITCHEN_PRODUCTION,
    PERMISSIONS.ACCESS_PURCHASE_ORDERS,
    PERMISSIONS.ACCESS_BANK_HIERARCHY,
    
    // Financial Management
    PERMISSIONS.CREATE_EXPENSE,
    PERMISSIONS.EDIT_EXPENSE,
    PERMISSIONS.DELETE_EXPENSE,
    PERMISSIONS.VIEW_EXPENSES,
    PERMISSIONS.APPROVE_EXPENSE,
    
    PERMISSIONS.CREATE_CHEQUE,
    PERMISSIONS.EDIT_CHEQUE,
    PERMISSIONS.DELETE_CHEQUE,
    PERMISSIONS.CANCEL_CHEQUE,
    PERMISSIONS.SETTLE_CHEQUE,
    PERMISSIONS.EARLY_SETTLEMENT,
    PERMISSIONS.PRINT_CHEQUE,
    PERMISSIONS.ARABIC_CHEQUE_GENERATION,
    
    PERMISSIONS.CREATE_BANK_ACCOUNT,
    PERMISSIONS.EDIT_BANK_ACCOUNT,
    PERMISSIONS.DELETE_BANK_ACCOUNT,
    PERMISSIONS.MANAGE_BANK_HIERARCHY,
    PERMISSIONS.MANAGE_CHEQUE_BOOKS,
    
    PERMISSIONS.CREATE_SAFE,
    PERMISSIONS.EDIT_SAFE,
    PERMISSIONS.DELETE_SAFE,
    
    // Inventory & Recipe Management
    PERMISSIONS.MANAGE_INVENTORY,
    PERMISSIONS.CREATE_ITEM,
    PERMISSIONS.EDIT_ITEM,
    PERMISSIONS.DELETE_ITEM,
    PERMISSIONS.VIEW_STOCK_LEVELS,
    PERMISSIONS.ADJUST_STOCK,
    
    PERMISSIONS.CREATE_SUB_RECIPE,
    PERMISSIONS.EDIT_SUB_RECIPE,
    PERMISSIONS.DELETE_SUB_RECIPE,
    PERMISSIONS.VIEW_SUB_RECIPES,
    
    PERMISSIONS.CREATE_MID_PREP_RECIPE,
    PERMISSIONS.EDIT_MID_PREP_RECIPE,
    PERMISSIONS.DELETE_MID_PREP_RECIPE,
    PERMISSIONS.VIEW_MID_PREP_RECIPES,
    
    PERMISSIONS.CREATE_CAKE_RECIPE,
    PERMISSIONS.EDIT_CAKE_RECIPE,
    PERMISSIONS.DELETE_CAKE_RECIPE,
    PERMISSIONS.VIEW_CAKE_RECIPES,
    
    PERMISSIONS.MANAGE_CATEGORIES,
    PERMISSIONS.CREATE_CATEGORY,
    PERMISSIONS.EDIT_CATEGORY,
    PERMISSIONS.DELETE_CATEGORY,
    
    // Warehouse Management
    PERMISSIONS.MANAGE_WAREHOUSE,
    PERMISSIONS.CREATE_WAREHOUSE,
    PERMISSIONS.EDIT_WAREHOUSE,
    PERMISSIONS.DELETE_WAREHOUSE,
    PERMISSIONS.MANAGE_STOCK,
    PERMISSIONS.WAREHOUSE_SETTINGS,
    
    PERMISSIONS.CREATE_TRANSFER_ORDER,
    PERMISSIONS.APPROVE_TRANSFER_ORDER,
    PERMISSIONS.RECEIVE_TRANSFER_ORDER,
    PERMISSIONS.VIEW_TRANSFER_ORDERS,
    PERMISSIONS.MANAGE_TRANSFER_TEMPLATES,
    
    PERMISSIONS.RECEIVE_FROM_SUPPLIER,
    PERMISSIONS.MANAGE_WAREHOUSE_ASSIGNMENTS,
    PERMISSIONS.WASTE_MANAGEMENT,
    
    // Kitchen Production
    PERMISSIONS.ACCESS_KITCHEN_DASHBOARD,
    PERMISSIONS.CREATE_PRODUCTION_ORDER,
    PERMISSIONS.EDIT_PRODUCTION_ORDER,
    PERMISSIONS.DELETE_PRODUCTION_ORDER,
    PERMISSIONS.VIEW_PRODUCTION_ORDERS,
    PERMISSIONS.APPROVE_PRODUCTION,
    PERMISSIONS.START_PRODUCTION,
    PERMISSIONS.COMPLETE_PRODUCTION,
    
    PERMISSIONS.BATCH_PRODUCTION_CALCULATOR,
    PERMISSIONS.PRODUCTION_PLANNING,
    PERMISSIONS.PRODUCTION_SCHEDULING,
    PERMISSIONS.KITCHEN_WORKFLOW,
    
    // Purchase Orders
    PERMISSIONS.CREATE_PURCHASE_ORDER,
    PERMISSIONS.EDIT_PURCHASE_ORDER,
    PERMISSIONS.DELETE_PURCHASE_ORDER,
    PERMISSIONS.VIEW_PURCHASE_ORDERS,
    PERMISSIONS.APPROVE_PURCHASE_ORDER,
    PERMISSIONS.RECEIVE_PURCHASE_ORDER,
    PERMISSIONS.CANCEL_PURCHASE_ORDER,
    
    PERMISSIONS.MANAGE_SUPPLIERS,
    PERMISSIONS.CREATE_SUPPLIER,
    PERMISSIONS.EDIT_SUPPLIER,
    PERMISSIONS.DELETE_SUPPLIER,
    PERMISSIONS.VIEW_SUPPLIERS,
    
    PERMISSIONS.SUPPLIER_PAYMENTS,
    PERMISSIONS.GENERATE_CHEQUE_FROM_PO,
    
    // Foodics Integration
    PERMISSIONS.ACCESS_FOODICS,
    PERMISSIONS.CONFIGURE_FOODICS,
    PERMISSIONS.SYNC_FOODICS_DATA,
    PERMISSIONS.VIEW_FOODICS_DASHBOARD,
    PERMISSIONS.IMPORT_FROM_FOODICS,
    PERMISSIONS.EXPORT_TO_FOODICS,
    PERMISSIONS.MANAGE_FOODICS_SETTINGS,
    
    // Reporting & Analytics
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_FINANCIAL_REPORTS,
    PERMISSIONS.VIEW_INVENTORY_REPORTS,
    PERMISSIONS.VIEW_PRODUCTION_REPORTS,
    PERMISSIONS.VIEW_PURCHASE_REPORTS,
    PERMISSIONS.EXPORT_DATA,
    PERMISSIONS.ADVANCED_ANALYTICS,
    
    // User Management
    PERMISSIONS.MANAGE_USERS
  ],
  
  [ROLES.MANAGER]: [
    // Dashboard & Core Access
    PERMISSIONS.ACCESS_DASHBOARD,
    PERMISSIONS.ACCESS_FINANCE_CENTER,
    PERMISSIONS.ACCESS_WAREHOUSE,
    PERMISSIONS.ACCESS_INVENTORY,
    PERMISSIONS.ACCESS_CHEQUE_MANAGEMENT,
    PERMISSIONS.ACCESS_EXPENSE_MANAGEMENT,
    PERMISSIONS.ACCESS_ITEM_MANAGEMENT,
    PERMISSIONS.ACCESS_KITCHEN_PRODUCTION,
    PERMISSIONS.ACCESS_PURCHASE_ORDERS,
    
    // Financial Management (Limited)
    PERMISSIONS.CREATE_EXPENSE,
    PERMISSIONS.EDIT_EXPENSE,
    PERMISSIONS.VIEW_EXPENSES,
    PERMISSIONS.APPROVE_EXPENSE,
    
    PERMISSIONS.CREATE_CHEQUE,
    PERMISSIONS.EDIT_CHEQUE,
    PERMISSIONS.CANCEL_CHEQUE,
    PERMISSIONS.SETTLE_CHEQUE,
    PERMISSIONS.EARLY_SETTLEMENT,
    PERMISSIONS.PRINT_CHEQUE,
    
    PERMISSIONS.EDIT_BANK_ACCOUNT,
    PERMISSIONS.EDIT_SAFE,
    
    // Inventory & Recipe Management
    PERMISSIONS.MANAGE_INVENTORY,
    PERMISSIONS.CREATE_ITEM,
    PERMISSIONS.EDIT_ITEM,
    PERMISSIONS.VIEW_STOCK_LEVELS,
    PERMISSIONS.ADJUST_STOCK,
    
    PERMISSIONS.CREATE_SUB_RECIPE,
    PERMISSIONS.EDIT_SUB_RECIPE,
    PERMISSIONS.VIEW_SUB_RECIPES,
    
    PERMISSIONS.CREATE_MID_PREP_RECIPE,
    PERMISSIONS.EDIT_MID_PREP_RECIPE,
    PERMISSIONS.VIEW_MID_PREP_RECIPES,
    
    PERMISSIONS.CREATE_CAKE_RECIPE,
    PERMISSIONS.EDIT_CAKE_RECIPE,
    PERMISSIONS.VIEW_CAKE_RECIPES,
    
    PERMISSIONS.EDIT_CATEGORY,
    
    // Warehouse Management
    PERMISSIONS.MANAGE_WAREHOUSE,
    PERMISSIONS.EDIT_WAREHOUSE,
    PERMISSIONS.MANAGE_STOCK,
    PERMISSIONS.WAREHOUSE_SETTINGS,
    
    PERMISSIONS.CREATE_TRANSFER_ORDER,
    PERMISSIONS.APPROVE_TRANSFER_ORDER,
    PERMISSIONS.RECEIVE_TRANSFER_ORDER,
    PERMISSIONS.VIEW_TRANSFER_ORDERS,
    PERMISSIONS.MANAGE_TRANSFER_TEMPLATES,
    
    PERMISSIONS.RECEIVE_FROM_SUPPLIER,
    PERMISSIONS.WASTE_MANAGEMENT,
    
    // Kitchen Production (Oversight)
    PERMISSIONS.ACCESS_KITCHEN_DASHBOARD,
    PERMISSIONS.CREATE_PRODUCTION_ORDER,
    PERMISSIONS.EDIT_PRODUCTION_ORDER,
    PERMISSIONS.VIEW_PRODUCTION_ORDERS,
    PERMISSIONS.APPROVE_PRODUCTION,
    PERMISSIONS.START_PRODUCTION,
    PERMISSIONS.COMPLETE_PRODUCTION,
    
    PERMISSIONS.BATCH_PRODUCTION_CALCULATOR,
    PERMISSIONS.PRODUCTION_PLANNING,
    PERMISSIONS.PRODUCTION_SCHEDULING,
    PERMISSIONS.KITCHEN_WORKFLOW,
    
    // Purchase Orders (Approval authority)
    PERMISSIONS.CREATE_PURCHASE_ORDER,
    PERMISSIONS.EDIT_PURCHASE_ORDER,
    PERMISSIONS.VIEW_PURCHASE_ORDERS,
    PERMISSIONS.APPROVE_PURCHASE_ORDER,
    PERMISSIONS.RECEIVE_PURCHASE_ORDER,
    
    PERMISSIONS.EDIT_SUPPLIER,
    PERMISSIONS.VIEW_SUPPLIERS,
    PERMISSIONS.SUPPLIER_PAYMENTS,
    
    // Foodics Integration (Limited)
    PERMISSIONS.ACCESS_FOODICS,
    PERMISSIONS.VIEW_FOODICS_DASHBOARD,
    PERMISSIONS.SYNC_FOODICS_DATA,
    
    // Advanced Reporting
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_FINANCIAL_REPORTS,
    PERMISSIONS.VIEW_INVENTORY_REPORTS,
    PERMISSIONS.VIEW_PRODUCTION_REPORTS,
    PERMISSIONS.VIEW_PURCHASE_REPORTS,
    PERMISSIONS.EXPORT_DATA,
    PERMISSIONS.ADVANCED_ANALYTICS
  ],
  
  [ROLES.ACCOUNTANT]: [
    // Dashboard & Financial Access
    PERMISSIONS.ACCESS_DASHBOARD,
    PERMISSIONS.ACCESS_FINANCE_CENTER,
    PERMISSIONS.ACCESS_CHEQUE_MANAGEMENT,
    PERMISSIONS.ACCESS_EXPENSE_MANAGEMENT,
    PERMISSIONS.ACCESS_BANK_HIERARCHY,
    
    // Financial Management (Full)
    PERMISSIONS.CREATE_EXPENSE,
    PERMISSIONS.EDIT_EXPENSE,
    PERMISSIONS.DELETE_EXPENSE,
    PERMISSIONS.VIEW_EXPENSES,
    PERMISSIONS.APPROVE_EXPENSE,
    
    PERMISSIONS.CREATE_CHEQUE,
    PERMISSIONS.EDIT_CHEQUE,
    PERMISSIONS.DELETE_CHEQUE,
    PERMISSIONS.CANCEL_CHEQUE,
    PERMISSIONS.SETTLE_CHEQUE,
    PERMISSIONS.EARLY_SETTLEMENT,
    PERMISSIONS.PRINT_CHEQUE,
    PERMISSIONS.ARABIC_CHEQUE_GENERATION,
    
    PERMISSIONS.CREATE_BANK_ACCOUNT,
    PERMISSIONS.EDIT_BANK_ACCOUNT,
    PERMISSIONS.DELETE_BANK_ACCOUNT,
    PERMISSIONS.MANAGE_BANK_HIERARCHY,
    PERMISSIONS.MANAGE_CHEQUE_BOOKS,
    
    PERMISSIONS.CREATE_SAFE,
    PERMISSIONS.EDIT_SAFE,
    PERMISSIONS.DELETE_SAFE,
    
    // Purchase Orders (Financial aspects)
    PERMISSIONS.VIEW_PURCHASE_ORDERS,
    PERMISSIONS.SUPPLIER_PAYMENTS,
    PERMISSIONS.GENERATE_CHEQUE_FROM_PO,
    
    // Reporting (Financial focus)
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_FINANCIAL_REPORTS,
    PERMISSIONS.VIEW_PURCHASE_REPORTS,
    PERMISSIONS.EXPORT_DATA,
    PERMISSIONS.ADVANCED_ANALYTICS
  ],
  
  [ROLES.WAREHOUSE_MANAGER]: [
    // Dashboard & Warehouse Access
    PERMISSIONS.ACCESS_DASHBOARD,
    PERMISSIONS.ACCESS_WAREHOUSE,
    PERMISSIONS.ACCESS_INVENTORY,
    PERMISSIONS.ACCESS_ITEM_MANAGEMENT,
    PERMISSIONS.ACCESS_PURCHASE_ORDERS,
    
    // Inventory & Recipe Management
    PERMISSIONS.MANAGE_INVENTORY,
    PERMISSIONS.CREATE_ITEM,
    PERMISSIONS.EDIT_ITEM,
    PERMISSIONS.DELETE_ITEM,
    PERMISSIONS.VIEW_STOCK_LEVELS,
    PERMISSIONS.ADJUST_STOCK,
    
    PERMISSIONS.CREATE_SUB_RECIPE,
    PERMISSIONS.EDIT_SUB_RECIPE,
    PERMISSIONS.DELETE_SUB_RECIPE,
    PERMISSIONS.VIEW_SUB_RECIPES,
    
    PERMISSIONS.CREATE_MID_PREP_RECIPE,
    PERMISSIONS.EDIT_MID_PREP_RECIPE,
    PERMISSIONS.DELETE_MID_PREP_RECIPE,
    PERMISSIONS.VIEW_MID_PREP_RECIPES,
    
    PERMISSIONS.CREATE_CAKE_RECIPE,
    PERMISSIONS.EDIT_CAKE_RECIPE,
    PERMISSIONS.DELETE_CAKE_RECIPE,
    PERMISSIONS.VIEW_CAKE_RECIPES,
    
    PERMISSIONS.MANAGE_CATEGORIES,
    PERMISSIONS.CREATE_CATEGORY,
    PERMISSIONS.EDIT_CATEGORY,
    PERMISSIONS.DELETE_CATEGORY,
    
    // Warehouse Management (Full)
    PERMISSIONS.MANAGE_WAREHOUSE,
    PERMISSIONS.CREATE_WAREHOUSE,
    PERMISSIONS.EDIT_WAREHOUSE,
    PERMISSIONS.DELETE_WAREHOUSE,
    PERMISSIONS.MANAGE_STOCK,
    PERMISSIONS.WAREHOUSE_SETTINGS,
    
    PERMISSIONS.CREATE_TRANSFER_ORDER,
    PERMISSIONS.APPROVE_TRANSFER_ORDER,
    PERMISSIONS.RECEIVE_TRANSFER_ORDER,
    PERMISSIONS.VIEW_TRANSFER_ORDERS,
    PERMISSIONS.MANAGE_TRANSFER_TEMPLATES,
    
    PERMISSIONS.RECEIVE_FROM_SUPPLIER,
    PERMISSIONS.MANAGE_WAREHOUSE_ASSIGNMENTS,
    PERMISSIONS.WASTE_MANAGEMENT,
    
    // Purchase Orders (Receiving focus)
    PERMISSIONS.VIEW_PURCHASE_ORDERS,
    PERMISSIONS.RECEIVE_PURCHASE_ORDER,
    PERMISSIONS.VIEW_SUPPLIERS,
    
    // Foodics Integration (Inventory sync)
    PERMISSIONS.ACCESS_FOODICS,
    PERMISSIONS.SYNC_FOODICS_DATA,
    PERMISSIONS.VIEW_FOODICS_DASHBOARD,
    PERMISSIONS.IMPORT_FROM_FOODICS,
    PERMISSIONS.EXPORT_TO_FOODICS,
    
    // Reporting (Inventory focus)
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_INVENTORY_REPORTS,
    PERMISSIONS.EXPORT_DATA
  ],
  
  [ROLES.KITCHEN_MANAGER]: [
    // Dashboard & Kitchen Access
    PERMISSIONS.ACCESS_DASHBOARD,
    PERMISSIONS.ACCESS_KITCHEN_PRODUCTION,
    PERMISSIONS.ACCESS_INVENTORY,
    PERMISSIONS.ACCESS_ITEM_MANAGEMENT,
    
    // Recipe Management (Full)
    PERMISSIONS.VIEW_STOCK_LEVELS,
    
    PERMISSIONS.CREATE_SUB_RECIPE,
    PERMISSIONS.EDIT_SUB_RECIPE,
    PERMISSIONS.DELETE_SUB_RECIPE,
    PERMISSIONS.VIEW_SUB_RECIPES,
    
    PERMISSIONS.CREATE_MID_PREP_RECIPE,
    PERMISSIONS.EDIT_MID_PREP_RECIPE,
    PERMISSIONS.DELETE_MID_PREP_RECIPE,
    PERMISSIONS.VIEW_MID_PREP_RECIPES,
    
    PERMISSIONS.CREATE_CAKE_RECIPE,
    PERMISSIONS.EDIT_CAKE_RECIPE,
    PERMISSIONS.DELETE_CAKE_RECIPE,
    PERMISSIONS.VIEW_CAKE_RECIPES,
    
    // Kitchen Production (Full)
    PERMISSIONS.ACCESS_KITCHEN_DASHBOARD,
    PERMISSIONS.CREATE_PRODUCTION_ORDER,
    PERMISSIONS.EDIT_PRODUCTION_ORDER,
    PERMISSIONS.DELETE_PRODUCTION_ORDER,
    PERMISSIONS.VIEW_PRODUCTION_ORDERS,
    PERMISSIONS.APPROVE_PRODUCTION,
    PERMISSIONS.START_PRODUCTION,
    PERMISSIONS.COMPLETE_PRODUCTION,
    
    PERMISSIONS.BATCH_PRODUCTION_CALCULATOR,
    PERMISSIONS.PRODUCTION_PLANNING,
    PERMISSIONS.PRODUCTION_SCHEDULING,
    PERMISSIONS.KITCHEN_WORKFLOW,
    
    // Limited Warehouse (for production needs)
    PERMISSIONS.VIEW_TRANSFER_ORDERS,
    PERMISSIONS.RECEIVE_TRANSFER_ORDER,
    
    // Reporting (Production focus)
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_PRODUCTION_REPORTS,
    PERMISSIONS.EXPORT_DATA
  ],
  
  [ROLES.PRODUCTION_STAFF]: [
    // Dashboard & Production Access
    PERMISSIONS.ACCESS_DASHBOARD,
    PERMISSIONS.ACCESS_KITCHEN_PRODUCTION,
    
    // Recipe Viewing
    PERMISSIONS.VIEW_SUB_RECIPES,
    PERMISSIONS.VIEW_MID_PREP_RECIPES,
    PERMISSIONS.VIEW_CAKE_RECIPES,
    PERMISSIONS.VIEW_STOCK_LEVELS,
    
    // Kitchen Production (Limited)
    PERMISSIONS.ACCESS_KITCHEN_DASHBOARD,
    PERMISSIONS.VIEW_PRODUCTION_ORDERS,
    PERMISSIONS.START_PRODUCTION,
    PERMISSIONS.COMPLETE_PRODUCTION,
    
    PERMISSIONS.BATCH_PRODUCTION_CALCULATOR,
    PERMISSIONS.KITCHEN_WORKFLOW,
    
    // Basic Reporting
    PERMISSIONS.VIEW_PRODUCTION_REPORTS
  ],
  
  [ROLES.INVENTORY_STAFF]: [
    // Dashboard & Inventory Access
    PERMISSIONS.ACCESS_DASHBOARD,
    PERMISSIONS.ACCESS_INVENTORY,
    PERMISSIONS.ACCESS_ITEM_MANAGEMENT,
    
    // Inventory Management (Limited)
    PERMISSIONS.MANAGE_INVENTORY,
    PERMISSIONS.CREATE_ITEM,
    PERMISSIONS.EDIT_ITEM,
    PERMISSIONS.VIEW_STOCK_LEVELS,
    PERMISSIONS.ADJUST_STOCK,
    
    PERMISSIONS.VIEW_SUB_RECIPES,
    PERMISSIONS.VIEW_MID_PREP_RECIPES,
    PERMISSIONS.VIEW_CAKE_RECIPES,
    
    // Warehouse Operations (Basic)
    PERMISSIONS.MANAGE_STOCK,
    PERMISSIONS.VIEW_TRANSFER_ORDERS,
    PERMISSIONS.RECEIVE_TRANSFER_ORDER,
    PERMISSIONS.RECEIVE_FROM_SUPPLIER,
    
    // Purchase Orders (Receiving only)
    PERMISSIONS.VIEW_PURCHASE_ORDERS,
    PERMISSIONS.RECEIVE_PURCHASE_ORDER,
    
    // Basic Reporting
    PERMISSIONS.VIEW_INVENTORY_REPORTS
  ],
  
  [ROLES.FINANCE_STAFF]: [
    // Dashboard & Financial Access
    PERMISSIONS.ACCESS_DASHBOARD,
    PERMISSIONS.ACCESS_FINANCE_CENTER,
    PERMISSIONS.ACCESS_EXPENSE_MANAGEMENT,
    
    // Financial Operations (Limited)
    PERMISSIONS.CREATE_EXPENSE,
    PERMISSIONS.EDIT_EXPENSE,
    PERMISSIONS.VIEW_EXPENSES,
    
    PERMISSIONS.VIEW_PURCHASE_ORDERS,
    PERMISSIONS.SUPPLIER_PAYMENTS,
    
    // Basic Financial Reporting
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_FINANCIAL_REPORTS,
    PERMISSIONS.EXPORT_DATA
  ],
  
  [ROLES.VIEWER]: [
    // Dashboard Access Only
    PERMISSIONS.ACCESS_DASHBOARD,
    
    // Basic Viewing
    PERMISSIONS.VIEW_EXPENSES,
    PERMISSIONS.VIEW_STOCK_LEVELS,
    PERMISSIONS.VIEW_SUB_RECIPES,
    PERMISSIONS.VIEW_MID_PREP_RECIPES,
    PERMISSIONS.VIEW_CAKE_RECIPES,
    PERMISSIONS.VIEW_PRODUCTION_ORDERS,
    PERMISSIONS.VIEW_PURCHASE_ORDERS,
    PERMISSIONS.VIEW_SUPPLIERS,
    
    // Basic Reporting
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
  '/kitchen': [PERMISSIONS.ACCESS_KITCHEN_PRODUCTION],
  '/purchase-orders': [PERMISSIONS.ACCESS_PURCHASE_ORDERS],
  '/bank-hierarchy': [PERMISSIONS.ACCESS_BANK_HIERARCHY],
  '/super-admin': [PERMISSIONS.ACCESS_SUPER_ADMIN],
  '/cheque-management': [PERMISSIONS.ACCESS_CHEQUE_MANAGEMENT],
  '/expense-management': [PERMISSIONS.ACCESS_EXPENSE_MANAGEMENT],
  '/item-management': [PERMISSIONS.ACCESS_ITEM_MANAGEMENT],
  '/foodics': [PERMISSIONS.ACCESS_FOODICS]
};

// Define tab-specific access rules for components
export const TAB_ACCESS = {
  finance: {
    'bank-accounts': [PERMISSIONS.ACCESS_FINANCE_CENTER],
    'bank-hierarchy': [PERMISSIONS.ACCESS_BANK_HIERARCHY],
    'cheques': [PERMISSIONS.ACCESS_CHEQUE_MANAGEMENT],
    'expenses': [PERMISSIONS.ACCESS_EXPENSE_MANAGEMENT],
    'supplier-payments': [PERMISSIONS.SUPPLIER_PAYMENTS],
    'reports': [PERMISSIONS.VIEW_FINANCIAL_REPORTS]
  },
  warehouse: {
    'settings': [PERMISSIONS.MANAGE_WAREHOUSE],
    'stock': [PERMISSIONS.MANAGE_STOCK],
    'transfers': [PERMISSIONS.VIEW_TRANSFER_ORDERS],
    'create-transfer': [PERMISSIONS.CREATE_TRANSFER_ORDER],
    'receive-transfer': [PERMISSIONS.RECEIVE_TRANSFER_ORDER],
    'receive-supplier': [PERMISSIONS.RECEIVE_FROM_SUPPLIER],
    'assignments': [PERMISSIONS.MANAGE_WAREHOUSE_ASSIGNMENTS],
    'foodics': [PERMISSIONS.ACCESS_FOODICS]
  },
  inventory: {
    'items': [PERMISSIONS.ACCESS_ITEM_MANAGEMENT],
    'sub-recipes': [PERMISSIONS.VIEW_SUB_RECIPES],
    'mid-prep': [PERMISSIONS.VIEW_MID_PREP_RECIPES],
    'cakes': [PERMISSIONS.VIEW_CAKE_RECIPES],
    'categories': [PERMISSIONS.MANAGE_CATEGORIES]
  },
  kitchen: {
    'production': [PERMISSIONS.ACCESS_KITCHEN_DASHBOARD],
    'orders': [PERMISSIONS.VIEW_PRODUCTION_ORDERS],
    'planning': [PERMISSIONS.PRODUCTION_PLANNING],
    'batch-calculator': [PERMISSIONS.BATCH_PRODUCTION_CALCULATOR],
    'workflow': [PERMISSIONS.KITCHEN_WORKFLOW]
  },
  purchaseOrders: {
    'orders': [PERMISSIONS.VIEW_PURCHASE_ORDERS],
    'create': [PERMISSIONS.CREATE_PURCHASE_ORDER],
    'suppliers': [PERMISSIONS.VIEW_SUPPLIERS],
    'payments': [PERMISSIONS.SUPPLIER_PAYMENTS],
    'reports': [PERMISSIONS.VIEW_PURCHASE_REPORTS]
  }
};

// Database role mapping - converts database roles to frontend roles
const DATABASE_ROLE_MAPPING = {
  'Admin': ROLES.SUPER_ADMIN,           // Database "Admin" = Frontend "super_admin"
  'admin': ROLES.SUPER_ADMIN,           // Fallback for lowercase
  'Warehouse Manager': ROLES.WAREHOUSE_MANAGER,
  'warehouse_manager': ROLES.WAREHOUSE_MANAGER,
  'Kitchen Manager': ROLES.KITCHEN_MANAGER,
  'kitchen_manager': ROLES.KITCHEN_MANAGER,
  'Production Staff': ROLES.PRODUCTION_STAFF,
  'production_staff': ROLES.PRODUCTION_STAFF,
  'Finance': ROLES.ACCOUNTANT,
  'finance': ROLES.ACCOUNTANT,
  'Cost Control': ROLES.MANAGER,
  'cost_control': ROLES.MANAGER,
  'Inventory Staff': ROLES.INVENTORY_STAFF,
  'inventory_staff': ROLES.INVENTORY_STAFF,
  'Finance Staff': ROLES.FINANCE_STAFF,
  'finance_staff': ROLES.FINANCE_STAFF,
  'User': ROLES.VIEWER,
  'user': ROLES.VIEWER,
  'Staff': ROLES.VIEWER
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
    const databaseRole = user?.role?.name || user?.role || 'User';
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
      [ROLES.KITCHEN_MANAGER]: 'Kitchen Manager',
      [ROLES.PRODUCTION_STAFF]: 'Production Staff',
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
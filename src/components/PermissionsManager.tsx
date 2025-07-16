import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ROLES, PERMISSIONS, PAGE_ACCESS, TAB_ACCESS } from '../lib/roleManager';
import roleManager from '../lib/roleManager';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import api from '../services/api';

interface Permission {
  key: string;
  label: string;
  category: string;
  description: string;
}

interface RolePermissions {
  [role: string]: string[];
}

const PermissionsManager: React.FC = () => {
  const { t } = useTranslation();
  const [selectedRole, setSelectedRole] = useState(ROLES.ADMIN);
  const [rolePermissions, setRolePermissions] = useState<RolePermissions>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Categorized permissions for better UI organization
  const permissionCategories = {
    'Page Access': [
      { key: PERMISSIONS.ACCESS_DASHBOARD, label: 'Dashboard Access', description: 'Can access main dashboard' },
      { key: PERMISSIONS.ACCESS_FINANCE_CENTER, label: 'Finance Center', description: 'Can access finance center' },
      { key: PERMISSIONS.ACCESS_WAREHOUSE, label: 'Warehouse Management', description: 'Can access warehouse section' },
      { key: PERMISSIONS.ACCESS_INVENTORY, label: 'Inventory Management', description: 'Can access inventory section' },
      { key: PERMISSIONS.ACCESS_SUPER_ADMIN, label: 'Super Admin Panel', description: 'Can access super admin features' },
      { key: PERMISSIONS.ACCESS_CHEQUE_MANAGEMENT, label: 'Cheque Management', description: 'Can access cheque management' },
      { key: PERMISSIONS.ACCESS_EXPENSE_MANAGEMENT, label: 'Expense Management', description: 'Can access expense management' },
      { key: PERMISSIONS.ACCESS_ITEM_MANAGEMENT, label: 'Item Management', description: 'Can access item management' },
      { key: PERMISSIONS.ACCESS_KITCHEN_PRODUCTION, label: 'Kitchen Production', description: 'Can access kitchen production' },
      { key: PERMISSIONS.ACCESS_PURCHASE_ORDERS, label: 'Purchase Orders', description: 'Can access purchase orders' },
      { key: PERMISSIONS.ACCESS_BANK_HIERARCHY, label: 'Bank Hierarchy', description: 'Can access bank hierarchy management' },
    ],
    'Financial Management': [
      { key: PERMISSIONS.CREATE_EXPENSE, label: 'Create Expenses', description: 'Can create new expenses' },
      { key: PERMISSIONS.EDIT_EXPENSE, label: 'Edit Expenses', description: 'Can edit existing expenses' },
      { key: PERMISSIONS.DELETE_EXPENSE, label: 'Delete Expenses', description: 'Can delete expenses' },
      { key: PERMISSIONS.VIEW_EXPENSES, label: 'View Expenses', description: 'Can view expense records' },
      { key: PERMISSIONS.APPROVE_EXPENSE, label: 'Approve Expenses', description: 'Can approve expense requests' },
      { key: PERMISSIONS.CREATE_CHEQUE, label: 'Create Cheques', description: 'Can create new cheques' },
      { key: PERMISSIONS.EDIT_CHEQUE, label: 'Edit Cheques', description: 'Can edit existing cheques' },
      { key: PERMISSIONS.DELETE_CHEQUE, label: 'Delete Cheques', description: 'Can delete cheques' },
      { key: PERMISSIONS.CANCEL_CHEQUE, label: 'Cancel Cheques', description: 'Can cancel issued cheques' },
      { key: PERMISSIONS.SETTLE_CHEQUE, label: 'Settle Cheques', description: 'Can settle cheques' },
      { key: PERMISSIONS.EARLY_SETTLEMENT, label: 'Early Settlement', description: 'Can process early settlements' },
      { key: PERMISSIONS.PRINT_CHEQUE, label: 'Print Cheques', description: 'Can print cheques' },
      { key: PERMISSIONS.ARABIC_CHEQUE_GENERATION, label: 'Arabic Cheque Generation', description: 'Can generate Arabic cheques' },
    ],
    'Banking & Safes': [
      { key: PERMISSIONS.CREATE_BANK_ACCOUNT, label: 'Create Bank Accounts', description: 'Can create new bank accounts' },
      { key: PERMISSIONS.EDIT_BANK_ACCOUNT, label: 'Edit Bank Accounts', description: 'Can edit bank account details' },
      { key: PERMISSIONS.DELETE_BANK_ACCOUNT, label: 'Delete Bank Accounts', description: 'Can delete bank accounts' },
      { key: PERMISSIONS.MANAGE_BANK_HIERARCHY, label: 'Manage Bank Hierarchy', description: 'Can manage bank hierarchy structure' },
      { key: PERMISSIONS.MANAGE_CHEQUE_BOOKS, label: 'Manage Cheque Books', description: 'Can manage cheque books' },
      { key: PERMISSIONS.CREATE_SAFE, label: 'Create Safes', description: 'Can create new safes' },
      { key: PERMISSIONS.EDIT_SAFE, label: 'Edit Safes', description: 'Can edit safe details' },
      { key: PERMISSIONS.DELETE_SAFE, label: 'Delete Safes', description: 'Can delete safes' },
      { key: PERMISSIONS.RESET_SAFE, label: 'Reset Safes', description: 'Can reset safe balances' },
    ],
    'Inventory & Items': [
      { key: PERMISSIONS.MANAGE_INVENTORY, label: 'Manage Inventory', description: 'Full inventory management access' },
      { key: PERMISSIONS.CREATE_ITEM, label: 'Create Items', description: 'Can create new inventory items' },
      { key: PERMISSIONS.EDIT_ITEM, label: 'Edit Items', description: 'Can edit item details' },
      { key: PERMISSIONS.DELETE_ITEM, label: 'Delete Items', description: 'Can delete items' },
      { key: PERMISSIONS.VIEW_STOCK_LEVELS, label: 'View Stock Levels', description: 'Can view current stock levels' },
      { key: PERMISSIONS.ADJUST_STOCK, label: 'Adjust Stock', description: 'Can make stock adjustments' },
      { key: PERMISSIONS.MANAGE_CATEGORIES, label: 'Manage Categories', description: 'Can manage item categories' },
      { key: PERMISSIONS.CREATE_CATEGORY, label: 'Create Categories', description: 'Can create new categories' },
      { key: PERMISSIONS.EDIT_CATEGORY, label: 'Edit Categories', description: 'Can edit category details' },
      { key: PERMISSIONS.DELETE_CATEGORY, label: 'Delete Categories', description: 'Can delete categories' },
    ],
    'Recipe Management': [
      { key: PERMISSIONS.CREATE_SUB_RECIPE, label: 'Create Sub-Recipes', description: 'Can create new sub-recipes' },
      { key: PERMISSIONS.EDIT_SUB_RECIPE, label: 'Edit Sub-Recipes', description: 'Can edit sub-recipe details' },
      { key: PERMISSIONS.DELETE_SUB_RECIPE, label: 'Delete Sub-Recipes', description: 'Can delete sub-recipes' },
      { key: PERMISSIONS.VIEW_SUB_RECIPES, label: 'View Sub-Recipes', description: 'Can view sub-recipe list' },
      { key: PERMISSIONS.CREATE_MID_PREP_RECIPE, label: 'Create Mid-Prep Recipes', description: 'Can create mid-prep recipes' },
      { key: PERMISSIONS.EDIT_MID_PREP_RECIPE, label: 'Edit Mid-Prep Recipes', description: 'Can edit mid-prep recipes' },
      { key: PERMISSIONS.DELETE_MID_PREP_RECIPE, label: 'Delete Mid-Prep Recipes', description: 'Can delete mid-prep recipes' },
      { key: PERMISSIONS.VIEW_MID_PREP_RECIPES, label: 'View Mid-Prep Recipes', description: 'Can view mid-prep recipe list' },
      { key: PERMISSIONS.CREATE_CAKE_RECIPE, label: 'Create Cake Recipes', description: 'Can create cake recipes' },
      { key: PERMISSIONS.EDIT_CAKE_RECIPE, label: 'Edit Cake Recipes', description: 'Can edit cake recipes' },
      { key: PERMISSIONS.DELETE_CAKE_RECIPE, label: 'Delete Cake Recipes', description: 'Can delete cake recipes' },
      { key: PERMISSIONS.VIEW_CAKE_RECIPES, label: 'View Cake Recipes', description: 'Can view cake recipe list' },
    ],
    'Warehouse Operations': [
      { key: PERMISSIONS.MANAGE_WAREHOUSE, label: 'Manage Warehouses', description: 'Full warehouse management access' },
      { key: PERMISSIONS.CREATE_WAREHOUSE, label: 'Create Warehouses', description: 'Can create new warehouses' },
      { key: PERMISSIONS.EDIT_WAREHOUSE, label: 'Edit Warehouses', description: 'Can edit warehouse details' },
      { key: PERMISSIONS.DELETE_WAREHOUSE, label: 'Delete Warehouses', description: 'Can delete warehouses' },
      { key: PERMISSIONS.MANAGE_STOCK, label: 'Manage Stock', description: 'Can manage stock operations' },
      { key: PERMISSIONS.WAREHOUSE_SETTINGS, label: 'Warehouse Settings', description: 'Can modify warehouse settings' },
      { key: PERMISSIONS.CREATE_TRANSFER_ORDER, label: 'Create Transfer Orders', description: 'Can create transfer orders' },
      { key: PERMISSIONS.APPROVE_TRANSFER_ORDER, label: 'Approve Transfer Orders', description: 'Can approve transfer orders' },
      { key: PERMISSIONS.RECEIVE_TRANSFER_ORDER, label: 'Receive Transfer Orders', description: 'Can receive transfer orders' },
      { key: PERMISSIONS.VIEW_TRANSFER_ORDERS, label: 'View Transfer Orders', description: 'Can view transfer order list' },
      { key: PERMISSIONS.MANAGE_TRANSFER_TEMPLATES, label: 'Manage Transfer Templates', description: 'Can manage transfer templates' },
      { key: PERMISSIONS.RECEIVE_FROM_SUPPLIER, label: 'Receive from Suppliers', description: 'Can receive supplier deliveries' },
      { key: PERMISSIONS.MANAGE_WAREHOUSE_ASSIGNMENTS, label: 'Manage Warehouse Assignments', description: 'Can assign users to warehouses' },
      { key: PERMISSIONS.WASTE_MANAGEMENT, label: 'Waste Management', description: 'Can manage waste tracking' },
    ],
    'Kitchen Production': [
      { key: PERMISSIONS.ACCESS_KITCHEN_DASHBOARD, label: 'Kitchen Dashboard', description: 'Can access kitchen dashboard' },
      { key: PERMISSIONS.CREATE_PRODUCTION_ORDER, label: 'Create Production Orders', description: 'Can create production orders' },
      { key: PERMISSIONS.EDIT_PRODUCTION_ORDER, label: 'Edit Production Orders', description: 'Can edit production orders' },
      { key: PERMISSIONS.DELETE_PRODUCTION_ORDER, label: 'Delete Production Orders', description: 'Can delete production orders' },
      { key: PERMISSIONS.VIEW_PRODUCTION_ORDERS, label: 'View Production Orders', description: 'Can view production order list' },
      { key: PERMISSIONS.APPROVE_PRODUCTION, label: 'Approve Production', description: 'Can approve production requests' },
      { key: PERMISSIONS.START_PRODUCTION, label: 'Start Production', description: 'Can initiate production processes' },
      { key: PERMISSIONS.COMPLETE_PRODUCTION, label: 'Complete Production', description: 'Can mark production as complete' },
      { key: PERMISSIONS.BATCH_PRODUCTION_CALCULATOR, label: 'Batch Production Calculator', description: 'Can use batch calculator' },
      { key: PERMISSIONS.PRODUCTION_PLANNING, label: 'Production Planning', description: 'Can plan production schedules' },
      { key: PERMISSIONS.PRODUCTION_SCHEDULING, label: 'Production Scheduling', description: 'Can schedule production tasks' },
      { key: PERMISSIONS.KITCHEN_WORKFLOW, label: 'Kitchen Workflow', description: 'Can manage kitchen workflows' },
    ],
    'Purchase Orders': [
      { key: PERMISSIONS.CREATE_PURCHASE_ORDER, label: 'Create Purchase Orders', description: 'Can create purchase orders' },
      { key: PERMISSIONS.EDIT_PURCHASE_ORDER, label: 'Edit Purchase Orders', description: 'Can edit purchase orders' },
      { key: PERMISSIONS.DELETE_PURCHASE_ORDER, label: 'Delete Purchase Orders', description: 'Can delete purchase orders' },
      { key: PERMISSIONS.VIEW_PURCHASE_ORDERS, label: 'View Purchase Orders', description: 'Can view purchase order list' },
      { key: PERMISSIONS.APPROVE_PURCHASE_ORDER, label: 'Approve Purchase Orders', description: 'Can approve purchase orders' },
      { key: PERMISSIONS.RECEIVE_PURCHASE_ORDER, label: 'Receive Purchase Orders', description: 'Can receive purchase order deliveries' },
      { key: PERMISSIONS.CANCEL_PURCHASE_ORDER, label: 'Cancel Purchase Orders', description: 'Can cancel purchase orders' },
      { key: PERMISSIONS.MANAGE_SUPPLIERS, label: 'Manage Suppliers', description: 'Full supplier management access' },
      { key: PERMISSIONS.CREATE_SUPPLIER, label: 'Create Suppliers', description: 'Can create new suppliers' },
      { key: PERMISSIONS.EDIT_SUPPLIER, label: 'Edit Suppliers', description: 'Can edit supplier details' },
      { key: PERMISSIONS.DELETE_SUPPLIER, label: 'Delete Suppliers', description: 'Can delete suppliers' },
      { key: PERMISSIONS.VIEW_SUPPLIERS, label: 'View Suppliers', description: 'Can view supplier list' },
      { key: PERMISSIONS.SUPPLIER_PAYMENTS, label: 'Supplier Payments', description: 'Can manage supplier payments' },
      { key: PERMISSIONS.GENERATE_CHEQUE_FROM_PO, label: 'Generate Cheques from PO', description: 'Can generate cheques from purchase orders' },
    ],
    'Foodics Integration': [
      { key: PERMISSIONS.ACCESS_FOODICS, label: 'Access Foodics', description: 'Can access Foodics integration' },
      { key: PERMISSIONS.CONFIGURE_FOODICS, label: 'Configure Foodics', description: 'Can configure Foodics settings' },
      { key: PERMISSIONS.SYNC_FOODICS_DATA, label: 'Sync Foodics Data', description: 'Can synchronize Foodics data' },
      { key: PERMISSIONS.VIEW_FOODICS_DASHBOARD, label: 'View Foodics Dashboard', description: 'Can view Foodics dashboard' },
      { key: PERMISSIONS.IMPORT_FROM_FOODICS, label: 'Import from Foodics', description: 'Can import data from Foodics' },
      { key: PERMISSIONS.EXPORT_TO_FOODICS, label: 'Export to Foodics', description: 'Can export data to Foodics' },
      { key: PERMISSIONS.MANAGE_FOODICS_SETTINGS, label: 'Manage Foodics Settings', description: 'Can manage Foodics configuration' },
    ],
    'Reports & Analytics': [
      { key: PERMISSIONS.VIEW_REPORTS, label: 'View Reports', description: 'Can view basic reports' },
      { key: PERMISSIONS.VIEW_FINANCIAL_REPORTS, label: 'View Financial Reports', description: 'Can view financial reports' },
      { key: PERMISSIONS.VIEW_INVENTORY_REPORTS, label: 'View Inventory Reports', description: 'Can view inventory reports' },
      { key: PERMISSIONS.VIEW_PRODUCTION_REPORTS, label: 'View Production Reports', description: 'Can view production reports' },
      { key: PERMISSIONS.VIEW_PURCHASE_REPORTS, label: 'View Purchase Reports', description: 'Can view purchase reports' },
      { key: PERMISSIONS.EXPORT_DATA, label: 'Export Data', description: 'Can export data to files' },
      { key: PERMISSIONS.ADVANCED_ANALYTICS, label: 'Advanced Analytics', description: 'Can access advanced analytics' },
    ],
    'System Administration': [
      { key: PERMISSIONS.MANAGE_USERS, label: 'Manage Users', description: 'Can create, edit, and delete users' },
      { key: PERMISSIONS.SYSTEM_RESET, label: 'System Reset', description: 'Can perform system resets' },
      { key: PERMISSIONS.VIEW_AUDIT_LOGS, label: 'View Audit Logs', description: 'Can view system audit logs' },
      { key: PERMISSIONS.SYSTEM_BACKUP, label: 'System Backup', description: 'Can perform system backups' },
      { key: PERMISSIONS.SYSTEM_SETTINGS, label: 'System Settings', description: 'Can modify system settings' },
    ]
  };

  const roleLabels = {
    [ROLES.SUPER_ADMIN]: 'Super Admin',
    [ROLES.ADMIN]: 'Admin',
    [ROLES.MANAGER]: 'Manager',
    [ROLES.ACCOUNTANT]: 'Accountant',
    [ROLES.WAREHOUSE_MANAGER]: 'Warehouse Manager',
    [ROLES.KITCHEN_MANAGER]: 'Kitchen Manager',
    [ROLES.PRODUCTION_STAFF]: 'Production Staff',
    [ROLES.INVENTORY_STAFF]: 'Inventory Staff',
    [ROLES.FINANCE_STAFF]: 'Finance Staff',
    [ROLES.VIEWER]: 'Viewer'
  };

  useEffect(() => {
    loadRolePermissions();
  }, []);

    const loadRolePermissions = async () => {
    setLoading(true);
    try {
      // Try to load from database API first
      const response = await api.get('/admin-simple/permissions/all-roles');
      console.log('🔄 Loaded permissions from database API:', response.data);
      setRolePermissions(response.data.roles);
      setMessage({ type: 'success', text: `Loaded ${response.data.total_roles} roles from database` });
      setTimeout(() => setMessage(null), 3000);
    } catch (apiError) {
      console.warn('🔄 API failed, trying localStorage fallback:', apiError);
      try {
        // Fallback to localStorage
        const savedPermissions = localStorage.getItem('role_permissions');
        if (savedPermissions) {
          const parsedPermissions = JSON.parse(savedPermissions);
          setRolePermissions(parsedPermissions);
          console.log('🔄 Loaded permissions from localStorage');
          setMessage({ type: 'success', text: 'Loaded permissions from local storage (offline mode)' });
          setTimeout(() => setMessage(null), 3000);
        } else {
          // Last resort: use default permissions
          const rolePermissionsFromDefaults = {};
          for (const role of Object.values(ROLES)) {
            rolePermissionsFromDefaults[role] = getDefaultPermissionsForRole(role);
          }
          setRolePermissions(rolePermissionsFromDefaults);
          console.log('🔄 Loaded hardcoded default permissions');
          setMessage({ type: 'success', text: 'Loaded default permissions (no saved data found)' });
          setTimeout(() => setMessage(null), 3000);
        }
      } catch (fallbackError) {
        console.error('Error in fallback loading:', fallbackError);
        setMessage({ type: 'error', text: 'Failed to load permissions from all sources' });
      }
    } finally {
      setLoading(false);
    }
  };

  const getDefaultPermissionsForRole = (role: string) => {
    const defaultPermissions = {
        [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
        [ROLES.ADMIN]: [
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
          PERMISSIONS.MANAGE_USERS
        ],
        [ROLES.MANAGER]: [
          PERMISSIONS.ACCESS_DASHBOARD,
          PERMISSIONS.ACCESS_FINANCE_CENTER,
          PERMISSIONS.ACCESS_WAREHOUSE,
          PERMISSIONS.ACCESS_INVENTORY,
          PERMISSIONS.ACCESS_KITCHEN_PRODUCTION,
          PERMISSIONS.ACCESS_PURCHASE_ORDERS,
          PERMISSIONS.VIEW_EXPENSES,
          PERMISSIONS.APPROVE_EXPENSE,
          PERMISSIONS.VIEW_PRODUCTION_ORDERS,
          PERMISSIONS.APPROVE_PRODUCTION
        ],
        [ROLES.ACCOUNTANT]: [
          // Dashboard & Financial Access
          PERMISSIONS.ACCESS_DASHBOARD,
          PERMISSIONS.ACCESS_FINANCE_CENTER,
          PERMISSIONS.ACCESS_CHEQUE_MANAGEMENT,
          PERMISSIONS.ACCESS_EXPENSE_MANAGEMENT,
          PERMISSIONS.ACCESS_BANK_HIERARCHY,
          
          // Inventory Access (for cost accounting)
          PERMISSIONS.ACCESS_INVENTORY,
          PERMISSIONS.ACCESS_ITEM_MANAGEMENT,
          PERMISSIONS.CREATE_ITEM,
          PERMISSIONS.EDIT_ITEM,
          PERMISSIONS.VIEW_STOCK_LEVELS,
          
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
          PERMISSIONS.ACCESS_PURCHASE_ORDERS,
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
          PERMISSIONS.ACCESS_DASHBOARD,
          PERMISSIONS.ACCESS_WAREHOUSE,
          PERMISSIONS.ACCESS_INVENTORY,
          PERMISSIONS.MANAGE_WAREHOUSE,
          PERMISSIONS.MANAGE_STOCK,
          PERMISSIONS.CREATE_TRANSFER_ORDER,
          PERMISSIONS.APPROVE_TRANSFER_ORDER,
          PERMISSIONS.RECEIVE_TRANSFER_ORDER,
          PERMISSIONS.VIEW_TRANSFER_ORDERS
        ],
        [ROLES.KITCHEN_MANAGER]: [
          PERMISSIONS.ACCESS_DASHBOARD,
          PERMISSIONS.ACCESS_KITCHEN_PRODUCTION,
          PERMISSIONS.ACCESS_INVENTORY,
          PERMISSIONS.VIEW_SUB_RECIPES,
          PERMISSIONS.VIEW_MID_PREP_RECIPES,
          PERMISSIONS.VIEW_CAKE_RECIPES,
          PERMISSIONS.CREATE_PRODUCTION_ORDER,
          PERMISSIONS.EDIT_PRODUCTION_ORDER,
          PERMISSIONS.VIEW_PRODUCTION_ORDERS,
          PERMISSIONS.START_PRODUCTION,
          PERMISSIONS.COMPLETE_PRODUCTION
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
          PERMISSIONS.ACCESS_DASHBOARD,
          PERMISSIONS.ACCESS_FINANCE_CENTER,
          PERMISSIONS.ACCESS_EXPENSE_MANAGEMENT,
          PERMISSIONS.CREATE_EXPENSE,
          PERMISSIONS.EDIT_EXPENSE,
          PERMISSIONS.VIEW_EXPENSES,
          PERMISSIONS.VIEW_PURCHASE_ORDERS,
          PERMISSIONS.SUPPLIER_PAYMENTS
        ],
        [ROLES.VIEWER]: [
          PERMISSIONS.ACCESS_DASHBOARD,
          PERMISSIONS.VIEW_EXPENSES,
          PERMISSIONS.VIEW_STOCK_LEVELS,
          PERMISSIONS.VIEW_SUB_RECIPES,
          PERMISSIONS.VIEW_MID_PREP_RECIPES,
          PERMISSIONS.VIEW_CAKE_RECIPES,
          PERMISSIONS.VIEW_PRODUCTION_ORDERS,
          PERMISSIONS.VIEW_PURCHASE_ORDERS,
          PERMISSIONS.VIEW_SUPPLIERS
        ]
      };
      
      return defaultPermissions[role] || [];
    };

  const togglePermission = (role: string, permission: string) => {
    setRolePermissions(prev => {
      const currentPermissions = prev[role] || [];
      const hasPermission = currentPermissions.includes(permission);
      
      const updatedPermissions = hasPermission
        ? currentPermissions.filter(p => p !== permission)
        : [...currentPermissions, permission];

      return {
        ...prev,
        [role]: updatedPermissions
      };
    });
  };

  const toggleAllInCategory = (role: string, categoryPermissions: Permission[], enable: boolean) => {
    setRolePermissions(prev => {
      const currentPermissions = prev[role] || [];
      const categoryKeys = categoryPermissions.map(p => p.key);
      
      let updatedPermissions = currentPermissions.filter(p => !categoryKeys.includes(p));
      
      if (enable) {
        updatedPermissions = [...updatedPermissions, ...categoryKeys];
      }

      return {
        ...prev,
        [role]: updatedPermissions
      };
    });
  };

    const savePermissions = async () => {
    setSaving(true);
    try {
      let savedToDatabase = false;
      let savedRoles = 0;
      
      // Try to save to database API first
      try {
        for (const [roleName, permissions] of Object.entries(rolePermissions)) {
          await api.post(`/admin-simple/roles/${roleName}/permissions`, {
            permissions: permissions
          });
          savedRoles++;
        }
        savedToDatabase = true;
        console.log('🔄 Saved permissions to database API');
      } catch (apiError) {
        console.warn('🔄 API save failed, falling back to localStorage:', apiError);
        savedToDatabase = false;
      }
      
      // Always save to localStorage as backup
      localStorage.setItem('role_permissions', JSON.stringify(rolePermissions));
      
      // Refresh the roleManager to use the new permissions immediately
      roleManager.refreshUserPermissions();
      
      // Show appropriate success message
      if (savedToDatabase) {
        setMessage({ 
          type: 'success', 
          text: `✅ Permissions saved to database for ${savedRoles} roles! (Also backed up locally)` 
        });
      } else {
        setMessage({ 
          type: 'success', 
          text: '💾 Permissions saved locally (database unavailable - will sync when online)' 
        });
      }
      
      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      console.error('Error saving permissions:', error);
      setMessage({ type: 'error', text: 'Failed to save permissions. Please try again.' });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async () => {
    if (!confirm('⚠️ Reset all permissions to defaults? This will overwrite all custom changes.')) {
      return;
    }
    
    setLoading(true);
    try {
      // Try to reset via API first
      try {
        await api.post('/admin-simple/permissions/reset-to-defaults');
        console.log('🔄 Reset permissions to defaults via API');
        
        // Reload permissions from API
        await loadRolePermissions();
        
        setMessage({ 
          type: 'success', 
          text: '✅ All permissions reset to defaults successfully!' 
        });
      } catch (apiError) {
        console.warn('🔄 API reset failed, using local defaults:', apiError);
        
        // Fallback: load hardcoded defaults
        const rolePermissionsFromDefaults = {};
        for (const role of Object.values(ROLES)) {
          rolePermissionsFromDefaults[role] = getDefaultPermissionsForRole(role);
        }
        setRolePermissions(rolePermissionsFromDefaults);
        
        // Save to localStorage
        localStorage.setItem('role_permissions', JSON.stringify(rolePermissionsFromDefaults));
        
        setMessage({ 
          type: 'success', 
          text: '🔄 Permissions reset to local defaults (database unavailable)' 
        });
      }
      
      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      console.error('Error resetting permissions:', error);
      setMessage({ type: 'error', text: 'Failed to reset permissions. Please try again.' });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (role: string, permission: string) => {
    return rolePermissions[role]?.includes(permission) || false;
  };

  const getCategoryStatus = (role: string, categoryPermissions: Permission[]) => {
    const rolePerms = rolePermissions[role] || [];
    const categoryKeys = categoryPermissions.map(p => p.key);
    const enabledCount = categoryKeys.filter(key => rolePerms.includes(key)).length;
    
    if (enabledCount === 0) return 'none';
    if (enabledCount === categoryKeys.length) return 'all';
    return 'partial';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🔐 Permissions Manager</h2>
          <p className="text-gray-600 mt-1">Manage role-based permissions and page access controls</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={resetToDefaults}
            disabled={saving || loading}
            className="bg-orange-600 hover:bg-orange-700"
          >
            🔄 Reset to Defaults
          </Button>
          <Button 
            onClick={savePermissions}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700"
          >
            {saving ? '💾 Saving...' : '💾 Save Changes'}
          </Button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Role Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Role to Configure</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(roleLabels).map(([role, label]) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedRole === role
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">{label}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {rolePermissions[role]?.length || 0} permissions
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Permissions Configuration */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900">
          Configure Permissions for: {roleLabels[selectedRole]}
        </h3>

        {Object.entries(permissionCategories).map(([categoryName, categoryPermissions]) => {
          const categoryStatus = getCategoryStatus(selectedRole, categoryPermissions);
          
          return (
            <Card key={categoryName}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{categoryName}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      {categoryPermissions.filter(p => hasPermission(selectedRole, p.key)).length} / {categoryPermissions.length}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">None</span>
                      <Switch
                        checked={categoryStatus === 'all'}
                        onCheckedChange={(checked) => toggleAllInCategory(selectedRole, categoryPermissions, checked)}
                      />
                      <span className="text-sm">All</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryPermissions.map((permission) => (
                    <div key={permission.key} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                      <input
                        type="checkbox"
                        id={`${selectedRole}-${permission.key}`}
                        checked={hasPermission(selectedRole, permission.key)}
                        onChange={(e) => togglePermission(selectedRole, permission.key)}
                        className="mt-1 w-4 h-4 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <label 
                          htmlFor={`${selectedRole}-${permission.key}`}
                          className="block text-sm font-medium text-gray-900 cursor-pointer"
                        >
                          {permission.label}
                        </label>
                        <p className="text-xs text-gray-500 mt-1">{permission.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Permission Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Permission Summary for {roleLabels[selectedRole]}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-sm text-gray-600">
              <strong>Total Permissions:</strong> {rolePermissions[selectedRole]?.length || 0} / {Object.keys(PERMISSIONS).length}
            </div>
            <div className="text-xs text-gray-500">
              <strong>Enabled Permissions:</strong>
              <div className="mt-1 max-h-20 overflow-y-auto">
                {rolePermissions[selectedRole]?.map((permission, index) => (
                  <span key={permission} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded mr-1 mb-1 text-xs">
                    {permission.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </span>
                )) || 'No permissions assigned'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PermissionsManager; 
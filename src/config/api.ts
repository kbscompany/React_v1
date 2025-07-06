// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  // Main API (authenticated endpoints)
  MAIN_API: API_BASE_URL,
  
  // Simple API (no authentication required)
  SIMPLE_API: API_BASE_URL,
  
  // Specific endpoints
  safes: {
    list: `${API_BASE_URL}/safes`,
    simple: `${API_BASE_URL}/safes-simple`
  },
  cheques: {
    unassignedSimple: `${API_BASE_URL}/cheques-unassigned-simple`,
    createSimple: `${API_BASE_URL}/cheques-simple`,
    createRangeSimple: `${API_BASE_URL}/cheques/create-range-simple`
  },
  bankAccounts: {
    list: `${API_BASE_URL}/bank-accounts`,
    simple: `${API_BASE_URL}/bank-accounts-simple`,
    createSimple: `${API_BASE_URL}/bank-accounts-simple`
  },
  expenses: {
    list: `${API_BASE_URL}/expenses`,
    create: `${API_BASE_URL}/expenses`,
    categories: `${API_BASE_URL}/expense-categories`
  },
  // New hierarchical expense category endpoints
  expenseCategories: {
    // Simple endpoints (no authentication)
    simple: `${API_BASE_URL}/expense-categories-simple`,
    treeSimple: `${API_BASE_URL}/expense-categories-tree-simple`,
    createSimple: `${API_BASE_URL}/expense-categories-simple`,
    updateSimple: (id: number) => `${API_BASE_URL}/expense-categories-simple/${id}`,
    deleteSimple: (id: number) => `${API_BASE_URL}/expense-categories-simple/${id}`,
    
    // Authenticated endpoints (full features)
    tree: `${API_BASE_URL}/categories/tree`,
    list: `${API_BASE_URL}/categories`,
    create: `${API_BASE_URL}/categories`,
    update: (id: number) => `${API_BASE_URL}/categories/${id}`,
    delete: (id: number) => `${API_BASE_URL}/categories/${id}`,
    move: `${API_BASE_URL}/categories/move`,
    bulkDelete: `${API_BASE_URL}/categories/bulk-delete`,
    expenses: (id: number) => `${API_BASE_URL}/categories/${id}/expenses`,
    reassignExpenses: `${API_BASE_URL}/expenses/reassign`,
    export: `${API_BASE_URL}/categories/export`,
    import: `${API_BASE_URL}/categories/import`
  }
}

export { API_BASE_URL };
export const SIMPLE_API_URL = API_BASE_URL;

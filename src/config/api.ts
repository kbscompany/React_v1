// API Configuration
export const API_ENDPOINTS = {
  // Main API (authenticated endpoints)
  MAIN_API: 'http://localhost:8000',
  
  // Simple API (no authentication required)
  SIMPLE_API: 'http://localhost:8000',
  
  // Specific endpoints
  safes: {
    list: 'http://localhost:8000/safes',
    simple: 'http://localhost:8000/safes-simple'
  },
  cheques: {
    unassignedSimple: 'http://localhost:8000/cheques-unassigned-simple',
    createSimple: 'http://localhost:8000/cheques-simple',
    createRangeSimple: 'http://localhost:8000/cheques/create-range-simple'
  },
  bankAccounts: {
    list: 'http://localhost:8000/bank-accounts',
    simple: 'http://localhost:8000/bank-accounts-simple',
    createSimple: 'http://localhost:8000/bank-accounts-simple'
  },
  expenses: {
    list: 'http://localhost:8000/expenses',
    create: 'http://localhost:8000/expenses',
    categories: 'http://localhost:8000/expense-categories'
  },
  // New hierarchical expense category endpoints
  expenseCategories: {
    // Simple endpoints (no authentication)
    simple: 'http://localhost:8000/expense-categories-simple',
    treeSimple: 'http://localhost:8000/expense-categories-tree-simple',
    createSimple: 'http://localhost:8000/expense-categories-simple',
    updateSimple: (id: number) => `http://localhost:8000/expense-categories-simple/${id}`,
    deleteSimple: (id: number) => `http://localhost:8000/expense-categories-simple/${id}`,
    
    // Authenticated endpoints (full features)
    tree: 'http://localhost:8000/categories/tree',
    list: 'http://localhost:8000/categories',
    create: 'http://localhost:8000/categories',
    update: (id: number) => `http://localhost:8000/categories/${id}`,
    delete: (id: number) => `http://localhost:8000/categories/${id}`,
    move: 'http://localhost:8000/categories/move',
    bulkDelete: 'http://localhost:8000/categories/bulk-delete',
    expenses: (id: number) => `http://localhost:8000/categories/${id}/expenses`,
    reassignExpenses: 'http://localhost:8000/expenses/reassign',
    export: 'http://localhost:8000/categories/export',
    import: 'http://localhost:8000/categories/import'
  }
}

export const API_BASE_URL = 'http://localhost:8000';
export const SIMPLE_API_URL = 'http://localhost:8000';

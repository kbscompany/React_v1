import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import { extractResponseData, extractErrorMessage } from '../lib/apiUtils';

// Types
interface ExpenseCategory {
  id: number;
  name: string;
  description?: string;
  parent_id?: number;
  path: string;
  level: number;
  sort_order: number;
  icon?: string;
  color?: string;
  is_active: boolean;
  expense_count: number;
  total_expense_count: number;
  can_delete: boolean;
  full_path: string;
  created_at: string;
  updated_at: string;
  children?: ExpenseCategory[];
}

interface CategoryFormData {
  name: string;
  description: string;
  parent_id: number | null;
  icon: string;
  color: string;
  sort_order: number;
}

const ExpenseCategoryManagement: React.FC = () => {
  // State
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [treeCategories, setTreeCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeView, setActiveView] = useState<'tree' | 'list'>('tree');
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    parent_id: null,
    icon: 'fas fa-folder',
    color: '#007bff',
    sort_order: 0
  });

  // Expanded nodes for tree view
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());

  // New state for searchable dropdown
  const [parentSearch, setParentSearch] = useState('');
  const [showParentDropdown, setShowParentDropdown] = useState(false);
  const parentInputRef = useRef<HTMLInputElement | null>(null);

  // Load data
  useEffect(() => {
    loadCategories();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (parentInputRef.current && !parentInputRef.current.contains(e.target as Node)) {
        setShowParentDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('📂 Loading expense categories...');
      const [flatResponse, treeResponse] = await Promise.all([
        axios.get(API_ENDPOINTS.expenseCategories.simple),
        axios.get(API_ENDPOINTS.expenseCategories.treeSimple)
      ]);
      
      // Use utility functions to extract data safely
      const categoriesData = extractResponseData<ExpenseCategory>(flatResponse.data);
      const treeData = extractResponseData<ExpenseCategory>(treeResponse.data);
      
      console.log('📂 Categories extracted:', categoriesData);
      console.log('🌳 Tree data extracted:', treeData);
      
      setCategories(categoriesData);
      setTreeCategories(treeData);
      
      // Auto-expand root nodes
      const rootIds = treeData.map((cat: ExpenseCategory) => cat.id);
      setExpandedNodes(new Set(rootIds));
      
    } catch (err: any) {
      console.error('❌ Error loading categories:', err);
      const errorMessage = extractErrorMessage(err);
      setError(`Failed to load categories: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Form handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...formData,
        parent_id: formData.parent_id || null
      };

      if (editingCategory) {
        await axios.put(API_ENDPOINTS.expenseCategories.updateSimple(editingCategory.id), payload);
        setSuccess('Category updated successfully!');
      } else {
        await axios.post(API_ENDPOINTS.expenseCategories.createSimple, payload);
        setSuccess('Category created successfully!');
      }

      resetForm();
      await loadCategories();
    } catch (err: any) {
      const errorMessage = extractErrorMessage(err);
      setError(`Failed to save category: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category: ExpenseCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      parent_id: category.parent_id || null,
      icon: category.icon || 'fas fa-folder',
      color: category.color || '#007bff',
      sort_order: category.sort_order
    });
    setShowForm(true);
  };

  const handleDelete = async (category: ExpenseCategory) => {
    if (!category.can_delete) {
      setError('Cannot delete category with expenses or subcategories');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${category.name}"?`)) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await axios.delete(API_ENDPOINTS.expenseCategories.deleteSimple(category.id));
      setSuccess('Category deleted successfully!');
      await loadCategories();
    } catch (err: any) {
      const errorMessage = extractErrorMessage(err);
      setError(`Failed to delete category: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      parent_id: null,
      icon: 'fas fa-folder',
      color: '#007bff',
      sort_order: 0
    });
  };

  // Tree view helpers
  const toggleNode = (nodeId: number) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const renderTreeNode = (category: ExpenseCategory, level: number = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedNodes.has(category.id);
    const indent = level * 20;

    return (
      <div key={category.id} className="tree-node">
        <div 
          className="tree-node-content"
          style={{ 
            paddingLeft: `${indent}px`,
            display: 'flex',
            alignItems: 'center',
            padding: '8px',
            borderBottom: '1px solid #e9ecef',
            backgroundColor: level % 2 === 0 ? '#f8f9fa' : 'white'
          }}
        >
          {/* Expand/Collapse Button */}
          <button
            onClick={() => toggleNode(category.id)}
            style={{
              background: 'none',
              border: 'none',
              cursor: hasChildren ? 'pointer' : 'default',
              marginRight: '8px',
              width: '20px',
              color: hasChildren ? '#007bff' : 'transparent'
            }}
          >
            {hasChildren ? (isExpanded ? '▼' : '▶') : ''}
          </button>

          {/* Icon */}
          <i 
            className={category.icon || 'fas fa-folder'}
            style={{ 
              color: category.color || '#007bff',
              marginRight: '8px',
              width: '16px'
            }}
          ></i>

          {/* Category Info */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontWeight: level === 0 ? 'bold' : 'normal' }}>
              {category.name}
            </span>
            
            {category.description && (
              <span style={{ color: '#6c757d', fontSize: '0.9em' }}>
                - {category.description}
              </span>
            )}

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {/* Expense Count Badge */}
              {category.total_expense_count > 0 && (
                <span style={{
                  background: '#17a2b8',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '12px',
                  fontSize: '0.8em'
                }}>
                  {category.total_expense_count} expenses
                </span>
              )}

              {/* Level Badge */}
              <span style={{
                background: '#6c757d',
                color: 'white',
                padding: '2px 6px',
                borderRadius: '12px',
                fontSize: '0.8em'
              }}>
                L{category.level}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => handleEdit(category)}
              style={{
                background: '#ffc107',
                color: 'white',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.8em'
              }}
            >
              Edit
            </button>
            
            {category.can_delete && (
              <button
                onClick={() => handleDelete(category)}
                style={{
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.8em'
                }}
              >
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="tree-children">
            {category.children!.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderListView = () => (
    <div className="list-view">
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Name</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Path</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Level</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Expenses</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(category => (
              <tr key={category.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i 
                      className={category.icon || 'fas fa-folder'}
                      style={{ color: category.color || '#007bff' }}
                    ></i>
                    <span>{category.name}</span>
                  </div>
                </td>
                <td style={{ padding: '12px', color: '#6c757d' }}>{category.full_path}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    background: '#6c757d',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '12px',
                    fontSize: '0.8em'
                  }}>
                    {category.level}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  {category.total_expense_count > 0 ? (
                    <span style={{
                      background: '#17a2b8',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '12px',
                      fontSize: '0.8em'
                    }}>
                      {category.total_expense_count}
                    </span>
                  ) : (
                    <span style={{ color: '#6c757d' }}>0</span>
                  )}
                </td>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => handleEdit(category)}
                      style={{
                        background: '#ffc107',
                        color: 'white',
                        border: 'none',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.8em'
                      }}
                    >
                      Edit
                    </button>
                    
                    {category.can_delete && (
                      <button
                        onClick={() => handleDelete(category)}
                        style={{
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8em'
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Icon options
  const iconOptions = [
    'fas fa-folder', 'fas fa-building', 'fas fa-laptop', 'fas fa-cogs',
    'fas fa-bullhorn', 'fas fa-plane', 'fas fa-home', 'fas fa-paperclip',
    'fas fa-plug', 'fas fa-desktop', 'fas fa-chair', 'fas fa-code',
    'fas fa-car', 'fas fa-utensils', 'fas fa-phone', 'fas fa-envelope'
  ];

  // Color options
  const colorOptions = [
    '#007bff', '#28a745', '#dc3545', '#ffc107', '#17a2b8', '#6610f2',
    '#e83e8c', '#fd7e14', '#20c997', '#6f42c1', '#495057', '#343a40'
  ];

  // New state for searchable dropdown
  const availableParentCategories = categories.filter(cat => !editingCategory || cat.id !== editingCategory.id);
  const filteredParentCategories = availableParentCategories.filter(cat => {
    const label = cat.full_path || cat.name;
    return label.toLowerCase().includes(parentSearch.toLowerCase());
  });

  // Compute display value for parent input
  const displayParentValue = showParentDropdown
    ? parentSearch
    : (formData.parent_id
        ? (availableParentCategories.find(c => c.id === formData.parent_id)?.full_path || availableParentCategories.find(c => c.id === formData.parent_id)?.name || '')
        : '');

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px',
        paddingBottom: '20px',
        borderBottom: '2px solid #e9ecef'
      }}>
        <h2 style={{ margin: 0, color: '#495057' }}>
          <i className="fas fa-sitemap" style={{ marginRight: '8px', color: '#007bff' }}></i>
          Expense Categories
        </h2>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* View Toggle */}
          <div style={{ display: 'flex', border: '1px solid #dee2e6', borderRadius: '4px' }}>
            <button
              onClick={() => setActiveView('tree')}
              style={{
                padding: '8px 16px',
                background: activeView === 'tree' ? '#007bff' : 'white',
                color: activeView === 'tree' ? 'white' : '#495057',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '4px 0 0 4px'
              }}
            >
              <i className="fas fa-sitemap"></i> Tree
            </button>
            <button
              onClick={() => setActiveView('list')}
              style={{
                padding: '8px 16px',
                background: activeView === 'list' ? '#007bff' : 'white',
                color: activeView === 'list' ? 'white' : '#495057',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '0 4px 4px 0'
              }}
            >
              <i className="fas fa-list"></i> List
            </button>
          </div>

          {/* Add Category Button */}
          <button
            onClick={() => setShowForm(true)}
            style={{
              padding: '8px 16px',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <i className="fas fa-plus"></i>
            Add Category
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div style={{
          background: '#f8d7da',
          color: '#721c24',
          padding: '12px',
          borderRadius: '4px',
          marginBottom: '20px',
          border: '1px solid #f5c6cb'
        }}>
          <i className="fas fa-exclamation-triangle" style={{ marginRight: '8px' }}></i>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          background: '#d4edda',
          color: '#155724',
          padding: '12px',
          borderRadius: '4px',
          marginBottom: '20px',
          border: '1px solid #c3e6cb'
        }}>
          <i className="fas fa-check-circle" style={{ marginRight: '8px' }}></i>
          {success}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', marginBottom: '8px' }}></i>
          <div>Loading categories...</div>
        </div>
      )}

      {/* Main Content */}
      {!loading && (
        <div style={{
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          {activeView === 'tree' ? (
            <div className="tree-view">
              {treeCategories.length > 0 ? (
                treeCategories.map(category => renderTreeNode(category))
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
                  <i className="fas fa-folder-open" style={{ fontSize: '48px', marginBottom: '16px' }}></i>
                  <div>No categories found. Create your first category to get started!</div>
                </div>
              )}
            </div>
          ) : (
            renderListView()
          )}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '24px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ margin: '0 0 20px', color: '#495057' }}>
              {editingCategory ? 'Edit Category' : 'Create Category'}
            </h3>

            <form onSubmit={handleSubmit}>
              {/* Name */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px'
                  }}
                />
              </div>

              {/* Description */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Parent Category (searchable) */}
              <div style={{ marginBottom: '16px', position: 'relative' }} ref={parentInputRef as any}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  Parent Category
                </label>
                <input
                  type="text"
                  value={displayParentValue}
                  placeholder="Root Level"
                  onFocus={() => setShowParentDropdown(true)}
                  onChange={(e) => {
                    setParentSearch(e.target.value);
                    setShowParentDropdown(true);
                    // If user clears input, reset parent_id
                    if (!e.target.value) {
                      setFormData({ ...formData, parent_id: null });
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px'
                  }}
                />
                {showParentDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    maxHeight: '200px',
                    overflowY: 'auto',
                    background: '#fff',
                    border: '1px solid #ced4da',
                    borderTop: 'none',
                    zIndex: 1001
                  }}>
                    <div
                      onClick={() => {
                        setFormData({ ...formData, parent_id: null });
                        setParentSearch('');
                        setShowParentDropdown(false);
                      }}
                      style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #e9ecef' }}
                    >
                      Root Level
                    </div>
                    {filteredParentCategories.map(cat => (
                      <div
                        key={cat.id}
                        onClick={() => {
                          setFormData({ ...formData, parent_id: cat.id });
                          setParentSearch('');
                          setShowParentDropdown(false);
                        }}
                        style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #e9ecef' }}
                      >
                        {cat.full_path || cat.name}
                      </div>
                    ))}
                    {filteredParentCategories.length === 0 && (
                      <div style={{ padding: '8px', color: '#6c757d' }}>No matches</div>
                    )}
                  </div>
                )}
              </div>

              {/* Icon */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  Icon
                </label>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(8, 1fr)', 
                  gap: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  padding: '8px'
                }}>
                  {iconOptions.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon })}
                      style={{
                        padding: '8px',
                        border: formData.icon === icon ? '2px solid #007bff' : '1px solid #dee2e6',
                        borderRadius: '4px',
                        background: formData.icon === icon ? '#e7f3ff' : 'white',
                        cursor: 'pointer'
                      }}
                    >
                      <i className={icon}></i>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  Color
                </label>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(6, 1fr)', 
                  gap: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  padding: '8px'
                }}>
                  {colorOptions.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      style={{
                        width: '40px',
                        height: '40px',
                        border: formData.color === color ? '3px solid #000' : '1px solid #dee2e6',
                        borderRadius: '4px',
                        background: color,
                        cursor: 'pointer'
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Sort Order */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  Sort Order
                </label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px'
                  }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    padding: '8px 16px',
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '8px 16px',
                    background: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {loading ? 'Saving...' : (editingCategory ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseCategoryManagement; 
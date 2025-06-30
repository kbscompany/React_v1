import React, { useState, useEffect } from 'react'
import axios from 'axios'

function IngredientManagement() {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    unit: '',
    category_id: '',
    price_per_unit: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [itemsRes, categoriesRes] = await Promise.all([
        axios.get('/items-simple'),
        axios.get('/categories-simple')
      ])
      setItems(itemsRes.data)
      setCategories(categoriesRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const data = {
        ...formData,
        price_per_unit: formData.price_per_unit ? parseFloat(formData.price_per_unit) : null,
        category_id: formData.category_id ? parseInt(formData.category_id) : null
      }

      if (editingItem) {
        await axios.put(`/items/${editingItem.id}`, data)
      } else {
        await axios.post('/items', data)
      }
      
      await fetchData()
      resetForm()
    } catch (error) {
      console.error('Error saving item:', error)
      alert('Error saving item. Please try again.')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return
    
    try {
      await axios.delete(`/items/${id}`)
      await fetchData()
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Error deleting item. Please try again.')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      unit: '',
      category_id: '',
      price_per_unit: ''
    })
    setShowAddForm(false)
    setEditingItem(null)
  }

  const startEdit = (item) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      unit: item.unit || '',
      category_id: item.category_id || '',
      price_per_unit: item.price_per_unit || ''
    })
    setShowAddForm(true)
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <h3 style={{ margin: 0 }}>Ingredient Management</h3>
        <button
          onClick={() => setShowAddForm(true)}
          style={{
            padding: '0.5rem 1rem',
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Add New Item
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div style={{
          background: '#f8f9fa',
          padding: '1.5rem',
          borderRadius: '8px',
          marginBottom: '2rem',
          border: '1px solid #dee2e6'
        }}>
          <h4>{editingItem ? 'Edit Item' : 'Add New Item'}</h4>
          <form onSubmit={handleSubmit}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ced4da',
                    borderRadius: '4px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Unit
                </label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  placeholder="kg, L, pieces, etc."
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ced4da',
                    borderRadius: '4px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Category
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ced4da',
                    borderRadius: '4px'
                  }}
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Price per Unit
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price_per_unit}
                  onChange={(e) => setFormData({...formData, price_per_unit: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ced4da',
                    borderRadius: '4px'
                  }}
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="submit"
                style={{
                  padding: '0.5rem 1rem',
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {editingItem ? 'Update' : 'Add'} Item
              </button>
              <button
                type="button"
                onClick={resetForm}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Items List */}
      <div>
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
            No items found. Add some items to get started.
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gap: '1rem'
          }}>
            {items.map(item => (
              <div
                key={item.id}
                style={{
                  background: 'white',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid #dee2e6',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <h5 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>
                    {item.name}
                  </h5>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    Unit: {item.unit || 'N/A'} | 
                    Category: {item.category?.name || 'Uncategorized'} | 
                    Price: ${item.price_per_unit || 'N/A'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => startEdit(item)}
                    style={{
                      padding: '0.25rem 0.5rem',
                      background: '#ffc107',
                      color: '#212529',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    style={{
                      padding: '0.25rem 0.5rem',
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default IngredientManagement 
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

const InventoryManagement = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('items');
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [subRecipes, setSubRecipes] = useState([]);
  const [midPrepRecipes, setMidPrepRecipes] = useState([]);
  const [cakes, setCakes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  // Item form state
  const [itemForm, setItemForm] = useState({
    name: '',
    base_unit: '',
    base_price: 0,
    category_id: '',
    packages: []
  });

  // Sub-recipe form state
  const [subRecipeForm, setSubRecipeForm] = useState({
    name: '',
    ingredients: [],
    sub_recipes: []
  });

  // Cake form state
  const [cakeForm, setCakeForm] = useState({
    name: '',
    percent_yield: 100,
    ingredients: [],
    sub_recipes: [],
    mid_preps: []
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [categoriesRes, itemsRes, subRecipesRes, midPrepRes, cakesRes] = await Promise.all([
        axios.get('http://localhost:8000/categories-simple'),
        axios.get('http://localhost:8000/items-simple'),
        axios.get('http://localhost:8000/sub-recipes-simple'),
        axios.get('http://localhost:8000/mid-prep-recipes-simple'),
        axios.get('http://localhost:8000/cakes-simple')
      ]);

      setCategories(categoriesRes.data);
      setItems(itemsRes.data);
      setSubRecipes(subRecipesRes.data);
      setMidPrepRecipes(midPrepRes.data);
      setCakes(cakesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      showMessage(t('inventory.messages.errorLoadingData'), 'error');
    }
  };

  const showMessage = (text, type) => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  // Item Management Functions
  const addPackage = () => {
    setItemForm({
      ...itemForm,
      packages: [...itemForm.packages, {
        name: '',
        quantity: 1,
        unit: '',
        price: 0,
        weight: 1,
        is_default: false
      }]
    });
  };

  const updatePackage = (index, field, value) => {
    const updatedPackages = [...itemForm.packages];
    updatedPackages[index][field] = value;
    
    // Auto-calculate price if not manually set
    if (field === 'quantity' || field === 'weight') {
      const pkg = updatedPackages[index];
      if (itemForm.base_price > 0 && pkg.quantity > 0 && pkg.weight > 0) {
        updatedPackages[index].price = itemForm.base_price * pkg.quantity * pkg.weight;
      }
    }
    
    setItemForm({ ...itemForm, packages: updatedPackages });
  };

  const removePackage = (index) => {
    const updatedPackages = itemForm.packages.filter((_, i) => i !== index);
    setItemForm({ ...itemForm, packages: updatedPackages });
  };

  const submitItem = async () => {
    if (!itemForm.name || !itemForm.base_unit) {
      showMessage(t('inventory.validation.itemNameAndUnit'), 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/items-simple', itemForm);
      showMessage(response.data.message, 'success');
      setItemForm({
        name: '',
        base_unit: '',
        base_price: 0,
        category_id: '',
        packages: []
      });
      loadData();
    } catch (error) {
      showMessage(error.response?.data?.detail || t('inventory.messages.errorCreatingItem'), 'error');
    } finally {
      setLoading(false);
    }
  };

  // Sub-recipe Management Functions
  const addIngredientToSubRecipe = () => {
    setSubRecipeForm({
      ...subRecipeForm,
      ingredients: [...subRecipeForm.ingredients, { id: '', quantity: 0 }]
    });
  };

  const addSubRecipeToSubRecipe = () => {
    setSubRecipeForm({
      ...subRecipeForm,
      sub_recipes: [...subRecipeForm.sub_recipes, { id: '', quantity: 0 }]
    });
  };

  const updateSubRecipeIngredient = (index, field, value) => {
    const updated = [...subRecipeForm.ingredients];
    updated[index][field] = value;
    setSubRecipeForm({ ...subRecipeForm, ingredients: updated });
  };

  const updateSubRecipeSubRecipe = (index, field, value) => {
    const updated = [...subRecipeForm.sub_recipes];
    updated[index][field] = value;
    setSubRecipeForm({ ...subRecipeForm, sub_recipes: updated });
  };

  const submitSubRecipe = async () => {
    if (!subRecipeForm.name) {
      showMessage(t('inventory.validation.subRecipeName'), 'error');
      return;
    }

    if (subRecipeForm.ingredients.length === 0 && subRecipeForm.sub_recipes.length === 0) {
      showMessage(t('inventory.validation.subRecipeIngredients'), 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/sub-recipes-simple', subRecipeForm);
      showMessage(response.data.message, 'success');
      setSubRecipeForm({
        name: '',
        ingredients: [],
        sub_recipes: []
      });
      loadData();
    } catch (error) {
      showMessage(error.response?.data?.detail || t('inventory.messages.errorCreatingSubRecipe'), 'error');
    } finally {
      setLoading(false);
    }
  };

  // Cake Management Functions
  const addIngredientToCake = () => {
    setCakeForm({
      ...cakeForm,
      ingredients: [...cakeForm.ingredients, { id: '', quantity: 0 }]
    });
  };

  const addSubRecipeToCake = () => {
    setCakeForm({
      ...cakeForm,
      sub_recipes: [...cakeForm.sub_recipes, { id: '', quantity: 0 }]
    });
  };

  const addMidPrepToCake = () => {
    setCakeForm({
      ...cakeForm,
      mid_preps: [...cakeForm.mid_preps, { id: '', quantity: 0 }]
    });
  };

  const updateCakeIngredient = (index, field, value) => {
    const updated = [...cakeForm.ingredients];
    updated[index][field] = value;
    setCakeForm({ ...cakeForm, ingredients: updated });
  };

  const updateCakeSubRecipe = (index, field, value) => {
    const updated = [...cakeForm.sub_recipes];
    updated[index][field] = value;
    setCakeForm({ ...cakeForm, sub_recipes: updated });
  };

  const updateCakeMidPrep = (index, field, value) => {
    const updated = [...cakeForm.mid_preps];
    updated[index][field] = value;
    setCakeForm({ ...cakeForm, mid_preps: updated });
  };

  const submitCake = async () => {
    if (!cakeForm.name) {
      showMessage(t('inventory.validation.cakeName'), 'error');
      return;
    }

    if (cakeForm.ingredients.length === 0 && cakeForm.sub_recipes.length === 0 && cakeForm.mid_preps.length === 0) {
      showMessage(t('inventory.validation.cakeIngredients'), 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/cakes-simple', cakeForm);
      showMessage(response.data.message, 'success');
      setCakeForm({
        name: '',
        percent_yield: 100,
        ingredients: [],
        sub_recipes: [],
        mid_preps: []
      });
      loadData();
    } catch (error) {
      showMessage(error.response?.data?.detail || t('inventory.messages.errorCreatingCake'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', 
        color: 'white', 
        padding: '20px', 
        borderRadius: '10px', 
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '28px' }}>{t('inventory.title')}</h1>
        <p style={{ margin: 0, opacity: 0.9 }}>{t('inventory.subtitle')}</p>
      </div>

      {/* Message Display */}
      {message && (
        <div style={{
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          backgroundColor: messageType === 'success' ? '#dcfce7' : '#fef2f2',
          color: messageType === 'success' ? '#166534' : '#dc2626',
          border: `1px solid ${messageType === 'success' ? '#bbf7d0' : '#fecaca'}`
        }}>
          {message}
        </div>
      )}

      {/* Tabs */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
          {[
            { id: 'items', label: t('inventory.tabs.items'), icon: '📦' },
            { id: 'sub-recipes', label: t('inventory.tabs.subRecipes'), icon: '🧪' },
            { id: 'cakes', label: t('inventory.tabs.cakes'), icon: '🎂' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 24px',
                background: activeTab === tab.id ? '#4f46e5' : 'transparent',
                color: activeTab === tab.id ? 'white' : '#6b7280',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                borderRadius: '8px 8px 0 0'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        
        {/* Add Items Tab */}
        {activeTab === 'items' && (
          <div>
            <h2 style={{ margin: '0 0 20px 0', color: '#1f2937' }}>{t('inventory.addItem.title')}</h2>
            
            {/* Basic Information */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>{t('inventory.addItem.name')} *</label>
                <input
                  type="text"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px'
                  }}
                  placeholder={t('inventory.addItem.namePlaceholder')}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>{t('inventory.addItem.baseUnit')} *</label>
                <input
                  type="text"
                  value={itemForm.base_unit}
                  onChange={(e) => setItemForm({ ...itemForm, base_unit: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px'
                  }}
                  placeholder={t('inventory.addItem.baseUnitPlaceholder')}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>{t('inventory.addItem.pricePerUnit')}</label>
                <input
                  type="number"
                  step="0.00001"
                  value={itemForm.base_price}
                  onChange={(e) => setItemForm({ ...itemForm, base_price: parseFloat(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>{t('inventory.addItem.category')}</label>
                <select
                  value={itemForm.category_id}
                  onChange={(e) => setItemForm({ ...itemForm, category_id: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px'
                  }}
                >
                  <option value="">{t('inventory.addItem.noCategory')}</option>
                  <option value="default">{t('inventory.addItem.defaultCategory')}</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Packaging Options */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#374151' }}>{t('inventory.packaging.title')}</h3>
              <button
                onClick={addPackage}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  marginBottom: '15px'
                }}
              >
                {t('inventory.packaging.addPackage')}
              </button>

              {itemForm.packages.map((pkg, index) => (
                <div key={index} style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '15px',
                  marginBottom: '10px',
                  backgroundColor: '#f9fafb'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>{t('inventory.packaging.packageName')}</label>
                      <input
                        type="text"
                        value={pkg.name}
                        onChange={(e) => updatePackage(index, 'name', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px'
                        }}
                        placeholder={t('inventory.packaging.packageNamePlaceholder')}
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>{t('inventory.packaging.quantity')}</label>
                      <input
                        type="number"
                        value={pkg.quantity}
                        onChange={(e) => updatePackage(index, 'quantity', parseFloat(e.target.value) || 1)}
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px'
                        }}
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>{t('inventory.packaging.unit')}</label>
                      <input
                        type="text"
                        value={pkg.unit}
                        onChange={(e) => updatePackage(index, 'unit', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px'
                        }}
                        placeholder={t('inventory.packaging.unitPlaceholder')}
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>{t('inventory.packaging.weightPerItem')}</label>
                      <input
                        type="number"
                        step="0.001"
                        value={pkg.weight}
                        onChange={(e) => updatePackage(index, 'weight', parseFloat(e.target.value) || 1)}
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px'
                        }}
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>{t('inventory.packaging.price')}</label>
                      <input
                        type="number"
                        step="0.01"
                        value={pkg.price}
                        onChange={(e) => updatePackage(index, 'price', parseFloat(e.target.value) || 0)}
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px'
                        }}
                      />
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <input
                          type="checkbox"
                          checked={pkg.is_default}
                          onChange={(e) => updatePackage(index, 'is_default', e.target.checked)}
                        />
                        {t('inventory.packaging.default')}
                      </label>
                      <button
                        onClick={() => removePackage(index)}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        {t('inventory.packaging.remove')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={submitItem}
              disabled={loading}
              style={{
                padding: '12px 24px',
                backgroundColor: loading ? '#9ca3af' : '#4f46e5',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              {loading ? t('inventory.buttons.adding') : t('inventory.buttons.addItem')}
            </button>
          </div>
        )}

        {/* Add Sub-Recipes Tab */}
        {activeTab === 'sub-recipes' && (
          <div>
            <h2 style={{ margin: '0 0 20px 0', color: '#1f2937' }}>{t('inventory.subRecipe.title')}</h2>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>{t('inventory.subRecipe.name')} *</label>
              <input
                type="text"
                value={subRecipeForm.name}
                onChange={(e) => setSubRecipeForm({ ...subRecipeForm, name: e.target.value })}
                style={{
                  width: '100%',
                  maxWidth: '400px',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px'
                }}
                placeholder={t('inventory.subRecipe.namePlaceholder')}
              />
            </div>

            {/* Ingredients Section */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#374151' }}>{t('inventory.subRecipe.ingredients')}</h3>
              <button
                onClick={addIngredientToSubRecipe}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  marginBottom: '15px'
                }}
              >
                {t('inventory.subRecipe.addIngredient')}
              </button>

              {subRecipeForm.ingredients.map((ingredient, index) => (
                <div key={index} style={{
                  display: 'flex',
                  gap: '10px',
                  marginBottom: '10px',
                  alignItems: 'center'
                }}>
                  <select
                    value={ingredient.id}
                    onChange={(e) => updateSubRecipeIngredient(index, 'id', parseInt(e.target.value))}
                    style={{
                      flex: 1,
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px'
                    }}
                  >
                    <option value="">{t('inventory.subRecipe.selectIngredient')}</option>
                    {items.map(item => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                  
                  <input
                    type="number"
                    step="0.001"
                    value={ingredient.quantity}
                    onChange={(e) => updateSubRecipeIngredient(index, 'quantity', parseFloat(e.target.value) || 0)}
                    style={{
                      width: '120px',
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px'
                    }}
                    placeholder={t('inventory.subRecipe.quantity')}
                  />
                  
                  <button
                    onClick={() => {
                      const updated = subRecipeForm.ingredients.filter((_, i) => i !== index);
                      setSubRecipeForm({ ...subRecipeForm, ingredients: updated });
                    }}
                    style={{
                      padding: '8px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {t('inventory.subRecipe.remove')}
                  </button>
                </div>
              ))}
            </div>

            {/* Sub-Recipes Section */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#374151' }}>{t('inventory.subRecipe.nestedSubRecipes')}</h3>
              <button
                onClick={addSubRecipeToSubRecipe}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  marginBottom: '15px'
                }}
              >
                {t('inventory.subRecipe.addSubRecipe')}
              </button>

              {subRecipeForm.sub_recipes.map((subRecipe, index) => (
                <div key={index} style={{
                  display: 'flex',
                  gap: '10px',
                  marginBottom: '10px',
                  alignItems: 'center'
                }}>
                  <select
                    value={subRecipe.id}
                    onChange={(e) => updateSubRecipeSubRecipe(index, 'id', parseInt(e.target.value))}
                    style={{
                      flex: 1,
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px'
                    }}
                  >
                    <option value="">{t('inventory.subRecipe.selectSubRecipe')}</option>
                    {subRecipes.filter(sr => sr.name !== subRecipeForm.name).map(sr => (
                      <option key={sr.id} value={sr.id}>{sr.name}</option>
                    ))}
                  </select>
                  
                  <input
                    type="number"
                    step="0.001"
                    value={subRecipe.quantity}
                    onChange={(e) => updateSubRecipeSubRecipe(index, 'quantity', parseFloat(e.target.value) || 0)}
                    style={{
                      width: '120px',
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px'
                    }}
                    placeholder={t('inventory.subRecipe.quantity')}
                  />
                  
                  <button
                    onClick={() => {
                      const updated = subRecipeForm.sub_recipes.filter((_, i) => i !== index);
                      setSubRecipeForm({ ...subRecipeForm, sub_recipes: updated });
                    }}
                    style={{
                      padding: '8px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {t('inventory.subRecipe.remove')}
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={submitSubRecipe}
              disabled={loading}
              style={{
                padding: '12px 24px',
                backgroundColor: loading ? '#9ca3af' : '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              {loading ? t('inventory.buttons.adding') : t('inventory.buttons.saveSubRecipe')}
            </button>
          </div>
        )}

        {/* Add Cakes Tab */}
        {activeTab === 'cakes' && (
          <div>
            <h2 style={{ margin: '0 0 20px 0', color: '#1f2937' }}>{t('inventory.cake.title')}</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>{t('inventory.cake.name')} *</label>
                <input
                  type="text"
                  value={cakeForm.name}
                  onChange={(e) => setCakeForm({ ...cakeForm, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px'
                  }}
                  placeholder={t('inventory.cake.namePlaceholder')}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>{t('inventory.cake.percentYield')}</label>
                <input
                  type="number"
                  step="0.01"
                  value={cakeForm.percent_yield}
                  onChange={(e) => setCakeForm({ ...cakeForm, percent_yield: parseFloat(e.target.value) || 100 })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px'
                  }}
                />
              </div>
            </div>

            {/* Ingredients Section */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#374151' }}>{t('inventory.cake.ingredients')}</h3>
              <button
                onClick={addIngredientToCake}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  marginBottom: '15px'
                }}
              >
                {t('inventory.cake.addIngredient')}
              </button>

              {cakeForm.ingredients.map((ingredient, index) => (
                <div key={index} style={{
                  display: 'flex',
                  gap: '10px',
                  marginBottom: '10px',
                  alignItems: 'center'
                }}>
                  <select
                    value={ingredient.id}
                    onChange={(e) => updateCakeIngredient(index, 'id', parseInt(e.target.value))}
                    style={{
                      flex: 1,
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px'
                    }}
                  >
                    <option value="">{t('inventory.cake.selectIngredient')}</option>
                    {items.map(item => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                  
                  <input
                    type="number"
                    step="0.00001"
                    value={ingredient.quantity}
                    onChange={(e) => updateCakeIngredient(index, 'quantity', parseFloat(e.target.value) || 0)}
                    style={{
                      width: '120px',
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px'
                    }}
                    placeholder={t('inventory.cake.quantity')}
                  />
                  
                  <button
                    onClick={() => {
                      const updated = cakeForm.ingredients.filter((_, i) => i !== index);
                      setCakeForm({ ...cakeForm, ingredients: updated });
                    }}
                    style={{
                      padding: '8px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {t('inventory.cake.remove')}
                  </button>
                </div>
              ))}
            </div>

            {/* Sub-Recipes Section */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#374151' }}>{t('inventory.cake.subRecipes')}</h3>
              <button
                onClick={addSubRecipeToCake}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  marginBottom: '15px'
                }}
              >
                {t('inventory.cake.addSubRecipe')}
              </button>

              {cakeForm.sub_recipes.map((subRecipe, index) => (
                <div key={index} style={{
                  display: 'flex',
                  gap: '10px',
                  marginBottom: '10px',
                  alignItems: 'center'
                }}>
                  <select
                    value={subRecipe.id}
                    onChange={(e) => updateCakeSubRecipe(index, 'id', parseInt(e.target.value))}
                    style={{
                      flex: 1,
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px'
                    }}
                  >
                    <option value="">{t('inventory.cake.selectSubRecipe')}</option>
                    {subRecipes.map(sr => (
                      <option key={sr.id} value={sr.id}>{sr.name}</option>
                    ))}
                  </select>
                  
                  <input
                    type="number"
                    step="0.00001"
                    value={subRecipe.quantity}
                    onChange={(e) => updateCakeSubRecipe(index, 'quantity', parseFloat(e.target.value) || 0)}
                    style={{
                      width: '120px',
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px'
                    }}
                    placeholder={t('inventory.cake.quantity')}
                  />
                  
                  <button
                    onClick={() => {
                      const updated = cakeForm.sub_recipes.filter((_, i) => i !== index);
                      setCakeForm({ ...cakeForm, sub_recipes: updated });
                    }}
                    style={{
                      padding: '8px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {t('inventory.cake.remove')}
                  </button>
                </div>
              ))}
            </div>

            {/* Mid-Prep Section */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#374151' }}>{t('inventory.cake.midPreps')}</h3>
              <button
                onClick={addMidPrepToCake}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  marginBottom: '15px'
                }}
              >
                {t('inventory.cake.addMidPrep')}
              </button>

              {cakeForm.mid_preps.map((midPrep, index) => (
                <div key={index} style={{
                  display: 'flex',
                  gap: '10px',
                  marginBottom: '10px',
                  alignItems: 'center'
                }}>
                  <select
                    value={midPrep.id}
                    onChange={(e) => updateCakeMidPrep(index, 'id', parseInt(e.target.value))}
                    style={{
                      flex: 1,
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px'
                    }}
                  >
                    <option value="">{t('inventory.cake.selectMidPrep')}</option>
                    {midPrepRecipes.map(mp => (
                      <option key={mp.id} value={mp.id}>{mp.name}</option>
                    ))}
                  </select>
                  
                  <input
                    type="number"
                    step="0.00001"
                    value={midPrep.quantity}
                    onChange={(e) => updateCakeMidPrep(index, 'quantity', parseFloat(e.target.value) || 0)}
                    style={{
                      width: '120px',
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px'
                    }}
                    placeholder={t('inventory.cake.quantity')}
                  />
                  
                  <button
                    onClick={() => {
                      const updated = cakeForm.mid_preps.filter((_, i) => i !== index);
                      setCakeForm({ ...cakeForm, mid_preps: updated });
                    }}
                    style={{
                      padding: '8px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {t('inventory.cake.remove')}
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={submitCake}
              disabled={loading}
              style={{
                padding: '12px 24px',
                backgroundColor: loading ? '#9ca3af' : '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              {loading ? t('inventory.buttons.adding') : t('inventory.buttons.saveCake')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryManagement; 

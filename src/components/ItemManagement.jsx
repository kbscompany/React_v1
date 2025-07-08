import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const ItemManagement = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('items');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subRecipes, setSubRecipes] = useState([]);
  const [midPrepRecipes, setMidPrepRecipes] = useState([]);
  const [cakes, setCakes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [statistics, setStatistics] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPackages, setShowPackages] = useState({});
  const [newPackage, setNewPackage] = useState({});
  
  // Search states for different recipe tabs
  const [subRecipeSearch, setSubRecipeSearch] = useState('');
  const [midPrepSearch, setMidPrepSearch] = useState('');
  const [cakeSearch, setCakeSearch] = useState('');
  
  // Create modals state
  const [showCreateSubRecipe, setShowCreateSubRecipe] = useState(false);
  const [showCreateMidPrep, setShowCreateMidPrep] = useState(false);
  const [showCreateCake, setShowCreateCake] = useState(false);

  // Create forms state
  const [newSubRecipe, setNewSubRecipe] = useState({
    name: '',
    ingredients: [],
    sub_recipes: []
  });
  const [newMidPrep, setNewMidPrep] = useState({
    name: '',
    ingredients: [],
    sub_recipes: []
  });
  const [newCake, setNewCake] = useState({
    name: '',
    percent_yield: 100,
    ingredients: [],
    sub_recipes: [],
    mid_preps: []
  });

  // Live cost calculation states
  const [subRecipeLiveCost, setSubRecipeLiveCost] = useState(0);
  const [midPrepLiveCost, setMidPrepLiveCost] = useState(0);
  const [cakeLiveCost, setCakeLiveCost] = useState(0);

  // Search states for edit modal dropdowns
  const [editIngredientSearch, setEditIngredientSearch] = useState('');
  const [editSubRecipeSearch, setEditSubRecipeSearch] = useState('');
  const [editMidPrepSearch, setEditMidPrepSearch] = useState('');

  // NEW: Edit modal states
  const [showEditCake, setShowEditCake] = useState(false);
  const [showEditSubRecipe, setShowEditSubRecipe] = useState(false);
  const [showEditMidPrep, setShowEditMidPrep] = useState(false);
  const [editingCake, setEditingCake] = useState(null);
  const [editingSubRecipe, setEditingSubRecipe] = useState(null);
  const [editingMidPrep, setEditingMidPrep] = useState(null);
  
  // NEW: Available data for editing dropdowns
  const [availableIngredients, setAvailableIngredients] = useState([]);
  const [availableSubRecipes, setAvailableSubRecipes] = useState([]);
  const [availableMidPreps, setAvailableMidPreps] = useState([]);

  const API_BASE = 'http://100.29.4.72:8000';

  useEffect(() => {
    loadCategories();
    if (activeTab === 'items') {
      loadItems();
      loadStatistics();
    } else if (activeTab === 'sub-recipes') {
      loadSubRecipes();
    } else if (activeTab === 'mid-prep') {
      loadMidPrepRecipes();
    } else if (activeTab === 'cakes') {
      loadCakes();
    }
  }, [activeTab, currentPage, searchTerm, selectedCategory]);

  // NEW: Load available data for editing
  const loadAvailableDataForEditing = async () => {
    try {
      console.log('🔄 Loading data for editing...');
      const [ingredientsRes, subRecipesRes, midPrepsRes] = await Promise.all([
        fetch(`${API_BASE}/ingredients-for-editing`),
        fetch(`${API_BASE}/sub-recipes-for-editing`),
        fetch(`${API_BASE}/mid-preps-for-editing`)
      ]);

      if (ingredientsRes.ok) {
        const ingredientsResponse = await ingredientsRes.json();
        const ingredients = ingredientsResponse.data || ingredientsResponse; // Handle both formats
        console.log('✅ Loaded ingredients:', ingredients.length, 'items');
        console.log('🧪 First ingredient:', ingredients[0]?.name || 'None');
        setAvailableIngredients(ingredients);
      } else {
        console.error('❌ Failed to load ingredients:', ingredientsRes.status);
      }
      
      if (subRecipesRes.ok) {
        const subRecipesResponse = await subRecipesRes.json();
        const subRecipes = subRecipesResponse.data || subRecipesResponse; // Handle both formats
        console.log('✅ Loaded sub-recipes:', subRecipes.length, 'items');
        console.log('🧪 First sub-recipe:', subRecipes[0]?.name || 'None');
        setAvailableSubRecipes(subRecipes);
      } else {
        console.error('❌ Failed to load sub-recipes:', subRecipesRes.status);
      }
      
      if (midPrepsRes.ok) {
        const midPrepsResponse = await midPrepsRes.json();
        const midPreps = midPrepsResponse.data || midPrepsResponse; // Handle both formats
        console.log('✅ Loaded mid-preps:', midPreps.length, 'items');
        console.log('🧪 First mid-prep:', midPreps[0]?.name || 'None');
        setAvailableMidPreps(midPreps);
      } else {
        console.error('❌ Failed to load mid-preps:', midPrepsRes.status);
      }
      
      console.log('🎉 Finished loading all data for editing');
    } catch (err) {
      console.error('Error loading available data for editing:', err);
    }
  };

  // NEW: Enhanced update functions
  const updateCakeEnhanced = async (cakeId, cakeData) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/cakes-manage/${cakeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cakeData)
      });
      
      if (response.ok) {
        setSuccess('Cake updated successfully!');
        setShowEditCake(false);
        setEditingCake(null);
        loadCakes();
      } else {
        const error = await response.json();
        setError(error.detail || 'Error updating cake');
      }
    } catch (err) {
      setError('Error updating cake: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateSubRecipeEnhanced = async (subRecipeId, subRecipeData) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/sub-recipes-manage/${subRecipeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subRecipeData)
      });
      
      if (response.ok) {
        setSuccess('Sub-recipe updated successfully!');
        setShowEditSubRecipe(false);
        setEditingSubRecipe(null);
        loadSubRecipes();
      } else {
        const error = await response.json();
        setError(error.detail || 'Error updating sub-recipe');
      }
    } catch (err) {
      setError('Error updating sub-recipe: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateMidPrepEnhanced = async (midPrepId, midPrepData) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/mid-prep-recipes-manage/${midPrepId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(midPrepData)
      });
      
      if (response.ok) {
        setSuccess('Mid-prep recipe updated successfully!');
        setShowEditMidPrep(false);
        setEditingMidPrep(null);
        loadMidPrepRecipes();
      } else {
        const error = await response.json();
        setError(error.detail || 'Error updating mid-prep recipe');
      }
    } catch (err) {
      setError('Error updating mid-prep recipe: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // NEW: Open edit modals
  const openEditCake = async (cake) => {
    setLoading(true);
    setEditingCake({
      id: cake.id,
      name: cake.name || '',
      percent_yield: cake.percent_yield || 100,
      ingredients: cake.ingredients ? cake.ingredients.map(ing => ({
        id: ing.ingredient_id || ing.id,
        quantity: ing.quantity || 0
      })) : [],
      sub_recipes: cake.sub_recipes ? cake.sub_recipes.map(sr => ({
        id: sr.sub_recipe_id || sr.id,
        quantity: sr.quantity || 0
      })) : [],
      mid_preps: cake.mid_preps ? cake.mid_preps.map(mp => ({
        id: mp.mid_prep_id || mp.id,
        quantity: mp.quantity || 0
      })) : []
    });
    
    // Wait for data to load before showing modal
    await loadAvailableDataForEditing();
    setShowEditCake(true);
    setLoading(false);
  };

  const openEditSubRecipe = async (subRecipe) => {
    setLoading(true);
    setEditingSubRecipe({
      id: subRecipe.id,
      name: subRecipe.name || '',
      ingredients: subRecipe.ingredients ? subRecipe.ingredients.map(ing => ({
        id: ing.ingredient_id || ing.id,
        quantity: ing.quantity || 0
      })) : [],
      sub_recipes: subRecipe.nested_sub_recipes ? subRecipe.nested_sub_recipes.map(sr => ({
        id: sr.sub_recipe_id || sr.id,
        quantity: sr.quantity || 0
      })) : []
    });
    
    // Wait for data to load before showing modal
    await loadAvailableDataForEditing();
    setShowEditSubRecipe(true);
    setLoading(false);
  };

  const openEditMidPrep = async (midPrep) => {
    setLoading(true);
    setEditingMidPrep({
      id: midPrep.id,
      name: midPrep.name || '',
      ingredients: midPrep.ingredients ? midPrep.ingredients.map(ing => ({
        id: ing.ingredient_id || ing.id,
        quantity: ing.quantity || 0
      })) : [],
      sub_recipes: midPrep.sub_recipes ? midPrep.sub_recipes.map(sr => ({
        id: sr.sub_recipe_id || sr.id,
        quantity: sr.quantity || 0
      })) : []
    });
    
    // Wait for data to load before showing modal
    await loadAvailableDataForEditing();
    setShowEditMidPrep(true);
    setLoading(false);
  };

  const loadCategories = async () => {
    try {
      const response = await fetch(`${API_BASE}/categories-simple`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Handle the API response format {success: true, data: []}
      if (data.success && Array.isArray(data.data)) {
        setCategories(data.data);
      } else if (Array.isArray(data)) {
        // Fallback for direct array response
        setCategories(data);
      } else {
        console.warn('Unexpected categories response format:', data);
        setCategories([]);
      }
      
      // Clear any previous errors on successful load
      if (error) setError('');
    } catch (err) {
      console.error('Error loading categories:', err);
      setError(`Failed to load categories: ${err.message}`);
      setCategories([]);
    }
  };

  const loadItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        per_page: itemsPerPage,
        search: searchTerm,
        category: selectedCategory
      });
      
      const response = await fetch(`${API_BASE}/items-manage?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      setItems(data.items || []);
      setTotalItems(data.total || 0);
      setTotalPages(data.total_pages || 1);
      
      // Clear any previous errors on successful load
      if (error) setError('');
    } catch (err) {
      console.error('Error loading items:', err);
      setError(`Failed to load items: ${err.message}. Please check if the backend server is running on ${API_BASE}`);
      setItems([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await fetch(`${API_BASE}/items-statistics`);
      const data = await response.json();
      setStatistics(data);
    } catch (err) {
      console.error('Error loading statistics:', err);
    }
  };

  const loadSubRecipes = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/sub-recipes-manage`);
      const data = await response.json();
      setSubRecipes(data);
    } catch (err) {
      setError('Error loading sub-recipes: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMidPrepRecipes = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/mid-prep-recipes-manage`);
      const data = await response.json();
      setMidPrepRecipes(data);
    } catch (err) {
      setError('Error loading mid-prep recipes: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCakes = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/cakes-manage`);
      const data = await response.json();
      setCakes(data);
    } catch (err) {
      setError('Error loading cakes: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (itemId, itemData) => {
    try {
      const response = await fetch(`${API_BASE}/items-manage/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData)
      });
      
      if (response.ok) {
        setSuccess('Item updated successfully!');
        loadItems();
      } else {
        const error = await response.json();
        setError(error.detail || 'Error updating item');
      }
    } catch (err) {
      setError('Error updating item: ' + err.message);
    }
  };

  const deleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      const response = await fetch(`${API_BASE}/items-manage/${itemId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setSuccess('Item deleted successfully!');
        loadItems();
      } else {
        const error = await response.json();
        setError(error.detail || 'Error deleting item');
      }
    } catch (err) {
      setError('Error deleting item: ' + err.message);
    }
  };

  const addPackage = async (itemId, packageData) => {
    try {
      const response = await fetch(`${API_BASE}/items-manage/${itemId}/packages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(packageData)
      });
      
      if (response.ok) {
        setSuccess('Package added successfully!');
        loadItems();
        setNewPackage({});
      } else {
        const error = await response.json();
        setError(error.detail || 'Error adding package');
      }
    } catch (err) {
      setError('Error adding package: ' + err.message);
    }
  };

  const deletePackage = async (packageId) => {
    if (!window.confirm('Are you sure you want to delete this package?')) return;
    
    try {
      const response = await fetch(`${API_BASE}/items-manage/packages/${packageId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setSuccess('Package deleted successfully!');
        loadItems();
      } else {
        const error = await response.json();
        setError(error.detail || 'Error deleting package');
      }
    } catch (err) {
      setError('Error deleting package: ' + err.message);
    }
  };

  // Sub-Recipe Management Functions
  const updateSubRecipe = async (subRecipeId, data) => {
    try {
      const response = await fetch(`${API_BASE}/sub-recipes-manage/${subRecipeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        setSuccess('Sub-recipe updated successfully!');
        loadSubRecipes();
      } else {
        const error = await response.json();
        setError(error.detail || 'Error updating sub-recipe');
      }
    } catch (err) {
      setError('Error updating sub-recipe: ' + err.message);
    }
  };

  const deleteSubRecipe = async (subRecipeId) => {
    try {
      const response = await fetch(`${API_BASE}/sub-recipes-manage/${subRecipeId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setSuccess('Sub-recipe deleted successfully!');
        loadSubRecipes();
      } else {
        const error = await response.json();
        setError(error.detail || 'Error deleting sub-recipe');
      }
    } catch (err) {
      setError('Error deleting sub-recipe: ' + err.message);
    }
  };

  // Mid-Prep Recipe Management Functions
  const updateMidPrepRecipe = async (midPrepId, data) => {
    try {
      const response = await fetch(`${API_BASE}/mid-prep-recipes-manage/${midPrepId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        setSuccess('Mid-prep recipe updated successfully!');
        loadMidPrepRecipes();
      } else {
        const error = await response.json();
        setError(error.detail || 'Error updating mid-prep recipe');
      }
    } catch (err) {
      setError('Error updating mid-prep recipe: ' + err.message);
    }
  };

  const deleteMidPrepRecipe = async (midPrepId) => {
    try {
      const response = await fetch(`${API_BASE}/mid-prep-recipes-manage/${midPrepId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setSuccess('Mid-prep recipe deleted successfully!');
        loadMidPrepRecipes();
      } else {
        const error = await response.json();
        setError(error.detail || 'Error deleting mid-prep recipe');
      }
    } catch (err) {
      setError('Error deleting mid-prep recipe: ' + err.message);
    }
  };

  // Cake Management Functions
  const updateCake = async (cakeId, data) => {
    try {
      const response = await fetch(`${API_BASE}/cakes-manage/${cakeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        setSuccess('Cake updated successfully!');
        loadCakes();
      } else {
        const error = await response.json();
        setError(error.detail || 'Error updating cake');
      }
    } catch (err) {
      setError('Error updating cake: ' + err.message);
    }
  };

  const deleteCake = async (cakeId) => {
    try {
      const response = await fetch(`${API_BASE}/cakes-manage/${cakeId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setSuccess('Cake deleted successfully!');
        loadCakes();
      } else {
        const error = await response.json();
        setError(error.detail || 'Error deleting cake');
      }
    } catch (err) {
      setError('Error deleting cake: ' + err.message);
    }
  };

  // Live Cost Calculation Functions
  const calculateSubRecipeCost = async (recipe) => {
    let totalCost = 0;
    
    if (!recipe) return totalCost;
    
    // Calculate ingredient costs
    if (Array.isArray(recipe.ingredients)) {
      for (const ingredient of recipe.ingredients) {
        if (ingredient.id && ingredient.quantity > 0) {
          const item = items.find(i => i.id === parseInt(ingredient.id));
          if (item && item.price_per_unit) {
            totalCost += item.price_per_unit * ingredient.quantity;
          }
        }
      }
    }
    
    // Calculate nested sub-recipe costs
    const nestedSubRecipes = recipe.nested_sub_recipes || recipe.sub_recipes || [];
    if (Array.isArray(nestedSubRecipes)) {
      for (const nested of nestedSubRecipes) {
        if (nested.id && nested.quantity > 0) {
          const subRecipe = subRecipes.find(sr => sr.id === parseInt(nested.id));
          if (subRecipe && subRecipe.total_cost) {
            totalCost += subRecipe.total_cost * nested.quantity;
          }
        }
      }
    }
    
    return totalCost;
  };

  const calculateMidPrepCost = async (recipe) => {
    let totalCost = 0;
    
    if (!recipe) return totalCost;
    
    // Calculate ingredient costs
    if (Array.isArray(recipe.ingredients)) {
      for (const ingredient of recipe.ingredients) {
        if (ingredient.id && ingredient.quantity > 0) {
          const item = items.find(i => i.id === parseInt(ingredient.id));
          if (item && item.price_per_unit) {
            totalCost += item.price_per_unit * ingredient.quantity;
          }
        }
      }
    }
    
    // Calculate sub-recipe costs
    if (Array.isArray(recipe.sub_recipes)) {
      for (const subRecipe of recipe.sub_recipes) {
        if (subRecipe.id && subRecipe.quantity > 0) {
          const sr = subRecipes.find(sr => sr.id === parseInt(subRecipe.id));
          if (sr && sr.total_cost) {
            totalCost += sr.total_cost * subRecipe.quantity;
          }
        }
      }
    }
    
    return totalCost;
  };

  const calculateCakeCost = async (recipe) => {
    let totalCost = 0;
    
    if (!recipe) return totalCost;
    
    // Calculate ingredient costs
    if (Array.isArray(recipe.ingredients)) {
      for (const ingredient of recipe.ingredients) {
        if (ingredient.id && ingredient.quantity > 0) {
          const item = items.find(i => i.id === parseInt(ingredient.id));
          if (item && item.price_per_unit) {
            totalCost += item.price_per_unit * ingredient.quantity;
          }
        }
      }
    }
    
    // Calculate sub-recipe costs
    if (Array.isArray(recipe.sub_recipes)) {
      for (const subRecipe of recipe.sub_recipes) {
        if (subRecipe.id && subRecipe.quantity > 0) {
          const sr = subRecipes.find(sr => sr.id === parseInt(subRecipe.id));
          if (sr && sr.total_cost) {
            totalCost += sr.total_cost * subRecipe.quantity;
          }
        }
      }
    }
    
    // Calculate mid-prep costs
    if (Array.isArray(recipe.mid_preps)) {
      for (const midPrep of recipe.mid_preps) {
        if (midPrep.id && midPrep.quantity > 0) {
          const mp = midPrepRecipes.find(mp => mp.id === parseInt(midPrep.id));
          if (mp && mp.total_cost) {
            totalCost += mp.total_cost * midPrep.quantity;
          }
        }
      }
    }
    
    // Apply yield percentage
    const yieldMultiplier = 1 + (recipe.percent_yield || 0) / 100;
    return totalCost * yieldMultiplier;
  };

  // Update live costs when recipes change
  useEffect(() => {
    const updateSubRecipeCost = async () => {
      if (newSubRecipe && Array.isArray(items) && Array.isArray(subRecipes)) {
        const cost = await calculateSubRecipeCost(newSubRecipe);
        setSubRecipeLiveCost(cost);
      }
    };
    updateSubRecipeCost();
  }, [newSubRecipe, items, subRecipes]);

  useEffect(() => {
    const updateMidPrepCost = async () => {
      if (newMidPrep && Array.isArray(items) && Array.isArray(subRecipes)) {
        const cost = await calculateMidPrepCost(newMidPrep);
        setMidPrepLiveCost(cost);
      }
    };
    updateMidPrepCost();
  }, [newMidPrep, items, subRecipes]);

  useEffect(() => {
    const updateCakeCost = async () => {
      if (newCake && Array.isArray(items) && Array.isArray(subRecipes) && Array.isArray(midPrepRecipes)) {
        const cost = await calculateCakeCost(newCake);
        setCakeLiveCost(cost);
      }
    };
    updateCakeCost();
  }, [newCake, items, subRecipes, midPrepRecipes]);

  // Create Functions
  const createSubRecipe = async () => {
    if (!newSubRecipe.name.trim()) {
      setError('Sub-recipe name is required');
      return;
    }
    
    if (newSubRecipe.ingredients.length === 0 && newSubRecipe.sub_recipes.length === 0) {
      setError('At least one ingredient or sub-recipe is required');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/sub-recipes-simple`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSubRecipe.name,
          ingredients: newSubRecipe.ingredients.filter(ing => ing.id && ing.quantity > 0),
          sub_recipes: newSubRecipe.sub_recipes.filter(sr => sr.id && sr.quantity > 0)
        })
      });
      
      if (response.ok) {
        setSuccess('Sub-recipe created successfully!');
        setShowCreateSubRecipe(false);
        setNewSubRecipe({ name: '', ingredients: [], sub_recipes: [] });
        loadSubRecipes();
      } else {
        const error = await response.json();
        setError(error.detail || 'Error creating sub-recipe');
      }
    } catch (err) {
      setError('Error creating sub-recipe: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const createMidPrep = async () => {
    if (!newMidPrep.name.trim()) {
      setError('Mid-prep recipe name is required');
      return;
    }
    
    if (newMidPrep.ingredients.length === 0 && newMidPrep.sub_recipes.length === 0) {
      setError('At least one ingredient or sub-recipe is required');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/mid-prep-recipes-simple`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newMidPrep.name,
          ingredients: newMidPrep.ingredients.filter(ing => ing.id && ing.quantity > 0),
          sub_recipes: newMidPrep.sub_recipes.filter(sr => sr.id && sr.quantity > 0)
        })
      });
      
      if (response.ok) {
        setSuccess('Mid-prep recipe created successfully!');
        setShowCreateMidPrep(false);
        setNewMidPrep({ name: '', ingredients: [], sub_recipes: [] });
        loadMidPrepRecipes();
      } else {
        const error = await response.json();
        setError(error.detail || 'Error creating mid-prep recipe');
      }
    } catch (err) {
      setError('Error creating mid-prep recipe: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const createCake = async () => {
    if (!newCake.name.trim()) {
      setError('Cake name is required');
      return;
    }
    
    if (newCake.ingredients.length === 0 && newCake.sub_recipes.length === 0 && newCake.mid_preps.length === 0) {
      setError('At least one ingredient, sub-recipe, or mid-prep is required');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/cakes-simple`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCake.name,
          percent_yield: newCake.percent_yield,
          ingredients: newCake.ingredients.filter(ing => ing.id && ing.quantity > 0),
          sub_recipes: newCake.sub_recipes.filter(sr => sr.id && sr.quantity > 0),
          mid_preps: newCake.mid_preps.filter(mp => mp.id && mp.quantity > 0)
        })
      });
      
      if (response.ok) {
        setSuccess('Cake created successfully!');
        setShowCreateCake(false);
        setNewCake({ name: '', percent_yield: 100, ingredients: [], sub_recipes: [], mid_preps: [] });
        loadCakes();
      } else {
        const error = await response.json();
        setError(error.detail || 'Error creating cake');
      }
    } catch (err) {
      setError('Error creating cake: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-center items-center space-x-2 mt-6">
        <button
          onClick={() => setCurrentPage(1)}
          disabled={currentPage <= 1}
          className="px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          ⏮️
        </button>
        <button
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage <= 1}
          className="px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          ◀️
        </button>
        <span className="px-4 py-1">
          Page {currentPage} of {totalPages} ({totalItems} items)
        </span>
        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          ▶️
        </button>
        <button
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage >= totalPages}
          className="px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          ⏭️
        </button>
      </div>
    );
  };

  const renderItemsTab = () => (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">🔍 {t('recipeManagement.items.searchTitle')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder={t('recipeManagement.items.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border rounded px-3 py-2"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">{t('recipeManagement.items.allCategories')}</option>
            {Array.isArray(categories) && categories.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
                      <select
             value={10}
             onChange={(e) => {}}
             className="border rounded px-3 py-2"
          >
            <option value={5}>5 {t('recipeManagement.items.perPage')}</option>
            <option value={10}>10 {t('recipeManagement.items.perPage')}</option>
            <option value={20}>20 {t('recipeManagement.items.perPage')}</option>
            <option value={50}>50 {t('recipeManagement.items.perPage')}</option>
          </select>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('');
              setCurrentPage(1);
            }}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            🔄 {t('recipeManagement.items.reset')}
          </button>
        </div>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">📊 {t('recipeManagement.items.statistics.title')}</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{statistics.total_items || 0}</div>
              <div className="text-sm text-gray-600">{t('recipeManagement.items.statistics.totalItems')}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{statistics.categories_used || 0}</div>
              <div className="text-sm text-gray-600">{t('recipeManagement.items.statistics.categories')}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">${(statistics.average_price || 0).toFixed(2)}</div>
              <div className="text-sm text-gray-600">{t('recipeManagement.items.statistics.averagePrice')}</div>
            </div>
          </div>
        </div>
      )}

      {/* Items List */}
      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
            <div className="text-yellow-600 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m0 0V9a2 2 0 012-2h2m0 0V6a2 2 0 012-2h2.586a1 1 0 01.707.293l2.414 2.414A1 1 0 0016 7.414V9" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-yellow-800 mb-2">
              📦 {t('recipeManagement.items.noItems')}
            </h3>
            <p className="text-yellow-700 mb-4">
              {searchTerm || selectedCategory 
                ? t('recipeManagement.items.noItemsSearch')
                : t('recipeManagement.items.noItemsSystem')
              }
            </p>
            {!(searchTerm || selectedCategory) && (
              <ul className="text-left text-yellow-700 mb-4 space-y-1">
                {t('recipeManagement.items.noItemsReasons', { returnObjects: true }).map((reason, index) => (
                  <li key={index}>• {reason}</li>
                ))}
              </ul>
            )}
            <div className="space-x-2">
              <button
                onClick={() => {
                  loadItems();
                  loadCategories();
                  loadStatistics();
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200"
              >
                🔄 {t('recipeManagement.items.reloadData')}
              </button>
              {(searchTerm || selectedCategory) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('');
                    setCurrentPage(1);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200"
                >
                  🔍 {t('recipeManagement.items.clearFilters')}
                </button>
              )}
            </div>
          </div>
        ) : (
          items.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              categories={categories}
              onUpdate={updateItem}
              onDelete={deleteItem}
              showPackages={showPackages}
              setShowPackages={setShowPackages}
              onAddPackage={addPackage}
              onDeletePackage={deletePackage}
              newPackage={newPackage}
              setNewPackage={setNewPackage}
              t={t}
            />
          ))
        )}
      </div>

      {renderPagination()}
    </div>
  );

  const renderSubRecipesTab = () => {
    const filteredSubRecipes = subRecipes.filter(recipe =>
      recipe.name?.toLowerCase().includes(subRecipeSearch.toLowerCase())
    );

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">📋 {t('recipeManagement.subRecipes.title')}</h3>
          <button
            onClick={() => setShowCreateSubRecipe(true)}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            ➕ {t('recipeManagement.subRecipes.createNew')}
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex gap-4 items-center">
          <input
            type="text"
            placeholder={t('recipeManagement.subRecipes.searchPlaceholder')}
            value={subRecipeSearch}
            onChange={(e) => setSubRecipeSearch(e.target.value)}
            className="flex-1 border rounded px-3 py-2"
          />
          <button
            onClick={() => setSubRecipeSearch('')}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            {t('recipeManagement.actions.clear')}
          </button>
        </div>
        
        {filteredSubRecipes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>{subRecipeSearch ? t('recipeManagement.subRecipes.noRecipesSearch') : t('recipeManagement.subRecipes.noRecipes')}</p>
          </div>
        ) : (
          filteredSubRecipes.map(recipe => (
            <SubRecipeCard 
              key={recipe.id} 
              recipe={recipe} 
              onUpdate={updateSubRecipe}
              onDelete={deleteSubRecipe}
              onOpenEdit={openEditSubRecipe}
              isLoadingEdit={loading}
              t={t}
            />
          ))
        )}
      </div>
    );
  };

  const renderMidPrepTab = () => {
    const filteredMidPrepRecipes = midPrepRecipes.filter(recipe =>
      recipe.name?.toLowerCase().includes(midPrepSearch.toLowerCase())
    );

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">🥘 {t('recipeManagement.midPrepRecipes.title')}</h3>
          <button
            onClick={() => setShowCreateMidPrep(true)}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            ➕ {t('recipeManagement.midPrepRecipes.createNew')}
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex gap-4 items-center">
          <input
            type="text"
            placeholder={t('recipeManagement.midPrepRecipes.searchPlaceholder')}
            value={midPrepSearch}
            onChange={(e) => setMidPrepSearch(e.target.value)}
            className="flex-1 border rounded px-3 py-2"
          />
          <button
            onClick={() => setMidPrepSearch('')}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            {t('recipeManagement.actions.clear')}
          </button>
        </div>
        
        {filteredMidPrepRecipes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>{midPrepSearch ? t('recipeManagement.midPrepRecipes.noRecipesSearch') : t('recipeManagement.midPrepRecipes.noRecipes')}</p>
          </div>
        ) : (
          filteredMidPrepRecipes.map(recipe => (
            <MidPrepCard 
              key={recipe.id} 
              recipe={recipe} 
              onUpdate={updateMidPrepRecipe}
              onDelete={deleteMidPrepRecipe}
              onOpenEdit={openEditMidPrep}
              isLoadingEdit={loading}
              t={t}
            />
          ))
        )}
      </div>
    );
  };

  const renderCakesTab = () => {
    const filteredCakes = cakes.filter(cake =>
      cake.name?.toLowerCase().includes(cakeSearch.toLowerCase())
    );

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">🎂 {t('recipeManagement.cakes.title')}</h3>
          <button
            onClick={() => setShowCreateCake(true)}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            ➕ {t('recipeManagement.cakes.createNew')}
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex gap-4 items-center">
          <input
            type="text"
            placeholder={t('recipeManagement.cakes.searchPlaceholder')}
            value={cakeSearch}
            onChange={(e) => setCakeSearch(e.target.value)}
            className="flex-1 border rounded px-3 py-2"
          />
          <button
            onClick={() => setCakeSearch('')}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            {t('recipeManagement.actions.clear')}
          </button>
        </div>
        
        {filteredCakes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>{cakeSearch ? t('recipeManagement.cakes.noCakesSearch') : t('recipeManagement.cakes.noCakes')}</p>
          </div>
        ) : (
          filteredCakes.map(cake => (
            <CakeCard 
              key={cake.id} 
              cake={cake} 
              onUpdate={updateCake}
              onDelete={deleteCake}
              onOpenEdit={openEditCake}
              isLoadingEdit={loading}
              t={t}
            />
          ))
        )}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {t('recipeManagement.title')}
        </h1>
        <p className="text-gray-600">{t('recipeManagement.subtitle')}</p>
      </div>

      {/* Success/Error Messages */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
          <button
            onClick={() => setError('')}
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
          >
            <span className="sr-only">Dismiss</span>
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{success}</span>
          <button
            onClick={() => setSuccess('')}
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
          >
            <span className="sr-only">Dismiss</span>
            ×
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <div className="overflow-x-auto">
            <nav className="-mb-px flex space-x-8 px-6 min-w-max">
              <button
                onClick={() => setActiveTab('items')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'items'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🧪 {t('recipeManagement.tabs.items')}
              </button>
              <button
                onClick={() => setActiveTab('sub-recipes')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'sub-recipes'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📋 {t('recipeManagement.tabs.subRecipes')}
              </button>
              <button
                onClick={() => setActiveTab('mid-prep')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'mid-prep'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🥘 {t('recipeManagement.tabs.midPrepRecipes')}
              </button>
              <button
                onClick={() => setActiveTab('cakes')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'cakes'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🎂 {t('recipeManagement.tabs.cakes')}
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">{t('recipeManagement.loading')}</p>
        </div>
      )}

      {/* Tab Content */}
      {!loading && (
        <>
          {activeTab === 'items' && renderItemsTab()}
          {activeTab === 'sub-recipes' && renderSubRecipesTab()}
          {activeTab === 'mid-prep' && renderMidPrepTab()}
          {activeTab === 'cakes' && renderCakesTab()}
        </>
      )}

      {/* Create Sub-Recipe Modal */}
      {showCreateSubRecipe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">🧪 Create New Sub-Recipe</h3>
            
            {/* Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Recipe Name</label>
              <input
                type="text"
                value={newSubRecipe.name}
                onChange={(e) => setNewSubRecipe({...newSubRecipe, name: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Enter sub-recipe name..."
              />
            </div>

            {/* Ingredients */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">Ingredients</label>
                <button
                  onClick={() => setNewSubRecipe({
                    ...newSubRecipe,
                    ingredients: [...newSubRecipe.ingredients, { id: '', quantity: 0 }]
                  })}
                  className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                >
                  ➕ Add Ingredient
                </button>
              </div>
              {newSubRecipe.ingredients.map((ing, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <select
                    value={ing.id}
                    onChange={(e) => {
                      const updated = [...newSubRecipe.ingredients];
                      updated[index].id = parseInt(e.target.value);
                      setNewSubRecipe({...newSubRecipe, ingredients: updated});
                    }}
                    className="flex-1 p-2 border border-gray-300 rounded"
                  >
                    <option value="">Select ingredient...</option>
                    {items.map(item => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.001"
                    value={ing.quantity}
                    onChange={(e) => {
                      const updated = [...newSubRecipe.ingredients];
                      updated[index].quantity = parseFloat(e.target.value) || 0;
                      setNewSubRecipe({...newSubRecipe, ingredients: updated});
                    }}
                    className="w-24 p-2 border border-gray-300 rounded"
                    placeholder="Qty"
                  />
                  <button
                    onClick={() => {
                      const updated = newSubRecipe.ingredients.filter((_, i) => i !== index);
                      setNewSubRecipe({...newSubRecipe, ingredients: updated});
                    }}
                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>

            {/* Nested Sub-Recipes */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">Nested Sub-Recipes</label>
                <button
                  onClick={() => setNewSubRecipe({
                    ...newSubRecipe,
                    sub_recipes: [...newSubRecipe.sub_recipes, { id: '', quantity: 0 }]
                  })}
                  className="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600"
                >
                  ➕ Add Sub-Recipe
                </button>
              </div>
              {newSubRecipe.sub_recipes.map((sr, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <select
                    value={sr.id}
                    onChange={(e) => {
                      const updated = [...newSubRecipe.sub_recipes];
                      updated[index].id = parseInt(e.target.value);
                      setNewSubRecipe({...newSubRecipe, sub_recipes: updated});
                    }}
                    className="flex-1 p-2 border border-gray-300 rounded"
                  >
                    <option value="">Select sub-recipe...</option>
                    {subRecipes.filter(sub => sub.name !== newSubRecipe.name).map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.001"
                    value={sr.quantity}
                    onChange={(e) => {
                      const updated = [...newSubRecipe.sub_recipes];
                      updated[index].quantity = parseFloat(e.target.value) || 0;
                      setNewSubRecipe({...newSubRecipe, sub_recipes: updated});
                    }}
                    className="w-24 p-2 border border-gray-300 rounded"
                    placeholder="Qty"
                  />
                  <button
                    onClick={() => {
                      const updated = newSubRecipe.sub_recipes.filter((_, i) => i !== index);
                      setNewSubRecipe({...newSubRecipe, sub_recipes: updated});
                    }}
                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>

            {/* Live Cost Display */}
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded">
              <div className="text-lg font-semibold text-green-700">
                💰 Live Cost Calculation: ${subRecipeLiveCost.toFixed(4)}
              </div>
              <div className="text-sm text-green-600 mt-1">
                Updates automatically as you add/modify ingredients and nested sub-recipes
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateSubRecipe(false);
                  setNewSubRecipe({ name: '', ingredients: [], sub_recipes: [] });
                  setSubRecipeLiveCost(0);
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                {t('recipeManagement.actions.cancel')}
              </button>
              <button
                onClick={createSubRecipe}
                disabled={loading}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
              >
                {loading ? t('recipeManagement.actions.creating') : 'Create Sub-Recipe'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Mid-Prep Modal */}
      {showCreateMidPrep && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">🥘 Create New Mid-Prep Recipe</h3>
            
            {/* Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Recipe Name</label>
              <input
                type="text"
                value={newMidPrep.name}
                onChange={(e) => setNewMidPrep({...newMidPrep, name: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Enter mid-prep recipe name..."
              />
            </div>

            {/* Ingredients */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">Direct Ingredients</label>
                <button
                  onClick={() => setNewMidPrep({
                    ...newMidPrep,
                    ingredients: [...newMidPrep.ingredients, { id: '', quantity: 0 }]
                  })}
                  className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                >
                  ➕ Add Ingredient
                </button>
              </div>
              {newMidPrep.ingredients.map((ing, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <select
                    value={ing.id}
                    onChange={(e) => {
                      const updated = [...newMidPrep.ingredients];
                      updated[index].id = parseInt(e.target.value);
                      setNewMidPrep({...newMidPrep, ingredients: updated});
                    }}
                    className="flex-1 p-2 border border-gray-300 rounded"
                  >
                    <option value="">Select ingredient...</option>
                    {items.map(item => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.001"
                    value={ing.quantity}
                    onChange={(e) => {
                      const updated = [...newMidPrep.ingredients];
                      updated[index].quantity = parseFloat(e.target.value) || 0;
                      setNewMidPrep({...newMidPrep, ingredients: updated});
                    }}
                    className="w-24 p-2 border border-gray-300 rounded"
                    placeholder="Qty"
                  />
                  <button
                    onClick={() => {
                      const updated = newMidPrep.ingredients.filter((_, i) => i !== index);
                      setNewMidPrep({...newMidPrep, ingredients: updated});
                    }}
                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>

            {/* Sub-Recipes */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">Sub-Recipes</label>
                <button
                  onClick={() => setNewMidPrep({
                    ...newMidPrep,
                    sub_recipes: [...newMidPrep.sub_recipes, { id: '', quantity: 0 }]
                  })}
                  className="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600"
                >
                  ➕ Add Sub-Recipe
                </button>
              </div>
              {newMidPrep.sub_recipes.map((sr, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <select
                    value={sr.id}
                    onChange={(e) => {
                      const updated = [...newMidPrep.sub_recipes];
                      updated[index].id = parseInt(e.target.value);
                      setNewMidPrep({...newMidPrep, sub_recipes: updated});
                    }}
                    className="flex-1 p-2 border border-gray-300 rounded"
                  >
                    <option value="">Select sub-recipe...</option>
                    {subRecipes.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.001"
                    value={sr.quantity}
                    onChange={(e) => {
                      const updated = [...newMidPrep.sub_recipes];
                      updated[index].quantity = parseFloat(e.target.value) || 0;
                      setNewMidPrep({...newMidPrep, sub_recipes: updated});
                    }}
                    className="w-24 p-2 border border-gray-300 rounded"
                    placeholder="Qty"
                  />
                  <button
                    onClick={() => {
                      const updated = newMidPrep.sub_recipes.filter((_, i) => i !== index);
                      setNewMidPrep({...newMidPrep, sub_recipes: updated});
                    }}
                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>

            {/* Live Cost Display */}
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded">
              <div className="text-lg font-semibold text-green-700">
                💰 Live Cost Calculation: ${midPrepLiveCost.toFixed(4)}
              </div>
              <div className="text-sm text-green-600 mt-1">
                Updates automatically as you add/modify ingredients and sub-recipes
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateMidPrep(false);
                  setNewMidPrep({ name: '', ingredients: [], sub_recipes: [] });
                  setMidPrepLiveCost(0);
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                {t('recipeManagement.actions.cancel')}
              </button>
              <button
                onClick={createMidPrep}
                disabled={loading}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
              >
                {loading ? t('recipeManagement.actions.creating') : 'Create Mid-Prep Recipe'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Cake Modal */}
      {showEditCake && editingCake && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-7xl w-full mx-4 h-5/6 overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">✏️ Edit Cake Recipe</h3>
            
            {/* DEBUG: Show data state */}
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs">
              <strong>🐛 Debug Info:</strong>
              <div>Available Ingredients: {Array.isArray(availableIngredients) ? availableIngredients.length : 'Not an array'} items</div>
              <div>Available Sub-Recipes: {Array.isArray(availableSubRecipes) ? availableSubRecipes.length : 'Not an array'} items</div>
              <div>Available Mid-Preps: {Array.isArray(availableMidPreps) ? availableMidPreps.length : 'Not an array'} items</div>
              {availableIngredients.length > 0 && (
                <div>First ingredient: {availableIngredients[0]?.name || 'No name'}</div>
              )}
            </div>
            
            {/* Name and Yield */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cake Name</label>
                <input
                  type="text"
                  value={editingCake.name}
                  onChange={(e) => setEditingCake({...editingCake, name: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Enter cake name..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Percent Yield (%)</label>
                <input
                  type="number"
                  value={editingCake.percent_yield}
                  onChange={(e) => setEditingCake({...editingCake, percent_yield: parseFloat(e.target.value) || 100})}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="100"
                />
              </div>
            </div>

            {/* Ingredients */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">Direct Ingredients</label>
                <button
                  onClick={() => setEditingCake({
                    ...editingCake,
                    ingredients: [...editingCake.ingredients, { id: '', quantity: 0 }]
                  })}
                  className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                >
                  ➕ Add Ingredient
                </button>
              </div>
              
              {/* Ingredient Search Bar */}
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="🔍 Search ingredients..."
                  value={editIngredientSearch}
                  onChange={(e) => setEditIngredientSearch(e.target.value)}
                  className="w-full p-2 border border-blue-300 rounded-lg bg-blue-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              {editingCake.ingredients.map((ing, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <select
                    value={ing.id}
                    onChange={(e) => {
                      const updated = [...editingCake.ingredients];
                      updated[index].id = parseInt(e.target.value);
                      setEditingCake({...editingCake, ingredients: updated});
                    }}
                    className="flex-1 p-2 border border-gray-300 rounded"
                  >
                    <option value="">Select ingredient...</option>
                    {Array.isArray(availableIngredients) ? availableIngredients
                      .filter(item => item.name.toLowerCase().includes(editIngredientSearch.toLowerCase()))
                      .map(item => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      )) : null}
                  </select>
                  <input
                    type="number"
                    step="0.001"
                    value={ing.quantity}
                    onChange={(e) => {
                      const updated = [...editingCake.ingredients];
                      updated[index].quantity = parseFloat(e.target.value) || 0;
                      setEditingCake({...editingCake, ingredients: updated});
                    }}
                    className="w-24 p-2 border border-gray-300 rounded"
                    placeholder="Qty"
                  />
                  <button
                    onClick={() => {
                      const updated = editingCake.ingredients.filter((_, i) => i !== index);
                      setEditingCake({...editingCake, ingredients: updated});
                    }}
                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>

            {/* Sub-Recipes */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">Sub-Recipes</label>
                <button
                  onClick={() => setEditingCake({
                    ...editingCake,
                    sub_recipes: [...editingCake.sub_recipes, { id: '', quantity: 0 }]
                  })}
                  className="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600"
                >
                  ➕ Add Sub-Recipe
                </button>
              </div>
              
              {/* Sub-Recipe Search Bar */}
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="🔍 Search sub-recipes..."
                  value={editSubRecipeSearch}
                  onChange={(e) => setEditSubRecipeSearch(e.target.value)}
                  className="w-full p-2 border border-purple-300 rounded-lg bg-purple-50 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
              {editingCake.sub_recipes.map((sr, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <select
                    value={sr.id}
                    onChange={(e) => {
                      const updated = [...editingCake.sub_recipes];
                      updated[index].id = parseInt(e.target.value);
                      setEditingCake({...editingCake, sub_recipes: updated});
                    }}
                    className="flex-1 p-2 border border-gray-300 rounded"
                  >
                    <option value="">Select sub-recipe...</option>
                    {Array.isArray(availableSubRecipes) ? availableSubRecipes
                      .filter(sub => sub.name.toLowerCase().includes(editSubRecipeSearch.toLowerCase()))
                      .map(sub => (
                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                      )) : null}
                  </select>
                  <input
                    type="number"
                    step="0.001"
                    value={sr.quantity}
                    onChange={(e) => {
                      const updated = [...editingCake.sub_recipes];
                      updated[index].quantity = parseFloat(e.target.value) || 0;
                      setEditingCake({...editingCake, sub_recipes: updated});
                    }}
                    className="w-24 p-2 border border-gray-300 rounded"
                    placeholder="Qty"
                  />
                  <button
                    onClick={() => {
                      const updated = editingCake.sub_recipes.filter((_, i) => i !== index);
                      setEditingCake({...editingCake, sub_recipes: updated});
                    }}
                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>

            {/* Mid-Preps */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">Mid-Prep Recipes</label>
                <button
                  onClick={() => setEditingCake({
                    ...editingCake,
                    mid_preps: [...editingCake.mid_preps, { id: '', quantity: 0 }]
                  })}
                  className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600"
                >
                  ➕ Add Mid-Prep
                </button>
              </div>
              
              {/* Mid-Prep Search Bar */}
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="🔍 Search mid-prep recipes..."
                  value={editMidPrepSearch}
                  onChange={(e) => setEditMidPrepSearch(e.target.value)}
                  className="w-full p-2 border border-orange-300 rounded-lg bg-orange-50 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
              {editingCake.mid_preps.map((mp, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <select
                    value={mp.id}
                    onChange={(e) => {
                      const updated = [...editingCake.mid_preps];
                      updated[index].id = parseInt(e.target.value);
                      setEditingCake({...editingCake, mid_preps: updated});
                    }}
                    className="flex-1 p-2 border border-gray-300 rounded"
                  >
                    <option value="">Select mid-prep recipe...</option>
                    {Array.isArray(availableMidPreps) ? availableMidPreps
                      .filter(mp => mp.name.toLowerCase().includes(editMidPrepSearch.toLowerCase()))
                      .map(mp => (
                        <option key={mp.id} value={mp.id}>{mp.name}</option>
                      )) : null}
                  </select>
                  <input
                    type="number"
                    step="0.001"
                    value={mp.quantity}
                    onChange={(e) => {
                      const updated = [...editingCake.mid_preps];
                      updated[index].quantity = parseFloat(e.target.value) || 0;
                      setEditingCake({...editingCake, mid_preps: updated});
                    }}
                    className="w-24 p-2 border border-gray-300 rounded"
                    placeholder="Qty"
                  />
                  <button
                    onClick={() => {
                      const updated = editingCake.mid_preps.filter((_, i) => i !== index);
                      setEditingCake({...editingCake, mid_preps: updated});
                    }}
                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEditCake(false);
                  setEditingCake(null);
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                {t('recipeManagement.actions.cancel')}
              </button>
              <button
                onClick={() => updateCakeEnhanced(editingCake.id, {
                  name: editingCake.name,
                  percent_yield: editingCake.percent_yield,
                  ingredients: editingCake.ingredients.filter(ing => ing.id && ing.quantity > 0),
                  sub_recipes: editingCake.sub_recipes.filter(sr => sr.id && sr.quantity > 0),
                  mid_preps: editingCake.mid_preps.filter(mp => mp.id && mp.quantity > 0)
                })}
                disabled={loading}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
              >
                {loading ? t('recipeManagement.actions.updating') : 'Update Cake'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Sub-Recipe Modal */}
      {showEditSubRecipe && editingSubRecipe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 h-5/6 overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">✏️ Edit Sub-Recipe</h3>
            
            {/* Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Recipe Name</label>
              <input
                type="text"
                value={editingSubRecipe.name}
                onChange={(e) => setEditingSubRecipe({...editingSubRecipe, name: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Enter sub-recipe name..."
              />
            </div>

            {/* Ingredients */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">Ingredients</label>
                <button
                  onClick={() => setEditingSubRecipe({
                    ...editingSubRecipe,
                    ingredients: [...editingSubRecipe.ingredients, { id: '', quantity: 0 }]
                  })}
                  className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                >
                  ➕ Add Ingredient
                </button>
              </div>
              
              {/* Ingredient Search Bar */}
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="🔍 Search ingredients..."
                  value={editIngredientSearch}
                  onChange={(e) => setEditIngredientSearch(e.target.value)}
                  className="w-full p-2 border border-blue-300 rounded-lg bg-blue-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              
              {editingSubRecipe.ingredients.map((ing, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <select
                    value={ing.id}
                    onChange={(e) => {
                      const updated = [...editingSubRecipe.ingredients];
                      updated[index].id = parseInt(e.target.value);
                      setEditingSubRecipe({...editingSubRecipe, ingredients: updated});
                    }}
                    className="flex-1 p-2 border border-gray-300 rounded"
                  >
                    <option value="">Select ingredient...</option>
                    {Array.isArray(availableIngredients) ? availableIngredients
                      .filter(item => item.name.toLowerCase().includes(editIngredientSearch.toLowerCase()))
                      .map(item => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    )) : null}
                  </select>
                  <input
                    type="number"
                    step="0.001"
                    value={ing.quantity}
                    onChange={(e) => {
                      const updated = [...editingSubRecipe.ingredients];
                      updated[index].quantity = parseFloat(e.target.value) || 0;
                      setEditingSubRecipe({...editingSubRecipe, ingredients: updated});
                    }}
                    className="w-24 p-2 border border-gray-300 rounded"
                    placeholder="Qty"
                  />
                  <button
                    onClick={() => {
                      const updated = editingSubRecipe.ingredients.filter((_, i) => i !== index);
                      setEditingSubRecipe({...editingSubRecipe, ingredients: updated});
                    }}
                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>

            {/* Nested Sub-Recipes */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">Nested Sub-Recipes</label>
                <button
                  onClick={() => setEditingSubRecipe({
                    ...editingSubRecipe,
                    sub_recipes: [...editingSubRecipe.sub_recipes, { id: '', quantity: 0 }]
                  })}
                  className="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600"
                >
                  ➕ Add Sub-Recipe
                </button>
              </div>
              
              {/* Sub-Recipe Search Bar */}
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="🔍 Search sub-recipes..."
                  value={editSubRecipeSearch}
                  onChange={(e) => setEditSubRecipeSearch(e.target.value)}
                  className="w-full p-2 border border-purple-300 rounded-lg bg-purple-50 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
              
              {editingSubRecipe.sub_recipes.map((sr, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <select
                    value={sr.id}
                    onChange={(e) => {
                      const updated = [...editingSubRecipe.sub_recipes];
                      updated[index].id = parseInt(e.target.value);
                      setEditingSubRecipe({...editingSubRecipe, sub_recipes: updated});
                    }}
                    className="flex-1 p-2 border border-gray-300 rounded"
                  >
                    <option value="">Select sub-recipe...</option>
                    {Array.isArray(availableSubRecipes) ? availableSubRecipes
                      .filter(sub => sub.id !== editingSubRecipe.id)
                      .filter(sub => sub.name.toLowerCase().includes(editSubRecipeSearch.toLowerCase()))
                      .map(sub => (
                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                      )) : null}
                  </select>
                  <input
                    type="number"
                    step="0.001"
                    value={sr.quantity}
                    onChange={(e) => {
                      const updated = [...editingSubRecipe.sub_recipes];
                      updated[index].quantity = parseFloat(e.target.value) || 0;
                      setEditingSubRecipe({...editingSubRecipe, sub_recipes: updated});
                    }}
                    className="w-24 p-2 border border-gray-300 rounded"
                    placeholder="Qty"
                  />
                  <button
                    onClick={() => {
                      const updated = editingSubRecipe.sub_recipes.filter((_, i) => i !== index);
                      setEditingSubRecipe({...editingSubRecipe, sub_recipes: updated});
                    }}
                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEditSubRecipe(false);
                  setEditingSubRecipe(null);
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                {t('recipeManagement.actions.cancel')}
              </button>
              <button
                onClick={() => updateSubRecipeEnhanced(editingSubRecipe.id, {
                  name: editingSubRecipe.name,
                  ingredients: editingSubRecipe.ingredients.filter(ing => ing.id && ing.quantity > 0),
                  sub_recipes: editingSubRecipe.sub_recipes.filter(sr => sr.id && sr.quantity > 0)
                })}
                disabled={loading}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
              >
                {loading ? t('recipeManagement.actions.updating') : 'Update Sub-Recipe'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Mid-Prep Modal */}
      {showEditMidPrep && editingMidPrep && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 h-5/6 overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">✏️ Edit Mid-Prep Recipe</h3>
            
            {/* Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Recipe Name</label>
              <input
                type="text"
                value={editingMidPrep.name}
                onChange={(e) => setEditingMidPrep({...editingMidPrep, name: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Enter mid-prep recipe name..."
              />
            </div>

            {/* Ingredients */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">Direct Ingredients</label>
                <button
                  onClick={() => setEditingMidPrep({
                    ...editingMidPrep,
                    ingredients: [...editingMidPrep.ingredients, { id: '', quantity: 0 }]
                  })}
                  className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                >
                  ➕ Add Ingredient
                </button>
              </div>
              
              {/* Ingredient Search Bar */}
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="🔍 Search ingredients..."
                  value={editIngredientSearch}
                  onChange={(e) => setEditIngredientSearch(e.target.value)}
                  className="w-full p-2 border border-blue-300 rounded-lg bg-blue-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              
              {editingMidPrep.ingredients.map((ing, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <select
                    value={ing.id}
                    onChange={(e) => {
                      const updated = [...editingMidPrep.ingredients];
                      updated[index].id = parseInt(e.target.value);
                      setEditingMidPrep({...editingMidPrep, ingredients: updated});
                    }}
                    className="flex-1 p-2 border border-gray-300 rounded"
                  >
                    <option value="">Select ingredient...</option>
                    {Array.isArray(availableIngredients) ? availableIngredients
                      .filter(item => item.name.toLowerCase().includes(editIngredientSearch.toLowerCase()))
                      .map(item => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    )) : null}
                  </select>
                  <input
                    type="number"
                    step="0.001"
                    value={ing.quantity}
                    onChange={(e) => {
                      const updated = [...editingMidPrep.ingredients];
                      updated[index].quantity = parseFloat(e.target.value) || 0;
                      setEditingMidPrep({...editingMidPrep, ingredients: updated});
                    }}
                    className="w-24 p-2 border border-gray-300 rounded"
                    placeholder="Qty"
                  />
                  <button
                    onClick={() => {
                      const updated = editingMidPrep.ingredients.filter((_, i) => i !== index);
                      setEditingMidPrep({...editingMidPrep, ingredients: updated});
                    }}
                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>

            {/* Sub-Recipes */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">Sub-Recipes</label>
                <button
                  onClick={() => setEditingMidPrep({
                    ...editingMidPrep,
                    sub_recipes: [...editingMidPrep.sub_recipes, { id: '', quantity: 0 }]
                  })}
                  className="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600"
                >
                  ➕ Add Sub-Recipe
                </button>
              </div>
              
              {/* Sub-Recipe Search Bar */}
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="🔍 Search sub-recipes..."
                  value={editSubRecipeSearch}
                  onChange={(e) => setEditSubRecipeSearch(e.target.value)}
                  className="w-full p-2 border border-purple-300 rounded-lg bg-purple-50 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
              
              {editingMidPrep.sub_recipes.map((sr, index) => (
                <div key={`${sr.id}-${index}`} className="bg-blue-50 p-2 rounded mb-1">
                  <span>{sr.sub_recipe_name}</span>
                  <span className="text-sm text-gray-600 ml-2">{t('recipeManagement.actions.quantity')}: {sr.quantity}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEditMidPrep(false);
                  setEditingMidPrep(null);
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                {t('recipeManagement.actions.cancel')}
              </button>
              <button
                onClick={() => updateMidPrepEnhanced(editingMidPrep.id, {
                  name: editingMidPrep.name,
                  ingredients: editingMidPrep.ingredients.filter(ing => ing.id && ing.quantity > 0),
                  sub_recipes: editingMidPrep.sub_recipes.filter(sr => sr.id && sr.quantity > 0)
                })}
                disabled={loading}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
              >
                {loading ? t('recipeManagement.actions.updating') : 'Update Mid-Prep'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Cake Modal */}
      {showCreateCake && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">🍰 Create New Cake</h3>
            
            {/* Name and Yield */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cake Name</label>
                <input
                  type="text"
                  value={newCake.name}
                  onChange={(e) => setNewCake({...newCake, name: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Enter cake name..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Percent Yield (%)</label>
                <input
                  type="number"
                  value={newCake.percent_yield}
                  onChange={(e) => setNewCake({...newCake, percent_yield: parseFloat(e.target.value) || 100})}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="100"
                />
              </div>
            </div>

            {/* Ingredients */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">Direct Ingredients</label>
                <button
                  onClick={() => setNewCake({
                    ...newCake,
                    ingredients: [...newCake.ingredients, { id: '', quantity: 0 }]
                  })}
                  className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                >
                  ➕ Add Ingredient
                </button>
              </div>
              {newCake.ingredients.map((ing, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <select
                    value={ing.id}
                    onChange={(e) => {
                      const updated = [...newCake.ingredients];
                      updated[index].id = parseInt(e.target.value);
                      setNewCake({...newCake, ingredients: updated});
                    }}
                    className="flex-1 p-2 border border-gray-300 rounded"
                  >
                    <option value="">Select ingredient...</option>
                    {items.map(item => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.001"
                    value={ing.quantity}
                    onChange={(e) => {
                      const updated = [...newCake.ingredients];
                      updated[index].quantity = parseFloat(e.target.value) || 0;
                      setNewCake({...newCake, ingredients: updated});
                    }}
                    className="w-24 p-2 border border-gray-300 rounded"
                    placeholder="Qty"
                  />
                  <button
                    onClick={() => {
                      const updated = newCake.ingredients.filter((_, i) => i !== index);
                      setNewCake({...newCake, ingredients: updated});
                    }}
                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>

            {/* Sub-Recipes */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">Sub-Recipes</label>
                <button
                  onClick={() => setNewCake({
                    ...newCake,
                    sub_recipes: [...newCake.sub_recipes, { id: '', quantity: 0 }]
                  })}
                  className="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600"
                >
                  ➕ Add Sub-Recipe
                </button>
              </div>
              {newCake.sub_recipes.map((sr, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <select
                    value={sr.id}
                    onChange={(e) => {
                      const updated = [...newCake.sub_recipes];
                      updated[index].id = parseInt(e.target.value);
                      setNewCake({...newCake, sub_recipes: updated});
                    }}
                    className="flex-1 p-2 border border-gray-300 rounded"
                  >
                    <option value="">Select sub-recipe...</option>
                    {subRecipes.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.001"
                    value={sr.quantity}
                    onChange={(e) => {
                      const updated = [...newCake.sub_recipes];
                      updated[index].quantity = parseFloat(e.target.value) || 0;
                      setNewCake({...newCake, sub_recipes: updated});
                    }}
                    className="w-24 p-2 border border-gray-300 rounded"
                    placeholder="Qty"
                  />
                  <button
                    onClick={() => {
                      const updated = newCake.sub_recipes.filter((_, i) => i !== index);
                      setNewCake({...newCake, sub_recipes: updated});
                    }}
                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>

            {/* Mid-Preps */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">Mid-Prep Recipes</label>
                <button
                  onClick={() => setNewCake({
                    ...newCake,
                    mid_preps: [...newCake.mid_preps, { id: '', quantity: 0 }]
                  })}
                  className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600"
                >
                  ➕ Add Mid-Prep
                </button>
              </div>
              {newCake.mid_preps.map((mp, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <select
                    value={mp.id}
                    onChange={(e) => {
                      const updated = [...newCake.mid_preps];
                      updated[index].id = parseInt(e.target.value);
                      setNewCake({...newCake, mid_preps: updated});
                    }}
                    className="flex-1 p-2 border border-gray-300 rounded"
                  >
                    <option value="">Select mid-prep recipe...</option>
                    {midPrepRecipes.map(mp => (
                      <option key={mp.id} value={mp.id}>{mp.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.001"
                    value={mp.quantity}
                    onChange={(e) => {
                      const updated = [...newCake.mid_preps];
                      updated[index].quantity = parseFloat(e.target.value) || 0;
                      setNewCake({...newCake, mid_preps: updated});
                    }}
                    className="w-24 p-2 border border-gray-300 rounded"
                    placeholder="Qty"
                  />
                  <button
                    onClick={() => {
                      const updated = newCake.mid_preps.filter((_, i) => i !== index);
                      setNewCake({...newCake, mid_preps: updated});
                    }}
                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>

            {/* Live Cost Display */}
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded">
              <div className="text-lg font-semibold text-green-700">
                💰 Live Cost Calculation: ${cakeLiveCost.toFixed(4)}
              </div>
              <div className="text-sm text-green-600 mt-1">
                Updates automatically as you add/modify ingredients, sub-recipes, and mid-preps
              </div>
              <div className="text-sm text-blue-600 mt-1">
                Includes {newCake.percent_yield}% yield adjustment
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateCake(false);
                  setNewCake({ name: '', percent_yield: 100, ingredients: [], sub_recipes: [], mid_preps: [] });
                  setCakeLiveCost(0);
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                {t('recipeManagement.actions.cancel')}
              </button>
              <button
                onClick={createCake}
                disabled={loading}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
              >
                {loading ? t('recipeManagement.actions.creating') : 'Create Cake'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Item Card Component
const ItemCard = ({ 
  item, 
  categories, 
  onUpdate, 
  onDelete, 
  showPackages, 
  setShowPackages, 
  onAddPackage, 
  onDeletePackage,
  newPackage,
  setNewPackage,
  t
}) => {
  const [editData, setEditData] = useState({
    name: item.name,
    price_per_unit: item.price_per_unit,
    unit: item.unit,
    category_id: item.category_id || ''
  });

  const handleUpdate = () => {
    onUpdate(item.id, editData);
  };

  const togglePackages = () => {
    setShowPackages(prev => ({
      ...prev,
      [item.id]: !prev[item.id]
    }));
  };

  const handleAddPackage = () => {
    const packageData = newPackage[item.id];
    if (packageData && packageData.package_name && packageData.quantity_per_package > 0) {
      onAddPackage(item.id, packageData);
    }
  };

  return (
    <div className="bg-white border rounded-lg shadow-sm">
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-gray-900">
              📦 {item.name} 
              <span className="text-sm text-gray-500 ml-2">
                ({item.category_name || t('recipeManagement.items.uncategorized')})
              </span>
            </h4>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={togglePackages}
              className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
            >
              📦 {t('recipeManagement.items.packages.title')}
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
            >
              🗑️ {t('recipeManagement.items.delete')}
            </button>
          </div>
        </div>

        {/* Edit Form */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('recipeManagement.items.fields.name')}</label>
            <input
              type="text"
              value={editData.name}
              onChange={(e) => setEditData({...editData, name: e.target.value})}
              className="mt-1 block w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('recipeManagement.items.fields.pricePerUnit')}</label>
            <input
              type="number"
              step="0.00001"
              value={editData.price_per_unit}
              onChange={(e) => setEditData({...editData, price_per_unit: parseFloat(e.target.value)})}
              className="mt-1 block w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('recipeManagement.items.fields.unit')}</label>
            <input
              type="text"
              value={editData.unit}
              onChange={(e) => setEditData({...editData, unit: e.target.value})}
              className="mt-1 block w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('recipeManagement.items.fields.category')}</label>
            <select
              value={editData.category_id}
              onChange={(e) => setEditData({...editData, category_id: e.target.value || null})}
              className="mt-1 block w-full border rounded px-3 py-2"
            >
              <option value="">{t('recipeManagement.items.fields.noCategory')}</option>
              {Array.isArray(categories) && categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={handleUpdate}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            💾 {t('recipeManagement.items.updateItem')}
          </button>
        </div>

        {/* Packages Section */}
        {showPackages[item.id] && (
          <div className="mt-6 border-t pt-4">
            <h5 className="text-lg font-semibold mb-3">📦 {t('recipeManagement.items.packages.packageManagement')}</h5>
            
            {/* Existing Packages */}
            {item.packages && item.packages.length > 0 && (
              <div className="mb-4">
                <h6 className="font-medium mb-2">{t('recipeManagement.items.packages.existingPackages')}:</h6>
                {item.packages.map(pkg => (
                  <div key={pkg.id} className="flex justify-between items-center bg-gray-50 p-3 rounded mb-2">
                    <div>
                      <span className="font-medium">{pkg.package_name}</span>
                      {pkg.is_default && <span className="ml-2 text-yellow-600">⭐</span>}
                      <div className="text-sm text-gray-600">
                        {pkg.quantity_per_package} {pkg.unit} | {pkg.weight_per_item} kg/unit | ${pkg.price_per_package.toFixed(4)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {t('recipeManagement.items.packages.pricing')}: {pkg.is_price_manual ? t('recipeManagement.items.packages.pricingManual') : t('recipeManagement.items.packages.pricingAuto')}
                      </div>
                    </div>
                    <button
                      onClick={() => onDeletePackage(pkg.id)}
                      className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Package */}
            <div className="bg-blue-50 p-4 rounded">
              <h6 className="font-medium mb-3">{t('recipeManagement.items.packages.addNewPackage')}:</h6>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder={t('recipeManagement.items.packages.packageName')}
                  value={newPackage[item.id]?.package_name || ''}
                  onChange={(e) => setNewPackage(prev => ({
                    ...prev,
                    [item.id]: { ...prev[item.id], package_name: e.target.value }
                  }))}
                  className="border rounded px-3 py-2"
                />
                <input
                  type="number"
                  step="0.1"
                  placeholder={t('recipeManagement.items.packages.quantity')}
                  value={newPackage[item.id]?.quantity_per_package || ''}
                  onChange={(e) => setNewPackage(prev => ({
                    ...prev,
                    [item.id]: { ...prev[item.id], quantity_per_package: parseFloat(e.target.value) }
                  }))}
                  className="border rounded px-3 py-2"
                />
                <input
                  type="number"
                  step="0.0001"
                  placeholder={t('recipeManagement.items.packages.weightPerUnit')}
                  value={newPackage[item.id]?.weight_per_item || ''}
                  onChange={(e) => setNewPackage(prev => ({
                    ...prev,
                    [item.id]: { ...prev[item.id], weight_per_item: parseFloat(e.target.value) }
                  }))}
                  className="border rounded px-3 py-2"
                />
              </div>
              <div className="mt-3 flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newPackage[item.id]?.is_default || false}
                    onChange={(e) => setNewPackage(prev => ({
                      ...prev,
                      [item.id]: { ...prev[item.id], is_default: e.target.checked }
                    }))}
                    className="mr-2"
                  />
                  {t('recipeManagement.items.packages.defaultPackage')}
                </label>
                <button
                  onClick={handleAddPackage}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  ➕ {t('recipeManagement.items.packages.addPackage')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Sub-Recipe Card Component
const SubRecipeCard = ({ recipe, onUpdate, onDelete, onOpenEdit, isLoadingEdit, t }) => {
  const handleDelete = () => {
    if (window.confirm(`${t('recipeManagement.deleteConfirm')} "${recipe.name}"?`)) {
      onDelete(recipe.id);
    }
  };

  return (
    <div className="bg-white border rounded-lg shadow-sm p-4">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-gray-900">
            🧪 {recipe.name || 'Unnamed Sub-Recipe'}
            {recipe.error && <span className="text-red-500 text-sm ml-2">(Error loading details)</span>}
          </h4>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onOpenEdit(recipe)}
            disabled={isLoadingEdit}
            className={`px-3 py-1 rounded text-sm ${
              isLoadingEdit 
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {isLoadingEdit ? `⏳ ${t('recipeManagement.actions.loading')}` : `✏️ ${t('recipeManagement.subRecipes.editRecipe')}`}
          </button>
          <button
            onClick={handleDelete}
            disabled={isLoadingEdit}
            className={`px-3 py-1 rounded text-sm ${
              isLoadingEdit 
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : 'bg-red-500 text-white hover:bg-red-600'
            }`}
          >
            🗑️ {t('recipeManagement.actions.delete')}
          </button>
        </div>
      </div>
      
      {/* Ingredients */}
      {recipe.ingredients && recipe.ingredients.length > 0 && (
        <div className="mb-4">
          <h5 className="font-medium mb-2">🥕 {t('recipeManagement.subRecipes.ingredients')}:</h5>
          {recipe.ingredients.map((ing, idx) => (
            <div key={`${ing.id}-${idx}`} className="flex justify-between items-center bg-gray-50 p-2 rounded mb-1">
              <span>{ing.ingredient_name}</span>
              <span className="text-sm text-gray-600">
                {ing.quantity} {ing.unit} × ${ing.price_per_unit} = ${ing.total_cost.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Nested Sub-Recipes */}
      {recipe.nested_sub_recipes && recipe.nested_sub_recipes.length > 0 && (
        <div className="mb-4">
          <h5 className="font-medium mb-2">🔗 {t('recipeManagement.subRecipes.nestedSubRecipes')}:</h5>
          {recipe.nested_sub_recipes.map((nested, idx) => (
            <div key={`${nested.id}-${idx}`} className="bg-blue-50 p-2 rounded mb-1">
              <span>{nested.sub_recipe_name}</span>
              <span className="text-sm text-gray-600 ml-2">{t('recipeManagement.actions.quantity')}: {nested.quantity}</span>
            </div>
          ))}
        </div>
      )}

      <div className="text-lg font-semibold text-green-600">
        💰 {t('recipeManagement.subRecipes.totalCost')}: ${recipe.total_cost ? recipe.total_cost.toFixed(2) : '0.00'}
      </div>
    </div>
  );
};

// Mid-Prep Card Component
const MidPrepCard = ({ recipe, onUpdate, onDelete, onOpenEdit, isLoadingEdit, t }) => {
  const handleDelete = () => {
    if (window.confirm(`${t('recipeManagement.deleteConfirm')} "${recipe.name}"?`)) {
      onDelete(recipe.id);
    }
  };

  return (
    <div className="bg-white border rounded-lg shadow-sm p-4">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-gray-900">
            🍳 {recipe.name || 'Unnamed Mid-Prep Recipe'}
          </h4>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onOpenEdit(recipe)}
            disabled={isLoadingEdit}
            className={`px-3 py-1 rounded text-sm ${
              isLoadingEdit 
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {isLoadingEdit ? `⏳ ${t('recipeManagement.actions.loading')}` : `✏️ ${t('recipeManagement.midPrepRecipes.editRecipe')}`}
          </button>
          <button
            onClick={handleDelete}
            disabled={isLoadingEdit}
            className={`px-3 py-1 rounded text-sm ${
              isLoadingEdit 
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : 'bg-red-500 text-white hover:bg-red-600'
            }`}
          >
            🗑️ {t('recipeManagement.actions.delete')}
          </button>
        </div>
      </div>
      
      {/* Direct Ingredients */}
      {recipe.ingredients && recipe.ingredients.length > 0 && (
        <div className="mb-4">
          <h5 className="font-medium mb-2">🥕 {t('recipeManagement.midPrepRecipes.directIngredients')}:</h5>
          {recipe.ingredients.map((ing, idx) => (
            <div key={`${ing.id}-${idx}`} className="flex justify-between items-center bg-gray-50 p-2 rounded mb-1">
              <span>{ing.ingredient_name}</span>
              <span className="text-sm text-gray-600">
                {ing.quantity} {ing.unit} × ${ing.price_per_unit} = ${ing.total_cost.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Sub-Recipes */}
      {recipe.sub_recipes && recipe.sub_recipes.length > 0 && (
        <div className="mb-4">
          <h5 className="font-medium mb-2">🧪 {t('recipeManagement.midPrepRecipes.subRecipes')}:</h5>
          {recipe.sub_recipes.map((sr, idx) => (
            <div key={`${sr.id}-${idx}`} className="bg-blue-50 p-2 rounded mb-1">
              <span>{sr.sub_recipe_name}</span>
              <span className="text-sm text-gray-600 ml-2">{t('recipeManagement.actions.quantity')}: {sr.quantity}</span>
            </div>
          ))}
        </div>
      )}

      <div className="text-lg font-semibold text-green-600">
        💰 {t('recipeManagement.midPrepRecipes.totalCost')}: ${recipe.total_cost ? recipe.total_cost.toFixed(2) : '0.00'}
      </div>
    </div>
  );
};

// Cake Card Component
const CakeCard = ({ cake, onUpdate, onDelete, onOpenEdit, isLoadingEdit, t }) => {
  const handleDelete = () => {
    if (window.confirm(`${t('recipeManagement.deleteConfirm')} "${cake.name}"?`)) {
      onDelete(cake.id);
    }
  };

  return (
    <div className="bg-white border rounded-lg shadow-sm p-4">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div>
            <h4 className="text-lg font-semibold text-gray-900">
              🎂 {cake.name || 'Unnamed Cake'}
            </h4>
            <span className="text-sm text-gray-600">{t('recipeManagement.cakes.yield')}: {cake.percent_yield || 0}%</span>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onOpenEdit(cake)}
            disabled={isLoadingEdit}
            className={`px-3 py-1 rounded text-sm ${
              isLoadingEdit 
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {isLoadingEdit ? `⏳ ${t('recipeManagement.actions.loading')}` : `✏️ ${t('recipeManagement.cakes.editRecipe')}`}
          </button>
          <button
            onClick={handleDelete}
            disabled={isLoadingEdit}
            className={`px-3 py-1 rounded text-sm ${
              isLoadingEdit 
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : 'bg-red-500 text-white hover:bg-red-600'
            }`}
          >
            🗑️ {t('recipeManagement.actions.delete')}
          </button>
        </div>
      </div>
      
      {/* Ingredients */}
      {cake.ingredients && cake.ingredients.length > 0 && (
        <div className="mb-4">
          <h5 className="font-medium mb-2">🥕 {t('recipeManagement.cakes.ingredients')}:</h5>
          {cake.ingredients.map((ing, idx) => (
            <div key={`${ing.id}-${idx}`} className="flex justify-between items-center bg-gray-50 p-2 rounded mb-1">
              <span>
                {ing.name} 
                <span className="text-xs text-gray-500 ml-2">({ing.type})</span>
                {ing.error && <span className="text-red-500 text-xs ml-2">(Error)</span>}
              </span>
              <span className="text-sm text-gray-600">
                {ing.quantity} × Cost = ${ing.cost ? ing.cost.toFixed(2) : '0.00'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Mid-Preps */}
      {cake.mid_preps && cake.mid_preps.length > 0 && (
        <div className="mb-4">
          <h5 className="font-medium mb-2">🍳 {t('recipeManagement.cakes.midPreps')}:</h5>
          {cake.mid_preps.map((mp, idx) => (
            <div key={`${mp.id}-${idx}`} className="bg-purple-50 p-2 rounded mb-1">
              <span>{mp.name}</span>
              <span className="text-sm text-gray-600 ml-2">
                {mp.quantity} batches × Cost = ${mp.cost ? mp.cost.toFixed(2) : '0.00'}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="border-t pt-3">
        <div className="text-lg font-semibold text-green-600">
          💰 {t('recipeManagement.cakes.totalCostBeforeYield')}: ${cake.total_cost ? cake.total_cost.toFixed(2) : '0.00'}
        </div>
        <div className="text-lg font-semibold text-blue-600">
          💡 {t('recipeManagement.cakes.costAfterYield')}: ${cake.total_cost ? (cake.total_cost * (1 + (cake.percent_yield || 0) / 100)).toFixed(2) : '0.00'}
        </div>
      </div>
    </div>
  );
};

export default ItemManagement; 

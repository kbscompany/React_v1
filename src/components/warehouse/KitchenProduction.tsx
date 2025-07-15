import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, ChefHat, Clock, Package, CheckCircle, AlertTriangle, Info, Search } from 'lucide-react';

interface SubRecipe {
  id: number;
  name: string;
}

interface Cake {
  id: number;
  name: string;
}

interface MidPrep {
  id: number;
  name: string;
}

interface Ingredient {
  ingredient_id: number;
  ingredient_name: string;
  unit: string;
  required_quantity: number;
  price_per_unit: number;
  available_stock: number;
}

interface CakeIngredient {
  item_id: number;
  is_subrecipe: boolean;
  required_quantity: number;
  name: string;
  unit: string;
  available_stock: number;
}

interface ProductionHistory {
  id: number;
  item_id: number;
  item_name: string;
  quantity: number;
  produced_at: string;
  produced_by: string;
  production_type: 'pre-production' | 'mid-production' | 'final-production';
}

interface SubRecipeStock {
  sub_recipe_id: number;
  sub_recipe_name: string;
  quantity: number;
  warehouse_name: string;
}

interface MidPrepStock {
  mid_prep_id: number;
  mid_prep_name: string;
  quantity: number;
  warehouse_name: string;
}

const KitchenProduction: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('pre-production');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Search states
  const [subRecipeSearch, setSubRecipeSearch] = useState('');
  const [midPrepSearch, setMidPrepSearch] = useState('');
  const [cakeSearch, setCakeSearch] = useState('');
  const [stockSearch, setStockSearch] = useState('');
  const [historySearch, setHistorySearch] = useState('');

  // Data states
  const [subRecipes, setSubRecipes] = useState<SubRecipe[]>([]);
  const [midPreps, setMidPreps] = useState<MidPrep[]>([]);
  const [cakes, setCakes] = useState<Cake[]>([]);
  const [productionHistory, setProductionHistory] = useState<ProductionHistory[]>([]);
  const [subRecipeStock, setSubRecipeStock] = useState<SubRecipeStock[]>([]);
  const [midPrepStock, setMidPrepStock] = useState<MidPrepStock[]>([]);

  // Production states
  const [selectedSubRecipes, setSelectedSubRecipes] = useState<Record<number, number>>({});
  const [selectedMidPreps, setSelectedMidPreps] = useState<Record<number, number>>({});
  const [selectedCakes, setSelectedCakes] = useState<Record<number, number>>({});
  const [previewIngredients, setPreviewIngredients] = useState<Record<number, Ingredient[]>>({});
  const [previewMidPrepIngredients, setPreviewMidPrepIngredients] = useState<Record<number, CakeIngredient[]>>({});
  const [previewCakeIngredients, setPreviewCakeIngredients] = useState<Record<number, CakeIngredient[]>>({});

  // Load initial data
  useEffect(() => {
    loadSubRecipes();
    loadMidPreps();
    loadCakes();
    loadProductionHistory();
    loadSubRecipeStock();
    loadMidPrepStock();
  }, []);

  const loadSubRecipes = async () => {
    try {
      const response = await fetch('http://100.29.4.72:8000/api/kitchen/sub-recipes');
      if (response.ok) {
        const data = await response.json();
        setSubRecipes(data);
      }
    } catch (err) {
      console.error('Error loading sub-recipes:', err);
    }
  };

  const loadMidPreps = async () => {
    try {
      const response = await fetch('http://100.29.4.72:8000/api/kitchen/mid-preps');
      if (response.ok) {
        const data = await response.json();
        setMidPreps(data);
      }
    } catch (err) {
      console.error('Error loading mid-preps:', err);
    }
  };

  const loadCakes = async () => {
    try {
      const response = await fetch('http://100.29.4.72:8000/api/kitchen/cakes');
      if (response.ok) {
        const data = await response.json();
        setCakes(data);
      }
    } catch (err) {
      console.error('Error loading cakes:', err);
    }
  };

  const loadProductionHistory = async () => {
    try {
      const response = await fetch('http://100.29.4.72:8000/api/kitchen/production-history');
      if (response.ok) {
        const data = await response.json();
        setProductionHistory(data);
      }
    } catch (err) {
      console.error('Error loading production history:', err);
    }
  };

  const loadSubRecipeStock = async () => {
    try {
      const response = await fetch('http://100.29.4.72:8000/api/kitchen/sub-recipe-stock');
      if (response.ok) {
        const data = await response.json();
        setSubRecipeStock(data);
      }
    } catch (err) {
      console.error('Error loading sub-recipe stock:', err);
    }
  };

  const loadMidPrepStock = async () => {
    try {
      const response = await fetch('http://100.29.4.72:8000/api/kitchen/mid-prep-stock');
      if (response.ok) {
        const data = await response.json();
        setMidPrepStock(data);
      }
    } catch (err) {
      console.error('Error loading mid-prep stock:', err);
    }
  };

  const loadSubRecipeIngredients = async (subRecipeId: number) => {
    try {
      const response = await fetch(`http://100.29.4.72:8000/api/kitchen/sub-recipe/${subRecipeId}/ingredients`);
      if (response.ok) {
        const data = await response.json();
        setPreviewIngredients(prev => ({
          ...prev,
          [subRecipeId]: data
        }));
      }
    } catch (err) {
      console.error('Error loading sub-recipe ingredients:', err);
    }
  };

  const loadMidPrepIngredients = async (midPrepId: number) => {
    try {
      const response = await fetch(`http://100.29.4.72:8000/api/kitchen/mid-prep/${midPrepId}/ingredients`);
      if (response.ok) {
        const data = await response.json();
        setPreviewMidPrepIngredients(prev => ({
          ...prev,
          [midPrepId]: data
        }));
      }
    } catch (err) {
      console.error('Error loading mid-prep ingredients:', err);
    }
  };

  const loadCakeIngredients = async (cakeId: number) => {
    try {
      const response = await fetch(`http://100.29.4.72:8000/api/kitchen/cake/${cakeId}/ingredients`);
      if (response.ok) {
        const data = await response.json();
        setPreviewCakeIngredients(prev => ({
          ...prev,
          [cakeId]: data
        }));
      }
    } catch (err) {
      console.error('Error loading cake ingredients:', err);
    }
  };

  const handleSubRecipeQuantityChange = (subRecipeId: number, quantity: number) => {
    setSelectedSubRecipes(prev => ({
      ...prev,
      [subRecipeId]: quantity
    }));

    if (quantity > 0 && !previewIngredients[subRecipeId]) {
      loadSubRecipeIngredients(subRecipeId);
    }
  };

  const handleMidPrepQuantityChange = (midPrepId: number, quantity: number) => {
    setSelectedMidPreps(prev => ({
      ...prev,
      [midPrepId]: quantity
    }));

    if (quantity > 0 && !previewMidPrepIngredients[midPrepId]) {
      loadMidPrepIngredients(midPrepId);
    }
  };

  const handleCakeQuantityChange = (cakeId: number, quantity: number) => {
    setSelectedCakes(prev => ({
      ...prev,
      [cakeId]: quantity
    }));

    if (quantity > 0 && !previewCakeIngredients[cakeId]) {
      loadCakeIngredients(cakeId);
    }
  };

  const executePreProduction = async () => {
    const subRecipesToProduce = Object.entries(selectedSubRecipes)
      .filter(([_, quantity]) => (quantity as number) > 0)
      .map(([subRecipeId, quantity]) => ({
        sub_recipe_id: parseInt(subRecipeId),
        quantity: quantity as number
      }));

    if (subRecipesToProduce.length === 0) {
      setError('Please select at least one sub-recipe to produce');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in again.');
        setLoading(false);
        return;
      }

      const response = await fetch('http://100.29.4.72:8000/api/kitchen/execute-pre-production', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sub_recipes: subRecipesToProduce,
          warehouse_id: 1  // Main Warehouse (temporary for testing)
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication expired. Please log in again.');
        } else if (response.status === 404) {
          setError('Pre-production endpoint not found. Please check the server configuration.');
        } else if (response.status >= 500) {
          setError('Server error occurred. Please try again later.');
        } else {
          const errorData = await response.json().catch(() => ({ detail: 'Unknown error occurred' }));
          setError(errorData.detail || `Error executing pre-production (${response.status})`);
        }
      } else {
        const result = await response.json();
        const producedItems = result.data?.produced_items || [];
        setSuccess(`Pre-production completed successfully in ${result.data?.warehouse_name}! Produced: ${producedItems.join(', ')}`);
        setSelectedSubRecipes({});
        // Reload data
        loadProductionHistory();
        loadSubRecipeStock();
        loadMidPrepStock();
      }
    } catch (err) {
      console.error('Pre-production error:', err);
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Unable to connect to server. Please check your internet connection and ensure the server is running.');
      } else {
        setError('Network error during pre-production. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const executeMidProduction = async () => {
    const midPrepsToProduced = Object.entries(selectedMidPreps)
      .filter(([_, quantity]) => (quantity as number) > 0)
      .map(([midPrepId, quantity]) => ({
        mid_prep_id: parseInt(midPrepId),
        quantity: quantity as number
      }));

    if (midPrepsToProduced.length === 0) {
      setError('Please select at least one mid-prep recipe to produce');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in again.');
        setLoading(false);
        return;
      }

      const response = await fetch('http://100.29.4.72:8000/api/kitchen/execute-mid-production', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          mid_preps: midPrepsToProduced,
          warehouse_id: 1  // Main Warehouse (temporary for testing)
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication expired. Please log in again.');
        } else if (response.status === 404) {
          setError('Mid-production endpoint not found. Please check the server configuration.');
        } else if (response.status >= 500) {
          setError('Server error occurred. Please try again later.');
        } else {
          const errorData = await response.json().catch(() => ({ detail: 'Unknown error occurred' }));
          setError(errorData.detail || `Error executing mid-production (${response.status})`);
        }
      } else {
        const result = await response.json();
        const producedItems = result.data?.produced_items || [];
        setSuccess(`Mid-production completed successfully in ${result.data?.warehouse_name}! Produced: ${producedItems.join(', ')}`);
        setSelectedMidPreps({});
        // Reload data
        loadProductionHistory();
        loadSubRecipeStock();
        loadMidPrepStock();
      }
    } catch (err) {
      console.error('Mid-production error:', err);
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Unable to connect to server. Please check your internet connection and ensure the server is running.');
      } else {
        setError('Network error during mid-production. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const executeFinalProduction = async () => {
    const cakesToProduce = Object.entries(selectedCakes)
      .filter(([_, quantity]) => (quantity as number) > 0)
      .map(([cakeId, quantity]) => ({
        cake_id: parseInt(cakeId),
        quantity: quantity as number
      }));

    if (cakesToProduce.length === 0) {
      setError('Please select at least one cake to produce');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in again.');
        setLoading(false);
        return;
      }

      const response = await fetch('http://100.29.4.72:8000/api/kitchen/execute-final-production', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cakes: cakesToProduce,
          warehouse_id: 1  // Main Warehouse (temporary for testing)
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication expired. Please log in again.');
        } else if (response.status === 404) {
          setError('Final production endpoint not found. Please check the server configuration.');
        } else if (response.status >= 500) {
          setError('Server error occurred. Please try again later.');
        } else {
          const errorData = await response.json().catch(() => ({ detail: 'Unknown error occurred' }));
          setError(errorData.detail || `Error executing final production (${response.status})`);
        }
      } else {
        const result = await response.json();
        const producedItems = result.data?.produced_items || [];
        setSuccess(`Final production completed successfully in ${result.data?.warehouse_name}! Produced: ${producedItems.join(', ')}`);
        setSelectedCakes({});
        // Reload data
        loadProductionHistory();
      }
    } catch (err) {
      console.error('Final production error:', err);
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Unable to connect to server. Please check your internet connection and ensure the server is running.');
      } else {
        setError('Network error during final production. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const checkStockAvailability = (ingredients: Ingredient[], multiplier: number) => {
    if (!Array.isArray(ingredients)) return false;
    return ingredients.every(ing => ing.available_stock >= ing.required_quantity * multiplier);
  };

  const checkCakeStockAvailability = (ingredients: CakeIngredient[], multiplier: number) => {
    if (!Array.isArray(ingredients)) return false;
    return ingredients.every(ing => ing.available_stock >= ing.required_quantity * multiplier);
  };

  // Filtered data based on search
  const filteredSubRecipes = subRecipes.filter(recipe => 
    recipe.name?.toLowerCase().includes(subRecipeSearch.toLowerCase())
  );

  const filteredMidPreps = midPreps.filter(midPrep => 
    midPrep.name?.toLowerCase().includes(midPrepSearch.toLowerCase())
  );

  const filteredCakes = cakes.filter(cake => 
    cake.name?.toLowerCase().includes(cakeSearch.toLowerCase())
  );

  const filteredSubRecipeStock = subRecipeStock.filter(stock => 
    (stock.sub_recipe_name?.toLowerCase() || '').includes(stockSearch.toLowerCase()) ||
    (stock.warehouse_name?.toLowerCase() || '').includes(stockSearch.toLowerCase())
  );

  const filteredMidPrepStock = midPrepStock.filter(stock => 
    (stock.mid_prep_name?.toLowerCase() || '').includes(stockSearch.toLowerCase()) ||
    (stock.warehouse_name?.toLowerCase() || '').includes(stockSearch.toLowerCase())
  );

  const filteredProductionHistory = productionHistory.filter(history => 
    (history.item_name?.toLowerCase() || '').includes(historySearch.toLowerCase()) ||
    (history.production_type?.toLowerCase() || '').includes(historySearch.toLowerCase()) ||
    (history.produced_by?.toLowerCase() || '').includes(historySearch.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
                  <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <ChefHat className="h-8 w-8" />
            {t('kitchen.title')}
          </h1>
          <p className="text-gray-600">{t('kitchen.subtitle')}</p>
      </div>

      {error && (
        <Alert className="mb-4 border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="pre-production">{t('kitchen.tabs.preProduction')}</TabsTrigger>
          <TabsTrigger value="mid-production">{t('kitchen.tabs.midProduction')}</TabsTrigger>
          <TabsTrigger value="final-production">{t('kitchen.tabs.finalProduction')}</TabsTrigger>
          <TabsTrigger value="stock">{t('kitchen.tabs.stockLevels')}</TabsTrigger>
          <TabsTrigger value="history">{t('kitchen.tabs.productionHistory')}</TabsTrigger>
        </TabsList>

        <TabsContent value="pre-production" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {t('pre_production_title')}
              </CardTitle>
              <CardDescription>
                {t('pre_production_description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder={t('search_sub_recipes_placeholder')}
                    value={subRecipeSearch}
                    onChange={(e) => setSubRecipeSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {filteredSubRecipes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {subRecipeSearch ? t('no_sub_recipes_found_matching_search') : t('no_sub_recipes_available')}
                  </div>
                ) : (
                  filteredSubRecipes.map(subRecipe => (
                  <div key={subRecipe.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">{subRecipe.name}</h3>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          placeholder="Qty"
                          className="w-24"
                          value={selectedSubRecipes[subRecipe.id] || ''}
                          onChange={(e) => handleSubRecipeQuantityChange(subRecipe.id, parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                    
                    {selectedSubRecipes[subRecipe.id] > 0 && previewIngredients[subRecipe.id] && Array.isArray(previewIngredients[subRecipe.id]) && (
                      <div className="mt-3 p-3 bg-gray-50 rounded">
                        <h4 className="font-medium text-sm mb-2">{t('required_ingredients')}:</h4>
                        <div className="space-y-1">
                          {previewIngredients[subRecipe.id].map((ing, index) => {
                            const totalRequired = ing.required_quantity * selectedSubRecipes[subRecipe.id];
                            const hasEnough = ing.available_stock >= totalRequired;
                            
                            return (
                              <div key={`sub-${subRecipe.id}-${ing.ingredient_id}-${index}`} className="flex justify-between items-center text-sm">
                                <span>{ing.ingredient_name}</span>
                                <div className="flex items-center gap-2">
                                  <span>{totalRequired.toFixed(2)} {ing.unit}</span>
                                  <Badge variant={hasEnough ? "default" : "destructive"}>
                                    {ing.available_stock.toFixed(2)} {t('available_stock')}
                                  </Badge>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {!checkStockAvailability(previewIngredients[subRecipe.id], selectedSubRecipes[subRecipe.id]) && (
                          <div className="mt-2 text-red-600 text-sm flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {t('insufficient_stock_for_some_ingredients')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  ))
                )}

                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={executePreProduction}
                    disabled={loading || Object.values(selectedSubRecipes).every(q => (q as number) <= 0)}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('execute_pre_production')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mid-production" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {t('mid_production_title')}
              </CardTitle>
              <CardDescription>
                {t('mid_production_description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder={t('search_mid_prep_recipes_placeholder')}
                    value={midPrepSearch}
                    onChange={(e) => setMidPrepSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {filteredMidPreps.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {midPrepSearch ? t('no_mid_prep_recipes_found_matching_search') : t('no_mid_prep_recipes_available')}
                  </div>
                ) : (
                  filteredMidPreps.map(midPrep => (
                  <div key={midPrep.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">{midPrep.name}</h3>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          placeholder="Qty"
                          className="w-24"
                          value={selectedMidPreps[midPrep.id] || ''}
                          onChange={(e) => handleMidPrepQuantityChange(midPrep.id, parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                    
                    {selectedMidPreps[midPrep.id] > 0 && previewMidPrepIngredients[midPrep.id] && Array.isArray(previewMidPrepIngredients[midPrep.id]) && (
                      <div className="mt-3 p-3 bg-gray-50 rounded">
                        <h4 className="font-medium text-sm mb-2">{t('required_items')}:</h4>
                        <div className="space-y-1">
                          {previewMidPrepIngredients[midPrep.id].map((item, index) => {
                            const totalRequired = item.required_quantity * selectedMidPreps[midPrep.id];
                            const hasEnough = item.available_stock >= totalRequired;
                            
                            return (
                              <div key={`midprep-${midPrep.id}-${item.item_id}-${index}`} className="flex justify-between items-center text-sm">
                                <span className="flex items-center gap-1">
                                  {item.is_subrecipe && <span className="text-blue-600">🧪</span>}
                                  {item.name}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span>{totalRequired.toFixed(2)} {item.unit}</span>
                                  <Badge variant={hasEnough ? "default" : "destructive"}>
                                    {item.available_stock.toFixed(2)} {t('available_stock')}
                                  </Badge>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {!checkCakeStockAvailability(previewMidPrepIngredients[midPrep.id], selectedMidPreps[midPrep.id]) && (
                          <div className="mt-2 text-red-600 text-sm flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {t('insufficient_stock_for_some_items')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  ))
                )}

                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={executeMidProduction}
                    disabled={loading || Object.values(selectedMidPreps).every(q => (q as number) <= 0)}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('execute_mid_production')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="final-production" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="h-5 w-5" />
                {t('final_production_title')}
              </CardTitle>
              <CardDescription>
                {t('final_production_description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder={t('search_cakes_placeholder')}
                    value={cakeSearch}
                    onChange={(e) => setCakeSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {filteredCakes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {cakeSearch ? t('no_cakes_found_matching_search') : t('no_cakes_available')}
                  </div>
                ) : (
                  filteredCakes.map(cake => (
                  <div key={cake.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">{cake.name}</h3>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          placeholder="Qty"
                          className="w-24"
                          value={selectedCakes[cake.id] || ''}
                          onChange={(e) => handleCakeQuantityChange(cake.id, parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                    
                    {selectedCakes[cake.id] > 0 && previewCakeIngredients[cake.id] && Array.isArray(previewCakeIngredients[cake.id]) && (
                      <div className="mt-3 p-3 bg-gray-50 rounded">
                        <h4 className="font-medium text-sm mb-2">{t('required_items')}:</h4>
                        <div className="space-y-1">
                          {previewCakeIngredients[cake.id].map((item, index) => {
                            const totalRequired = item.required_quantity * selectedCakes[cake.id];
                            const hasEnough = item.available_stock >= totalRequired;
                            
                            return (
                              <div key={`cake-${cake.id}-${item.item_id}-${index}`} className="flex justify-between items-center text-sm">
                                <span className="flex items-center gap-1">
                                  {item.is_subrecipe && <span className="text-blue-600">🧪</span>}
                                  {item.name}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span>{totalRequired.toFixed(2)} {item.unit}</span>
                                  <Badge variant={hasEnough ? "default" : "destructive"}>
                                    {item.available_stock.toFixed(2)} {t('available_stock')}
                                  </Badge>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {!checkCakeStockAvailability(previewCakeIngredients[cake.id], selectedCakes[cake.id]) && (
                          <div className="mt-2 text-red-600 text-sm flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {t('insufficient_stock_for_some_items')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  ))
                )}

                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={executeFinalProduction}
                    disabled={loading || Object.values(selectedCakes).every(q => (q as number) <= 0)}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('execute_final_production')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stock" className="mt-6">
          <div className="space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={t('search_stock_items_placeholder')}
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {t('sub_recipe_stock_title')}
                </CardTitle>
                <CardDescription>
                  {t('sub_recipe_stock_description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredSubRecipeStock.map(stock => (
                    <div key={stock.sub_recipe_id} className="flex justify-between items-center p-3 border rounded">
                      <span className="font-medium flex items-center gap-2">
                        <span className="text-blue-600">🧪</span>
                        {stock.sub_recipe_name}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge variant={stock.quantity > 0 ? "default" : "secondary"}>
                          {stock.quantity.toFixed(2)} {t('units')}
                        </Badge>
                        <span className="text-sm text-gray-500">{stock.warehouse_name}</span>
                      </div>
                    </div>
                  ))}
                  {filteredSubRecipeStock.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      {stockSearch ? t('no_sub_recipe_stock_found_matching_search') : t('no_sub_recipe_stock_available')}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {t('mid_prep_stock_title')}
                </CardTitle>
                <CardDescription>
                  {t('mid_prep_stock_description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredMidPrepStock.map(stock => (
                    <div key={stock.mid_prep_id} className="flex justify-between items-center p-3 border rounded">
                      <span className="font-medium flex items-center gap-2">
                        <span className="text-orange-600">🥘</span>
                        {stock.mid_prep_name}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge variant={stock.quantity > 0 ? "default" : "secondary"}>
                          {stock.quantity.toFixed(2)} {t('units')}
                        </Badge>
                        <span className="text-sm text-gray-500">{stock.warehouse_name}</span>
                      </div>
                    </div>
                  ))}
                  {filteredMidPrepStock.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      {stockSearch ? t('no_mid_prep_stock_found_matching_search') : t('no_mid_prep_stock_available')}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {t('production_history_title')}
              </CardTitle>
              <CardDescription>
                {t('production_history_description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder={t('search_production_history_placeholder')}
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="space-y-2">
                  {filteredProductionHistory.map(record => (
                  <div key={`${record.production_type}-${record.id}`} className="flex justify-between items-center p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <Badge variant={
                        record.production_type === 'pre-production' ? "default" : 
                        record.production_type === 'mid-production' ? "secondary" : 
                        "outline"
                      }>
                        {record.production_type === 'pre-production' ? '🧪' : 
                         record.production_type === 'mid-production' ? '🥘' : '🎂'}
                      </Badge>
                      <div>
                        <div className="font-medium">{record.item_name}</div>
                        <div className="text-sm text-gray-500">
                          {t('quantity')}: {record.quantity} | {t('produced_by')}: {record.produced_by}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(record.produced_at).toLocaleString()}
                    </div>
                  </div>
                ))}
                {filteredProductionHistory.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {historySearch ? t('no_production_history_found_matching_search') : t('no_production_history_available')}
                  </div>
                )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default KitchenProduction; 
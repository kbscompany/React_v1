import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const BatchProductionCalculator = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCakes, setSelectedCakes] = useState({});
  const [calculationResult, setCalculationResult] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [sessionDescription, setSessionDescription] = useState('');
  const [showSessionManager, setShowSessionManager] = useState(false);
  const searchInputRef = useRef(null);

  // Search for cakes
  const searchCakes = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await axios.get(`/api/batch/cakes/search?q=${query}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching cakes:', error);
      setSearchResults([]);
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    searchCakes(value);
  };

  // Handle Enter key press in search
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter' && searchResults.length > 0) {
      e.preventDefault();
      addCake(searchResults[0]);
    }
  };

  // Add cake to selection
  const addCake = (cake) => {
    setSelectedCakes(prev => ({
      ...prev,
      [cake.id]: { ...cake, quantity: 1 }
    }));
    setSearchTerm('');
    setSearchResults([]);
    setError('');
    
    // Focus back on search input
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Update cake quantity
  const updateQuantity = (cakeId, quantity) => {
    if (quantity <= 0) {
      removeCake(cakeId);
      return;
    }
    
    setSelectedCakes(prev => ({
      ...prev,
      [cakeId]: { ...prev[cakeId], quantity: Number(quantity) }
    }));
  };

  // Remove cake from selection
  const removeCake = (cakeId) => {
    setSelectedCakes(prev => {
      const newSelected = { ...prev };
      delete newSelected[cakeId];
      return newSelected;
    });
  };

  // Calculate batch production
  const calculateBatch = async () => {
    const cakeQuantities = Object.fromEntries(
      Object.entries(selectedCakes).map(([id, cake]) => [id, cake.quantity])
    );

    if (Object.keys(cakeQuantities).length < 2) {
      setError(t('Batch production requires at least 2 different cakes'));
      return;
    }

    setLoading(true);
    setError('');
    setCalculationResult(null);

    try {
      console.log('🧮 Sending batch calculation request:', { cake_quantities: cakeQuantities });
      
      const response = await axios.post('/api/batch/calculate', {
        cake_quantities: cakeQuantities
      });
      
      console.log('📊 Batch calculation response:', response.data);
      
      // Validate response structure
      if (!response.data) {
        throw new Error('Empty response from server');
      }
      
      if (typeof response.data.total_cost === 'undefined') {
        console.warn('⚠️ total_cost is undefined in response');
      }
      
      if (!response.data.total_ingredients) {
        console.warn('⚠️ total_ingredients is missing from response');
      }
      
      if (!response.data.sub_recipe_summary) {
        console.warn('⚠️ sub_recipe_summary is missing from response');
      }
      
      setCalculationResult(response.data);
      setSuccess(t('Batch calculation completed successfully!'));
      
    } catch (error) {
      console.error('❌ Batch calculation error:', error);
      console.error('❌ Error response:', error.response?.data);
      
      if (error.response?.status === 422) {
        setError(`Validation Error: ${error.response?.data?.detail || 'Invalid request data'}`);
      } else if (error.response?.status === 500) {
        setError(`Server Error: ${error.response?.data?.detail || 'Internal server error'}`);
      } else {
        setError(error.response?.data?.detail || error.message || t('Error calculating batch production'));
      }
      setCalculationResult(null);
    } finally {
      setLoading(false);
    }
  };

  // Load sessions
  const loadSessions = async () => {
    try {
      const response = await axios.get('/api/batch/sessions');
      setSessions(response.data);
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  // Save session
  const saveSession = async () => {
    if (!sessionName.trim()) {
      setError(t('Please enter a session name'));
      return;
    }

    const cakeQuantities = Object.fromEntries(
      Object.entries(selectedCakes).map(([id, cake]) => [id, cake.quantity])
    );

    if (Object.keys(cakeQuantities).length === 0) {
      setError(t('No cakes to save'));
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/batch/sessions', {
        session_name: sessionName,
        description: sessionDescription,
        cake_quantities: cakeQuantities,
        total_cost: calculationResult?.total_cost || 0
      });
      
      setSuccess(t('Session saved successfully!'));
      setShowSaveModal(false);
      setSessionName('');
      setSessionDescription('');
      loadSessions();
    } catch (error) {
      setError(error.response?.data?.detail || t('Error saving session'));
    } finally {
      setLoading(false);
    }
  };

  // Load session
  const loadSession = async (sessionId) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/batch/sessions/${sessionId}`);
      const session = response.data;
      
      // Convert session items to selectedCakes format
      const newSelectedCakes = {};
      session.items.forEach(item => {
        newSelectedCakes[item.cake_id] = {
          id: item.cake_id,
          name: item.cake.name,
          quantity: Number(item.quantity)
        };
      });
      
      setSelectedCakes(newSelectedCakes);
      setCalculationResult(null);
      setSuccess(t(`Session "${session.session_name}" loaded successfully!`));
      setShowSessionManager(false);
    } catch (error) {
      setError(error.response?.data?.detail || t('Error loading session'));
    } finally {
      setLoading(false);
    }
  };

  // Delete session
  const deleteSession = async (sessionId) => {
    if (!window.confirm(t('Are you sure you want to delete this session?'))) {
      return;
    }

    try {
      await axios.delete(`/api/batch/sessions/${sessionId}`);
      setSuccess(t('Session deleted successfully!'));
      loadSessions();
    } catch (error) {
      setError(error.response?.data?.detail || t('Error deleting session'));
    }
  };

  // Clear all
  const clearAll = () => {
    setSelectedCakes({});
    setCalculationResult(null);
    setError('');
    setSuccess('');
  };

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            🧮 {t('Batch Production Calculator')}
          </h1>
          <p className="text-gray-600 mt-2">
            {t('Calculate ingredients and costs for multiple cake production')}
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowSessionManager(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            📂 {t('Sessions')}
          </button>
          <button
            onClick={clearAll}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            🗑️ {t('Clear All')}
          </button>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          ❌ {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          ✅ {success}
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">🔍 {t('Add Cakes to Batch')}</h2>
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            placeholder={t('Search cakes and press Enter to add...')}
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyPress={handleSearchKeyPress}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map(cake => (
                <button
                  key={cake.id}
                  onClick={() => addCake(cake)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  🎂 {cake.name}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <p className="text-sm text-gray-500 mt-2">
          💡 {t('Tip: Search for cakes and press Enter to quickly add them to your batch')}
        </p>
      </div>

      {/* Selected Cakes */}
      {Object.keys(selectedCakes).length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">🎂 {t('Selected Cakes')}</h2>
            <button
              onClick={calculateBatch}
              disabled={loading || Object.keys(selectedCakes).length < 2}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '⏳' : '🧮'} {t('Calculate Batch')}
            </button>
          </div>

          <div className="grid gap-4">
            {Object.values(selectedCakes).map(cake => (
              <div key={cake.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">🎂</span>
                  <span className="font-medium">{cake.name}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    min="0"
                    step="0.00001"
                    value={cake.quantity}
                    onChange={(e) => updateQuantity(cake.id, e.target.value)}
                    className="w-24 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-500">{t('cakes')}</span>
                  <button
                    onClick={() => removeCake(cake.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>

          {Object.keys(selectedCakes).length < 2 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              ⚠️ {t('Add at least 2 different cakes to enable batch calculation')}
            </div>
          )}
        </div>
      )}

      {/* Calculation Results */}
      {calculationResult && (
        <div className="space-y-6">
          {/* Total Cost */}
          <div className="bg-green-50 p-6 rounded-lg border border-green-200">
            <h2 className="text-2xl font-bold text-green-800 mb-2">
              💰 {t('Total Batch Cost')}: ${Number(calculationResult.total_cost || 0).toFixed(2)}
            </h2>
            <button
              onClick={() => setShowSaveModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              💾 {t('Save Session')}
            </button>
          </div>

          {/* Total Ingredients */}
          {calculationResult.total_ingredients && calculationResult.total_ingredients.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-xl font-semibold mb-4">📦 {t('Total Ingredients Required')}</h3>
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-3">{t('Ingredient')}</th>
                      <th className="text-left p-3">{t('Quantity')}</th>
                      <th className="text-left p-3">{t('Unit')}</th>
                      <th className="text-left p-3">{t('Cost')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculationResult.total_ingredients.map((ingredient, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="p-3 font-medium">{ingredient.ingredient_name || 'Unknown'}</td>
                        <td className="p-3">{Number(ingredient.quantity || 0).toFixed(5)}</td>
                        <td className="p-3">{ingredient.unit || ''}</td>
                        <td className="p-3">${Number(ingredient.cost || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub-Recipe Summary */}
          {calculationResult.sub_recipe_summary && calculationResult.sub_recipe_summary.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-xl font-semibold mb-4">🧪 {t('Sub-Recipe Summary')}</h3>
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-3">{t('Sub-Recipe')}</th>
                      <th className="text-left p-3">{t('Quantity Used')}</th>
                      <th className="text-left p-3">{t('Unit Cost')}</th>
                      <th className="text-left p-3">{t('Total Cost')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculationResult.sub_recipe_summary.map((subrecipe, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="p-3 font-medium">{subrecipe.sub_recipe_name || 'Unknown'}</td>
                        <td className="p-3">{Number(subrecipe.quantity_used || 0).toFixed(5)}</td>
                        <td className="p-3">${Number(subrecipe.unit_cost || 0).toFixed(2)}</td>
                        <td className="p-3">${Number(subrecipe.total_cost || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Debug Information */}
          {(!calculationResult.total_ingredients || calculationResult.total_ingredients.length === 0) && (
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              ⚠️ {t('No ingredients found in calculation result. This might indicate an issue with the recipe data.')}
            </div>
          )}
        </div>
      )}

      {/* Save Session Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">💾 {t('Save Session')}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('Session Name')}
                </label>
                <input
                  type="text"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder={t('e.g., Birthday Batch')}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('Description (optional)')}
                </label>
                <textarea
                  value={sessionDescription}
                  onChange={(e) => setSessionDescription(e.target.value)}
                  placeholder={t('Brief description of the batch...')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                {t('Cancel')}
              </button>
              <button
                onClick={saveSession}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? '⏳' : '💾'} {t('Save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Manager Modal */}
      {showSessionManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">📂 {t('Session Manager')}</h3>
              <button
                onClick={() => setShowSessionManager(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            {sessions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                📭 {t('No saved sessions yet')}
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map(session => (
                  <div key={session.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{session.session_name}</h4>
                      <p className="text-gray-600 text-sm">
                        {session.description || t('No description')}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>🎂 {session.item_count} {t('cakes')}</span>
                        <span>💰 ${session.total_cost.toFixed(2)}</span>
                        <span>📅 {new Date(session.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => loadSession(session.id)}
                        className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        📥 {t('Load')}
                      </button>
                      <button
                        onClick={() => deleteSession(session.id)}
                        className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                      >
                        🗑️ {t('Delete')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchProductionCalculator; 
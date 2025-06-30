import React, { useState } from 'react';
import axios from 'axios';

const BatchProductionCalculatorSimple = () => {
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const testCalculation = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      console.log('🧮 Starting test calculation...');
      
      // Hardcoded test data - 2 cakes
      const testData = {
        cake_quantities: {
          "1": 2,
          "2": 3
        }
      };
      
      console.log('📤 Sending:', testData);
      
      const response = await axios.post('/api/batch/calculate', testData);
      
      console.log('📊 Response:', response.data);
      
      setResult(response.data);
      
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.response?.data?.detail || err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">🧮 Simple Batch Calculator Test</h1>
      
      <button
        onClick={testCalculation}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? '⏳ Testing...' : '🧮 Test Batch Calculation'}
      </button>
      
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
          <strong>❌ Error:</strong> {error}
        </div>
      )}
      
      {result && (
        <div className="mt-4 space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded">
            <h2 className="font-bold">✅ Success!</h2>
            <p><strong>Total Cost:</strong> ${result.total_cost || 0}</p>
            <p><strong>Ingredients:</strong> {result.total_ingredients?.length || 0}</p>
            <p><strong>Sub-Recipes:</strong> {result.sub_recipe_summary?.length || 0}</p>
          </div>
          
          <details className="p-4 border rounded">
            <summary className="font-bold cursor-pointer">📋 Full Response Data</summary>
            <pre className="mt-2 text-sm overflow-auto bg-gray-100 p-2 rounded">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default BatchProductionCalculatorSimple; 
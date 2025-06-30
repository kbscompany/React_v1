import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { transferTemplateAPI, warehouseAPI } from '../../services/api';

interface TransferTemplate {
  id: number;
  name: string;
  description: string;
  source_warehouse_id: number;
  target_warehouse_id: number;
  items: TemplateItem[];
  created_at: string;
  total_items: number;
}

interface TemplateItem {
  id: number;
  ingredient_id: number;
  suggested_quantity: number;
  notes?: string;
  ingredient: {
    id: number;
    name: string;
    unit: string;
    category_id: number;
    price_per_unit: number;
  };
}

interface Warehouse {
  id: number;
  name: string;
  location?: string;
}

interface TransferTemplateManagerProps {
  onLoadTemplate: (template: any) => void;
}

const TransferTemplateManager: React.FC<TransferTemplateManagerProps> = ({ onLoadTemplate }) => {
  const [templates, setTemplates] = useState<TransferTemplate[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    source_warehouse_id: '',
    target_warehouse_id: ''
  });

  useEffect(() => {
    loadTemplates();
    loadWarehouses();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await transferTemplateAPI.getAll();
      setTemplates(response.data);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWarehouses = async () => {
    try {
      const response = await warehouseAPI.getAll();
      setWarehouses(response.data);
    } catch (error) {
      console.error('Error loading warehouses:', error);
    }
  };

  const handleLoadTemplate = async (templateId: number) => {
    try {
      const response = await transferTemplateAPI.load(templateId);
      onLoadTemplate(response.data);
    } catch (error) {
      console.error('Error loading template:', error);
    }
  };

  const handleDeleteTemplate = async (templateId: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      await transferTemplateAPI.delete(templateId);
      loadTemplates(); // Refresh list
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getWarehouseName = (warehouseId: number) => {
    const warehouse = warehouses.find(w => w.id === warehouseId);
    return warehouse?.name || `Warehouse ${warehouseId}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Transfer Templates</h2>
          <p className="text-gray-600">Manage reusable transfer configurations</p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {showCreateForm ? 'Cancel' : '+ Create Template'}
        </Button>
      </div>

      {/* Search */}
      <div className="flex space-x-4">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      {/* Create Template Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Template</CardTitle>
            <CardDescription>
              Create a template from your current transfer configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="templateName">Template Name</Label>
                <Input
                  id="templateName"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Daily Bakery Transfer"
                />
              </div>
              <div>
                <Label htmlFor="templateDescription">Description</Label>
                <Input
                  id="templateDescription"
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Template description..."
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sourceWarehouse">Source Warehouse</Label>
                <Select value={newTemplate.source_warehouse_id} onValueChange={(value) => 
                  setNewTemplate(prev => ({ ...prev, source_warehouse_id: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map(warehouse => (
                      <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                        {warehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="targetWarehouse">Target Warehouse</Label>
                <Select value={newTemplate.target_warehouse_id} onValueChange={(value) => 
                  setNewTemplate(prev => ({ ...prev, target_warehouse_id: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map(warehouse => (
                      <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                        {warehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button 
                onClick={() => setShowCreateForm(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700"
                disabled={!newTemplate.name || !newTemplate.source_warehouse_id || !newTemplate.target_warehouse_id}
              >
                Create Template
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Templates List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading templates...</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
                <p className="text-gray-600">
                  {searchTerm ? 'No templates match your search.' : 'Create your first transfer template to get started.'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredTemplates.map(template => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {template.total_items} items
                      </span>
                    </div>
                    
                    {template.description && (
                      <p className="text-gray-600 mb-3">{template.description}</p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>
                        <strong>From:</strong> {getWarehouseName(template.source_warehouse_id)}
                      </span>
                      <span>→</span>
                      <span>
                        <strong>To:</strong> {getWarehouseName(template.target_warehouse_id)}
                      </span>
                      <span>•</span>
                      <span>
                        Created: {new Date(template.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <Button
                      onClick={() => handleLoadTemplate(template.id)}
                      className="bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      Load Template
                    </Button>
                    
                    <Button
                      onClick={() => handleDeleteTemplate(template.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:border-red-600"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                
                {/* Template Items Preview */}
                {template.items && template.items.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Items in this template:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {template.items.slice(0, 8).map(item => (
                        <div key={item.id} className="text-xs bg-gray-50 px-2 py-1 rounded">
                          <span className="font-medium">{item.ingredient.name}</span>
                          <span className="text-gray-500 ml-1">({item.suggested_quantity} {item.ingredient.unit})</span>
                        </div>
                      ))}
                      {template.items.length > 8 && (
                        <div className="text-xs text-gray-500 px-2 py-1">
                          +{template.items.length - 8} more...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default TransferTemplateManager; 
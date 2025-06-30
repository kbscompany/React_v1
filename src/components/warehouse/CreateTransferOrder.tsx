import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Trash2, Plus, TrendingDown, Save, FolderOpen, Bookmark } from 'lucide-react';
import { transferTemplateAPI, stockAPI } from '../../services/api';

const CreateTransferOrder = ({ warehouses, onNotification }: any) => {
  const { t } = useTranslation();
  const [sourceWarehouse, setSourceWarehouse] = useState('');
  const [targetWarehouse, setTargetWarehouse] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [sourceStock, setSourceStock] = useState([]);
  const [transferItems, setTransferItems] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('quick');
  
  // Quick add form
  const [selectedIngredient, setSelectedIngredient] = useState('');
  const [quantity, setQuantity] = useState('');

  // Template-related state
  const [templates, setTemplates] = useState([]);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [showLoadTemplate, setShowLoadTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');

  // Load ingredients on mount
  useEffect(() => {
    loadIngredients();
  }, []);

  // Load source stock when source warehouse changes
  useEffect(() => {
    if (sourceWarehouse) {
      loadSourceStock();
    }
  }, [sourceWarehouse]);

  // Load low stock items when both warehouses are selected
  useEffect(() => {
    if (sourceWarehouse && targetWarehouse && sourceWarehouse !== targetWarehouse) {
      loadLowStockItems();
    }
  }, [sourceWarehouse, targetWarehouse]);

  // Add template loading effect
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadIngredients = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/warehouse/ingredients');
      if (!response.ok) throw new Error('Failed to load ingredients');
      const data = await response.json();
      setIngredients(data);
    } catch (error) {
      console.error('Error loading ingredients:', error);
      onNotification('error', 'Failed to load ingredients');
    }
  };

  const loadSourceStock = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/warehouse/warehouses/${sourceWarehouse}/stock`);
      if (!response.ok) throw new Error('Failed to load stock');
      const data = await response.json();
      setSourceStock(data.filter((item: any) => item.quantity > 0));
    } catch (error) {
      console.error('Error loading source stock:', error);
      onNotification('error', 'Failed to load source warehouse stock');
    }
  };

  const loadLowStockItems = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/warehouse/ingredients/low-stock/${sourceWarehouse}/${targetWarehouse}`);
      if (!response.ok) throw new Error('Failed to load low stock items');
      const data = await response.json();
      setLowStockItems(data);
    } catch (error) {
      console.error('Error loading low stock items:', error);
      onNotification('error', 'Failed to load low stock suggestions');
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await transferTemplateAPI.getAll();
      setTemplates(response.data);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const addQuickItem = () => {
    if (!selectedIngredient || !quantity || parseFloat(quantity) <= 0) {
      onNotification('error', 'Please select an ingredient and enter a valid quantity');
      return;
    }

    const ingredient = ingredients.find((ing: any) => ing.id.toString() === selectedIngredient);
    const stockItem = sourceStock.find((stock: any) => stock.ingredient_id.toString() === selectedIngredient);
    
    if (!ingredient || !stockItem) {
      onNotification('error', 'Ingredient not found or not available in source warehouse');
      return;
    }

    const requestedQty = parseFloat(quantity);
    if (requestedQty > stockItem.quantity) {
      onNotification('error', `Insufficient stock. Available: ${stockItem.quantity} ${ingredient.unit}`);
      return;
    }

    // Check if item already exists
    const existingIndex = transferItems.findIndex((item: any) => item.ingredient_id.toString() === selectedIngredient);
    
    if (existingIndex >= 0) {
      // Update existing item
      const updatedItems = [...transferItems];
      updatedItems[existingIndex].quantity = requestedQty;
      setTransferItems(updatedItems);
    } else {
      // Add new item
      const newItem = {
        ingredient_id: ingredient.id,
        ingredient_name: ingredient.name,
        unit: ingredient.unit,
        quantity: requestedQty,
        available: stockItem.quantity,
        method: 'Quick Add'
      };
      setTransferItems([...transferItems, newItem]);
    }

    setSelectedIngredient('');
    setQuantity('');
    onNotification('success', `Added ${ingredient.name} to transfer order`);
  };

  const addLowStockItems = (items: any[]) => {
    const newItems: any[] = [];
    
    items.forEach(item => {
      const existingIndex = transferItems.findIndex((existing: any) => existing.ingredient_id === item.ingredient_id);
      
      if (existingIndex >= 0) {
        // Update existing item
        const updatedItems = [...transferItems];
        updatedItems[existingIndex].quantity = item.suggested_quantity;
        setTransferItems(updatedItems);
      } else {
        // Add new item
        newItems.push({
          ingredient_id: item.ingredient_id,
          ingredient_name: item.ingredient_name,
          unit: item.unit,
          quantity: item.suggested_quantity,
          available: item.source_quantity,
          method: 'Low Stock Suggestion'
        });
      }
    });

    if (newItems.length > 0) {
      setTransferItems((prev: any) => [...prev, ...newItems]);
      onNotification('success', `Added ${newItems.length} items from low stock suggestions`);
    }
  };

  const removeTransferItem = (index: number) => {
    setTransferItems(transferItems.filter((_: any, i: number) => i !== index));
  };

  const createTransferOrder = async () => {
    if (!sourceWarehouse || !targetWarehouse) {
      onNotification('error', 'Please select both source and destination warehouses');
      return;
    }

    if (transferItems.length === 0) {
      onNotification('error', 'Please add at least one item to the transfer order');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/warehouse/transfer-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source_warehouse_id: parseInt(sourceWarehouse),
          target_warehouse_id: parseInt(targetWarehouse),
          items: transferItems.map((item: any) => ({
            ingredient_id: item.ingredient_id,
            quantity: item.quantity
          }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create transfer order');
      }

      const result = await response.json();
      onNotification('success', `Transfer order #${result.transfer_order_id} created successfully`);
      
      // Reset form
      setTransferItems([]);
      setSourceWarehouse('');
      setTargetWarehouse('');
      
    } catch (error) {
      console.error('Error creating transfer order:', error);
      onNotification('error', error instanceof Error ? error.message : 'Failed to create transfer order');
    } finally {
      setLoading(false);
    }
  };

  const saveAsTemplate = async () => {
    if (!templateName.trim()) {
      onNotification('error', 'Please enter a template name');
      return;
    }

    if (!sourceWarehouse || !targetWarehouse || transferItems.length === 0) {
      onNotification('error', 'Please configure warehouses and add items before saving as template');
      return;
    }

    try {
      const templateData = {
        template_name: templateName,
        description: templateDescription,
        source_warehouse_id: parseInt(sourceWarehouse),
        target_warehouse_id: parseInt(targetWarehouse),
        items: transferItems.map((item: any) => ({
          ingredient_id: item.ingredient_id,
          quantity: item.quantity
        }))
      };

      // Call the actual API to save the template
      const response = await transferTemplateAPI.save(templateData);
      onNotification('success', `Template "${templateName}" saved successfully!`);
      
      setShowSaveTemplate(false);
      setTemplateName('');
      setTemplateDescription('');
      loadTemplates(); // Refresh templates list
    } catch (error) {
      console.error('Error saving template:', error);
      onNotification('error', 'Failed to save template');
    }
  };

  const loadTemplate = async (template: any) => {
    try {
      // Use the API to load the full template data
      const response = await transferTemplateAPI.load(template.id);
      const templateData = response.data;
      
      setSourceWarehouse(templateData.source_warehouse_id?.toString() || '');
      setTargetWarehouse(templateData.target_warehouse_id?.toString() || '');
      
      // Fetch actual stock data for the source warehouse
      let stockData: any[] = [];
      try {
        const stockResponse = await stockAPI.getWarehouseStock(templateData.source_warehouse_id);
        stockData = stockResponse.data;
      } catch (error) {
        console.error('Error fetching stock data:', error);
      }
      
      // Convert template items to transfer items with real available quantities
      const templateTransferItems = templateData.items.map((item: any) => {
        // Find the actual stock for this ingredient
        const stockItem = stockData.find((stock: any) => stock.ingredient_id === item.ingredient_id);
        
        return {
          ingredient_id: item.ingredient_id,
          ingredient_name: item.ingredient_name || `Ingredient ${item.ingredient_id}`, // Fallback if name is empty
          unit: stockItem?.unit || 'kg', // Use actual unit from stock or default to kg
          quantity: item.suggested_quantity,
          available: stockItem?.quantity || 0, // Use real available quantity or 0 if not found
          method: 'Template'
        };
      });
      
      setTransferItems(templateTransferItems);
      setShowLoadTemplate(false);
      
      onNotification('success', `Template "${templateData.template_name}" loaded successfully!`);
    } catch (error) {
      console.error('Error loading template:', error);
      onNotification('error', 'Failed to load template');
    }
  };

  const availableStock = sourceStock.filter((stock: any) => 
    stock && 
    stock.ingredient_id !== undefined && 
    stock.ingredient_id !== null &&
    !transferItems.some((item: any) => item.ingredient_id === stock.ingredient_id)
  );

  return (
    <div className="space-y-6">
      {/* Header with Template Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('warehouse.create.title')}</h2>
          <p className="text-gray-600">{t('warehouse.create.subtitle')}</p>
        </div>
        
        <div className="flex space-x-2">
          {/* Load Template Button */}
          <Dialog open={showLoadTemplate} onOpenChange={setShowLoadTemplate}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center space-x-2">
                <FolderOpen className="h-4 w-4" />
                <span>{t('warehouse.create.loadTemplate')}</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>{t('warehouse.create.loadTransferTemplate')}</DialogTitle>
                <DialogDescription>
                  {t('warehouse.create.selectSavedTemplate')}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {templates.length === 0 ? (
                  <div className="text-center py-8">
                    <Bookmark className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{t('warehouse.create.noTemplatesFound')}</h3>
                    <p className="text-gray-600">{t('warehouse.create.createFirstTemplate')}</p>
                  </div>
                ) : (
                  templates.map((template: any) => (
                    <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-semibold">{template.name}</h3>
                              <Badge variant="secondary">{template.total_items} {t('createTransferOrder.items')}</Badge>
                            </div>
                            
                            {template.description && (
                              <p className="text-gray-600 text-sm mb-2">{template.description}</p>
                            )}
                            
                            <div className="text-sm text-gray-500">
                              <span>{warehouses.find((w: any) => w.id === template.source_warehouse_id)?.name} → </span>
                              <span>{warehouses.find((w: any) => w.id === template.target_warehouse_id)?.name}</span>
                            </div>
                          </div>
                          
                          <Button
                            onClick={() => loadTemplate(template)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {t('createTransferOrder.load')}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Save Template Button */}
          <Dialog open={showSaveTemplate} onOpenChange={setShowSaveTemplate}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="flex items-center space-x-2"
                disabled={transferItems.length === 0 || !sourceWarehouse || !targetWarehouse}
              >
                <Save className="h-4 w-4" />
                <span>{t('createTransferOrder.saveAsTemplate')}</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('createTransferOrder.saveTemplateTitle')}</DialogTitle>
                <DialogDescription>
                  {t('createTransferOrder.saveTemplateDescription')}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="templateName">{t('createTransferOrder.templateName')}</Label>
                  <Input
                    id="templateName"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder={t('createTransferOrder.templateNamePlaceholder')}
                  />
                </div>
                
                <div>
                  <Label htmlFor="templateDescription">{t('createTransferOrder.templateDescription')}</Label>
                  <Textarea
                    id="templateDescription"
                    value={templateDescription}
                    onChange={(e) => setTemplateDescription(e.target.value)}
                    placeholder={t('createTransferOrder.templateDescriptionPlaceholder')}
                    rows={3}
                  />
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">{t('createTransferOrder.templateSummary')}</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>
                      <strong>{t('createTransferOrder.from')}:</strong> {warehouses.find((w: any) => w && w.id && w.id.toString() === sourceWarehouse)?.name || t('createTransferOrder.unknown')}
                    </div>
                    <div>
                      <strong>{t('createTransferOrder.to')}:</strong> {warehouses.find((w: any) => w && w.id && w.id.toString() === targetWarehouse)?.name || t('createTransferOrder.unknown')}
                    </div>
                    <div>
                      <strong>{t('createTransferOrder.items')}:</strong> {transferItems.length} {t('createTransferOrder.ingredients')}
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => setShowSaveTemplate(false)} className="flex-1">
                    {t('createTransferOrder.cancel')}
                  </Button>
                  <Button onClick={saveAsTemplate} className="flex-1 bg-blue-600 hover:bg-blue-700">
                    {t('createTransferOrder.saveTemplate')}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Warehouse Selection */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="source-warehouse">{t('warehouse.create.sourceWarehouse')}</Label>
          <Select value={sourceWarehouse} onValueChange={setSourceWarehouse}>
            <SelectTrigger>
              <SelectValue placeholder={t('warehouse.create.selectSourceWarehouse')} />
            </SelectTrigger>
            <SelectContent>
              {warehouses.filter(w => w && w.id).map((warehouse: any) => (
                <SelectItem key={warehouse.id} value={warehouse.id?.toString() || ''}>
                  {warehouse.name || t('createTransferOrder.unknownWarehouse')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="target-warehouse">{t('warehouse.create.destinationWarehouse')}</Label>
          <Select value={targetWarehouse} onValueChange={setTargetWarehouse}>
            <SelectTrigger>
              <SelectValue placeholder={t('warehouse.create.selectDestinationWarehouse')} />
            </SelectTrigger>
            <SelectContent>
              {warehouses
                .filter((w: any) => w && w.id && w.id.toString() !== sourceWarehouse)
                .map((warehouse: any) => (
                  <SelectItem key={warehouse.id} value={warehouse.id?.toString() || ''}>
                    {warehouse.name || t('createTransferOrder.unknownWarehouse')}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {sourceWarehouse && targetWarehouse && (
        <>
          <Separator />

          {/* Item Addition Methods */}
          <div className="space-y-4">
            <div className="flex space-x-2">
              <Button
                variant={activeTab === 'quick' ? 'default' : 'outline'}
                onClick={() => setActiveTab('quick')}
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>{t('createTransferOrder.quickAdd')}</span>
              </Button>
              <Button
                variant={activeTab === 'low-stock' ? 'default' : 'outline'}
                onClick={() => setActiveTab('low-stock')}
                className="flex items-center space-x-2"
              >
                <TrendingDown className="h-4 w-4" />
                <span>{t('createTransferOrder.lowStock')} ({lowStockItems.length})</span>
              </Button>
            </div>

            {/* Quick Add Tab */}
            {activeTab === 'quick' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('createTransferOrder.quickAddItems')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>{t('createTransferOrder.ingredient')}</Label>
                      <Select value={selectedIngredient} onValueChange={setSelectedIngredient}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('createTransferOrder.selectIngredient')} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableStock.map((stock: any) => (
                            <SelectItem 
                              key={stock.ingredient_id} 
                              value={stock.ingredient_id?.toString() || ''}
                            >
                              {stock.ingredient_name || t('createTransferOrder.unknownIngredient')} (Available: {stock.quantity || 0} {stock.unit || t('createTransferOrder.units')})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>{t('createTransferOrder.quantity')}</Label>
                      <Input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder={t('createTransferOrder.enterQuantity')}
                        min="0"
                        step="0.1"
                      />
                    </div>

                    <div className="flex items-end">
                      <Button onClick={addQuickItem} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        {t('createTransferOrder.addItem')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Low Stock Tab */}
            {activeTab === 'low-stock' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('createTransferOrder.lowStockSuggestions')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {lowStockItems.length === 0 ? (
                    <p className="text-gray-500">{t('createTransferOrder.noItemsNeedReplenishment')}</p>
                  ) : (
                    <div className="space-y-3">
                      {lowStockItems.map((item: any) => (
                        <div key={item.ingredient_id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium">{item.ingredient_name}</div>
                            <div className="text-sm text-gray-600">
                              {t('createTransferOrder.dest')}: {item.dest_quantity} {item.unit} | 
                              {t('createTransferOrder.source')}: {item.source_quantity} {item.unit} | 
                              {t('createTransferOrder.min')}: {item.minimum_stock} {item.unit}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-blue-600">
                              {t('createTransferOrder.suggested')}: {item.suggested_quantity} {item.unit}
                            </div>
                            <Button
                              size="sm"
                              onClick={() => addLowStockItems([item])}
                              className="mt-1"
                            >
                              {t('createTransferOrder.add')}
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      {lowStockItems.length > 0 && (
                        <Button
                          onClick={() => addLowStockItems(lowStockItems)}
                          className="w-full"
                          variant="outline"
                        >
                          {t('createTransferOrder.addAllLowStockItems')}
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Transfer Items List */}
          {transferItems.length > 0 && (
            <>
              <Separator />
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('createTransferOrder.transferOrderItems')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {transferItems.map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{item.ingredient_name}</div>
                          <div className="text-sm text-gray-600 flex items-center space-x-2">
                            <div className="flex items-center space-x-1">
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => {
                                  const newQuantity = parseFloat(e.target.value) || 0;
                                  const updatedItems = [...transferItems];
                                  updatedItems[index].quantity = newQuantity;
                                  setTransferItems(updatedItems);
                                }}
                                className="w-20 h-8 text-sm"
                                min="0"
                                step="0.1"
                              />
                              <span>{item.unit}</span>
                            </div>
                            <Badge variant="secondary">{item.method}</Badge>
                            {item.available && (
                              <span className="text-xs text-gray-500">
                                {t('createTransferOrder.available')}: {item.available} {item.unit}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeTransferItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <div className="text-lg font-semibold">
                        {t('createTransferOrder.totalItems')}: {transferItems.length}
                      </div>
                      <div className="space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setTransferItems([])}
                        >
                          {t('createTransferOrder.clearAll')}
                        </Button>
                        <Button
                          onClick={createTransferOrder}
                          disabled={loading}
                          className="min-w-[150px]"
                        >
                          {loading ? t('createTransferOrder.creating') : t('createTransferOrder.createTransferOrder')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default CreateTransferOrder; 

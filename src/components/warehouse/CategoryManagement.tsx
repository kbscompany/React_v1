import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Edit2, Trash2, Plus, Tag, Package } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  description: string;
  ingredient_count: number;
  created_at: string;
}

interface CategoryFormData {
  name: string;
  description: string;
}

interface CategoryManagementProps {
  onNotification: (type: 'success' | 'error' | 'info', message: string) => void;
}

const CategoryManagement: React.FC<CategoryManagementProps> = ({ onNotification }) => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: ''
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://100.29.4.72:8000/api/warehouse/categories');
      if (!response.ok) throw new Error(t('warehouse.categories.loadFailed'));
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      onNotification('error', t('warehouse.categories.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: ''
      });
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      description: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      onNotification('error', t('warehouse.categories.nameRequired'));
      return;
    }

    setLoading(true);
    try {
      const url = editingCategory 
        ? `http://100.29.4.72:8000/api/warehouse/categories/${editingCategory.id}`
        : 'http://100.29.4.72:8000/api/warehouse/categories';
      
      const method = editingCategory ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || t('warehouse.categories.validationError'));
      }

      const result = await response.json();
      onNotification('success', result.message || (editingCategory ? t('warehouse.categories.updateSuccess') : t('warehouse.categories.createSuccess')));
      
      // Reload categories and close dialog
      await loadCategories();
      closeDialog();
      
    } catch (error) {
      console.error('Error saving category:', error);
      onNotification('error', error instanceof Error ? error.message : (editingCategory ? t('warehouse.categories.updateFailed') : t('warehouse.categories.createFailed')));
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (category: Category) => {
    if ((category.ingredient_count || 0) > 0) {
      onNotification('error', t('warehouse.categories.cannotDelete'));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`http://100.29.4.72:8000/api/warehouse/categories/${category.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || t('warehouse.categories.deleteFailed'));
      }

      const result = await response.json();
      onNotification('success', result.message || t('warehouse.categories.deleteSuccess'));
      
      // Reload categories
      await loadCategories();
      
    } catch (error) {
      console.error('Error deleting category:', error);
      onNotification('error', error instanceof Error ? error.message : t('warehouse.categories.deleteFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">{t('warehouse.categories.title')}</h3>
          <p className="text-sm text-gray-600">
            {t('warehouse.categories.description')}
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              {t('warehouse.categories.addCategory')}
            </Button>
          </DialogTrigger>
          
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? t('warehouse.categories.editCategory') : t('warehouse.categories.addNewCategory')}
              </DialogTitle>
              <DialogDescription>
                {editingCategory ? t('warehouse.categories.updateCategory') : t('warehouse.categories.createCategory')}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category-name">{t('warehouse.categories.categoryName')} *</Label>
                <Input
                  id="category-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={t('warehouse.categories.categoryName')}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category-description">{t('warehouse.categories.categoryDescription')}</Label>
                <Input
                  id="category-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t('warehouse.categories.categoryDescriptionPlaceholder')}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={closeDialog}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? t('warehouse.categories.saving') : (editingCategory ? t('common.update') : t('common.create'))}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Separator />

      {/* Categories List */}
      <div className="space-y-4">
        {categories.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <Tag className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">{t('notifications.noItemsFound')}</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => openDialog()}
                >
                  {t('warehouse.categories.createFirstCategory')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {categories.map(category => (
              <Card key={category.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Tag className="h-5 w-5 text-blue-600" />
                        <h4 className="font-medium text-lg">{category.name}</h4>
                        <Badge variant="outline">
                          {category.ingredient_count || 0} {t('warehouse.categories.ingredients')}
                        </Badge>
                      </div>
                      
                      {category.description && (
                        <p className="text-gray-600 mt-1">{category.description}</p>
                      )}
                      
                      <div className="text-sm text-gray-500 mt-2">
                        {t('warehouse.categories.created')}: {new Date(category.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDialog(category)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={(category.ingredient_count || 0) > 0}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('warehouse.categories.deleteCategory')}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t('warehouse.categories.deleteConfirm')}
                              {(category.ingredient_count || 0) > 0 && (
                                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                                  <div className="flex items-center space-x-2 text-red-800">
                                    <Package className="h-4 w-4" />
                                    <span className="font-medium">
                                      {t('warehouse.categories.cannotDelete')}: {category.ingredient_count || 0} {t('warehouse.categories.ingredients')}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteCategory(category)}
                              disabled={(category.ingredient_count || 0) > 0}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {t('common.delete')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Usage Statistics */}
      {categories.length > 0 && (
        <>
          <Separator />
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('warehouse.stock.categoryStats')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {categories.length}
                  </div>
                  <div className="text-sm text-gray-600">{t('warehouse.stock.totalCategories')}</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {categories.reduce((sum, cat) => sum + (cat.ingredient_count || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600">{t('warehouse.stock.totalIngredients')}</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {categories.filter(cat => (cat.ingredient_count || 0) > 0).length}
                  </div>
                  <div className="text-sm text-gray-600">{t('warehouse.stock.activeCategories')}</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {categories.filter(cat => (cat.ingredient_count || 0) === 0).length}
                  </div>
                  <div className="text-sm text-gray-600">{t('warehouse.stock.emptyCategories')}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default CategoryManagement; 

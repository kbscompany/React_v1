import React, { useState, useEffect } from 'react';
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
      if (!response.ok) throw new Error('Failed to load categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      onNotification('error', 'Failed to load categories');
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
      onNotification('error', 'Category name is required');
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
        throw new Error(errorData.detail || `Failed to ${editingCategory ? 'update' : 'create'} category`);
      }

      const result = await response.json();
      onNotification('success', result.message);
      
      // Reload categories and close dialog
      await loadCategories();
      closeDialog();
      
    } catch (error) {
      console.error('Error saving category:', error);
      onNotification('error', error instanceof Error ? error.message : 'Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (category: Category) => {
    if ((category.ingredient_count || 0) > 0) {
      onNotification('error', 'Cannot delete category with existing ingredients');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`http://100.29.4.72:8000/api/warehouse/categories/${category.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete category');
      }

      const result = await response.json();
      onNotification('success', result.message);
      
      // Reload categories
      await loadCategories();
      
    } catch (error) {
      console.error('Error deleting category:', error);
      onNotification('error', error instanceof Error ? error.message : 'Failed to delete category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Category Management</h3>
          <p className="text-sm text-gray-600">
            Manage inventory categories for better organization
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </DialogTitle>
              <DialogDescription>
                {editingCategory ? 'Update the category information below' : 'Create a new category for organizing inventory items'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category-name">Category Name *</Label>
                <Input
                  id="category-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter category name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category-description">Description</Label>
                <Input
                  id="category-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter category description (optional)"
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : (editingCategory ? 'Update' : 'Create')}
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
                <p className="text-gray-500">No categories found</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => openDialog()}
                >
                  Create First Category
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
                          {category.ingredient_count || 0} ingredients
                        </Badge>
                      </div>
                      
                      {category.description && (
                        <p className="text-gray-600 mt-1">{category.description}</p>
                      )}
                      
                      <div className="text-sm text-gray-500 mt-2">
                        Created: {new Date(category.created_at).toLocaleDateString()}
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
                            <AlertDialogTitle>Delete Category</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete the category "{category.name}"? 
                              This action cannot be undone.
                              {(category.ingredient_count || 0) > 0 && (
                                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                                  <div className="flex items-center space-x-2 text-red-800">
                                    <Package className="h-4 w-4" />
                                    <span className="font-medium">
                                      Cannot delete: {category.ingredient_count || 0} ingredients are using this category
                                    </span>
                                  </div>
                                </div>
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteCategory(category)}
                              disabled={(category.ingredient_count || 0) > 0}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
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
              <CardTitle className="text-lg">Category Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {categories.length}
                  </div>
                  <div className="text-sm text-gray-600">Total Categories</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {categories.reduce((sum, cat) => sum + (cat.ingredient_count || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Ingredients</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {categories.filter(cat => (cat.ingredient_count || 0) > 0).length}
                  </div>
                  <div className="text-sm text-gray-600">Active Categories</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {categories.filter(cat => (cat.ingredient_count || 0) === 0).length}
                  </div>
                  <div className="text-sm text-gray-600">Empty Categories</div>
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

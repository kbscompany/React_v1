import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { warehouseAssignmentAPI, usersAPI, warehouseAPI } from '../../services/api';

interface WarehouseManagerAssignment {
  id: number;
  user_id: number;
  warehouse_id: number;
  user_username: string;
  warehouse_name: string;
  can_view_stock: boolean;
  can_create_transfers_out: boolean;
  can_receive_transfers: boolean;
  can_manage_stock: boolean;
  assigned_at: string;
  assigner_username?: string;
}

interface User {
  id: number;
  username: string;
  role_id: number;
  role: {
    id: number;
    name: string;
  };
}

interface Warehouse {
  id: number;
  name: string;
  location?: string;
}

const WarehouseManagerAssignment: React.FC = () => {
  const [assignments, setAssignments] = useState<WarehouseManagerAssignment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  const [newAssignment, setNewAssignment] = useState({
    user_id: '',
    warehouse_id: '',
    can_view_stock: true,
    can_create_transfers_out: true,
    can_receive_transfers: true,
    can_manage_stock: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadAssignments(),
        loadUsers(),
        loadWarehouses()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async () => {
    try {
      const response = await warehouseAssignmentAPI.getAll();
      setAssignments(response.data);
    } catch (error) {
      console.error('Error loading assignments:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await usersAPI.getAll();
      setUsers(response.data.filter((user: User) => user.role.name === 'Warehouse Manager' || user.role.name === 'Admin'));
    } catch (error) {
      console.error('Error loading users:', error);
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

  const handleCreateAssignment = async () => {
    if (!newAssignment.user_id || !newAssignment.warehouse_id) {
      alert('Please select both user and warehouse');
      return;
    }

    try {
      const response = await warehouseAssignmentAPI.create({
        user_id: parseInt(newAssignment.user_id),
        warehouse_id: parseInt(newAssignment.warehouse_id),
        can_view_stock: newAssignment.can_view_stock,
        can_create_transfers_out: newAssignment.can_create_transfers_out,
        can_receive_transfers: newAssignment.can_receive_transfers,
        can_manage_stock: newAssignment.can_manage_stock
      });

      alert(response.data.message);
      setShowCreateDialog(false);
      setNewAssignment({
        user_id: '',
        warehouse_id: '',
        can_view_stock: true,
        can_create_transfers_out: true,
        can_receive_transfers: true,
        can_manage_stock: true
      });
      loadAssignments();
    } catch (error: any) {
      console.error('Error creating assignment:', error);
      alert(error.response?.data?.detail || 'Failed to create assignment');
    }
  };

  const handleDeleteAssignment = async (assignmentId: number) => {
    if (!confirm('Are you sure you want to remove this assignment?')) return;

    try {
      const response = await warehouseAssignmentAPI.delete(assignmentId);
      alert(response.data.message);
      loadAssignments();
    } catch (error: any) {
      console.error('Error deleting assignment:', error);
      alert(error.response?.data?.detail || 'Failed to remove assignment');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Warehouse Manager Assignments</h2>
          <p className="text-gray-600">Assign users to manage specific warehouses</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              + Assign Manager
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Assign Warehouse Manager</DialogTitle>
              <DialogDescription>
                Select a user and warehouse to create a new assignment
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="user">User</Label>
                <Select value={newAssignment.user_id} onValueChange={(value) => 
                  setNewAssignment(prev => ({ ...prev, user_id: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.username} ({user.role.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="warehouse">Warehouse</Label>
                <Select value={newAssignment.warehouse_id} onValueChange={(value) => 
                  setNewAssignment(prev => ({ ...prev, warehouse_id: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select warehouse" />
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

              <div className="space-y-3">
                <Label>Permissions</Label>
                
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox"
                    id="can_view_stock"
                    checked={newAssignment.can_view_stock}
                    onChange={(e) => 
                      setNewAssignment(prev => ({ ...prev, can_view_stock: e.target.checked }))
                    }
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="can_view_stock">Can view stock</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox"
                    id="can_create_transfers_out"
                    checked={newAssignment.can_create_transfers_out}
                    onChange={(e) => 
                      setNewAssignment(prev => ({ ...prev, can_create_transfers_out: e.target.checked }))
                    }
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="can_create_transfers_out">Can create outbound transfers</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox"
                    id="can_receive_transfers"
                    checked={newAssignment.can_receive_transfers}
                    onChange={(e) => 
                      setNewAssignment(prev => ({ ...prev, can_receive_transfers: e.target.checked }))
                    }
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="can_receive_transfers">Can receive transfers</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox"
                    id="can_manage_stock"
                    checked={newAssignment.can_manage_stock}
                    onChange={(e) => 
                      setNewAssignment(prev => ({ ...prev, can_manage_stock: e.target.checked }))
                    }
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="can_manage_stock">Can manage stock</Label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateAssignment} className="bg-green-600 hover:bg-green-700">
                Create Assignment
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Assignments List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading assignments...</p>
          </div>
        ) : assignments.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments found</h3>
                <p className="text-gray-600">
                  Create your first warehouse manager assignment to get started.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          assignments.map(assignment => (
            <Card key={assignment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {assignment.user_username}
                      </h3>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {assignment.warehouse_name}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                      <div>
                        <span className={`${assignment.can_view_stock ? 'text-green-600' : 'text-red-600'}`}>
                          {assignment.can_view_stock ? '✓' : '✗'} View Stock
                        </span>
                      </div>
                      <div>
                        <span className={`${assignment.can_create_transfers_out ? 'text-green-600' : 'text-red-600'}`}>
                          {assignment.can_create_transfers_out ? '✓' : '✗'} Create Transfers
                        </span>
                      </div>
                      <div>
                        <span className={`${assignment.can_receive_transfers ? 'text-green-600' : 'text-red-600'}`}>
                          {assignment.can_receive_transfers ? '✓' : '✗'} Receive Transfers
                        </span>
                      </div>
                      <div>
                        <span className={`${assignment.can_manage_stock ? 'text-green-600' : 'text-red-600'}`}>
                          {assignment.can_manage_stock ? '✓' : '✗'} Manage Stock
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-500">
                      Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}
                      {assignment.assigner_username && (
                        <span> by {assignment.assigner_username}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    <Button
                      onClick={() => handleDeleteAssignment(assignment.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:border-red-600"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default WarehouseManagerAssignment; 
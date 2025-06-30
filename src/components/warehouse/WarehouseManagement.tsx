import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import WarehouseManagerAssignment from './WarehouseManagerAssignment';
import CreateTransferOrder from './CreateTransferOrder';
import TransferTemplateManager from './TransferTemplateManager';

const WarehouseManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('transfers');

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Warehouse Management</h1>
        <p className="text-gray-600">Manage transfers, assignments, and warehouse operations</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="transfers">Transfer Orders</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="assignments">Manager Assignments</TabsTrigger>
          <TabsTrigger value="stock">Stock Management</TabsTrigger>
        </TabsList>

        <TabsContent value="transfers" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Transfer Orders</CardTitle>
              <CardDescription>Create and manage warehouse transfer orders</CardDescription>
            </CardHeader>
            <CardContent>
              <CreateTransferOrder />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Transfer Templates</CardTitle>
              <CardDescription>Manage reusable transfer configurations</CardDescription>
            </CardHeader>
            <CardContent>
              <TransferTemplateManager onLoadTemplate={(template) => {
                // Handle template loading
                setActiveTab('transfers');
              }} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Manager Assignments</CardTitle>
              <CardDescription>Assign warehouse managers and set their permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <WarehouseManagerAssignment />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stock" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Stock Management</CardTitle>
              <CardDescription>View and manage warehouse stock levels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-gray-500">Stock management interface coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default WarehouseManagement; 
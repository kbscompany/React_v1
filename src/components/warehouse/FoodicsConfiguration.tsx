import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { AlertCircle, CheckCircle, Settings, Eye, EyeOff, Shield, Lock, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';

interface FoodicsConfigurationProps {
  onNotification: (type: 'success' | 'error' | 'info', message: string) => void;
}

interface FoodicsStatus {
  configured: boolean;
  api_token_configured: boolean;
  last_sync?: string;
  last_sync_status?: 'success' | 'error';
  error?: string;
}

const FoodicsConfiguration: React.FC<FoodicsConfigurationProps> = ({ onNotification }) => {
  const [status, setStatus] = useState<FoodicsStatus>({
    configured: false,
    api_token_configured: false
  });
  const [apiToken, setApiToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/foodics/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch Foodics status:', error);
    }
  };

  const handleConfigure = async () => {
    if (!apiToken.trim()) {
      onNotification('error', 'Please enter your Foodics API token');
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const formData = new FormData();
      formData.append('api_token', apiToken);

      const response = await fetch('/api/foodics/configure', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        onNotification('success', 'Foodics API configured successfully!');
        setApiToken('');
        await fetchStatus();
      } else {
        const error = await response.json();
        onNotification('error', error.detail || 'Failed to configure Foodics API');
      }
    } catch (error) {
      onNotification('error', 'Failed to configure Foodics API');
      console.error('Configuration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!status.configured) {
      onNotification('error', 'Please configure Foodics API first');
      return;
    }

    setIsTesting(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/foodics/test-connection', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        onNotification('success', `Connection successful! Found ${result.branches?.length || 0} branch(es)`);
      } else {
        const error = await response.json();
        onNotification('error', error.detail || 'Connection test failed');
      }
    } catch (error) {
      onNotification('error', 'Connection test failed');
      console.error('Test connection error:', error);
    } finally {
      setIsTesting(false);
    }
  };

  const handleRemoveConfiguration = async () => {
    if (!confirm('Are you sure you want to remove the Foodics configuration? This will disconnect all syncing.')) {
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/foodics/remove', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        onNotification('success', 'Foodics configuration removed successfully');
        await fetchStatus();
      } else {
        const error = await response.json();
        onNotification('error', error.detail || 'Failed to remove configuration');
      }
    } catch (error) {
      onNotification('error', 'Failed to remove configuration');
      console.error('Remove configuration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Foodics API Configuration
          </CardTitle>
          <CardDescription>
            Secure integration with your Foodics account for automated syncing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {status.configured ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">API Configured</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium">Not Configured</span>
                </>
              )}
            </div>
            
            {status.configured && (
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  <Lock className="h-3 w-3 mr-1" />
                  Secure
                </Badge>
                <Badge variant="default">
                  Active
                </Badge>
              </div>
            )}
          </div>

          {status.last_sync && (
            <div className="text-sm text-gray-600">
              <strong>Last Sync:</strong> {new Date(status.last_sync).toLocaleString()}
              {status.last_sync_status === 'error' && (
                <span className="text-red-600 ml-2">(Failed)</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration Form */}
      {!status.configured ? (
        <Card>
          <CardHeader>
            <CardTitle>Setup Foodics Integration</CardTitle>
            <CardDescription>
              Enter your Foodics API token to enable secure syncing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>How to get your API token:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Log into your Foodics dashboard</li>
                  <li>Go to Settings → Integrations → API</li>
                  <li>Generate or copy your API token</li>
                  <li>Paste it below (it will be encrypted)</li>
                </ol>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="api-token">Foodics API Token *</Label>
              <div className="relative">
                <Input
                  id="api-token"
                  type={showToken ? "text" : "password"}
                  placeholder="Enter your Foodics API token..."
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleConfigure} 
                disabled={isLoading || !apiToken.trim()}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Configuring...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Configure Securely
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Management Actions */
        <Card>
          <CardHeader>
            <CardTitle>Manage Configuration</CardTitle>
            <CardDescription>
              Test your connection or update your configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button 
                onClick={handleTestConnection} 
                disabled={isTesting}
                variant="outline"
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Test Connection
                  </>
                )}
              </Button>
              
              <Button 
                onClick={handleRemoveConfiguration} 
                disabled={isLoading}
                variant="destructive"
              >
                Remove Configuration
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FoodicsConfiguration; 
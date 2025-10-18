'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Code, Database, Settings, AlertTriangle } from 'lucide-react';

interface AdvancedPrefsProps {
  preferences?: any;
}

export function AdvancedPrefs({ preferences }: AdvancedPrefsProps) {
  const [debugMode, setDebugMode] = useState(false);
  const [verboseLogging, setVerboseLogging] = useState(false);
  const [experimentalFeatures, setExperimentalFeatures] = useState(false);
  const [apiEndpoint, setApiEndpoint] = useState('https://api.eezmail.com');
  const [syncTimeout, setSyncTimeout] = useState('30');
  const [maxRetries, setMaxRetries] = useState('3');

  const handleResetSettings = () => {
    // TODO: Implement settings reset
    console.log('Resetting all settings...');
  };

  const handleClearLogs = () => {
    // TODO: Implement log clearing
    console.log('Clearing logs...');
  };

  const handleTestConnection = () => {
    // TODO: Implement connection test
    console.log('Testing connection...');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Advanced Settings
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Developer options and experimental features
        </p>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          These settings are for advanced users only. Changing them may affect
          app stability.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        {/* Debug Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Debug Settings
            </CardTitle>
            <CardDescription>
              Enable debugging features for troubleshooting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="debug-mode">Debug Mode</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Show detailed debug information in console
                  </p>
                </div>
                <Switch
                  id="debug-mode"
                  checked={debugMode}
                  onCheckedChange={setDebugMode}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="verbose-logging">Verbose Logging</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Log all API requests and responses
                  </p>
                </div>
                <Switch
                  id="verbose-logging"
                  checked={verboseLogging}
                  onCheckedChange={setVerboseLogging}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="experimental">Experimental Features</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Enable beta and experimental features
                  </p>
                </div>
                <Switch
                  id="experimental"
                  checked={experimentalFeatures}
                  onCheckedChange={setExperimentalFeatures}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              API Settings
            </CardTitle>
            <CardDescription>
              Configure API endpoints and connection settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-endpoint">API Endpoint</Label>
                <div className="flex gap-2">
                  <Input
                    id="api-endpoint"
                    value={apiEndpoint}
                    onChange={(e) => setApiEndpoint(e.target.value)}
                    placeholder="https://api.example.com"
                    className="flex-1"
                  />
                  <Button variant="outline" onClick={handleTestConnection}>
                    Test
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="sync-timeout">Sync Timeout (seconds)</Label>
                <Select value={syncTimeout} onValueChange={setSyncTimeout}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15s</SelectItem>
                    <SelectItem value="30">30s</SelectItem>
                    <SelectItem value="60">60s</SelectItem>
                    <SelectItem value="120">120s</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="max-retries">Max Retries</Label>
                <Select value={maxRetries} onValueChange={setMaxRetries}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Settings
            </CardTitle>
            <CardDescription>
              Database maintenance and optimization tools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Button variant="outline" onClick={handleClearLogs}>
                  Clear Logs
                </Button>
                <Button variant="outline" onClick={handleResetSettings}>
                  Reset All Settings
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
            <CardDescription>
              Current system status and version information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  App Version:
                </span>
                <span>1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Build:</span>
                <span>2024.01.15</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Environment:
                </span>
                <span>Production</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Database:
                </span>
                <span>Connected</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



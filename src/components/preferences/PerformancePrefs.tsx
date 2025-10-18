'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

interface PerformancePrefsProps {
  preferences?: any;
}

export function PerformancePrefs({ preferences }: PerformancePrefsProps) {
  const [syncInterval, setSyncInterval] = useState('5');
  const [cacheSize, setCacheSize] = useState([50]);
  const [enableOfflineMode, setEnableOfflineMode] = useState(false);
  const [enablePreloading, setEnablePreloading] = useState(true);
  const [enableCompression, setEnableCompression] = useState(true);
  const [maxConcurrentSyncs, setMaxConcurrentSyncs] = useState('3');

  const syncIntervals = [
    { value: '1', label: '1 minute' },
    { value: '5', label: '5 minutes' },
    { value: '15', label: '15 minutes' },
    { value: '30', label: '30 minutes' },
    { value: '60', label: '1 hour' },
    { value: '0', label: 'Manual only' },
  ];

  const handleClearCache = () => {
    // TODO: Implement cache clearing
    console.log('Clearing cache...');
  };

  const handleOptimizeDatabase = () => {
    // TODO: Implement database optimization
    console.log('Optimizing database...');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Performance Settings
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Optimize sync performance and resource usage
        </p>
      </div>

      <div className="grid gap-6">
        {/* Sync Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Sync Settings</CardTitle>
            <CardDescription>
              Configure how often emails are synchronized
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="sync-interval">Sync Interval</Label>
                <Select value={syncInterval} onValueChange={setSyncInterval}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {syncIntervals.map((interval) => (
                      <SelectItem key={interval.value} value={interval.value}>
                        {interval.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="max-concurrent">Max Concurrent Syncs</Label>
                <Select
                  value={maxConcurrentSyncs}
                  onValueChange={setMaxConcurrentSyncs}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Caching */}
        <Card>
          <CardHeader>
            <CardTitle>Caching</CardTitle>
            <CardDescription>
              Manage local cache for improved performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Cache Size (MB)</Label>
                <div className="px-3">
                  <Slider
                    value={cacheSize}
                    onValueChange={setCacheSize}
                    max={500}
                    min={10}
                    step={10}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-1">
                    <span>10 MB</span>
                    <span>{cacheSize[0]} MB</span>
                    <span>500 MB</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enable-preloading">Enable Preloading</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Preload emails for faster access
                  </p>
                </div>
                <Switch
                  id="enable-preloading"
                  checked={enablePreloading}
                  onCheckedChange={setEnablePreloading}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enable-compression">Enable Compression</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Compress data to save bandwidth
                  </p>
                </div>
                <Switch
                  id="enable-compression"
                  checked={enableCompression}
                  onCheckedChange={setEnableCompression}
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClearCache}>
                  Clear Cache
                </Button>
                <Button variant="outline" onClick={handleOptimizeDatabase}>
                  Optimize Database
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Offline Mode */}
        <Card>
          <CardHeader>
            <CardTitle>Offline Mode</CardTitle>
            <CardDescription>Configure offline functionality</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="offline-mode">Enable Offline Mode</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Allow access to cached emails when offline
                  </p>
                </div>
                <Switch
                  id="offline-mode"
                  checked={enableOfflineMode}
                  onCheckedChange={setEnableOfflineMode}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

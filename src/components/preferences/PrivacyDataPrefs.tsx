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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Eye, Trash2, Download } from 'lucide-react';
import { toast } from 'sonner';

interface PrivacyDataPrefsProps {
  preferences?: any;
}

export function PrivacyDataPrefs({ preferences }: PrivacyDataPrefsProps) {
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [crashReporting, setCrashReporting] = useState(true);
  const [usageTracking, setUsageTracking] = useState(false);
  const [dataRetention, setDataRetention] = useState('1year');
  const [autoDelete, setAutoDelete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const retentionOptions = [
    { value: '30days', label: '30 days' },
    { value: '90days', label: '90 days' },
    { value: '1year', label: '1 year' },
    { value: '2years', label: '2 years' },
    { value: 'forever', label: 'Forever' },
  ];

  const handleExportData = async () => {
    setIsLoading(true);
    try {
      const { exportUserData } = await import('@/lib/settings/data-management');
      const result = await exportUserData();
      if (result.success && result.data) {
        const blob = new Blob([JSON.stringify(result.data, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `email-data-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Data exported successfully');
      } else {
        toast.error(result.error || 'Export failed');
      }
    } catch (error) {
      toast.error('Failed to export data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteData = async () => {
    if (!confirm('⚠️ This will delete all your data. Are you sure?')) return;
    if (
      !confirm(
        'This action cannot be undone. Type DELETE in the prompt to confirm.'
      )
    )
      return;

    setIsLoading(true);
    try {
      const { deleteUserData } = await import('@/lib/settings/data-management');
      const result = await deleteUserData();
      if (result.success) {
        toast.success('Data deletion scheduled. You will be logged out.');
        setTimeout(() => (window.location.href = '/login'), 2000);
      } else {
        toast.error(result.error || 'Deletion failed');
      }
    } catch (error) {
      toast.error('Failed to delete data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadData = async () => {
    setIsLoading(true);
    try {
      const { downloadUserData } = await import(
        '@/lib/settings/data-management'
      );
      const result = await downloadUserData();
      if (result.success && result.downloadUrl) {
        const a = document.createElement('a');
        a.href = result.downloadUrl;
        a.download = `email-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        toast.success('Data downloaded successfully');
      } else {
        toast.error(result.error || 'Download failed');
      }
    } catch (error) {
      toast.error('Failed to download data');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Privacy & Data
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Control your data privacy and analytics settings
        </p>
      </div>

      <div className="grid gap-6">
        {/* Analytics & Tracking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Analytics & Tracking
            </CardTitle>
            <CardDescription>
              Control what data is collected for analytics and improvements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="analytics">Analytics</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Help improve the app by sharing anonymous usage data
                  </p>
                </div>
                <Switch
                  id="analytics"
                  checked={analyticsEnabled}
                  onCheckedChange={setAnalyticsEnabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="crash-reporting">Crash Reporting</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Automatically send crash reports to help fix bugs
                  </p>
                </div>
                <Switch
                  id="crash-reporting"
                  checked={crashReporting}
                  onCheckedChange={setCrashReporting}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="usage-tracking">Usage Tracking</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Track how you use the app to improve features
                  </p>
                </div>
                <Switch
                  id="usage-tracking"
                  checked={usageTracking}
                  onCheckedChange={setUsageTracking}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Retention */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Data Retention
            </CardTitle>
            <CardDescription>
              Control how long your data is stored
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="data-retention">Data Retention Period</Label>
                <Select value={dataRetention} onValueChange={setDataRetention}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {retentionOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-delete">Auto-delete Old Data</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Automatically delete data older than retention period
                  </p>
                </div>
                <Switch
                  id="auto-delete"
                  checked={autoDelete}
                  onCheckedChange={setAutoDelete}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Data Management
            </CardTitle>
            <CardDescription>
              Export, download, or delete your data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  You have the right to access, export, and delete your personal
                  data at any time.
                </AlertDescription>
              </Alert>

              <div className="grid gap-3">
                <Button
                  variant="outline"
                  onClick={handleExportData}
                  disabled={isLoading}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export My Data
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownloadData}
                  disabled={isLoading}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Data Archive
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteData}
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete All My Data
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Notice */}
        <Card>
          <CardHeader>
            <CardTitle>Privacy Notice</CardTitle>
            <CardDescription>How we protect and use your data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <p>
                • Your email content is encrypted and never shared with third
                parties
              </p>
              <p>
                • Analytics data is anonymized and cannot be traced back to you
              </p>
              <p>• You can disable all tracking and still use the full app</p>
              <p>• Data is stored securely and can be deleted at any time</p>
              <p>• We comply with GDPR, CCPA, and other privacy regulations</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface DisplayPrefsProps {
  preferences?: any;
}

export function DisplayPrefs({ preferences }: DisplayPrefsProps) {
  const [density, setDensity] = useState(preferences?.density || 'comfortable');
  const [readingPanePosition, setReadingPanePosition] = useState(
    preferences?.readingPanePosition || 'right'
  );
  const [showPreview, setShowPreview] = useState(true);
  const [showImages, setShowImages] = useState(true);
  const [compactMode, setCompactMode] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Display Preferences
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Customize how emails are displayed and organized
        </p>
      </div>

      <div className="grid gap-6">
        {/* Email Density */}
        <Card>
          <CardHeader>
            <CardTitle>Email Density</CardTitle>
            <CardDescription>
              Choose how much information to show in your email list
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="density">Density</Label>
                <Select value={density} onValueChange={setDensity}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="comfortable">Comfortable</SelectItem>
                    <SelectItem value="spacious">Spacious</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reading Pane */}
        <Card>
          <CardHeader>
            <CardTitle>Reading Pane</CardTitle>
            <CardDescription>
              Configure the reading pane position and behavior
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="reading-pane">Position</Label>
                <Select
                  value={readingPanePosition}
                  onValueChange={setReadingPanePosition}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="right">Right</SelectItem>
                    <SelectItem value="bottom">Bottom</SelectItem>
                    <SelectItem value="off">Off</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Display Options */}
        <Card>
          <CardHeader>
            <CardTitle>Display Options</CardTitle>
            <CardDescription>
              Control what information is shown in your email list
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-preview">Show Preview</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Show email preview in the list
                  </p>
                </div>
                <Switch
                  id="show-preview"
                  checked={showPreview}
                  onCheckedChange={setShowPreview}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-images">Show Images</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Display images in email previews
                  </p>
                </div>
                <Switch
                  id="show-images"
                  checked={showImages}
                  onCheckedChange={setShowImages}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="compact-mode">Compact Mode</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Reduce spacing for more emails on screen
                  </p>
                </div>
                <Switch
                  id="compact-mode"
                  checked={compactMode}
                  onCheckedChange={setCompactMode}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

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

interface LanguageRegionPrefsProps {
  preferences?: any;
}

export function LanguageRegionPrefs({ preferences }: LanguageRegionPrefsProps) {
  const [language, setLanguage] = useState(preferences?.language || 'en');
  const [timezone, setTimezone] = useState(preferences?.timezone || 'auto');
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const [timeFormat, setTimeFormat] = useState('12h');
  const [autoDetect, setAutoDetect] = useState(true);

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
    { value: 'de', label: 'Deutsch' },
    { value: 'it', label: 'Italiano' },
    { value: 'pt', label: 'Português' },
    { value: 'ru', label: 'Русский' },
    { value: 'ja', label: '日本語' },
    { value: 'ko', label: '한국어' },
    { value: 'zh', label: '中文' },
  ];

  const timezones = [
    { value: 'auto', label: 'Auto-detect' },
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'Europe/London', label: 'London (GMT)' },
    { value: 'Europe/Paris', label: 'Paris (CET)' },
    { value: 'Europe/Berlin', label: 'Berlin (CET)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
    { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
  ];

  const dateFormats = [
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2023)' },
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2023)' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2023-12-31)' },
    { value: 'DD MMM YYYY', label: 'DD MMM YYYY (31 Dec 2023)' },
    { value: 'MMM DD, YYYY', label: 'MMM DD, YYYY (Dec 31, 2023)' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Language & Region
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Set your language, timezone, and formatting preferences
        </p>
      </div>

      <div className="grid gap-6">
        {/* Language */}
        <Card>
          <CardHeader>
            <CardTitle>Language</CardTitle>
            <CardDescription>
              Choose your preferred language for the interface
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="language">Interface Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timezone */}
        <Card>
          <CardHeader>
            <CardTitle>Timezone</CardTitle>
            <CardDescription>
              Set your timezone for accurate timestamps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-detect">Auto-detect Timezone</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Automatically detect timezone from your location
                  </p>
                </div>
                <Switch
                  id="auto-detect"
                  checked={autoDetect}
                  onCheckedChange={setAutoDetect}
                />
              </div>

              {!autoDetect && (
                <div className="flex items-center justify-between">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger className="w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Date & Time Format */}
        <Card>
          <CardHeader>
            <CardTitle>Date & Time Format</CardTitle>
            <CardDescription>
              Customize how dates and times are displayed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="date-format">Date Format</Label>
                <Select value={dateFormat} onValueChange={setDateFormat}>
                  <SelectTrigger className="w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dateFormats.map((format) => (
                      <SelectItem key={format.value} value={format.value}>
                        {format.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="time-format">Time Format</Label>
                <Select value={timeFormat} onValueChange={setTimeFormat}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12h">12-hour (2:30 PM)</SelectItem>
                    <SelectItem value="24h">24-hour (14:30)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



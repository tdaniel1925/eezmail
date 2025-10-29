'use client';

/**
 * Communication Settings Component
 * Configure Twilio credentials and billing preferences
 */

import { useState, useEffect } from 'react';
import { Phone, Eye, EyeOff, Loader2, Check, X, RefreshCw } from 'lucide-react';
import { InlineMessage } from '@/components/ui/inline-message';
import {
  getUserCommunicationSettings,
  updateCommunicationSettings,
  testUserTwilioCredentials,
  type CommunicationSettingsData,
  type CommunicationLimitsData,
} from '@/lib/contacts/communication-settings-actions';

interface TwilioPhoneNumber {
  phoneNumber: string;
  friendlyName: string;
  sid: string;
  capabilities: {
    sms: boolean;
    voice: boolean;
    mms: boolean;
  };
}

export function CommunicationSettings() {
  const [settings, setSettings] = useState<CommunicationSettingsData>({
    useCustomTwilio: false,
    billingEnabled: true,
  });
  const [limits, setLimits] = useState<CommunicationLimitsData | null>(null);
  const [accountSidMasked, setAccountSidMasked] = useState<string>('');
  
  const [showAccountSid, setShowAccountSid] = useState(false);
  const [showAuthToken, setShowAuthToken] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isLoadingNumbers, setIsLoadingNumbers] = useState(false);
  const [availableNumbers, setAvailableNumbers] = useState<TwilioPhoneNumber[]>([]);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info' | null;
    message: string;
  }>({ type: null, message: '' });

  // Auto-clear success messages after 5 seconds
  useEffect(() => {
    if (statusMessage.type === 'success') {
      const timer = setTimeout(() => {
        setStatusMessage({ type: null, message: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    const result = await getUserCommunicationSettings();

    if (result.success && result.settings && result.limits) {
      setSettings(result.settings);
      setLimits(result.limits);
      setAccountSidMasked(result.settings.accountSidMasked || '');
    } else {
      setStatusMessage({
        type: 'error',
        message: 'Failed to load settings',
      });
    }
    setIsLoading(false);
  };

  const fetchTwilioNumbers = async () => {
    if (!settings.twilioAccountSid || !settings.twilioAuthToken) {
      setStatusMessage({
        type: 'error',
        message: 'Please enter Account SID and Auth Token first',
      });
      return;
    }

    setIsLoadingNumbers(true);

    try {
      const params = new URLSearchParams({
        accountSid: settings.twilioAccountSid,
        authToken: settings.twilioAuthToken,
      });

      const response = await fetch(`/api/twilio/phone-numbers?${params}`);
      const data = await response.json();

      if (data.success && data.phoneNumbers) {
        setAvailableNumbers(data.phoneNumbers);
        if (data.phoneNumbers.length === 0) {
          setStatusMessage({
            type: 'info',
            message: 'No A2P certified numbers found in your Twilio account',
          });
        } else {
          setStatusMessage({
            type: 'success',
            message: `Found ${data.phoneNumbers.length} phone number(s)`,
          });
        }
      } else {
        setStatusMessage({
          type: 'error',
          message: data.error || 'Failed to fetch phone numbers',
        });
        setAvailableNumbers([]);
      }
    } catch (error) {
      console.error('Error fetching Twilio numbers:', error);
      setStatusMessage({
        type: 'error',
        message: 'Failed to fetch phone numbers',
      });
      setAvailableNumbers([]);
    } finally {
      setIsLoadingNumbers(false);
    }
  };

  const handleTestCredentials = async () => {
    if (!settings.twilioAccountSid || !settings.twilioAuthToken) {
      setStatusMessage({
        type: 'error',
        message: 'Please enter Account SID and Auth Token',
      });
      return;
    }

    setIsTesting(true);

    const result = await testUserTwilioCredentials(
      settings.twilioAccountSid,
      settings.twilioAuthToken,
      settings.twilioPhoneNumber
    );

    if (result.success) {
      setStatusMessage({
        type: 'success',
        message: 'Twilio credentials are valid!',
      });
      // Automatically fetch available numbers on successful credential test
      await fetchTwilioNumbers();
    } else {
      setStatusMessage({
        type: 'error',
        message: result.error || 'Invalid credentials',
      });
    }

    setIsTesting(false);
  };

  const handleSave = async () => {
    if (settings.useCustomTwilio && (!settings.twilioAccountSid || !settings.twilioAuthToken)) {
      setStatusMessage({
        type: 'error',
        message: 'Please provide Twilio credentials or disable custom Twilio',
      });
      return;
    }

    setIsSaving(true);

    const result = await updateCommunicationSettings(settings);

    if (result.success) {
      setStatusMessage({
        type: 'success',
        message: 'Settings saved successfully',
      });
      await loadSettings(); // Reload to get masked values
    } else {
      setStatusMessage({
        type: 'error',
        message: result.error || 'Failed to save settings',
      });
    }

    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Communication Settings
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Configure SMS and voice call settings
        </p>
      </div>

      {/* Status Message */}
      {statusMessage.type && (
        <div className="mb-6">
          <InlineMessage
            type={statusMessage.type}
            message={statusMessage.message}
            onDismiss={() => setStatusMessage({ type: null, message: '' })}
          />
        </div>
      )}

      <div className="space-y-6">
        {/* Twilio Integration */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Phone className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Twilio Integration
            </h3>
          </div>

          {/* Use Custom Twilio Toggle */}
          <div className="mb-6">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.useCustomTwilio}
                onChange={(e) =>
                  setSettings({ ...settings, useCustomTwilio: e.target.checked })
                }
                className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Use My Own Twilio Account
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Provide your own Twilio credentials to avoid per-use billing
                </p>
              </div>
            </label>
          </div>

          {/* Twilio Credentials */}
          {settings.useCustomTwilio && (
            <div className="space-y-4">
              {/* Account SID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Account SID
                </label>
                <div className="relative">
                  <input
                    type={showAccountSid ? 'text' : 'password'}
                    value={settings.twilioAccountSid || ''}
                    onChange={(e) =>
                      setSettings({ ...settings, twilioAccountSid: e.target.value })
                    }
                    placeholder={accountSidMasked || 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAccountSid(!showAccountSid)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showAccountSid ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Auth Token */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Auth Token
                </label>
                <div className="relative">
                  <input
                    type={showAuthToken ? 'text' : 'password'}
                    value={settings.twilioAuthToken || ''}
                    onChange={(e) =>
                      setSettings({ ...settings, twilioAuthToken: e.target.value })
                    }
                    placeholder="••••••••••••••••••••••••••••••••"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAuthToken(!showAuthToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showAuthToken ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Twilio Phone Number
                  </label>
                  {availableNumbers.length > 0 && (
                    <button
                      type="button"
                      onClick={fetchTwilioNumbers}
                      disabled={isLoadingNumbers}
                      className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 disabled:opacity-50"
                      title="Refresh phone numbers"
                    >
                      <RefreshCw className={`h-3 w-3 ${isLoadingNumbers ? 'animate-spin' : ''}`} />
                      <span>Refresh</span>
                    </button>
                  )}
                </div>
                
                {availableNumbers.length > 0 ? (
                  <select
                    value={settings.twilioPhoneNumber || ''}
                    onChange={(e) =>
                      setSettings({ ...settings, twilioPhoneNumber: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select a phone number...</option>
                    {availableNumbers.map((number) => (
                      <option key={number.sid} value={number.phoneNumber}>
                        {number.phoneNumber} 
                        {number.friendlyName && ` (${number.friendlyName})`}
                        {' - '}
                        {number.capabilities.sms && 'SMS'}
                        {number.capabilities.sms && number.capabilities.voice && ', '}
                        {number.capabilities.voice && 'Voice'}
                        {number.capabilities.mms && ', MMS'}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="tel"
                    value={settings.twilioPhoneNumber || ''}
                    onChange={(e) =>
                      setSettings({ ...settings, twilioPhoneNumber: e.target.value })
                    }
                    placeholder="+1234567890"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                )}
                
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {availableNumbers.length > 0
                    ? 'Select from your A2P certified Twilio numbers'
                    : 'Test credentials to load your Twilio numbers, or enter manually in E.164 format (e.g., +14155552671)'}
                </p>
              </div>

              {/* Test Button */}
              <button
                onClick={handleTestCredentials}
                disabled={isTesting}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors disabled:opacity-50"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Testing...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Test Credentials</span>
                  </>
                )}
              </button>

              {/* Security Notice */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  <strong>Security:</strong> Your Twilio credentials are encrypted using AES-256
                  before being stored in the database. They are never exposed in API responses.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Billing Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Billing Settings
          </h3>

          {!settings.useCustomTwilio && (
            <div className="mb-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.billingEnabled}
                  onChange={(e) =>
                    setSettings({ ...settings, billingEnabled: e.target.checked })
                  }
                  className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Enable System Twilio (Per-Use Billing)
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Use our Twilio account - you'll be charged per message/call
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Current Rates */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Current Rates (System Twilio)
            </h4>
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <li>• SMS: $0.0075 per message (US)</li>
              <li>• Voice Call: $0.013 per minute (US)</li>
              <li>• Rates vary by country</li>
            </ul>
          </div>
        </div>

        {/* Rate Limits */}
        {limits && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Your Rate Limits ({limits.planType} plan)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">SMS Limits</p>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>Per minute: {limits.smsPerMinute}</li>
                  <li>Per hour: {limits.smsPerHour}</li>
                  <li>Per day: {limits.smsPerDay}</li>
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Voice Limits</p>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>Per minute: {limits.voicePerMinute}</li>
                  <li>Per hour: {limits.voicePerHour}</li>
                  <li>Per day: {limits.voicePerDay}</li>
                </ul>
              </div>
            </div>

            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              Contact support to upgrade your plan or adjust custom limits
            </p>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span>Save Settings</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


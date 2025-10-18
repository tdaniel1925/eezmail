'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Settings,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Info,
  Clock,
  Zap,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import {
  getBrowserCompatibility,
  getRecommendedSettings,
} from '@/lib/voice/processing';

interface VoiceSettings {
  recordingQuality: 'high' | 'medium' | 'low';
  maxDuration: number; // 1-10 minutes
  autoPlay: boolean;
  defaultPlaybackSpeed: number; // 0.5, 1, 1.5, 2
  saveLocally: boolean;
  enablePause: boolean;
  enablePlayback: boolean;
}

const DEFAULT_SETTINGS: VoiceSettings = {
  recordingQuality: 'medium',
  maxDuration: 10, // 10 minutes
  autoPlay: false,
  defaultPlaybackSpeed: 1,
  saveLocally: false,
  enablePause: true,
  enablePlayback: true,
};

const QUALITY_OPTIONS = [
  {
    value: 'high' as const,
    label: 'High Quality',
    description: '64kbps - Best audio quality',
    bitrate: '64kbps',
    fileSize: '~480KB per minute',
  },
  {
    value: 'medium' as const,
    label: 'Medium Quality',
    description: '32kbps - Balanced quality and size',
    bitrate: '32kbps',
    fileSize: '~240KB per minute',
  },
  {
    value: 'low' as const,
    label: 'Low Quality',
    description: '16kbps - Smallest file size',
    bitrate: '16kbps',
    fileSize: '~120KB per minute',
  },
];

const SPEED_OPTIONS = [
  { value: 0.5, label: '0.5x' },
  { value: 1, label: '1x' },
  { value: 1.5, label: '1.5x' },
  { value: 2, label: '2x' },
];

export function VoiceSettings(): JSX.Element {
  const [settings, setSettings] = useState<VoiceSettings>(DEFAULT_SETTINGS);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [browserCompatibility, setBrowserCompatibility] = useState<ReturnType<
    typeof getBrowserCompatibility
  > | null>(null);
  const [recommendedSettings, setRecommendedSettings] = useState<ReturnType<
    typeof getRecommendedSettings
  > | null>(null);

  // Voice recorder for testing
  const {
    state: recordingState,
    duration: recordingDuration,
    error: recordingError,
    isSupported: isRecordingSupported,
    startRecording,
    stopRecording,
    resetRecording,
    getRecordingResult,
    formatDuration,
  } = useVoiceRecorder({
    maxDuration: settings.maxDuration * 60,
    quality: settings.recordingQuality,
    enablePause: settings.enablePause,
    enablePlayback: settings.enablePlayback,
  });

  // Load settings and browser compatibility on mount
  useEffect(() => {
    const compatibility = getBrowserCompatibility();
    const recommended = getRecommendedSettings();

    setBrowserCompatibility(compatibility);
    setRecommendedSettings(recommended);

    // Load saved settings from localStorage
    const savedSettings = localStorage.getItem('voice-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (error) {
        console.error('Failed to load voice settings:', error);
      }
    }
  }, []);

  // Save settings when they change
  useEffect(() => {
    localStorage.setItem('voice-settings', JSON.stringify(settings));
  }, [settings]);

  // Update settings
  const updateSetting = <K extends keyof VoiceSettings>(
    key: K,
    value: VoiceSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // Test microphone
  const handleTestMicrophone = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      await startRecording();

      // Record for 3 seconds
      setTimeout(async () => {
        stopRecording();

        const result = getRecordingResult();
        if (result) {
          setTestResult(
            `✅ Microphone test successful! Recorded ${formatDuration(result.duration)} of audio.`
          );
        } else {
          setTestResult('❌ Microphone test failed - no audio recorded.');
        }

        resetRecording();
        setIsTesting(false);
      }, 3000);
    } catch (error) {
      setTestResult(
        `❌ Microphone test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      setIsTesting(false);
    }
  };

  // Apply recommended settings
  const applyRecommendedSettings = () => {
    if (recommendedSettings) {
      setSettings((prev) => ({
        ...prev,
        recordingQuality: recommendedSettings.quality,
        maxDuration: recommendedSettings.maxDuration / 60, // Convert to minutes
        enablePause: recommendedSettings.enablePause,
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Voice Message Settings
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-white/60">
          Configure voice recording quality, playback options, and privacy
          settings
        </p>
      </div>

      {/* Browser Compatibility */}
      {browserCompatibility && (
        <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Shield className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Browser Compatibility
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              {browserCompatibility.mediaRecorder ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <span>MediaRecorder API</span>
            </div>

            <div className="flex items-center space-x-2">
              {browserCompatibility.getUserMedia ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <span>Microphone Access</span>
            </div>

            <div className="flex items-center space-x-2">
              {browserCompatibility.audioContext ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <span>Audio Context</span>
            </div>

            <div className="flex items-center space-x-2">
              {browserCompatibility.opusSupport ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <span>Opus Codec</span>
            </div>
          </div>

          {!browserCompatibility.mediaRecorder && (
            <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                <Info className="h-4 w-4 inline mr-1" />
                Voice recording requires a modern browser. Please use Chrome,
                Firefox, or Safari.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Recording Quality */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recording Quality
          </h3>
          <p className="text-sm text-gray-600 dark:text-white/60">
            Choose the audio quality for voice messages
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {QUALITY_OPTIONS.map((option) => (
            <motion.div
              key={option.value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <label
                className={cn(
                  'block p-4 rounded-lg border-2 cursor-pointer transition-all',
                  settings.recordingQuality === option.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                )}
              >
                <input
                  type="radio"
                  name="recordingQuality"
                  value={option.value}
                  checked={settings.recordingQuality === option.value}
                  onChange={(e) =>
                    updateSetting(
                      'recordingQuality',
                      e.target.value as 'high' | 'medium' | 'low'
                    )
                  }
                  className="sr-only"
                />

                <div className="flex items-center space-x-2 mb-2">
                  <div
                    className={cn(
                      'w-4 h-4 rounded-full border-2',
                      settings.recordingQuality === option.value
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300 dark:border-white/40'
                    )}
                  >
                    {settings.recordingQuality === option.value && (
                      <div className="w-full h-full rounded-full bg-white scale-50" />
                    )}
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {option.label}
                  </span>
                </div>

                <p className="text-sm text-gray-600 dark:text-white/60 mb-2">
                  {option.description}
                </p>

                <div className="text-xs text-gray-500 dark:text-white/40">
                  <div>Bitrate: {option.bitrate}</div>
                  <div>Size: {option.fileSize}</div>
                </div>
              </label>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Duration Settings */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Maximum Duration
          </h3>
          <p className="text-sm text-gray-600 dark:text-white/60">
            Set the maximum length for voice messages
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <label
            htmlFor="maxDuration"
            className="text-sm font-medium text-gray-700 dark:text-white/70"
          >
            Max Duration:
          </label>
          <select
            id="maxDuration"
            value={settings.maxDuration}
            onChange={(e) =>
              updateSetting('maxDuration', parseInt(e.target.value))
            }
            className="px-3 py-2 border border-gray-300 dark:border-white/20 rounded-md bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {Array.from({ length: 10 }, (_, i) => i + 1).map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes} minute{minutes !== 1 ? 's' : ''}
              </option>
            ))}
          </select>

          <div className="text-sm text-gray-500 dark:text-white/60">
            <Clock className="h-4 w-4 inline mr-1" />
            {formatDuration(settings.maxDuration * 60)}
          </div>
        </div>
      </div>

      {/* Playback Settings */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Playback Settings
          </h3>
          <p className="text-sm text-gray-600 dark:text-white/60">
            Configure how voice messages are played back
          </p>
        </div>

        <div className="space-y-4">
          {/* Auto-play */}
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.autoPlay}
              onChange={(e) => updateSetting('autoPlay', e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-white/70">
              Auto-play incoming voice messages
            </span>
          </label>

          {/* Default playback speed */}
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700 dark:text-white/70">
              Default Speed:
            </label>
            <div className="flex space-x-2">
              {SPEED_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    updateSetting('defaultPlaybackSpeed', option.value)
                  }
                  className={cn(
                    'px-3 py-1 text-sm rounded-md transition-colors',
                    settings.defaultPlaybackSpeed === option.value
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Privacy Settings
          </h3>
          <p className="text-sm text-gray-600 dark:text-white/60">
            Control how voice messages are stored and processed
          </p>
        </div>

        <div className="space-y-4">
          {/* Save locally */}
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.saveLocally}
              onChange={(e) => updateSetting('saveLocally', e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-white/70">
              Save voice messages locally (in browser)
            </span>
          </label>

          <div className="text-xs text-gray-500 dark:text-white/40">
            <Info className="h-3 w-3 inline mr-1" />
            Voice messages are always stored securely in the cloud. This option
            also keeps a local copy.
          </div>
        </div>
      </div>

      {/* Microphone Test */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Test Microphone
          </h3>
          <p className="text-sm text-gray-600 dark:text-white/60">
            Test your microphone and recording settings
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={handleTestMicrophone}
            disabled={!isRecordingSupported || isTesting}
            className={cn(
              'flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
              isRecordingSupported && !isTesting
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            )}
          >
            {isTesting ? (
              <>
                <motion.div
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
                <span>Testing...</span>
              </>
            ) : (
              <>
                <Mic className="h-4 w-4" />
                <span>Test Microphone</span>
              </>
            )}
          </button>

          {recordingState === 'recording' && (
            <div className="flex items-center space-x-2 text-sm text-red-600">
              <motion.div
                className="w-2 h-2 bg-red-500 rounded-full"
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span>Recording... {formatDuration(recordingDuration)}</span>
            </div>
          )}
        </div>

        <AnimatePresence>
          {testResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 rounded-md bg-gray-50 dark:bg-white/5"
            >
              <p className="text-sm text-gray-700 dark:text-white/70">
                {testResult}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {recordingError && (
          <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20">
            <p className="text-sm text-red-700 dark:text-red-300">
              <AlertCircle className="h-4 w-4 inline mr-1" />
              {recordingError}
            </p>
          </div>
        )}
      </div>

      {/* Recommended Settings */}
      {recommendedSettings && (
        <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                Recommended Settings
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Based on your browser capabilities
              </p>
            </div>
            <button
              type="button"
              onClick={applyRecommendedSettings}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

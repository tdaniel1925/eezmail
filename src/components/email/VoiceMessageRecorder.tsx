'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Play,
  Pause,
  Square,
  Trash2,
  Volume2,
  VolumeX,
  RotateCcw,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import {
  useVoiceRecorder,
  type VoiceRecordingOptions,
} from '@/hooks/useVoiceRecorder';
import { AudioVisualizer } from '@/components/email/AudioVisualizer';
import { cn } from '@/lib/utils';

interface VoiceMessageRecorderProps {
  onRecordingComplete?: (result: {
    blob: Blob;
    duration: number;
    size: number;
    format: string;
    url: string;
  }) => void;
  onCancel?: () => void;
  maxDuration?: number;
  quality?: 'high' | 'medium' | 'low';
  className?: string;
  disabled?: boolean;
}

export function VoiceMessageRecorder({
  onRecordingComplete,
  onCancel,
  maxDuration = 600, // 10 minutes
  quality = 'medium',
  className,
  disabled = false,
}: VoiceMessageRecorderProps): JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showWaveform, setShowWaveform] = useState(false);

  const options: VoiceRecordingOptions = {
    maxDuration,
    quality,
    enablePause: true,
    enablePlayback: true,
  };

  const {
    state,
    duration,
    isPlaying,
    error,
    audioLevel,
    isSupported,
    isAtMaxDuration,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    playRecording,
    pausePlayback,
    resetRecording,
    getRecordingResult,
    formatDuration,
  } = useVoiceRecorder(options);

  // Auto-expand when recording starts
  useEffect(() => {
    if (state === 'recording') {
      setIsExpanded(true);
      setShowWaveform(true);
    }
  }, [state]);

  // Handle recording completion
  const handleRecordingComplete = useCallback(() => {
    const result = getRecordingResult();
    if (result && onRecordingComplete) {
      onRecordingComplete(result);
    }
  }, [getRecordingResult, onRecordingComplete]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    resetRecording();
    setIsExpanded(false);
    setShowWaveform(false);
    if (onCancel) {
      onCancel();
    }
  }, [resetRecording, onCancel]);

  // Handle play/pause
  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      pausePlayback();
    } else {
      playRecording();
    }
  }, [isPlaying, pausePlayback, playRecording]);

  // Get button state and icon
  const getButtonState = () => {
    switch (state) {
      case 'idle':
        return {
          icon: Mic,
          text: 'Hold to record',
          color: 'bg-green-500 hover:bg-green-600',
        };
      case 'recording':
        return {
          icon: Square,
          text: 'Stop',
          color: 'bg-red-500 hover:bg-red-600',
        };
      case 'paused':
        return {
          icon: Play,
          text: 'Resume',
          color: 'bg-green-500 hover:bg-green-600',
        };
      case 'stopped':
        return {
          icon: Play,
          text: 'Play',
          color: 'bg-green-500 hover:bg-green-600',
        };
      default:
        return {
          icon: Mic,
          text: 'Record',
          color: 'bg-green-500 hover:bg-green-600',
        };
    }
  };

  const buttonState = getButtonState();
  const ButtonIcon = buttonState.icon;

  // Handle silence detection for auto-stop
  const handleSilenceDetected = useCallback(() => {
    if (state === 'recording') {
      stopRecording();
      handleRecordingComplete();
    }
  }, [state, stopRecording, handleRecordingComplete]);

  // Render error state
  if (error) {
    return (
      <div
        className={cn(
          'p-4 rounded-lg border border-red-200 bg-red-50',
          className
        )}
      >
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm font-medium">Recording Error</span>
        </div>
        <p className="text-sm text-red-500 mt-1">{error}</p>
        <div className="flex space-x-2 mt-3">
          <button
            onClick={resetRecording}
            className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={handleCancel}
            className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Render unsupported browser state
  if (!isSupported) {
    return (
      <div
        className={cn(
          'p-4 rounded-lg border border-yellow-200 bg-yellow-50',
          className
        )}
      >
        <div className="flex items-center space-x-2 text-yellow-600">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm font-medium">
            Voice Recording Not Supported
          </span>
        </div>
        <p className="text-sm text-yellow-500 mt-1">
          Your browser doesn't support voice recording. Please use Chrome,
          Firefox, or Safari.
        </p>
        <button
          onClick={handleCancel}
          className="mt-3 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {/* Main Recording Interface */}
      <motion.div
        layout
        className={cn(
          'flex items-center space-x-3 p-4 rounded-lg border border-gray-200 bg-white shadow-sm',
          isExpanded && 'shadow-md'
        )}
        animate={{
          scale: isExpanded ? 1.02 : 1,
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
      >
        {/* Record Button */}
        <motion.button
          type="button"
          onClick={() => {
            if (state === 'idle') {
              startRecording();
            } else if (state === 'recording') {
              stopRecording();
              handleRecordingComplete();
            } else if (state === 'paused') {
              resumeRecording();
            } else if (state === 'stopped') {
              handlePlayPause();
            }
          }}
          disabled={disabled || isAtMaxDuration}
          className={cn(
            'flex items-center justify-center w-12 h-12 rounded-full text-white transition-all duration-200',
            buttonState.color,
            disabled && 'opacity-50 cursor-not-allowed',
            isAtMaxDuration && 'opacity-50 cursor-not-allowed'
          )}
          whileHover={{ scale: disabled ? 1 : 1.05 }}
          whileTap={{ scale: disabled ? 1 : 0.95 }}
        >
          <ButtonIcon className="h-6 w-6" />
        </motion.button>

        {/* Timer and Status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-mono font-semibold text-gray-900">
              {formatDuration(duration)}
            </span>
            <span className="text-sm text-gray-400">/</span>
            <span className="text-sm text-gray-500">
              {formatDuration(maxDuration)}
            </span>
            {isAtMaxDuration && (
              <span className="text-xs text-red-500 font-medium">
                Max duration reached
              </span>
            )}
          </div>

          <div className="text-sm text-gray-500">
            {state === 'idle' && 'Tap to start recording'}
            {state === 'recording' && 'Recording...'}
            {state === 'paused' && 'Paused'}
            {state === 'stopped' && 'Recording complete'}
          </div>
        </div>

        {/* Audio Visualizer */}
        <AnimatePresence>
          {showWaveform && state === 'recording' && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="flex-1 max-w-48"
            >
              <AudioVisualizer
                isActive={state === 'recording'}
                onSilenceDetected={handleSilenceDetected}
                silenceThreshold={3500} // 3.5 seconds of silence
                volumeThreshold={20}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center space-x-2"
            >
              {/* Pause/Resume (only when recording) */}
              {state === 'recording' && (
                <button
                  type="button"
                  onClick={pauseRecording}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                  title="Pause recording"
                >
                  <Pause className="h-4 w-4" />
                </button>
              )}

              {state === 'paused' && (
                <button
                  type="button"
                  onClick={resumeRecording}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                  title="Resume recording"
                >
                  <Play className="h-4 w-4" />
                </button>
              )}

              {/* Play/Pause (only when stopped) */}
              {state === 'stopped' && (
                <button
                  type="button"
                  onClick={handlePlayPause}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                  title={isPlaying ? 'Pause playback' : 'Play recording'}
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </button>
              )}

              {/* Volume indicator */}
              {state === 'recording' && (
                <div className="flex items-center space-x-1">
                  <Volume2 className="h-4 w-4 text-gray-400" />
                  <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${audioLevel * 100}%` }}
                      animate={{ width: `${audioLevel * 100}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>
                </div>
              )}

              {/* Delete/Reset */}
              {(state === 'paused' || state === 'stopped') && (
                <button
                  type="button"
                  onClick={resetRecording}
                  className="p-2 text-red-600 hover:text-red-900 hover:bg-red-100 rounded-full transition-colors"
                  title="Delete recording"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}

              {/* Cancel */}
              <button
                type="button"
                onClick={handleCancel}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                title="Cancel"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Recording Status Indicator */}
      <AnimatePresence>
        {state === 'recording' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -top-2 -right-2 flex items-center space-x-1 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium"
          >
            <motion.div
              className="w-2 h-2 bg-white rounded-full"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span>REC</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quality and Duration Info */}
      <div className="mt-2 text-xs text-gray-500 text-center">
        Quality: {quality} (
        {quality === 'high'
          ? '64kbps'
          : quality === 'medium'
            ? '32kbps'
            : '16kbps'}
        ){maxDuration < 600 && ` • Max: ${formatDuration(maxDuration)}`}
      </div>
    </div>
  );
}

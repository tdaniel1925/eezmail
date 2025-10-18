'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Download,
  RotateCcw,
  RotateCw,
  Clock,
  FileAudio,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceMessagePlayerProps {
  src: string;
  duration?: number;
  size?: number;
  format?: string;
  title?: string;
  className?: string;
  showDownload?: boolean;
  showSpeedControl?: boolean;
  autoPlay?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onError?: (error: string) => void;
}

export function VoiceMessagePlayer({
  src,
  duration,
  size,
  format,
  title = 'Voice Message',
  className,
  showDownload = true,
  showSpeedControl = true,
  autoPlay = false,
  onPlay,
  onPause,
  onEnded,
  onError,
}: VoiceMessagePlayerProps): JSX.Element {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audio = audioRef.current;
    audio.src = src;
    audio.preload = 'metadata';

    // Event listeners
    const handleLoadStart = () => setIsLoading(true);
    const handleLoadedMetadata = () => setIsLoading(false);
    const handlePlay = () => {
      setIsPlaying(true);
      onPlay?.();
    };
    const handlePause = () => {
      setIsPlaying(false);
      onPause?.();
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      onEnded?.();
    };
    const handleTimeUpdate = () => {
      if (!isDraggingRef.current) {
        setCurrentTime(audio.currentTime);
      }
    };
    const handleError = () => {
      const errorMsg = 'Failed to load voice message';
      setError(errorMsg);
      setIsLoading(false);
      onError?.(errorMsg);
    };

    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('error', handleError);

    // Auto-play if enabled
    if (autoPlay) {
      audio.play().catch(() => {
        // Auto-play failed, ignore
      });
    }

    return () => {
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('error', handleError);
    };
  }, [src, autoPlay, onPlay, onPause, onEnded, onError]);

  // Update playback speed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Play/pause handler
  const handlePlayPause = useCallback(async () => {
    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        await audioRef.current.play();
      }
    } catch (err) {
      console.error('Playback error:', err);
      setError('Failed to play voice message');
    }
  }, [isPlaying]);

  // Seek handler
  const handleSeek = useCallback((newTime: number) => {
    if (!audioRef.current) return;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, []);

  // Progress bar click handler
  const handleProgressClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!audioRef.current || !progressRef.current) return;

      const rect = progressRef.current.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const width = rect.width;
      const percentage = clickX / width;
      const newTime = percentage * (duration || audioRef.current.duration || 0);

      handleSeek(newTime);
    },
    [duration, handleSeek]
  );

  // Progress bar drag handler
  const handleProgressMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      isDraggingRef.current = true;
      document.addEventListener('mousemove', handleProgressMouseMove);
      document.addEventListener('mouseup', handleProgressMouseUp);
      event.preventDefault();
    },
    []
  );

  const handleProgressMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!audioRef.current || !progressRef.current) return;

      const rect = progressRef.current.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const width = rect.width;
      const percentage = Math.max(0, Math.min(1, clickX / width));
      const newTime = percentage * (duration || audioRef.current.duration || 0);

      setCurrentTime(newTime);
    },
    [duration]
  );

  const handleProgressMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    document.removeEventListener('mousemove', handleProgressMouseMove);
    document.removeEventListener('mouseup', handleProgressMouseUp);

    if (audioRef.current) {
      handleSeek(currentTime);
    }
  }, [currentTime, handleSeek]);

  // Speed control
  const handleSpeedChange = useCallback((speed: number) => {
    setPlaybackSpeed(speed);
  }, []);

  // Volume control
  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  }, []);

  // Download handler
  const handleDownload = useCallback(() => {
    const link = document.createElement('a');
    link.href = src;
    link.download = `${title}.${format || 'webm'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [src, title, format]);

  // Format time
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Format file size
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }, []);

  // Calculate progress percentage
  const progressPercentage = duration ? (currentTime / duration) * 100 : 0;

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
          <span className="text-sm font-medium">Playback Error</span>
        </div>
        <p className="text-sm text-red-500 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'p-4 rounded-lg border border-gray-200 bg-white shadow-sm',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center space-x-2 mb-3">
        <FileAudio className="h-5 w-5 text-blue-500" />
        <span className="font-medium text-gray-900">{title}</span>
        {duration && (
          <span className="text-sm text-gray-500">
            <Clock className="h-4 w-4 inline mr-1" />
            {formatTime(duration)}
          </span>
        )}
        {size && (
          <span className="text-sm text-gray-500">
            ({formatFileSize(size)})
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div
          ref={progressRef}
          className="relative h-2 bg-gray-200 rounded-full cursor-pointer hover:h-3 transition-all"
          onClick={handleProgressClick}
          onMouseDown={handleProgressMouseDown}
        >
          <motion.div
            className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
            style={{ width: `${progressPercentage}%` }}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.1 }}
          />
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full shadow-md"
            style={{
              left: `${progressPercentage}%`,
              transform: 'translate(-50%, -50%)',
            }}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
          />
        </div>

        {/* Time Display */}
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{formatTime(currentTime)}</span>
          {duration && <span>{formatTime(duration)}</span>}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* Play/Pause Button */}
          <motion.button
            type="button"
            onClick={handlePlayPause}
            disabled={isLoading}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isLoading ? (
              <motion.div
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            ) : isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </motion.button>

          {/* Speed Control */}
          {showSpeedControl && (
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => handleSpeedChange(0.5)}
                className={cn(
                  'px-2 py-1 text-xs rounded',
                  playbackSpeed === 0.5
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                0.5x
              </button>
              <button
                type="button"
                onClick={() => handleSpeedChange(1)}
                className={cn(
                  'px-2 py-1 text-xs rounded',
                  playbackSpeed === 1
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                1x
              </button>
              <button
                type="button"
                onClick={() => handleSpeedChange(1.5)}
                className={cn(
                  'px-2 py-1 text-xs rounded',
                  playbackSpeed === 1.5
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                1.5x
              </button>
              <button
                type="button"
                onClick={() => handleSpeedChange(2)}
                className={cn(
                  'px-2 py-1 text-xs rounded',
                  playbackSpeed === 2
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                2x
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Volume Control */}
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-16 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Download Button */}
          {showDownload && (
            <button
              type="button"
              onClick={handleDownload}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              title="Download voice message"
            >
              <Download className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-2 text-center"
          >
            <div className="inline-flex items-center space-x-2 text-sm text-gray-500">
              <motion.div
                className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <span>Loading voice message...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

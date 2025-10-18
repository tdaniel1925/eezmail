'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped';

export interface VoiceRecordingOptions {
  maxDuration?: number; // in seconds, default 600 (10 minutes)
  quality?: 'high' | 'medium' | 'low'; // 64kbps, 32kbps, 16kbps
  enablePause?: boolean;
  enablePlayback?: boolean;
}

export interface VoiceRecordingResult {
  blob: Blob;
  duration: number;
  size: number;
  format: string;
  url: string;
}

const QUALITY_SETTINGS = {
  high: { bitrate: 64000, mimeType: 'audio/webm;codecs=opus' },
  medium: { bitrate: 32000, mimeType: 'audio/webm;codecs=opus' },
  low: { bitrate: 16000, mimeType: 'audio/webm;codecs=opus' },
};

export function useVoiceRecorder(options: VoiceRecordingOptions = {}) {
  const {
    maxDuration = 600, // 10 minutes
    quality = 'medium',
    enablePause = true,
    enablePlayback = true,
  } = options;

  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Get quality settings
  const qualitySettings = QUALITY_SETTINGS[quality];

  // Check browser compatibility
  const isSupported = useCallback(() => {
    if (typeof window === 'undefined') return false;

    const hasMediaRecorder = typeof MediaRecorder !== 'undefined';
    const hasGetUserMedia =
      navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
    const hasAudioContext =
      typeof AudioContext !== 'undefined' ||
      typeof (window as any).webkitAudioContext !== 'undefined';

    return hasMediaRecorder && hasGetUserMedia && hasAudioContext;
  }, []);

  // Initialize audio context and analyser for level monitoring
  const initializeAudioContext = useCallback(async (stream: MediaStream) => {
    try {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
      const source = audioContextRef.current.createMediaStreamSource(stream);

      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;

      source.connect(analyserRef.current);

      // Start monitoring audio levels
      monitorAudioLevel();
    } catch (err) {
      console.warn('Failed to initialize audio context:', err);
    }
  }, []);

  // Monitor audio levels for visualization
  const monitorAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

    const updateLevel = () => {
      if (!analyserRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArray);
      const average =
        dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      setAudioLevel(average / 255); // Normalize to 0-1

      if (state === 'recording') {
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      }
    };

    updateLevel();
  }, [state]);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setError(null);

      if (!isSupported()) {
        throw new Error('Voice recording is not supported in this browser');
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
        },
      });

      streamRef.current = stream;
      audioChunksRef.current = [];

      // Initialize audio context for level monitoring
      await initializeAudioContext(stream);

      // Create MediaRecorder with Opus codec
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: qualitySettings.mimeType,
        audioBitsPerSecond: qualitySettings.bitrate,
      });

      mediaRecorderRef.current = mediaRecorder;

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, {
          type: qualitySettings.mimeType,
        });
        // Clean up
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      setState('recording');
      setDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          const newDuration = prev + 1;
          if (newDuration >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return newDuration;
        });
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to start recording'
      );
      setState('idle');
    }
  }, [isSupported, qualitySettings, maxDuration, initializeAudioContext]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === 'recording') {
      mediaRecorderRef.current.pause();
      setState('paused');
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }
  }, [state]);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === 'paused') {
      mediaRecorderRef.current.resume();
      setState('recording');

      // Resume timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          const newDuration = prev + 1;
          if (newDuration >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return newDuration;
        });
      }, 1000);

      // Resume audio level monitoring
      monitorAudioLevel();
    }
  }, [state, maxDuration, monitorAudioLevel]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      (state === 'recording' || state === 'paused')
    ) {
      mediaRecorderRef.current.stop();
      setState('stopped');

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }
  }, [state]);

  // Get recording result
  const getRecordingResult = useCallback((): VoiceRecordingResult | null => {
    if (audioChunksRef.current.length === 0) return null;

    const blob = new Blob(audioChunksRef.current, {
      type: qualitySettings.mimeType,
    });
    const url = URL.createObjectURL(blob);

    return {
      blob,
      duration,
      size: blob.size,
      format: qualitySettings.mimeType,
      url,
    };
  }, [duration, qualitySettings.mimeType]);

  // Play recording preview
  const playRecording = useCallback(() => {
    if (!enablePlayback) return;

    const result = getRecordingResult();
    if (!result) return;

    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }

    const audio = new Audio(result.url);
    audioElementRef.current = audio;

    audio.onplay = () => setIsPlaying(true);
    audio.onpause = () => setIsPlaying(false);
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => {
      setIsPlaying(false);
      setError('Failed to play recording');
    };

    audio.play().catch((err) => {
      console.error('Failed to play recording:', err);
      setError('Failed to play recording');
    });
  }, [enablePlayback, getRecordingResult]);

  // Pause playback
  const pausePlayback = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }
  }, []);

  // Reset recording
  const resetRecording = useCallback(() => {
    // Stop any ongoing recording
    if (
      mediaRecorderRef.current &&
      (state === 'recording' || state === 'paused')
    ) {
      mediaRecorderRef.current.stop();
    }

    // Stop playback
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }

    // Clean up
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Reset state
    setState('idle');
    setDuration(0);
    setIsPlaying(false);
    setError(null);
    setAudioLevel(0);
    audioChunksRef.current = [];
    mediaRecorderRef.current = null;
  }, [state]);

  // Format duration as MM:SS
  const formatDuration = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Check if recording is at max duration
  const isAtMaxDuration = duration >= maxDuration;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      resetRecording();
    };
  }, [resetRecording]);

  return {
    // State
    state,
    duration,
    isPlaying,
    error,
    audioLevel,
    isSupported: isSupported(),
    isAtMaxDuration,

    // Actions
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    playRecording,
    pausePlayback,
    resetRecording,
    getRecordingResult,

    // Utilities
    formatDuration,

    // Options
    maxDuration,
    quality,
    enablePause,
    enablePlayback,
  };
}

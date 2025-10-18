'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Play, Pause, Square, Trash2, Send } from 'lucide-react';

interface SimpleVoiceRecorderProps {
  onRecordingComplete?: (result: {
    blob: Blob;
    duration: number;
    url: string;
  }) => void;
  onCancel?: () => void;
  maxDuration?: number; // in seconds
}

export function SimpleVoiceRecorder({
  onRecordingComplete,
  onCancel,
  maxDuration = 300, // 5 minutes default
}: SimpleVoiceRecorderProps): JSX.Element {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      audioChunksRef.current = [];
      setDuration(0);
      setAudioLevel(0);

      // Set up audio context for level monitoring
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      source.connect(analyser);
      analyser.fftSize = 256;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateLevel = () => {
        if (analyser && isRecording) {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average);
          animationFrameRef.current = requestAnimationFrame(updateLevel);
        }
      };

      updateLevel();

      // Set up MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setRecordingBlob(blob);
        setRecordingUrl(url);
        setIsRecording(false);
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          const newDuration = prev + 1;
          if (newDuration >= maxDuration) {
            stopRecording();
          }
          return newDuration;
        });
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  // Play recording
  const playRecording = () => {
    if (recordingUrl && !isPlaying) {
      const audio = new Audio(recordingUrl);
      audioElementRef.current = audio;

      audio.onended = () => setIsPlaying(false);
      audio.play();
      setIsPlaying(true);
    }
  };

  // Pause playback
  const pausePlayback = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Delete recording
  const deleteRecording = () => {
    if (recordingUrl) {
      URL.revokeObjectURL(recordingUrl);
    }
    setRecordingBlob(null);
    setRecordingUrl(null);
    setDuration(0);
    setMessage('');
    setSubject('');
  };

  // Send recording
  const sendRecording = () => {
    if (recordingBlob && onRecordingComplete) {
      onRecordingComplete({
        blob: recordingBlob,
        duration: duration,
        url: recordingUrl || '',
      });
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingUrl) {
        URL.revokeObjectURL(recordingUrl);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [recordingUrl]);

  return (
    <div className="w-full max-w-md mx-auto p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Voice Message
        </h3>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ×
          </button>
        )}
      </div>

      {/* Recording Status */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {isRecording
              ? 'Recording...'
              : recordingBlob
                ? 'Recording Complete'
                : 'Ready to Record'}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {formatTime(duration)} / {formatTime(maxDuration)}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <motion.div
            className="bg-primary h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(duration / maxDuration) * 100}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      </div>

      {/* Audio Level Visualizer */}
      {isRecording && (
        <div className="mb-4">
          <div className="flex items-center space-x-1">
            {Array.from({ length: 20 }, (_, i) => (
              <motion.div
                key={i}
                className="w-1 bg-gray-300 dark:bg-gray-600 rounded-full"
                animate={{
                  height: audioLevel > i * 5 ? '20px' : '4px',
                  backgroundColor: audioLevel > i * 5 ? '#FF4C5A' : '#D1D5DB',
                }}
                transition={{ duration: 0.1 }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center space-x-4 mb-4">
        {!recordingBlob ? (
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`flex items-center justify-center w-12 h-12 rounded-full ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-primary hover:bg-primary/90 text-white'
            } transition-colors`}
          >
            {isRecording ? (
              <Square className="h-6 w-6" />
            ) : (
              <Mic className="h-6 w-6" />
            )}
          </button>
        ) : (
          <div className="flex items-center space-x-2">
            <button
              onClick={isPlaying ? pausePlayback : playRecording}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-500 hover:bg-gray-600 text-white"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </button>
            <button
              onClick={deleteRecording}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 text-white"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* Message Form (only show after recording) */}
      {recordingBlob && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Voice message subject"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
            />
          </div>

          <button
            onClick={sendRecording}
            disabled={!subject.trim() || !message.trim()}
            className="w-full flex items-center justify-center space-x-2 bg-primary hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md transition-colors"
          >
            <Send className="h-4 w-4" />
            <span>Send Voice Message</span>
          </button>
        </div>
      )}
    </div>
  );
}



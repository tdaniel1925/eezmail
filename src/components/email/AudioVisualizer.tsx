'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface AudioVisualizerProps {
  isActive: boolean;
  onSilenceDetected?: () => void;
  silenceThreshold?: number; // milliseconds of silence before calling callback
  volumeThreshold?: number; // minimum volume to consider as speech (0-255)
}

export function AudioVisualizer({
  isActive,
  onSilenceDetected,
  silenceThreshold = 3500, // 3.5 seconds of silence (increased from 2.5)
  volumeThreshold = 20, // Minimum volume to detect speech
}: AudioVisualizerProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const lastSoundTimeRef = useRef<number>(Date.now());
  const silenceCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasDetectedSilenceRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isActive) {
      // Clean up when inactive
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (silenceCheckIntervalRef.current) {
        clearInterval(silenceCheckIntervalRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      hasDetectedSilenceRef.current = false;
      return;
    }

    // Reset the flag when starting
    hasDetectedSilenceRef.current = false;

    // Set up audio context and visualizer
    const setupAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);

        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        source.connect(analyser);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        dataArrayRef.current = dataArray;
        lastSoundTimeRef.current = Date.now();

        // Start visualization
        draw();

        // Check for silence periodically
        silenceCheckIntervalRef.current = setInterval(() => {
          if (!analyserRef.current || !dataArrayRef.current) return;

          // If we already detected silence, don't check again
          if (hasDetectedSilenceRef.current) return;

          analyserRef.current.getByteFrequencyData(dataArrayRef.current);

          // Calculate average volume
          const average =
            dataArrayRef.current.reduce((a, b) => a + b, 0) /
            dataArrayRef.current.length;

          if (average > volumeThreshold) {
            // Sound detected, update last sound time
            lastSoundTimeRef.current = Date.now();
          } else {
            // Check if we've been silent long enough
            const silenceDuration = Date.now() - lastSoundTimeRef.current;
            if (silenceDuration >= silenceThreshold && onSilenceDetected) {
              console.log(
                `🔇 Silence detected for ${silenceDuration}ms, stopping...`
              );

              // Set flag to prevent multiple calls
              hasDetectedSilenceRef.current = true;

              // Clear interval immediately
              if (silenceCheckIntervalRef.current) {
                clearInterval(silenceCheckIntervalRef.current);
                silenceCheckIntervalRef.current = null;
              }

              // Call the callback
              onSilenceDetected();
            }
          }
        }, 100); // Check every 100ms
      } catch (error) {
        console.error('Error setting up audio visualization:', error);
      }
    };

    setupAudio();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (silenceCheckIntervalRef.current) {
        clearInterval(silenceCheckIntervalRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [isActive, onSilenceDetected, silenceThreshold, volumeThreshold]);

  const draw = () => {
    if (!canvasRef.current || !analyserRef.current || !dataArrayRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;
    const bufferLength = analyser.frequencyBinCount;

    analyser.getByteFrequencyData(dataArray);

    // Clear canvas
    canvasCtx.fillStyle = 'rgb(17, 24, 39)'; // dark background
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width / bufferLength) * 2.5;
    let barHeight;
    let x = 0;

    // Draw bars
    for (let i = 0; i < bufferLength; i++) {
      barHeight = (dataArray[i] / 255) * canvas.height * 0.8;

      // Gradient from primary to pink
      const gradient = canvasCtx.createLinearGradient(
        0,
        canvas.height,
        0,
        canvas.height - barHeight
      );
      gradient.addColorStop(0, 'rgb(255, 76, 90)'); // primary
      gradient.addColorStop(1, 'rgb(236, 72, 153)'); // pink

      canvasCtx.fillStyle = gradient;
      canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

      x += barWidth + 1;
    }

    animationFrameRef.current = requestAnimationFrame(draw);
  };

  if (!isActive) {
    return <></>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="w-full overflow-hidden rounded-lg border border-primary/30 bg-gray-900 p-4"
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [1, 0.7, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="h-3 w-3 rounded-full bg-red-500"
          />
          <span className="text-sm font-medium text-white">Listening...</span>
        </div>
        <span className="text-xs text-gray-400">
          I'll stop after 3.5s of silence
        </span>
      </div>
      <canvas
        ref={canvasRef}
        width={600}
        height={80}
        className="w-full rounded"
      />
    </motion.div>
  );
}

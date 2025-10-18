/**
 * Voice message processing utilities
 * Handles audio validation, compression, and metadata extraction
 */

export interface VoiceMessageMetadata {
  duration: number;
  size: number;
  format: string;
  bitrate: number;
  sampleRate: number;
  channels: number;
  quality: 'high' | 'medium' | 'low';
}

export interface ProcessingOptions {
  maxDuration?: number; // seconds
  maxSize?: number; // bytes
  targetBitrate?: number; // bps
  quality?: 'high' | 'medium' | 'low';
}

const QUALITY_SETTINGS = {
  high: { bitrate: 64000, sampleRate: 48000 },
  medium: { bitrate: 32000, sampleRate: 48000 },
  low: { bitrate: 16000, sampleRate: 24000 },
};

const DEFAULT_OPTIONS: Required<ProcessingOptions> = {
  maxDuration: 600, // 10 minutes
  maxSize: 10 * 1024 * 1024, // 10MB
  targetBitrate: 32000, // 32kbps
  quality: 'medium',
};

/**
 * Validate audio blob for voice message requirements
 */
export function validateAudioBlob(
  blob: Blob,
  options: ProcessingOptions = {}
): { isValid: boolean; error?: string } {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Check file size
  if (blob.size > opts.maxSize) {
    return {
      isValid: false,
      error: `File size ${formatBytes(blob.size)} exceeds limit of ${formatBytes(opts.maxSize)}`,
    };
  }

  // Check MIME type
  const allowedTypes = [
    'audio/webm',
    'audio/webm;codecs=opus',
    'audio/ogg',
    'audio/ogg;codecs=opus',
  ];

  if (!allowedTypes.includes(blob.type)) {
    return {
      isValid: false,
      error: `Invalid audio format: ${blob.type}. Only WebM/Opus is supported.`,
    };
  }

  return { isValid: true };
}

/**
 * Extract metadata from audio blob
 */
export async function extractMetadata(
  blob: Blob,
  duration?: number
): Promise<VoiceMessageMetadata> {
  const quality = getQualityFromBitrate(blob.size, duration);
  const settings = QUALITY_SETTINGS[quality];

  return {
    duration: duration || 0,
    size: blob.size,
    format: blob.type,
    bitrate: settings.bitrate,
    sampleRate: settings.sampleRate,
    channels: 1, // Mono for voice
    quality,
  };
}

/**
 * Determine quality level based on file size and duration
 */
function getQualityFromBitrate(
  size: number,
  duration?: number
): 'high' | 'medium' | 'low' {
  if (!duration || duration === 0) {
    // Default to medium if no duration info
    return 'medium';
  }

  const bitrate = (size * 8) / duration; // bits per second

  if (bitrate >= 50000) return 'high';
  if (bitrate >= 25000) return 'medium';
  return 'low';
}

/**
 * Estimate file size for given duration and quality
 */
export function estimateFileSize(
  duration: number,
  quality: 'high' | 'medium' | 'low' = 'medium'
): number {
  const settings = QUALITY_SETTINGS[quality];
  const bitrate = settings.bitrate;

  // Calculate size in bytes: (bitrate * duration) / 8
  return Math.ceil((bitrate * duration) / 8);
}

/**
 * Check if audio needs compression
 */
export function needsCompression(
  blob: Blob,
  duration: number,
  targetQuality: 'high' | 'medium' | 'low' = 'medium'
): boolean {
  const targetSize = estimateFileSize(duration, targetQuality);
  return blob.size > targetSize * 1.1; // 10% tolerance
}

/**
 * Get optimal quality for given constraints
 */
export function getOptimalQuality(
  duration: number,
  maxSize: number
): 'high' | 'medium' | 'low' {
  // Try high quality first
  if (estimateFileSize(duration, 'high') <= maxSize) {
    return 'high';
  }

  // Try medium quality
  if (estimateFileSize(duration, 'medium') <= maxSize) {
    return 'medium';
  }

  // Fall back to low quality
  return 'low';
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Format duration to MM:SS format
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calculate compression ratio
 */
export function calculateCompressionRatio(
  originalSize: number,
  compressedSize: number
): number {
  return Math.round(((originalSize - compressedSize) / originalSize) * 100);
}

/**
 * Validate recording settings
 */
export function validateRecordingSettings(settings: {
  maxDuration?: number;
  quality?: 'high' | 'medium' | 'low';
  enablePause?: boolean;
}): { isValid: boolean; error?: string } {
  const { maxDuration = 600, quality = 'medium' } = settings;

  // Check duration limits
  if (maxDuration < 1 || maxDuration > 600) {
    return {
      isValid: false,
      error: 'Max duration must be between 1 and 600 seconds (10 minutes)',
    };
  }

  // Check quality setting
  if (!['high', 'medium', 'low'].includes(quality)) {
    return {
      isValid: false,
      error: 'Quality must be high, medium, or low',
    };
  }

  return { isValid: true };
}

/**
 * Get browser compatibility info
 */
export function getBrowserCompatibility(): {
  mediaRecorder: boolean;
  getUserMedia: boolean;
  audioContext: boolean;
  opusSupport: boolean;
} {
  if (typeof window === 'undefined') {
    return {
      mediaRecorder: false,
      getUserMedia: false,
      audioContext: false,
      opusSupport: false,
    };
  }

  const hasMediaRecorder = typeof MediaRecorder !== 'undefined';
  const hasGetUserMedia = !!(
    navigator.mediaDevices && navigator.mediaDevices.getUserMedia
  );
  const hasAudioContext =
    typeof AudioContext !== 'undefined' ||
    typeof (window as any).webkitAudioContext !== 'undefined';

  // Check Opus codec support
  let opusSupport = false;
  if (hasMediaRecorder) {
    try {
      const testRecorder = new MediaRecorder(new MediaStream(), {
        mimeType: 'audio/webm;codecs=opus',
      });
      opusSupport = testRecorder.mimeType.includes('opus');
    } catch {
      opusSupport = false;
    }
  }

  return {
    mediaRecorder: hasMediaRecorder,
    getUserMedia: hasGetUserMedia,
    audioContext: hasAudioContext,
    opusSupport,
  };
}

/**
 * Get recommended settings for user's browser
 */
export function getRecommendedSettings(): {
  quality: 'high' | 'medium' | 'low';
  maxDuration: number;
  enablePause: boolean;
} {
  const compatibility = getBrowserCompatibility();

  // Adjust quality based on browser support
  let quality: 'high' | 'medium' | 'low' = 'medium';
  if (compatibility.opusSupport && compatibility.audioContext) {
    quality = 'high';
  } else if (!compatibility.opusSupport) {
    quality = 'low';
  }

  return {
    quality,
    maxDuration: 600, // 10 minutes
    enablePause: compatibility.mediaRecorder,
  };
}

/**
 * Generate unique filename for voice message
 */
export function generateVoiceFilename(
  userId: string,
  timestamp?: number
): string {
  const ts = timestamp || Date.now();
  const randomId = Math.random().toString(36).substring(7);
  return `${userId}/${ts}-${randomId}.webm`;
}

/**
 * Parse voice message URL to extract metadata
 */
export function parseVoiceUrl(url: string): {
  userId: string;
  timestamp: number;
  filename: string;
} | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const filename = pathParts[pathParts.length - 1];
    const [timestamp, randomId] = filename.replace('.webm', '').split('-');

    return {
      userId: pathParts[pathParts.length - 2],
      timestamp: parseInt(timestamp),
      filename,
    };
  } catch {
    return null;
  }
}

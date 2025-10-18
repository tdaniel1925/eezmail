/**
 * Email templates for voice messages
 * Provides HTML, plain text, and fallback templates for different email clients
 */

export interface VoiceMessageData {
  url: string;
  duration: number; // seconds
  size: number; // bytes
  format: string; // MIME type
  title?: string;
  senderName?: string;
  fallbackUrl?: string; // MP3 or other fallback format
}

/**
 * Generate HTML template for modern email clients (Gmail, Outlook, Apple Mail)
 */
export function generateVoiceMessageHTML(data: VoiceMessageData): string {
  const {
    url,
    duration,
    size,
    format,
    title = 'Voice Message',
    senderName,
    fallbackUrl,
  } = data;

  const durationFormatted = formatDuration(duration);
  const sizeFormatted = formatFileSize(size);

  return `
    <div style="
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    ">
      <!-- Header -->
      <div style="
        display: flex;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 1px solid #e5e7eb;
      ">
        <div style="
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
        ">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
        </div>
        <div>
          <h3 style="
            margin: 0;
            font-size: 18px;
            font-weight: 600;
            color: #111827;
          ">${title}</h3>
          ${
            senderName
              ? `
            <p style="
              margin: 4px 0 0 0;
              font-size: 14px;
              color: #6b7280;
            ">from ${senderName}</p>
          `
              : ''
          }
        </div>
      </div>

      <!-- Audio Player -->
      <div style="
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 20px;
      ">
        <audio 
          controls 
          style="
            width: 100%;
            height: 40px;
            border-radius: 6px;
            background: white;
          "
          preload="metadata"
        >
          <source src="${url}" type="${format}">
          ${fallbackUrl ? `<source src="${fallbackUrl}" type="audio/mpeg">` : ''}
          <p style="
            margin: 0;
            padding: 12px;
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            color: #92400e;
            text-align: center;
          ">
            Your email client doesn't support audio playback. 
            <a href="${url}" style="color: #1d4ed8; text-decoration: none; font-weight: 500;">
              Download voice message
            </a>
          </p>
        </audio>
      </div>

      <!-- Metadata -->
      <div style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 14px;
        color: #6b7280;
        margin-bottom: 20px;
      ">
        <div style="display: flex; gap: 16px;">
          <span>⏱️ ${durationFormatted}</span>
          <span>📁 ${sizeFormatted}</span>
        </div>
        <a href="${url}" style="
          color: #3b82f6;
          text-decoration: none;
          font-weight: 500;
          padding: 6px 12px;
          border: 1px solid #3b82f6;
          border-radius: 6px;
          transition: all 0.2s;
        " onmouseover="this.style.backgroundColor='#3b82f6'; this.style.color='white'" 
           onmouseout="this.style.backgroundColor='transparent'; this.style.color='#3b82f6'">
          Download
        </a>
      </div>

      <!-- Footer -->
      <div style="
        padding-top: 15px;
        border-top: 1px solid #e5e7eb;
        font-size: 12px;
        color: #9ca3af;
        text-align: center;
      ">
        <p style="margin: 0;">
          This voice message was sent via eezMail. 
          <a href="https://imbox.app" style="color: #3b82f6; text-decoration: none;">
            Learn more
          </a>
        </p>
      </div>
    </div>
  `;
}

/**
 * Generate plain text template for basic email clients
 */
export function generateVoiceMessageText(data: VoiceMessageData): string {
  const { url, duration, size, title = 'Voice Message', senderName } = data;

  const durationFormatted = formatDuration(duration);
  const sizeFormatted = formatFileSize(size);

  return `
${title}${senderName ? ` from ${senderName}` : ''}

Duration: ${durationFormatted}
Size: ${sizeFormatted}

Download voice message: ${url}

---
This voice message was sent via eezMail.
Visit https://imbox.app to learn more.
  `.trim();
}

/**
 * Generate minimal HTML template for basic email clients
 */
export function generateVoiceMessageMinimalHTML(
  data: VoiceMessageData
): string {
  const { url, duration, title = 'Voice Message' } = data;

  const durationFormatted = formatDuration(duration);

  return `
    <div style="
      font-family: Arial, sans-serif;
      max-width: 400px;
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 8px;
      background: #f9f9f9;
    ">
      <h4 style="margin: 0 0 10px 0; color: #333;">${title}</h4>
      <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
        Duration: ${durationFormatted}
      </p>
      <a href="${url}" style="
        display: inline-block;
        padding: 8px 16px;
        background: #007bff;
        color: white;
        text-decoration: none;
        border-radius: 4px;
        font-size: 14px;
      ">
        Download Voice Message
      </a>
    </div>
  `;
}

/**
 * Generate email body with voice message embedded
 */
export function generateEmailWithVoiceMessage(
  textBody: string,
  voiceData: VoiceMessageData,
  clientType: 'modern' | 'basic' | 'minimal' = 'modern'
): string {
  let voiceHTML: string;

  switch (clientType) {
    case 'modern':
      voiceHTML = generateVoiceMessageHTML(voiceData);
      break;
    case 'basic':
      voiceHTML = generateVoiceMessageMinimalHTML(voiceData);
      break;
    case 'minimal':
      voiceHTML = `<p><a href="${voiceData.url}">Download voice message (${formatDuration(voiceData.duration)})</a></p>`;
      break;
    default:
      voiceHTML = generateVoiceMessageHTML(voiceData);
  }

  // Combine text body with voice message
  if (textBody.trim()) {
    return `
      <div style="margin-bottom: 20px;">
        ${textBody}
      </div>
      <div style="margin-top: 20px;">
        ${voiceHTML}
      </div>
    `;
  } else {
    return voiceHTML;
  }
}

/**
 * Detect email client type from user agent (simplified)
 */
export function detectEmailClient(
  userAgent: string
): 'modern' | 'basic' | 'minimal' {
  const ua = userAgent.toLowerCase();

  // Modern clients that support HTML5 audio
  if (
    ua.includes('gmail') ||
    ua.includes('outlook') ||
    ua.includes('apple') ||
    ua.includes('thunderbird')
  ) {
    return 'modern';
  }

  // Basic clients that support basic HTML
  if (ua.includes('mail') || ua.includes('client')) {
    return 'basic';
  }

  // Fallback to minimal
  return 'minimal';
}

/**
 * Format duration in MM:SS format
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format file size in human readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Generate email subject with voice message indicator
 */
export function generateVoiceMessageSubject(originalSubject: string): string {
  if (
    originalSubject.toLowerCase().includes('voice') ||
    originalSubject.toLowerCase().includes('audio')
  ) {
    return originalSubject;
  }

  return `🎤 ${originalSubject}`;
}

/**
 * Generate preview text for voice message
 */
export function generateVoiceMessagePreview(
  voiceData: VoiceMessageData
): string {
  const duration = formatDuration(voiceData.duration);
  return `Voice message (${duration}) - Click to listen or download`;
}

/**
 * Validate voice message data
 */
export function validateVoiceMessageData(data: VoiceMessageData): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.url) {
    errors.push('Voice message URL is required');
  }

  if (data.duration <= 0) {
    errors.push('Duration must be greater than 0');
  }

  if (data.duration > 600) {
    errors.push('Duration cannot exceed 10 minutes');
  }

  if (data.size <= 0) {
    errors.push('File size must be greater than 0');
  }

  if (data.size > 10 * 1024 * 1024) {
    // 10MB
    errors.push('File size cannot exceed 10MB');
  }

  if (!data.format || !data.format.startsWith('audio/')) {
    errors.push('Invalid audio format');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

import { db } from '@/lib/db';
import { emails } from '@/db/schema';
import { eq, and, isNotNull } from 'drizzle-orm';

export interface VoiceTestResult {
  testName: string;
  passed: boolean;
  score: number;
  issues: string[];
  recommendations: string[];
  duration: number;
  voiceStats?: {
    totalVoiceMessages: number;
    averageDuration: number;
    supportedFormats: string[];
  };
}

export class VoiceTester {
  async runAllTests(): Promise<VoiceTestResult[]> {
    const results: VoiceTestResult[] = [];

    // Test 1: Voice Message Storage
    results.push(await this.testVoiceMessageStorage());

    // Test 2: Voice Message Playback
    results.push(await this.testVoiceMessagePlayback());

    // Test 3: Voice Message Transcription
    results.push(await this.testVoiceMessageTranscription());

    // Test 4: Voice Message Formats
    results.push(await this.testVoiceMessageFormats());

    // Test 5: Voice Message Size Limits
    results.push(await this.testVoiceMessageSizeLimits());

    // Test 6: Voice Message Security
    results.push(await this.testVoiceMessageSecurity());

    return results;
  }

  private async testVoiceMessageStorage(): Promise<VoiceTestResult> {
    const startTime = Date.now();
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Test emails with voice messages
      const voiceEmails = await db
        .select()
        .from(emails)
        .where(
          and(
            eq(emails.hasVoiceMessage, true),
            isNotNull(emails.voiceMessageUrl)
          )
        );

      const duration = Date.now() - startTime;
      const score =
        duration < 300 ? 100 : Math.max(0, 100 - (duration - 300) / 30);

      if (voiceEmails.length === 0) {
        issues.push('No voice messages found for testing');
        recommendations.push('Add test emails with voice messages');
      }

      // Check for valid voice message URLs
      const invalidUrls = voiceEmails.filter(
        (email) =>
          !email.voiceMessageUrl ||
          typeof email.voiceMessageUrl !== 'string' ||
          email.voiceMessageUrl.length === 0
      );

      if (invalidUrls.length > 0) {
        issues.push(`${invalidUrls.length} voice messages have invalid URLs`);
        recommendations.push('Validate voice message URLs during storage');
      }

      return {
        testName: 'Voice Message Storage',
        passed: voiceEmails.length > 0,
        score,
        issues,
        recommendations,
        duration,
        voiceStats: {
          totalVoiceMessages: voiceEmails.length,
          averageDuration: 0,
          supportedFormats: [],
        },
      };
    } catch (error) {
      return {
        testName: 'Voice Message Storage',
        passed: false,
        score: 0,
        issues: [`Voice storage test failed: ${String(error)}`],
        recommendations: ['Check voice message storage implementation'],
        duration: Date.now() - startTime,
      };
    }
  }

  private async testVoiceMessagePlayback(): Promise<VoiceTestResult> {
    const startTime = Date.now();
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Test voice message playback data
      const voiceEmails = await db
        .select()
        .from(emails)
        .where(
          and(
            eq(emails.hasVoiceMessage, true),
            isNotNull(emails.voiceMessageDuration)
          )
        );

      const duration = Date.now() - startTime;
      const score =
        duration < 200 ? 100 : Math.max(0, 100 - (duration - 200) / 20);

      // Check for valid duration values
      const invalidDurations = voiceEmails.filter(
        (email) =>
          !email.voiceMessageDuration ||
          email.voiceMessageDuration <= 0 ||
          email.voiceMessageDuration > 300 // 5 minutes max
      );

      if (invalidDurations.length > 0) {
        issues.push(
          `${invalidDurations.length} voice messages have invalid durations`
        );
        recommendations.push(
          'Validate voice message duration during recording'
        );
      }

      // Check for reasonable duration values
      const averageDuration =
        voiceEmails.length > 0
          ? voiceEmails.reduce(
              (sum, email) => sum + (email.voiceMessageDuration || 0),
              0
            ) / voiceEmails.length
          : 0;

      if (averageDuration > 180) {
        // 3 minutes
        issues.push('Average voice message duration is very long');
        recommendations.push(
          'Consider implementing duration limits for voice messages'
        );
      }

      return {
        testName: 'Voice Message Playback',
        passed: true,
        score,
        issues,
        recommendations,
        duration,
        voiceStats: {
          totalVoiceMessages: voiceEmails.length,
          averageDuration,
          supportedFormats: [],
        },
      };
    } catch (error) {
      return {
        testName: 'Voice Message Playback',
        passed: false,
        score: 0,
        issues: [`Voice playback test failed: ${String(error)}`],
        recommendations: ['Check voice message playback implementation'],
        duration: Date.now() - startTime,
      };
    }
  }

  private async testVoiceMessageTranscription(): Promise<VoiceTestResult> {
    const startTime = Date.now();
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Test voice message transcription capabilities
      const voiceEmails = await db
        .select()
        .from(emails)
        .where(eq(emails.hasVoiceMessage, true));

      const duration = Date.now() - startTime;
      const score =
        duration < 400 ? 100 : Math.max(0, 100 - (duration - 400) / 40);

      // Check if transcription is available
      const emailsWithTranscription = voiceEmails.filter(
        (email) => email.body && email.body.length > 0
      );

      const transcriptionRate =
        voiceEmails.length > 0
          ? (emailsWithTranscription.length / voiceEmails.length) * 100
          : 0;

      if (transcriptionRate < 50) {
        issues.push(`Low transcription rate: ${transcriptionRate.toFixed(1)}%`);
        recommendations.push('Improve voice transcription accuracy');
      }

      if (voiceEmails.length === 0) {
        issues.push('No voice messages found for transcription testing');
        recommendations.push(
          'Add test voice messages for transcription testing'
        );
      }

      return {
        testName: 'Voice Message Transcription',
        passed: transcriptionRate >= 50,
        score,
        issues,
        recommendations,
        duration,
        voiceStats: {
          totalVoiceMessages: voiceEmails.length,
          averageDuration: 0,
          supportedFormats: [],
        },
      };
    } catch (error) {
      return {
        testName: 'Voice Message Transcription',
        passed: false,
        score: 0,
        issues: [`Voice transcription test failed: ${String(error)}`],
        recommendations: ['Check voice transcription implementation'],
        duration: Date.now() - startTime,
      };
    }
  }

  private async testVoiceMessageFormats(): Promise<VoiceTestResult> {
    const startTime = Date.now();
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Test supported voice message formats
      const voiceEmails = await db
        .select()
        .from(emails)
        .where(
          and(
            eq(emails.hasVoiceMessage, true),
            isNotNull(emails.voiceMessageFormat)
          )
        );

      const duration = Date.now() - startTime;
      const score =
        duration < 200 ? 100 : Math.max(0, 100 - (duration - 200) / 20);

      // Check for supported formats
      const supportedFormats = [
        'audio/mpeg',
        'audio/wav',
        'audio/mp4',
        'audio/webm',
      ];
      const formatCounts: Record<string, number> = {};

      voiceEmails.forEach((email) => {
        if (email.voiceMessageFormat) {
          formatCounts[email.voiceMessageFormat] =
            (formatCounts[email.voiceMessageFormat] || 0) + 1;
        }
      });

      const usedFormats = Object.keys(formatCounts);
      const unsupportedFormats = usedFormats.filter(
        (format) => !supportedFormats.includes(format)
      );

      if (unsupportedFormats.length > 0) {
        issues.push(
          `Unsupported voice formats found: ${unsupportedFormats.join(', ')}`
        );
        recommendations.push(
          'Add support for additional audio formats or validate format support'
        );
      }

      if (voiceEmails.length === 0) {
        issues.push('No voice messages with format information found');
        recommendations.push('Add voice message format tracking');
      }

      return {
        testName: 'Voice Message Formats',
        passed: unsupportedFormats.length === 0,
        score,
        issues,
        recommendations,
        duration,
        voiceStats: {
          totalVoiceMessages: voiceEmails.length,
          averageDuration: 0,
          supportedFormats: usedFormats,
        },
      };
    } catch (error) {
      return {
        testName: 'Voice Message Formats',
        passed: false,
        score: 0,
        issues: [`Voice format test failed: ${String(error)}`],
        recommendations: ['Check voice message format handling'],
        duration: Date.now() - startTime,
      };
    }
  }

  private async testVoiceMessageSizeLimits(): Promise<VoiceTestResult> {
    const startTime = Date.now();
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Test voice message size limits
      const voiceEmails = await db
        .select()
        .from(emails)
        .where(
          and(
            eq(emails.hasVoiceMessage, true),
            isNotNull(emails.voiceMessageSize)
          )
        );

      const duration = Date.now() - startTime;
      const score =
        duration < 300 ? 100 : Math.max(0, 100 - (duration - 300) / 30);

      // Check for size limits (10MB max)
      const maxSize = 10 * 1024 * 1024; // 10MB
      const oversizedMessages = voiceEmails.filter(
        (email) => email.voiceMessageSize && email.voiceMessageSize > maxSize
      );

      if (oversizedMessages.length > 0) {
        issues.push(
          `${oversizedMessages.length} voice messages exceed size limits`
        );
        recommendations.push('Implement voice message size validation');
      }

      // Check for reasonable size values
      const averageSize =
        voiceEmails.length > 0
          ? voiceEmails.reduce(
              (sum, email) => sum + (email.voiceMessageSize || 0),
              0
            ) / voiceEmails.length
          : 0;

      if (averageSize > 5 * 1024 * 1024) {
        // 5MB average
        issues.push('Average voice message size is very large');
        recommendations.push(
          'Consider implementing compression or size optimization'
        );
      }

      if (voiceEmails.length === 0) {
        issues.push('No voice messages with size information found');
        recommendations.push('Add voice message size tracking');
      }

      return {
        testName: 'Voice Message Size Limits',
        passed: oversizedMessages.length === 0,
        score,
        issues,
        recommendations,
        duration,
        voiceStats: {
          totalVoiceMessages: voiceEmails.length,
          averageDuration: 0,
          supportedFormats: [],
        },
      };
    } catch (error) {
      return {
        testName: 'Voice Message Size Limits',
        passed: false,
        score: 0,
        issues: [`Voice size limit test failed: ${String(error)}`],
        recommendations: ['Check voice message size handling'],
        duration: Date.now() - startTime,
      };
    }
  }

  private async testVoiceMessageSecurity(): Promise<VoiceTestResult> {
    const startTime = Date.now();
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Test voice message security
      const voiceEmails = await db
        .select()
        .from(emails)
        .where(eq(emails.hasVoiceMessage, true));

      const duration = Date.now() - startTime;
      const score =
        duration < 250 ? 100 : Math.max(0, 100 - (duration - 250) / 25);

      // Check for secure URLs (HTTPS)
      const insecureUrls = voiceEmails.filter(
        (email) =>
          email.voiceMessageUrl && email.voiceMessageUrl.startsWith('http://')
      );

      if (insecureUrls.length > 0) {
        issues.push(`${insecureUrls.length} voice messages use insecure URLs`);
        recommendations.push('Use HTTPS for all voice message URLs');
      }

      // Check for proper access controls
      const publicUrls = voiceEmails.filter(
        (email) =>
          email.voiceMessageUrl &&
          !email.voiceMessageUrl.includes('token') &&
          !email.voiceMessageUrl.includes('auth')
      );

      if (publicUrls.length > voiceEmails.length * 0.5) {
        issues.push('Many voice messages may not have proper access controls');
        recommendations.push(
          'Implement proper authentication for voice message access'
        );
      }

      return {
        testName: 'Voice Message Security',
        passed: insecureUrls.length === 0,
        score,
        issues,
        recommendations,
        duration,
        voiceStats: {
          totalVoiceMessages: voiceEmails.length,
          averageDuration: 0,
          supportedFormats: [],
        },
      };
    } catch (error) {
      return {
        testName: 'Voice Message Security',
        passed: false,
        score: 0,
        issues: [`Voice security test failed: ${String(error)}`],
        recommendations: ['Check voice message security implementation'],
        duration: Date.now() - startTime,
      };
    }
  }
}

export const voiceTester = new VoiceTester();

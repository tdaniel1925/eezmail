import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Set environment
  environment: process.env.NODE_ENV || 'development',

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Replay settings
  replaysOnErrorSampleRate: 1.0, // Capture 100% of errors
  replaysSessionSampleRate: 0.1, // Capture 10% of all sessions

  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  integrations: [
    Sentry.replayIntegration({
      // Additional Replay configuration goes here
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Ignore common errors
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    'chrome-extension',
    'moz-extension',
    // Network errors
    'NetworkError',
    'Failed to fetch',
    // Random plugins/extensions
    'atomicFindClose',
    // Facebook errors
    'fb_xd_fragment',
  ],

  // Filter sensitive data
  beforeSend(event, hint) {
    // Don't send events if DSN is not configured
    if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
      return null;
    }

    // Remove sensitive data
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers;
    }

    return event;
  },
});

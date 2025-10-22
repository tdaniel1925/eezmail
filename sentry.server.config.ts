import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Set environment
  environment: process.env.NODE_ENV || 'development',

  // Adjust this value in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Ignore common errors
  ignoreErrors: ['NetworkError', 'Failed to fetch', 'AbortError'],

  // Filter sensitive data
  beforeSend(event, hint) {
    // Don't send events if DSN is not configured
    if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
      return null;
    }

    // Remove sensitive data
    if (event.request) {
      delete event.request.cookies;

      // Redact Authorization headers
      if (event.request.headers) {
        if ('authorization' in event.request.headers) {
          event.request.headers.authorization = '[Filtered]';
        }
        if ('cookie' in event.request.headers) {
          event.request.headers.cookie = '[Filtered]';
        }
      }
    }

    // Redact email addresses from messages
    if (event.message) {
      event.message = event.message.replace(
        /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
        '[email]'
      );
    }

    return event;
  },
});

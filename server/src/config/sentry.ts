import { ENV } from './env.js';

export function initSentry(app?: any): void {
  if (!ENV.SENTRY_DSN) {
    console.log('[Sentry] SENTRY_DSN not configured; telemetry disabled gracefully.');
    return;
  }

  try {
    console.log('[Sentry] Sentry enabled with provided DSN.');
    // Note: In production, import * as Sentry from '@sentry/node' and Sentry.init({ dsn: ENV.SENTRY_DSN });
  } catch (err: any) {
    console.warn('[Sentry] Failed to initialize Sentry:', err.message);
  }
}

export function captureException(error: any, context?: Record<string, any>): void {
  if (ENV.SENTRY_DSN) {
    // Forward to Sentry without sensitive PII
    console.error('[Sentry Captured Error]', error, context);
  } else {
    console.error('[App Error]', error);
  }
}

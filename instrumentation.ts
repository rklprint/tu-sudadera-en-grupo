import * as Sentry from "@sentry/nextjs";

export async function register() {
  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.APP_ENV || process.env.VERCEL_ENV || "development",
    release: process.env.SENTRY_RELEASE,
    sendDefaultPii: false,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
    beforeSend(event) {
      if (event.request) {
        delete event.request.cookies;
        delete event.request.data;
        delete event.request.headers;
        delete event.request.query_string;
      }
      if (event.user) event.user = undefined;
      return event;
    },
  });
}

export const onRequestError = Sentry.captureRequestError;

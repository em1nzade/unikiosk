const DEFAULT_PUBLIC_URL = 'https://oyu-feedback.vercel.app';

function getConfiguredRegistrationBaseUrl(): string {
  const metaEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
  return metaEnv?.VITE_EVENT_REGISTRATION_URL || DEFAULT_PUBLIC_URL;
}

export function buildEventRegistrationUrl(eventId: number, originOrHref: string): string {
  let baseUrl = getConfiguredRegistrationBaseUrl();

  try {
    const currentUrl = new URL(originOrHref);
    const isUsableOrigin = currentUrl.origin !== 'null' && ['http:', 'https:'].includes(currentUrl.protocol);
    if (isUsableOrigin && currentUrl.hostname === 'localhost') {
      baseUrl = currentUrl.origin;
    }
  } catch {
    baseUrl = getConfiguredRegistrationBaseUrl();
  }

  const url = new URL(`/events/${eventId}/register`, baseUrl);
  return url.toString();
}

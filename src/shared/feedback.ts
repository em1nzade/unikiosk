const DEFAULT_FEEDBACK_URL = 'https://oyu-feedback.vercel.app/';

export function buildFeedbackUrl(originOrHref: string): string {
  const metaEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
  const configuredUrl = metaEnv?.VITE_FEEDBACK_URL || DEFAULT_FEEDBACK_URL;
  try {
    return new URL(configuredUrl).toString();
  } catch {
    const url = new URL(originOrHref);
    return url.origin === 'null' ? DEFAULT_FEEDBACK_URL : `${url.origin}/feedback`;
  }
}

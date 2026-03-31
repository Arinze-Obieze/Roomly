export const DEFAULT_POST_AUTH_PATH = '/dashboard';

export function resolvePostAuthPath(value, fallback = DEFAULT_POST_AUTH_PATH) {
  if (!value || typeof value !== 'string') return fallback;

  const nextPath = value.trim();

  if (!nextPath.startsWith('/')) return fallback;
  if (nextPath.startsWith('//')) return fallback;
  if (nextPath === '/') return fallback;

  return nextPath;
}

export function extractPostAuthPath(redirectTo, siteUrl) {
  if (!redirectTo) return DEFAULT_POST_AUTH_PATH;

  const candidate = typeof redirectTo === 'string' ? redirectTo.trim() : '';
  if (!candidate) return DEFAULT_POST_AUTH_PATH;
  if (!candidate.startsWith('/') && !/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(candidate)) {
    return DEFAULT_POST_AUTH_PATH;
  }

  try {
    const redirectUrl = new URL(candidate, siteUrl || 'http://localhost');
    return resolvePostAuthPath(
      `${redirectUrl.pathname}${redirectUrl.search}${redirectUrl.hash}`
    );
  } catch {
    return resolvePostAuthPath(candidate);
  }
}

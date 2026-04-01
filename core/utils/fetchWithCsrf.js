function withTimeout(timeoutMs = 15000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  return {
    signal: controller.signal,
    clear: () => clearTimeout(timeoutId),
  };
}

export async function fetchWithCsrf(url, options = {}) {
  const timeoutMs = options.timeoutMs ?? 15000;
  const csrfTimeout = withTimeout(timeoutMs);
  const requestTimeout = withTimeout(timeoutMs);

  const csrfRes = await fetch('/api/csrf-token', {
    signal: csrfTimeout.signal,
  });
  if (!csrfRes.ok) throw new Error('Failed to fetch CSRF token');

  const { csrfToken } = await csrfRes.json();
  if (!csrfToken) throw new Error('CSRF token missing from server response');

  csrfTimeout.clear();

  const headers = {
    ...options.headers,
    'x-csrf-token': csrfToken,
  };

  const { timeoutMs: _timeoutMs, signal: providedSignal, ...restOptions } = options;

  if (providedSignal) {
    providedSignal.addEventListener('abort', () => requestTimeout.clear(), { once: true });
  }

  try {
    return await fetch(url, {
      ...restOptions,
      headers,
      signal: providedSignal || requestTimeout.signal,
    });
  } finally {
    requestTimeout.clear();
  }
}

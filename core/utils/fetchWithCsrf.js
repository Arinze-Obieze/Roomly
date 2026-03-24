export async function fetchWithCsrf(url, options = {}) {
  const csrfRes = await fetch('/api/csrf-token');
  if (!csrfRes.ok) throw new Error('Failed to fetch CSRF token');

  const { csrfToken } = await csrfRes.json();
  if (!csrfToken) throw new Error('CSRF token missing from server response');

  const headers = {
    ...options.headers,
    'x-csrf-token': csrfToken,
  };

  return fetch(url, { ...options, headers });
}

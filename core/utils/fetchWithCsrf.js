export async function fetchWithCsrf(url, options = {}) {
  try {
    const csrfRes = await fetch('/api/csrf-token');
    if (!csrfRes.ok) throw new Error('Failed to fetch CSRF token');
    const { csrfToken } = await csrfRes.json();

    const headers = {
      ...options.headers,
      'x-csrf-token': csrfToken,
    };

    return fetch(url, { ...options, headers });
  } catch (error) {
    console.error('Error in fetchWithCsrf:', error);
    // Fallback to normal fetch if CSRF fetching fails, though it might fail on the server
    return fetch(url, options);
  }
}

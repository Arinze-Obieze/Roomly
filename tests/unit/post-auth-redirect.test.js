import { describe, expect, test } from 'vitest';
import {
  DEFAULT_POST_AUTH_PATH,
  extractPostAuthPath,
  resolvePostAuthPath,
} from '../../core/utils/auth/post-auth-redirect.js';

describe('post auth redirects', () => {
  test('falls back to the dashboard when redirect is missing or root', () => {
    expect(resolvePostAuthPath()).toBe(DEFAULT_POST_AUTH_PATH);
    expect(resolvePostAuthPath('/')).toBe(DEFAULT_POST_AUTH_PATH);
    expect(extractPostAuthPath('/')).toBe(DEFAULT_POST_AUTH_PATH);
  });

  test('preserves valid in-app destinations', () => {
    expect(resolvePostAuthPath('/dashboard/buddy')).toBe('/dashboard/buddy');
    expect(
      extractPostAuthPath(
        'https://roomfind.ie/dashboard/buddy/join?token=abc123#invite',
        'https://roomfind.ie'
      )
    ).toBe('/dashboard/buddy/join?token=abc123#invite');
  });

  test('rejects external or malformed destinations', () => {
    expect(resolvePostAuthPath('https://evil.example/steal')).toBe(DEFAULT_POST_AUTH_PATH);
    expect(resolvePostAuthPath('//evil.example/steal')).toBe(DEFAULT_POST_AUTH_PATH);
    expect(extractPostAuthPath('not-a-path', 'https://roomfind.ie')).toBe(DEFAULT_POST_AUTH_PATH);
  });
});

import { describe, expect, test } from 'vitest';
import {
  isLatestDashboardRequest,
  resolveCommunityFetchPage,
  shouldMarkConversationAsRead,
} from '../../core/utils/dashboard-fetch-guards.js';

describe('dashboard fetch guards', () => {
  test('marks a conversation as read only when messages are loaded and not already marked', () => {
    expect(
      shouldMarkConversationAsRead({
        activeConversation: 'conv-1',
        firstPageLength: 3,
        lastMarkedConversation: null,
      })
    ).toBe(true);

    expect(
      shouldMarkConversationAsRead({
        activeConversation: 'conv-1',
        firstPageLength: 0,
        lastMarkedConversation: null,
      })
    ).toBe(false);

    expect(
      shouldMarkConversationAsRead({
        activeConversation: 'conv-1',
        firstPageLength: 2,
        lastMarkedConversation: 'conv-1',
      })
    ).toBe(false);
  });

  test('accepts only the latest dashboard request response', () => {
    expect(isLatestDashboardRequest(5, 5)).toBe(true);
    expect(isLatestDashboardRequest(4, 5)).toBe(false);
  });

  test('prefers an explicit community page override when present', () => {
    expect(resolveCommunityFetchPage(3, 1)).toBe(1);
    expect(resolveCommunityFetchPage(3)).toBe(3);
    expect(resolveCommunityFetchPage(2, null)).toBe(2);
  });
});

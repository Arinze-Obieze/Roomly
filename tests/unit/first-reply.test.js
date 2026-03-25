import { describe, expect, test } from 'vitest';
import { shouldLogFirstReply } from '../../core/services/messaging/first-reply.js';

describe('first reply detection', () => {
  test('logs only when a conversation already has messages and the sender has not replied before', () => {
    expect(
      shouldLogFirstReply({
        existingMessagesCount: 3,
        existingSenderMessagesCount: 0,
      })
    ).toBe(true);
  });

  test('does not log on the very first message in a conversation', () => {
    expect(
      shouldLogFirstReply({
        existingMessagesCount: 0,
        existingSenderMessagesCount: 0,
      })
    ).toBe(false);
  });

  test('does not log when the sender has already messaged in the conversation', () => {
    expect(
      shouldLogFirstReply({
        existingMessagesCount: 5,
        existingSenderMessagesCount: 2,
      })
    ).toBe(false);
  });
});

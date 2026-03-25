export function shouldLogFirstReply({
  existingMessagesCount = 0,
  existingSenderMessagesCount = 0,
} = {}) {
  return (Number(existingMessagesCount) || 0) > 0 && (Number(existingSenderMessagesCount) || 0) === 0;
}

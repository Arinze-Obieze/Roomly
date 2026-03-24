export function shouldMarkConversationAsRead({
  activeConversation,
  firstPageLength = 0,
  lastMarkedConversation = null,
}) {
  return Boolean(activeConversation) && firstPageLength > 0 && lastMarkedConversation !== activeConversation;
}

export function isLatestDashboardRequest(requestId, currentRequestId) {
  return requestId === currentRequestId;
}

export function resolveCommunityFetchPage(currentPage, pageOverride) {
  return typeof pageOverride === 'number' ? pageOverride : currentPage;
}

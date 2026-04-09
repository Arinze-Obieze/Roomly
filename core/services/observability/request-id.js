export function getRequestId(request) {
  return request?.headers?.get?.('x-request-id') || crypto.randomUUID();
}

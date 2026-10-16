/**
 * Shared utility to build HTTP request headers with Authorization Bearer token.
 * Reads token from localStorage ('d2_luxury_auth_token') when running on client side.
 */

const TOKEN_KEY = 'd2_luxury_auth_token';

export function getAuthHeaders(
  extraHeaders?: Record<string, string>,
  includeJsonContentType = true
): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(includeJsonContentType ? { 'Content-Type': 'application/json' } : {}),
    ...extraHeaders,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

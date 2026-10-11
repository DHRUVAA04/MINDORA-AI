/**
 * Mindora AI — Secure API Client with Cookie Auth & Auto-Refresh
 */

export const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000';

let inMemoryAccessToken: string | null = null;

export function setAuthToken(token: string | null) {
  inMemoryAccessToken = token;
}

export function getAuthToken(): string | null {
  return inMemoryAccessToken;
}

function getCsrfTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)csrfToken=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  // Attach CSRF header on state-changing requests
  const csrfToken = getCsrfTokenFromCookie();
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (csrfToken && ['POST', 'PUT', 'DELETE', 'PATCH'].includes((options.method || 'GET').toUpperCase())) {
    headers.set('X-CSRF-Token', csrfToken);
  }

  // Attach in-memory access token if available
  if (inMemoryAccessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${inMemoryAccessToken}`);
  }

  // Include httpOnly cookies (accessToken, refreshToken, csrfToken)
  const fetchConfig: RequestInit = {
    ...options,
    headers,
    credentials: 'include',
  };

  const response = await fetch(url, fetchConfig);

  // If 401 Unauthorized and not already refreshing or calling /auth endpoints
  if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : {},
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          isRefreshing = false;
          if (refreshData.access_token) {
            setAuthToken(refreshData.access_token);
          }
          onRefreshed(refreshData.access_token);
          // Retry original request
          return apiClient<T>(endpoint, options);
        } else {
          isRefreshing = false;
          setAuthToken(null);
          // Session fully expired
          window.dispatchEvent(new CustomEvent('mindora:session-expired'));
          throw new Error('Your session has expired. Please log in again.');
        }
      } catch (err) {
        isRefreshing = false;
        setAuthToken(null);
        window.dispatchEvent(new CustomEvent('mindora:session-expired'));
        throw err;
      }
    } else {
      // Queue until refresh finishes
      return new Promise((resolve, reject) => {
        refreshSubscribers.push(() => {
          apiClient<T>(endpoint, options).then(resolve).catch(reject);
        });
      });
    }
  }

  if (!response.ok) {
    let errorDetail = 'Request failed';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.error || errorDetail;
    } catch {
      errorDetail = response.statusText || errorDetail;
    }
    const error = new Error(errorDetail);
    (error as any).status = response.status;
    throw error;
  }

  return response.json();
}

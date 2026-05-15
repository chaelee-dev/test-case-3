const BASE = import.meta.env['VITE_API_BASE_URL'] ?? 'http://localhost:3000';

const TOKEN_KEY = 'conduit.jwt';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export interface ApiError {
  status: number;
  errors: Record<string, string[]>;
}

function isApiError(e: unknown): e is ApiError {
  return typeof e === 'object' && e !== null && 'status' in e && 'errors' in e;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const { auth, headers, ...rest } = init;
  const h = new Headers(headers);
  if (!h.has('content-type') && rest.body && !(rest.body instanceof FormData)) {
    h.set('content-type', 'application/json');
  }
  if (auth !== false) {
    const token = getToken();
    if (token) h.set('authorization', `Token ${token}`);
  }
  const res = await fetch(`${BASE}${path}`, { ...rest, headers: h });
  if (res.status === 401) {
    setToken(null);
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.replace('/login');
    }
  }
  let body: unknown = null;
  if (res.status !== 204) {
    const text = await res.text();
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
    }
  }
  if (!res.ok) {
    const err: ApiError = {
      status: res.status,
      errors:
        body && typeof body === 'object' && 'errors' in body
          ? ((body as { errors: Record<string, string[]> }).errors ?? { error: [String(res.status)] })
          : { error: [`${res.status}`] },
    };
    throw err;
  }
  return body as T;
}

export { isApiError };

import axios, { AxiosError } from 'axios';

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1';

/**
 * The access token lives in memory only — never localStorage. The refresh
 * token is an httpOnly cookie the JS side can't read, so a session survives
 * a reload via /auth/refresh rather than by persisting a bearer token.
 */
let accessToken: string | null = null;
export const setAccessToken = (t: string | null) => {
  accessToken = t;
};
export const getAccessToken = () => accessToken;

export const api = axios.create({ baseURL: API_URL, withCredentials: true });

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshOnce(): Promise<string | null> {
  refreshing ??= axios
    .post<{ accessToken: string }>(`${API_URL}/auth/refresh`, {}, { withCredentials: true })
    .then((r) => {
      setAccessToken(r.data.accessToken);
      return r.data.accessToken;
    })
    .catch(() => {
      setAccessToken(null);
      return null;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (typeof error.config & { _retried?: boolean }) | undefined;
    const isAuthCall = original?.url?.includes('/auth/');

    if (error.response?.status === 401 && original && !original._retried && !isAuthCall) {
      original._retried = true;
      const token = await refreshOnce();
      if (token) {
        original.headers = original.headers ?? {};
        (original.headers as Record<string, string>).Authorization = `Bearer ${token}`;
        return api.request(original);
      }
      window.dispatchEvent(new CustomEvent('olw:signed-out'));
    }
    return Promise.reject(error);
  }
);

/** Turns an axios failure into something we can show a human. */
export function errorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(err)) {
    // No response at all means the API never answered — almost always the
    // server being down, not anything wrong with what was sent.
    if (!err.response) {
      return 'Could not reach the server. Is the API running on port 4000?';
    }
    const data = err.response.data as { error?: string; details?: unknown } | undefined;
    const detail = Array.isArray(data?.details)
      ? (data.details as { path?: string; message?: string }[])
          .map((d) => [d.path, d.message].filter(Boolean).join(': '))
          .join(' · ')
      : '';
    const base = data?.error ?? err.message ?? fallback;
    return detail ? `${base} — ${detail}` : base;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

/**
 * Cloudinary URLs are absolute already. Locally-stored uploads come back as
 * `/uploads/x`; when API_URL is relative (dev, proxied) that path is already
 * correct, otherwise prefix the API's origin.
 */
export function mediaUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const origin = API_URL.replace(/\/api\/v1\/?$/, '');
  return `${origin}${url}`;
}

export { refreshOnce };

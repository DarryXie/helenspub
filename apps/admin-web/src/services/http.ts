import { getAccessToken } from './auth';

const FALLBACK_API_BASE_URL = 'http://127.0.0.1:3000/api/v1';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? FALLBACK_API_BASE_URL;
export const API_ORIGIN = import.meta.env.VITE_API_ORIGIN ?? new URL(API_BASE_URL).origin;

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  const isFormData = init?.body instanceof FormData;

  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAccessToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  const result = (await response.json()) as ApiResponse<T>;

  if (!response.ok || result.code !== 0) {
    throw new Error(result.message);
  }

  return result.data;
}

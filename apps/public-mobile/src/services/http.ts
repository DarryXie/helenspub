const FALLBACK_API_BASE_URL = 'http://127.0.0.1:3000/api/v1';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? FALLBACK_API_BASE_URL;
export const API_ORIGIN = import.meta.env.VITE_API_ORIGIN ?? new URL(API_BASE_URL).origin;

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export class ApiError extends Error {
  status: number;
  code: number | null;

  constructor(message: string, status: number, code: number | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);

  if (!(init?.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  const result = (await response.json()) as ApiResponse<T>;

  if (!response.ok || result.code !== 0) {
    throw new ApiError(result.message || 'Request failed', response.status, result.code ?? null);
  }

  return result.data;
}

export function resolveApiAssetUrl(value?: string | null): string {
  if (!value) {
    return '';
  }

  if (/^(https?:)?\/\//.test(value) || value.startsWith('data:')) {
    return value;
  }

  return `${API_ORIGIN}${value}`;
}

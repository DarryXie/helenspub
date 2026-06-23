import { getAccessToken } from './auth';

const DEFAULT_API_ORIGIN =
  typeof window === 'undefined' ? 'http://127.0.0.1:3000' : window.location.origin;
const FALLBACK_API_BASE_URL = '/api/v1';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? FALLBACK_API_BASE_URL;
export const API_ORIGIN =
  import.meta.env.VITE_API_ORIGIN ?? new URL(API_BASE_URL, DEFAULT_API_ORIGIN).origin;

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

function looksLikeJson(contentType: string | null, rawText: string) {
  if (contentType) {
    const normalized = contentType.toLowerCase();
    if (normalized.includes('application/json') || normalized.includes('+json')) {
      return true;
    }
  }

  const trimmed = rawText.trim();
  return trimmed.startsWith('{') || trimmed.startsWith('[');
}

function resolveNonJsonErrorMessage(status: number, rawText: string) {
  if (status === 404) {
    return 'API endpoint not found. Check the API server or local proxy configuration.';
  }

  if (!rawText.trim()) {
    return 'The API returned an empty response.';
  }

  return 'The API returned a non-JSON response. Check the API server or local proxy configuration.';
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

  const rawText = await response.text();
  if (!rawText.trim()) {
    throw new ApiError(resolveNonJsonErrorMessage(response.status, rawText), response.status, null);
  }

  let result: ApiResponse<T> | null = null;

  if (looksLikeJson(response.headers.get('content-type'), rawText)) {
    try {
      result = JSON.parse(rawText) as ApiResponse<T>;
    } catch {
      throw new ApiError('The API returned invalid JSON.', response.status, null);
    }
  }

  if (!result) {
    throw new ApiError(resolveNonJsonErrorMessage(response.status, rawText), response.status, null);
  }

  if (!response.ok || result.code !== 0) {
    throw new ApiError(result.message || 'Request failed', response.status, result.code ?? null);
  }

  return result.data;
}

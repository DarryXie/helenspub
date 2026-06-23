import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiRequest, API_BASE_URL } from './http';

vi.mock('./auth', () => ({
  getAccessToken: () => '',
}));

function createResponse({
  ok,
  status,
  contentType,
  body,
}: {
  ok: boolean;
  status: number;
  contentType?: string;
  body: string;
}) {
  return {
    ok,
    status,
    headers: new Headers(contentType ? { 'content-type': contentType } : undefined),
    text: async () => body,
  } as Response;
}

describe('admin-web http service', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('requests JSON APIs with the default relative base path', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      createResponse({
        ok: true,
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({
          code: 0,
          message: 'ok',
          data: { accessToken: 'token-1' },
        }),
      }),
    );

    await expect(apiRequest<{ accessToken: string }>('/admin/auth/login')).resolves.toEqual({
      accessToken: 'token-1',
    });
    expect(fetchSpy).toHaveBeenCalledWith(
      `${API_BASE_URL}/admin/auth/login`,
      expect.any(Object),
    );
  });

  it('throws a readable error when the API returns a 404 HTML page', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      createResponse({
        ok: false,
        status: 404,
        contentType: 'text/html; charset=utf-8',
        body: '<!doctype html><html><body>Not Found</body></html>',
      }),
    );

    await expect(apiRequest('/admin/auth/login')).rejects.toMatchObject({
      message: 'API endpoint not found. Check the API server or local proxy configuration.',
      status: 404,
      code: null,
    });
  });

  it('throws a readable error when the API returns an empty response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      createResponse({
        ok: true,
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: '',
      }),
    );

    await expect(apiRequest('/admin/auth/login')).rejects.toMatchObject({
      message: 'The API returned an empty response.',
      status: 200,
      code: null,
    });
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiRequest, API_BASE_URL, resolveApiAssetUrl } from './http';

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

describe('public-mobile http service', () => {
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
          data: { success: true },
        }),
      }),
    );

    await expect(apiRequest<{ success: boolean }>('/public/categories')).resolves.toEqual({
      success: true,
    });
    expect(fetchSpy).toHaveBeenCalledWith(
      `${API_BASE_URL}/public/categories`,
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

    await expect(apiRequest('/public/categories')).rejects.toMatchObject({
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

    await expect(apiRequest('/public/categories')).rejects.toMatchObject({
      message: 'The API returned an empty response.',
      status: 200,
      code: null,
    });
  });

  it('resolves relative asset urls against the API origin', () => {
    expect(resolveApiAssetUrl('/uploads/cocktails/negroni.jpg')).toBe(
      'http://localhost:3000/uploads/cocktails/negroni.jpg',
    );
    expect(resolveApiAssetUrl('https://images.example.com/drink.jpg')).toBe(
      'https://images.example.com/drink.jpg',
    );
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import { API_BASE_URL, resolveApiAssetUrl } from './http';
import { fetchPublicCocktails, fetchPublicCocktailDetail } from './public-menu';

describe('public-menu services', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('maps filters into the public cocktail list request', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 0,
        message: 'ok',
        data: {
          list: [],
          pagination: {
            page: 2,
            pageSize: 10,
            total: 0,
            totalPages: 1,
          },
        },
      }),
    } as Response);

    await fetchPublicCocktails({
      page: 2,
      pageSize: 10,
      keyword: ' martini ',
      categoryId: 3,
      tagId: 8,
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      `${API_BASE_URL}/public/cocktails?page=2&pageSize=10&keyword=martini&categoryId=3&tagId=8`,
      expect.any(Object),
    );
  });

  it('requests public cocktail detail by id', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 0,
        message: 'ok',
        data: {
          id: 12,
          nameZh: 'Negroni',
          tags: [],
          categories: [],
          recipeItems: [],
          imageUrls: [],
        },
      }),
    } as Response);

    await fetchPublicCocktailDetail(12);

    expect(fetchSpy).toHaveBeenCalledWith(
      `${API_BASE_URL}/public/cocktails/12`,
      expect.any(Object),
    );
  });

  it('resolves relative asset urls against the API origin', () => {
    expect(resolveApiAssetUrl('/uploads/cocktails/negroni.jpg')).toBe(
      'http://127.0.0.1:3000/uploads/cocktails/negroni.jpg',
    );
    expect(resolveApiAssetUrl('https://images.example.com/drink.jpg')).toBe(
      'https://images.example.com/drink.jpg',
    );
  });
});

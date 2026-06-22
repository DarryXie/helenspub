import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchAppCocktails,
  fetchPublicCategories,
  fetchPublicTags,
} from '../../services/cocktails';
import { CocktailDetailPage } from './CocktailDetailPage';
import { CocktailLibraryPage } from './CocktailLibraryPage';

vi.mock('../../services/cocktails', () => ({
  fetchAppCocktails: vi.fn(),
  fetchAppCocktailDetail: vi.fn().mockResolvedValue({
    id: 1,
    nameZh: 'Negroni',
    nameEn: 'Negroni',
    shortDescription: '苦甜平衡',
    coverImageUrl: null,
    baseSpirit: 'Gin',
    tasteProfile: '苦甜',
    description: '经典苦味鸡尾酒',
    abvNote: '偏强',
    glassType: 'Old Fashioned',
    garnish: '橙皮',
    method: '搅拌出杯',
    scene: '餐前',
    categories: [],
    tags: [],
    recipeItems: [],
    imageUrls: [],
  }),
  fetchPublicCategories: vi.fn(),
  fetchPublicTags: vi.fn(),
}));

const mockedFetchAppCocktails = vi.mocked(fetchAppCocktails);
const mockedFetchPublicCategories = vi.mocked(fetchPublicCategories);
const mockedFetchPublicTags = vi.mocked(fetchPublicTags);

function renderLibrary(initialEntry = '/cocktails') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/cocktails" element={<CocktailLibraryPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

function renderDetail(initialEntry = '/cocktails/1') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/cocktails/:id" element={<CocktailDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('cocktail browse and handoff flows', () => {
  beforeEach(() => {
    mockedFetchAppCocktails.mockReset();
    mockedFetchPublicCategories.mockReset();
    mockedFetchPublicTags.mockReset();
    mockedFetchPublicCategories.mockResolvedValue([{ id: 2, name: '经典', slug: 'classic' }]);
    mockedFetchPublicTags.mockResolvedValue([{ id: 8, name: '苦甜', color: '#444' }]);
    mockedFetchAppCocktails.mockResolvedValue({
      list: [
        {
          id: 1,
          nameZh: 'Negroni',
          nameEn: 'Negroni',
          shortDescription: '苦甜平衡',
          coverImageUrl: null,
          baseSpirit: 'Gin',
          tasteProfile: '苦甜',
          tags: [{ id: 8, name: '苦甜', color: '#444' }],
        },
      ],
      pagination: {
        page: 1,
        pageSize: 10,
        total: 1,
        totalPages: 1,
      },
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('reads keyword, categoryId, and tagId from the URL when requesting app cocktails', async () => {
    renderLibrary('/cocktails?keyword=neg&categoryId=2&tagId=8');

    await screen.findByRole('heading', { name: 'Negroni' });

    expect(mockedFetchAppCocktails).toHaveBeenCalledWith({
      categoryId: 2,
      keyword: 'neg',
      page: 1,
      pageSize: 10,
      tagId: 8,
    });
  });

  it('offers a create-task link from the list and keeps only the back link on the detail page', async () => {
    renderLibrary();
    await screen.findByRole('heading', { name: 'Negroni' });

    const createLink = screen.getByRole('link', { name: '加入待制作' });
    expect(createLink.getAttribute('href')).toContain('/tasks/order?cocktailId=1');

    cleanup();
    renderDetail();

    const backLink = await screen.findByRole('link', {
      name: '返回上一页',
    });
    expect(backLink.getAttribute('href')).toContain('/tasks/order');
    expect(screen.queryByRole('link', { name: '去点单' })).not.toBeInTheDocument();
  });
});

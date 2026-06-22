import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../services/http';
import { fetchPublicCocktailDetail } from '../../services/public-menu';
import { CocktailDetailPage } from './CocktailDetailPage';

vi.mock('../../services/public-menu', () => ({
  fetchPublicCocktailDetail: vi.fn(),
}));

const mockedFetchPublicCocktailDetail = vi.mocked(fetchPublicCocktailDetail);

function renderDetail(initialEntry = '/menu/cocktails/1') {
  return render(
    <MemoryRouter basename="/menu" initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/cocktails/:id" element={<CocktailDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('CocktailDetailPage', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders public cocktail detail content and price', async () => {
    mockedFetchPublicCocktailDetail.mockResolvedValue({
      id: 1,
      nameZh: 'Night Bloom',
      nameEn: 'Night Bloom',
      shortDescription: '花香、苦感与丝绸般酒体。',
      coverImageUrl: null,
      baseSpirit: 'Gin',
      tasteProfile: '花香、微苦',
      price: 68,
      description: '一杯适合夜晚慢慢喝的琴酒鸡尾酒。',
      glassType: 'Coupe',
      garnish: '葡萄柚皮',
      method: '搅拌后过滤入杯。',
      scene: '夜晚、慢饮',
      abvNote: '中等',
      categories: [{ id: 2, name: 'Sours' }],
      tags: [{ id: 8, name: '烟熏' }],
      recipeItems: [
        {
          id: 1,
          ingredientId: 11,
          ingredientName: 'Gin',
          amount: 45,
          unit: 'ml',
          note: null,
          sortOrder: 1,
        },
      ],
      imageUrls: [],
    });

    renderDetail();

    await screen.findByRole('heading', { name: 'Night Bloom' });
    expect(screen.queryByText('配方清单')).not.toBeInTheDocument();
    expect(screen.queryByText('饮用与制作')).not.toBeInTheDocument();
    expect(screen.getByText('¥68.00')).toBeInTheDocument();
  });

  it('renders a not-found state for missing cocktails', async () => {
    mockedFetchPublicCocktailDetail.mockRejectedValue(
      new ApiError('Cocktail not found', 404, 4040),
    );

    renderDetail('/menu/cocktails/404');

    await screen.findByText('酒单中暂未找到这杯酒');
    expect(screen.getAllByRole('link', { name: '返回菜单' })[0]).toHaveAttribute('href', '/menu');
  });
});

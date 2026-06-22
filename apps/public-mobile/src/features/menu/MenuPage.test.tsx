import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MenuPage } from './MenuPage';
import {
  fetchPublicCategories,
  fetchPublicCocktails,
  fetchPublicTags,
} from '../../services/public-menu';

vi.mock('../../services/public-menu', () => ({
  fetchPublicCategories: vi.fn(),
  fetchPublicCocktails: vi.fn(),
  fetchPublicTags: vi.fn(),
}));

const mockedFetchPublicCocktails = vi.mocked(fetchPublicCocktails);
const mockedFetchPublicCategories = vi.mocked(fetchPublicCategories);
const mockedFetchPublicTags = vi.mocked(fetchPublicTags);

function renderMenu(initialEntry = '/menu') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route element={<MenuPage />} path="/" />
        <Route element={<MenuPage />} path="/menu" />
      </Routes>
    </MemoryRouter>,
  );
}

describe('MenuPage', () => {
  beforeEach(() => {
    mockedFetchPublicCategories.mockResolvedValue([
      { id: 1, name: '经典鸡尾酒' },
      { id: 2, name: '特调鸡尾酒' },
    ]);
    mockedFetchPublicTags.mockResolvedValue([
      { id: 7, name: '清爽' },
      { id: 8, name: '甜' },
    ]);
    mockedFetchPublicCocktails.mockResolvedValue({
      list: [
        {
          id: 1,
          nameZh: '琥珀微光',
          nameEn: 'Amber Glow',
          shortDescription: '柑橘、蜂蜜和轻微草本感，入口清亮。',
          tasteProfile: '清爽',
          coverImageUrl: null,
          price: 58,
          tags: [{ id: 7, name: '清爽' }],
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
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('loads filters and cocktails on first render', async () => {
    renderMenu();

    await screen.findByRole('heading', { name: '琥珀微光' });

    expect(mockedFetchPublicCategories).toHaveBeenCalledTimes(1);
    expect(mockedFetchPublicTags).toHaveBeenCalledTimes(1);
    expect(mockedFetchPublicCocktails).toHaveBeenCalledWith({
      page: 1,
      pageSize: 10,
      categoryId: undefined,
      tagId: undefined,
    });
  });

  it('updates the request after selecting a flavor tag', async () => {
    renderMenu();

    await screen.findByRole('heading', { name: '琥珀微光' });
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: '甜' }));

    await waitFor(() => {
      expect(mockedFetchPublicCocktails).toHaveBeenLastCalledWith({
        page: 1,
        pageSize: 10,
        categoryId: undefined,
        tagId: 8,
      });
    });
  });

  it('keeps existing filters when paging forward', async () => {
    mockedFetchPublicCocktails.mockResolvedValue({
      list: [
        {
          id: 1,
          nameZh: '琥珀微光',
          nameEn: 'Amber Glow',
          shortDescription: '柑橘、蜂蜜和轻微草本感，入口清亮。',
          tasteProfile: '清爽',
          coverImageUrl: null,
          tags: [{ id: 7, name: '清爽' }],
        },
      ],
      pagination: {
        page: 1,
        pageSize: 10,
        total: 24,
        totalPages: 3,
      },
    });

    const user = userEvent.setup();
    renderMenu('/menu?categoryId=2');

    await screen.findByRole('heading', { name: '琥珀微光' });
    await user.click(screen.getByRole('button', { name: '下一页' }));

    await waitFor(() => {
      expect(mockedFetchPublicCocktails).toHaveBeenLastCalledWith({
        page: 2,
        pageSize: 10,
        categoryId: 2,
        tagId: undefined,
      });
    });
  });

  it('shows an error state and retries loading', async () => {
    mockedFetchPublicCocktails
      .mockRejectedValueOnce(new Error('菜单服务暂时不可用'))
      .mockResolvedValueOnce({
        list: [
          {
            id: 9,
            nameZh: '丝绒酸',
            shortDescription: '酸甜平衡，酒体顺滑。',
            coverImageUrl: null,
            tags: [],
          },
        ],
        pagination: {
          page: 1,
          pageSize: 10,
          total: 1,
          totalPages: 1,
        },
      });

    const user = userEvent.setup();
    renderMenu();

    await screen.findByText('菜单暂时没有加载出来');
    await user.click(screen.getByRole('button', { name: '重新加载' }));

    await screen.findByText('丝绒酸');
  });
});

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

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];

  callback: IntersectionObserverCallback;
  elements = new Set<Element>();

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    MockIntersectionObserver.instances.push(this);
  }

  disconnect() {
    this.elements.clear();
  }

  observe(element: Element) {
    this.elements.add(element);
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  trigger(element: Element, isIntersecting = true) {
    if (!this.elements.has(element)) {
      return;
    }

    this.callback(
      [{ isIntersecting, target: element } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }

  unobserve(element: Element) {
    this.elements.delete(element);
  }
}

function createCocktail(id: number, nameZh: string) {
  return {
    id,
    nameZh,
    nameEn: `${nameZh} EN`,
    shortDescription: `${nameZh} 的描述`,
    tasteProfile: '清爽',
    coverImageUrl: null,
    price: 58,
    tags: [{ id: 7, name: '清爽' }],
  };
}

function createPaginatedResult(
  page: number,
  totalPages: number,
  items: ReturnType<typeof createCocktail>[],
) {
  return {
    list: items,
    pagination: {
      page,
      pageSize: 10,
      total: totalPages * 10,
      totalPages,
    },
  };
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((nextResolve, nextReject) => {
    resolve = nextResolve;
    reject = nextReject;
  });

  return { promise, resolve, reject };
}

function renderMenu(initialEntry = '/menu') {
  return render(
    <MemoryRouter basename="/menu" initialEntries={[initialEntry]}>
      <Routes>
        <Route element={<MenuPage />} path="/" />
      </Routes>
    </MemoryRouter>,
  );
}

function triggerLoadMore() {
  const sentinel = screen.getByTestId('menu-load-more-sentinel');
  const observer = MockIntersectionObserver.instances.at(-1);

  expect(observer).toBeDefined();
  observer?.trigger(sentinel, true);
}

describe('MenuPage', () => {
  beforeEach(() => {
    MockIntersectionObserver.instances = [];
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

    mockedFetchPublicCategories.mockResolvedValue([
      { id: 1, name: '经典鸡尾酒' },
      { id: 2, name: '特调鸡尾酒' },
    ]);
    mockedFetchPublicTags.mockResolvedValue([
      { id: 7, name: '清爽' },
      { id: 8, name: '甜' },
    ]);
    mockedFetchPublicCocktails.mockResolvedValue(
      createPaginatedResult(1, 1, [createCocktail(1, '琥珀微光')]),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('loads filters and cocktails on first render without pagination controls', async () => {
    renderMenu();

    expect(document.querySelector('.menu-row-skeleton')).toBeTruthy();
    await screen.findByRole('heading', { name: '琥珀微光' });

    expect(mockedFetchPublicCategories).toHaveBeenCalledTimes(1);
    expect(mockedFetchPublicTags).toHaveBeenCalledTimes(1);
    expect(mockedFetchPublicCocktails).toHaveBeenCalledWith({
      page: 1,
      pageSize: 10,
      categoryId: undefined,
      tagId: undefined,
    });
    expect(screen.queryByRole('button', { name: '上一页' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '下一页' })).not.toBeInTheDocument();
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

  it('updates the request after selecting a category', async () => {
    renderMenu();

    await screen.findByRole('heading', { name: '琥珀微光' });
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: '特调鸡尾酒' }));

    await waitFor(() => {
      expect(mockedFetchPublicCocktails).toHaveBeenLastCalledWith({
        page: 1,
        pageSize: 10,
        categoryId: 2,
        tagId: undefined,
      });
    });
  });

  it('loads the next page on intersection and appends items while showing a loading state', async () => {
    const pageTwoDeferred = createDeferred<ReturnType<typeof createPaginatedResult>>();

    mockedFetchPublicCocktails.mockImplementation(({ page, categoryId, tagId }) => {
      if (page === 1) {
        return Promise.resolve(createPaginatedResult(1, 2, [createCocktail(1, '琥珀微光')]));
      }

      if (page === 2) {
        expect(categoryId).toBe(2);
        expect(tagId).toBeUndefined();
        return pageTwoDeferred.promise;
      }

      throw new Error(`unexpected page ${page}`);
    });

    renderMenu('/menu?categoryId=2');

    await screen.findByRole('heading', { name: '琥珀微光' });
    triggerLoadMore();

    await waitFor(() => {
      expect(mockedFetchPublicCocktails).toHaveBeenLastCalledWith({
        page: 2,
        pageSize: 10,
        categoryId: 2,
        tagId: undefined,
      });
    });

    expect(screen.getByText('正在加载更多...')).toBeInTheDocument();

    pageTwoDeferred.resolve(createPaginatedResult(2, 2, [createCocktail(2, '丝绒酸')]));

    await screen.findByRole('heading', { name: '丝绒酸' });
    expect(screen.getByRole('heading', { name: '琥珀微光' })).toBeInTheDocument();
    expect(screen.queryByText('正在加载更多...')).not.toBeInTheDocument();
  });

  it('keeps existing items when load more fails and retries the same page', async () => {
    let pageTwoAttempts = 0;

    mockedFetchPublicCocktails.mockImplementation(({ page }) => {
      if (page === 1) {
        return Promise.resolve(createPaginatedResult(1, 2, [createCocktail(1, '琥珀微光')]));
      }

      if (page === 2) {
        pageTwoAttempts += 1;

        if (pageTwoAttempts === 1) {
          return Promise.reject(new Error('加载更多失败'));
        }

        return Promise.resolve(createPaginatedResult(2, 2, [createCocktail(2, '落日漂流')]));
      }

      throw new Error(`unexpected page ${page}`);
    });

    renderMenu();

    await screen.findByRole('heading', { name: '琥珀微光' });
    triggerLoadMore();

    await screen.findByText('加载更多失败');
    expect(screen.getByRole('heading', { name: '琥珀微光' })).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: '重试加载更多' }));

    await waitFor(() => {
      expect(mockedFetchPublicCocktails).toHaveBeenLastCalledWith({
        page: 2,
        pageSize: 10,
        categoryId: undefined,
        tagId: undefined,
      });
    });

    await screen.findByRole('heading', { name: '落日漂流' });
  });

  it('shows an error state and retries loading', async () => {
    mockedFetchPublicCocktails
      .mockRejectedValueOnce(new Error('菜单服务暂时不可用'))
      .mockResolvedValueOnce(createPaginatedResult(1, 1, [createCocktail(9, '丝绒酸')]));

    const user = userEvent.setup();
    renderMenu();

    await screen.findByText('菜单暂时没有加载出来');
    await user.click(screen.getByRole('button', { name: '重新加载' }));

    await screen.findByRole('heading', { name: '丝绒酸' });
  });
});

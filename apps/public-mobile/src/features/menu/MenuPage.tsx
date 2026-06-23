import { startTransition, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import type { CategoryItem, CocktailListItem, TagItem } from '../../types/public-menu';
import {
  fetchPublicCategories,
  fetchPublicCocktails,
  fetchPublicTags,
} from '../../services/public-menu';
import { resolveApiAssetUrl } from '../../services/http';

const PAGE_SIZE = 10;

function parsePositiveNumber(value: string | null) {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function buildSearchParams(filters: {
  categoryId?: number;
  tagId?: number;
}) {
  const params = new URLSearchParams();

  if (filters.categoryId) {
    params.set('categoryId', String(filters.categoryId));
  }

  if (filters.tagId) {
    params.set('tagId', String(filters.tagId));
  }

  return params;
}

function formatPrice(price?: number | null) {
  if (typeof price !== 'number' || Number.isNaN(price)) {
    return '时价';
  }

  return `¥${price.toFixed(0)}`;
}

function MenuRow({
  item,
  fromSearch,
}: {
  item: CocktailListItem;
  fromSearch: string;
}) {
  const coverImage = resolveApiAssetUrl(item.coverImageUrl);
  const visibleTags = item.tags.slice(0, 3);
  const description = item.shortDescription || item.tasteProfile || '风味信息待补充';

  return (
    <article className="menu-row">
      <Link className="menu-row-link" state={{ fromSearch }} to={`/cocktails/${item.id}`}>
        <div className="menu-row-media">
          {coverImage ? (
            <img alt={item.nameZh} src={coverImage} />
          ) : (
            <div className="menu-row-placeholder">
              <span>{item.nameZh.slice(0, 1)}</span>
            </div>
          )}
        </div>

        <div className="menu-row-copy">
          <div className="menu-row-title">
            <h2>{item.nameZh}</h2>
            {item.nameEn ? <p className="menu-row-name-en">{item.nameEn}</p> : null}
          </div>

          <div className="menu-row-tags">
            {visibleTags.length > 0 ? (
              visibleTags.map((tag) => (
                <span className="menu-flavor-pill" key={tag.id}>
                  {tag.name}
                </span>
              ))
            ) : item.tasteProfile ? (
              <span className="menu-flavor-pill">{item.tasteProfile}</span>
            ) : null}
          </div>

          <p className="menu-row-description">{description}</p>
        </div>

        <div className="menu-row-price-slot">
          <p className="menu-row-price">{formatPrice(item.price)}</p>
        </div>
      </Link>
    </article>
  );
}

function MenuListSkeleton() {
  return (
    <div aria-hidden="true" className="menu-list">
      {Array.from({ length: 6 }).map((_, index) => (
        <div className="menu-row menu-row-skeleton" key={index}>
          <div className="menu-row-skeleton-media" />
          <div className="menu-row-skeleton-copy">
            <span className="menu-row-skeleton-line menu-row-skeleton-line-short" />
            <span className="menu-row-skeleton-line menu-row-skeleton-line-tags" />
            <span className="menu-row-skeleton-line menu-row-skeleton-line-long" />
          </div>
          <div className="menu-row-skeleton-price" />
        </div>
      ))}
    </div>
  );
}

function MenuLoadMoreSkeleton() {
  return (
    <div aria-live="polite" className="menu-load-more" role="status">
      <p className="menu-loading-chip">正在加载更多...</p>
      <div aria-hidden="true" className="menu-list menu-list-loading-more">
        {Array.from({ length: 2 }).map((_, index) => (
          <div className="menu-row menu-row-skeleton" key={index}>
            <div className="menu-row-skeleton-media" />
            <div className="menu-row-skeleton-copy">
              <span className="menu-row-skeleton-line menu-row-skeleton-line-short" />
              <span className="menu-row-skeleton-line menu-row-skeleton-line-tags" />
              <span className="menu-row-skeleton-line menu-row-skeleton-line-long" />
            </div>
            <div className="menu-row-skeleton-price" />
          </div>
        ))}
      </div>
    </div>
  );
}

function FilterRetry({
  message,
  onRetry,
  buttonLabel = '重试',
}: {
  message: string;
  onRetry: () => void;
  buttonLabel?: string;
}) {
  return (
    <div className="inline-error" role="alert">
      <span>{message}</span>
      <button onClick={onRetry} type="button">
        {buttonLabel}
      </button>
    </div>
  );
}

export function MenuPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [filtersError, setFiltersError] = useState<string | null>(null);
  const [isFiltersLoading, setIsFiltersLoading] = useState(true);
  const [menuItems, setMenuItems] = useState<CocktailListItem[]>([]);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [retryToken, setRetryToken] = useState(0);
  const menuListScrollRef = useRef<HTMLDivElement | null>(null);
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);
  const activeMenuRequestRef = useRef(0);
  const loadMoreLockRef = useRef(false);

  const categoryId = parsePositiveNumber(searchParams.get('categoryId'));
  const tagId = parsePositiveNumber(searchParams.get('tagId'));
  const currentFilterParams = buildSearchParams({ categoryId, tagId });
  const currentFilterSearch = currentFilterParams.toString();
  const fromSearch = currentFilterSearch
    ? `${location.pathname}?${currentFilterSearch}`
    : location.pathname;
  const hasActiveFilters = Boolean(categoryId || tagId);

  useEffect(() => {
    let isCancelled = false;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsFiltersLoading(true);
    setFiltersError(null);

    Promise.all([fetchPublicCategories(), fetchPublicTags()])
      .then(([nextCategories, nextTags]) => {
        if (isCancelled) {
          return;
        }

        setCategories(nextCategories);
        setTags(nextTags);
      })
      .catch((error: Error) => {
        if (isCancelled) {
          return;
        }

        setFiltersError(error.message || '筛选项加载失败');
      })
      .finally(() => {
        if (!isCancelled) {
          setIsFiltersLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [retryToken]);

  useEffect(() => {
    let isCancelled = false;
    const requestId = activeMenuRequestRef.current + 1;
    activeMenuRequestRef.current = requestId;
    loadMoreLockRef.current = false;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsInitialLoading(true);
    setIsLoadingMore(false);
    setMenuError(null);
    setLoadMoreError(null);
    setMenuItems([]);
    setCurrentPage(0);
    setTotalPages(1);

    fetchPublicCocktails({
      page: 1,
      pageSize: PAGE_SIZE,
      categoryId,
      tagId,
    })
      .then((result) => {
        if (isCancelled || requestId !== activeMenuRequestRef.current) {
          return;
        }

        setMenuItems(result.list);
        setCurrentPage(result.pagination.page);
        setTotalPages(result.pagination.totalPages);
      })
      .catch((error: Error) => {
        if (isCancelled || requestId !== activeMenuRequestRef.current) {
          return;
        }

        setMenuError(error.message || '菜单加载失败');
      })
      .finally(() => {
        if (!isCancelled && requestId === activeMenuRequestRef.current) {
          setIsInitialLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [categoryId, tagId, retryToken]);

  function updateSearch(partial: {
    categoryId?: number;
    tagId?: number;
  }) {
    const nextParams = buildSearchParams({
      categoryId: Object.prototype.hasOwnProperty.call(partial, 'categoryId')
        ? partial.categoryId
        : categoryId,
      tagId: Object.prototype.hasOwnProperty.call(partial, 'tagId') ? partial.tagId : tagId,
    });

    startTransition(() => {
      setSearchParams(nextParams);
    });
  }

  function handleCategoryToggle(nextCategoryId?: number) {
    updateSearch({
      categoryId: nextCategoryId,
      tagId,
    });
  }

  function handleTagToggle(nextTagId?: number) {
    updateSearch({
      categoryId,
      tagId: nextTagId,
    });
  }

  function handleClearFilters() {
    startTransition(() => {
      setSearchParams(new URLSearchParams());
    });
  }

  function handleRetry() {
    setRetryToken((value) => value + 1);
  }

  function handleLoadMore(nextPage: number) {
    if (
      loadMoreLockRef.current ||
      isInitialLoading ||
      isLoadingMore ||
      menuError ||
      nextPage <= currentPage ||
      nextPage > totalPages
    ) {
      return;
    }

    loadMoreLockRef.current = true;
    const requestId = activeMenuRequestRef.current;

    setIsLoadingMore(true);
    setLoadMoreError(null);

    fetchPublicCocktails({
      page: nextPage,
      pageSize: PAGE_SIZE,
      categoryId,
      tagId,
    })
      .then((result) => {
        if (requestId !== activeMenuRequestRef.current) {
          return;
        }

        setMenuItems((previousItems) => [...previousItems, ...result.list]);
        setCurrentPage(result.pagination.page);
        setTotalPages(result.pagination.totalPages);
      })
      .catch((error: Error) => {
        if (requestId !== activeMenuRequestRef.current) {
          return;
        }

        setLoadMoreError(error.message || '加载更多失败');
      })
      .finally(() => {
        if (requestId === activeMenuRequestRef.current) {
          loadMoreLockRef.current = false;
          setIsLoadingMore(false);
        }
      });
  }

  function handleRetryLoadMore() {
    handleLoadMore(currentPage + 1);
  }

  useEffect(() => {
    const root = menuListScrollRef.current;
    const sentinel = loadMoreSentinelRef.current;

    if (
      !root ||
      !sentinel ||
      isInitialLoading ||
      isLoadingMore ||
      Boolean(menuError) ||
      Boolean(loadMoreError) ||
      menuItems.length === 0 ||
      currentPage >= totalPages
    ) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          handleLoadMore(currentPage + 1);
        }
      },
      {
        root,
        rootMargin: '0px 0px 160px 0px',
        threshold: 0.01,
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [
    currentPage,
    totalPages,
    isInitialLoading,
    isLoadingMore,
    menuError,
    loadMoreError,
    menuItems.length,
    categoryId,
    tagId,
  ]);

  return (
    <main className="menu-shell menu-shell-compact">
      <div className="menu-compact-layout">
        <aside className="menu-category-panel" aria-label="主分类">
          {filtersError ? (
            <FilterRetry message={filtersError} onRetry={handleRetry} />
          ) : isFiltersLoading ? (
            <div aria-hidden="true" className="menu-category-skeleton">
              {Array.from({ length: 6 }).map((_, index) => (
                <span className="menu-category-skeleton-item" key={index} />
              ))}
            </div>
          ) : (
            <nav className="menu-category-list">
              <button
                aria-pressed={!categoryId}
                className={`menu-category-button${!categoryId ? ' is-active' : ''}`}
                onClick={() => handleCategoryToggle(undefined)}
                type="button"
              >
                全部
              </button>
              {categories.map((category) => (
                <button
                  aria-pressed={category.id === categoryId}
                  className={`menu-category-button${category.id === categoryId ? ' is-active' : ''}`}
                  key={category.id}
                  onClick={() =>
                    handleCategoryToggle(category.id === categoryId ? undefined : category.id)
                  }
                  type="button"
                >
                  {category.name}
                </button>
              ))}
            </nav>
          )}
        </aside>

        <section className="menu-main-panel">
          <section className="menu-tag-bar" aria-label="风味标签">
            {filtersError ? (
              <FilterRetry message={filtersError} onRetry={handleRetry} />
            ) : isFiltersLoading ? (
              <div aria-hidden="true" className="pill-skeleton-row">
                {Array.from({ length: 7 }).map((_, index) => (
                  <span className="pill-skeleton pill-skeleton-small" key={index} />
                ))}
              </div>
            ) : (
              <div className="menu-tag-strip">
                <button
                  className={`tag-pill${!tagId ? ' is-active' : ''}`}
                  onClick={() => handleTagToggle(undefined)}
                  type="button"
                >
                  全部风味
                </button>
                {tags.map((tag) => (
                  <button
                    className={`tag-pill${tag.id === tagId ? ' is-active' : ''}`}
                    key={tag.id}
                    onClick={() => handleTagToggle(tag.id === tagId ? undefined : tag.id)}
                    type="button"
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="menu-list-panel">
            {menuError ? (
              <div className="status-panel" role="alert">
                <h3>菜单暂时没有加载出来</h3>
                <p>{menuError}</p>
                <button className="status-action" onClick={handleRetry} type="button">
                  重新加载
                </button>
              </div>
            ) : isInitialLoading ? (
              <div className="menu-list-scroll">
                <MenuListSkeleton />
              </div>
            ) : menuItems.length === 0 ? (
              <div className="status-panel">
                <h3>还没找到符合条件的酒</h3>
                <p>换一个分类或风味标签试试。</p>
                {hasActiveFilters ? (
                  <button className="status-action" onClick={handleClearFilters} type="button">
                    查看全部酒单
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="menu-list-scroll" ref={menuListScrollRef}>
                <div className="menu-list">
                  {menuItems.map((item) => (
                    <MenuRow fromSearch={fromSearch} item={item} key={item.id} />
                  ))}
                </div>
                {isLoadingMore ? <MenuLoadMoreSkeleton /> : null}
                {loadMoreError ? (
                  <div className="menu-load-more-retry">
                    <FilterRetry
                      buttonLabel="重试加载更多"
                      message={loadMoreError}
                      onRetry={handleRetryLoadMore}
                    />
                  </div>
                ) : null}
                <div
                  aria-hidden="true"
                  className="menu-load-more-sentinel"
                  data-testid="menu-load-more-sentinel"
                  ref={loadMoreSentinelRef}
                />
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}

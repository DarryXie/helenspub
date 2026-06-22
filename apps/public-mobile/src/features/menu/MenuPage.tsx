import { startTransition, useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import type {
  CategoryItem,
  CocktailListItem,
  PaginatedResult,
  TagItem,
} from '../../types/public-menu';
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
  page?: number;
}) {
  const params = new URLSearchParams();

  if (filters.categoryId) {
    params.set('categoryId', String(filters.categoryId));
  }

  if (filters.tagId) {
    params.set('tagId', String(filters.tagId));
  }

  if (filters.page && filters.page > 1) {
    params.set('page', String(filters.page));
  }

  return params;
}

function paginationWindow(currentPage: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  return Array.from({ length: 5 }, (_, index) => start + index);
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

function Pagination({
  page,
  totalPages,
  onSelectPage,
}: {
  page: number;
  totalPages: number;
  onSelectPage: (nextPage: number) => void;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = paginationWindow(page, totalPages);

  return (
    <nav aria-label="菜单分页" className="pagination">
      <button
        className="pagination-button"
        disabled={page <= 1}
        onClick={() => onSelectPage(page - 1)}
        type="button"
      >
        上一页
      </button>
      <div className="pagination-pages">
        {pages.map((item) => (
          <button
            aria-current={item === page ? 'page' : undefined}
            className={`pagination-page${item === page ? ' is-active' : ''}`}
            key={item}
            onClick={() => onSelectPage(item)}
            type="button"
          >
            {item}
          </button>
        ))}
      </div>
      <button
        className="pagination-button"
        disabled={page >= totalPages}
        onClick={() => onSelectPage(page + 1)}
        type="button"
      >
        下一页
      </button>
    </nav>
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

function FilterRetry({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="inline-error" role="alert">
      <span>{message}</span>
      <button onClick={onRetry} type="button">
        重试
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
  const [menuResult, setMenuResult] = useState<PaginatedResult<CocktailListItem> | null>(null);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [isMenuLoading, setIsMenuLoading] = useState(true);
  const [retryToken, setRetryToken] = useState(0);

  const categoryId = parsePositiveNumber(searchParams.get('categoryId'));
  const tagId = parsePositiveNumber(searchParams.get('tagId'));
  const page = parsePositiveNumber(searchParams.get('page')) ?? 1;
  const fromSearch = `${location.pathname}${location.search}`;
  const hasActiveFilters = Boolean(categoryId || tagId);
  const visiblePages = menuResult?.pagination.totalPages ?? 1;

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

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMenuLoading(true);
    setMenuError(null);

    fetchPublicCocktails({
      page,
      pageSize: PAGE_SIZE,
      categoryId,
      tagId,
    })
      .then((result) => {
        if (!isCancelled) {
          setMenuResult(result);
        }
      })
      .catch((error: Error) => {
        if (!isCancelled) {
          setMenuError(error.message || '菜单加载失败');
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsMenuLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [page, categoryId, tagId, retryToken]);

  function updateSearch(partial: {
    categoryId?: number;
    tagId?: number;
    page?: number;
  }) {
    const nextParams = buildSearchParams({
      categoryId: Object.prototype.hasOwnProperty.call(partial, 'categoryId')
        ? partial.categoryId
        : categoryId,
      tagId: Object.prototype.hasOwnProperty.call(partial, 'tagId') ? partial.tagId : tagId,
      page: partial.page !== undefined ? partial.page : page,
    });

    startTransition(() => {
      setSearchParams(nextParams);
    });
  }

  function handleCategoryToggle(nextCategoryId?: number) {
    updateSearch({
      categoryId: nextCategoryId,
      tagId,
      page: 1,
    });
  }

  function handleTagToggle(nextTagId?: number) {
    updateSearch({
      categoryId,
      tagId: nextTagId,
      page: 1,
    });
  }

  function handlePageChange(nextPage: number) {
    updateSearch({
      categoryId,
      tagId,
      page: nextPage,
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
            ) : isMenuLoading && !menuResult ? (
              <div className="menu-list-scroll">
                <MenuListSkeleton />
              </div>
            ) : menuResult && menuResult.list.length === 0 ? (
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
              <>
                <div className="menu-list-scroll">
                  <div className="menu-list">
                    {menuResult?.list.map((item) => (
                      <MenuRow fromSearch={fromSearch} item={item} key={item.id} />
                    ))}
                  </div>
                </div>
                <Pagination page={page} totalPages={visiblePages} onSelectPage={handlePageChange} />
              </>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}

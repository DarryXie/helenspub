import type { CategoryItem, CocktailListItem, PaginatedResult, TagItem } from '@cocktail/shared-types';
import { startTransition, useDeferredValue, useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { EmptyState } from '../../components/EmptyState';
import { InlineError } from '../../components/InlineError';
import { Pagination } from '../../components/Pagination';
import { fetchAppCocktails, fetchPublicCategories, fetchPublicTags } from '../../services/cocktails';
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
  keyword?: string;
  categoryId?: number;
  tagId?: number;
  page?: number;
}) {
  const params = new URLSearchParams();

  if (filters.keyword?.trim()) {
    params.set('keyword', filters.keyword.trim());
  }

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

function CocktailRow({
  item,
  fromSearch,
}: {
  item: CocktailListItem;
  fromSearch: string;
}) {
  const coverImage = resolveApiAssetUrl(item.coverImageUrl);

  return (
    <article className="cocktail-row">
      <div className="cocktail-row-link">
        <div className="cocktail-row-media">
          {coverImage ? (
            <img alt={item.nameZh} src={coverImage} />
          ) : (
            <div className="media-fallback">{item.nameZh.slice(0, 1)}</div>
          )}
        </div>

        <div className="cocktail-row-copy">
          <div className="cocktail-row-header">
            <div>
              <h2>{item.nameZh}</h2>
              {item.nameEn ? <p>{item.nameEn}</p> : null}
            </div>
            <span className="status-pill status-pending">随手可加单</span>
          </div>

          <div className="pill-row">
            {item.tags.length > 0 ? (
              item.tags.map((tag) => (
                <span className="soft-pill is-tag" key={tag.id}>
                  {tag.name}
                </span>
              ))
            ) : item.tasteProfile ? (
              <span className="soft-pill is-tag">{item.tasteProfile}</span>
            ) : null}
          </div>

          <p>{item.shortDescription || '适合在出杯前快速确认风味与配方的一杯。'}</p>

          <div className="action-row">
            <Link className="ghost-button is-solid" state={{ fromSearch }} to={`/cocktails/${item.id}`}>
              查看配方
            </Link>
            <Link className="primary-button is-compact" to={`/tasks/order?cocktailId=${item.id}`}>
              加入待制作
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export function CocktailLibraryPage() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchParams.get('keyword') ?? '');
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [filtersError, setFiltersError] = useState<string | null>(null);
  const [isFiltersLoading, setIsFiltersLoading] = useState(true);
  const [result, setResult] = useState<PaginatedResult<CocktailListItem> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryToken, setRetryToken] = useState(0);

  const keyword = searchParams.get('keyword') ?? '';
  const deferredKeyword = useDeferredValue(searchValue);
  const categoryId = parsePositiveNumber(searchParams.get('categoryId'));
  const tagId = parsePositiveNumber(searchParams.get('tagId'));
  const page = parsePositiveNumber(searchParams.get('page')) ?? 1;
  const fromSearch = `${location.pathname}${location.search}`;

  useEffect(() => {
    if (searchValue === keyword) {
      return;
    }

    const timer = window.setTimeout(() => {
      const nextParams = buildSearchParams({
        keyword: deferredKeyword,
        categoryId,
        tagId,
        page: 1,
      });

      startTransition(() => {
        setSearchParams(nextParams, { replace: true });
      });
    }, 220);

    return () => window.clearTimeout(timer);
  }, [searchValue, deferredKeyword, keyword, categoryId, tagId, setSearchParams]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearchValue(keyword);
  }, [keyword]);

  useEffect(() => {
    let isCancelled = false;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsFiltersLoading(true);
    setFiltersError(null);

    Promise.all([fetchPublicCategories(), fetchPublicTags()])
      .then(([nextCategories, nextTags]) => {
        if (!isCancelled) {
          setCategories(nextCategories);
          setTags(nextTags);
        }
      })
      .catch((requestError: Error) => {
        if (!isCancelled) {
          setFiltersError(requestError.message || '筛选项加载失败。');
        }
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
    setIsLoading(true);
    setError(null);

    fetchAppCocktails({
      page,
      pageSize: PAGE_SIZE,
      keyword: keyword || undefined,
      categoryId,
      tagId,
    })
      .then((nextResult) => {
        if (!isCancelled) {
          setResult(nextResult);
        }
      })
      .catch((requestError: Error) => {
        if (!isCancelled) {
          setError(requestError.message || '鸡尾酒列表加载失败。');
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [page, keyword, categoryId, tagId, retryToken]);

  function updateSearch(partial: {
    keyword?: string;
    categoryId?: number;
    tagId?: number;
    page?: number;
  }) {
    const nextParams = buildSearchParams({
      keyword: Object.prototype.hasOwnProperty.call(partial, 'keyword') ? partial.keyword : keyword,
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

  return (
    <section className="page-stack">
      <section className="filter-bar">
        <label className="search-field">
          <span>搜索鸡尾酒</span>
          <input
            aria-label="搜索鸡尾酒"
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="输入中文名、英文名或风味关键词"
            type="search"
            value={searchValue}
          />
        </label>

        <div className="filter-groups">
          <div className="chip-group">
            <span className="group-label">分类</span>
            {filtersError ? (
              <InlineError message={filtersError} onRetry={() => setRetryToken((value) => value + 1)} />
            ) : isFiltersLoading ? (
              <div className="pill-row">
                {Array.from({ length: 4 }).map((_, index) => (
                  <span className="soft-pill skeleton-pill" key={index} />
                ))}
              </div>
            ) : (
              <div className="pill-row">
                <button
                  className={`soft-pill pill-button${!categoryId ? ' is-active' : ''}`}
                  onClick={() => updateSearch({ categoryId: undefined, page: 1 })}
                  type="button"
                >
                  全部
                </button>
                {categories.map((category) => (
                  <button
                    className={`soft-pill pill-button${category.id === categoryId ? ' is-active' : ''}`}
                    key={category.id}
                    onClick={() =>
                      updateSearch({
                        categoryId: category.id === categoryId ? undefined : category.id,
                        page: 1,
                      })
                    }
                    type="button"
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="chip-group">
            <span className="group-label">风味</span>
            {filtersError ? (
              <InlineError message={filtersError} onRetry={() => setRetryToken((value) => value + 1)} />
            ) : isFiltersLoading ? (
              <div className="pill-row">
                {Array.from({ length: 5 }).map((_, index) => (
                  <span className="soft-pill skeleton-pill" key={index} />
                ))}
              </div>
            ) : (
              <div className="pill-row">
                <button
                  className={`soft-pill pill-button${!tagId ? ' is-active' : ''}`}
                  onClick={() => updateSearch({ tagId: undefined, page: 1 })}
                  type="button"
                >
                  全部
                </button>
                {tags.map((tag) => (
                  <button
                    className={`soft-pill pill-button${tag.id === tagId ? ' is-active' : ''}`}
                    key={tag.id}
                    onClick={() =>
                      updateSearch({
                        tagId: tag.id === tagId ? undefined : tag.id,
                        page: 1,
                      })
                    }
                    type="button"
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {error ? (
        <InlineError message={error} onRetry={() => setRetryToken((value) => value + 1)} />
      ) : isLoading && !result ? (
        <div className="card-list">
          {Array.from({ length: 5 }).map((_, index) => (
            <article className="cocktail-row is-skeleton" key={index}>
              <div className="cocktail-row-media skeleton" />
              <div className="cocktail-row-copy">
                <span className="skeleton-line short" />
                <span className="skeleton-line medium" />
                <span className="skeleton-line long" />
              </div>
            </article>
          ))}
        </div>
      ) : result && result.list.length === 0 ? (
        <EmptyState
          title="暂时没有匹配的鸡尾酒"
          description="换个关键词，或者清掉筛选条件，再继续从酒单里找到适合这一轮的那一杯。"
          action={
            <button
              className="ghost-button is-solid"
              onClick={() =>
                startTransition(() => {
                  setSearchParams(new URLSearchParams());
                })
              }
              type="button"
            >
              清空筛选
            </button>
          }
        />
      ) : (
        <>
          <div className="card-list">
            {result?.list.map((item) => (
              <CocktailRow fromSearch={fromSearch} item={item} key={item.id} />
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={result?.pagination.totalPages ?? 1}
            onSelectPage={(nextPage) => updateSearch({ page: nextPage })}
          />
        </>
      )}
    </section>
  );
}

import type {
  CategoryItem,
  CocktailListItem,
  PaginatedResult,
  TagItem,
} from '@cocktail/shared-types';
import { startTransition, useDeferredValue, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EmptyState } from '../../../components/EmptyState';
import { InlineError } from '../../../components/InlineError';
import { fetchAppCocktails, fetchPublicCategories, fetchPublicTags } from '../../../services/cocktails';
import { resolveApiAssetUrl } from '../../../services/http';
import { createProductionTask } from '../../../services/production-tasks';
import { OrderRemarkModal } from '../shared/OrderRemarkModal';
import { useWorkbenchTaskCounts } from '../shared/useWorkbenchTaskCounts';
import { WorkbenchTabs } from '../shared/WorkbenchTabs';

const PAGE_SIZE = 100;

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
  cocktailId?: number;
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

  if (filters.cocktailId) {
    params.set('cocktailId', String(filters.cocktailId));
  }

  return params;
}

function formatPrice(price?: number | null) {
  if (typeof price !== 'number' || Number.isNaN(price)) {
    return '时价';
  }

  return `¥${price.toFixed(0)}`;
}

function OrderRow({
  item,
  onOrder,
}: {
  item: CocktailListItem;
  onOrder: (item: CocktailListItem) => void;
}) {
  const coverImage = resolveApiAssetUrl(item.coverImageUrl);
  const visibleTags = item.tags.slice(0, 3);

  return (
    <article className="menu-row workbench-order-row">
      <div className="menu-row-link workbench-order-row-link">
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

          <p className="menu-row-description workbench-order-row-description">
            {item.shortDescription || item.tasteProfile || '适合当前点单场景的经典搭配。'}
          </p>
        </div>

        <div className="workbench-order-side">
          <p className="menu-row-price">{formatPrice(item.price)}</p>
          <button className="btn-order" onClick={() => onOrder(item)} type="button">
            下单
          </button>
        </div>
      </div>
    </article>
  );
}

export function OrderWorkbenchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchParams.get('keyword') ?? '');
  const deferredKeyword = useDeferredValue(searchValue);
  const keyword = searchParams.get('keyword') ?? '';
  const categoryId = parsePositiveNumber(searchParams.get('categoryId'));
  const tagId = parsePositiveNumber(searchParams.get('tagId'));
  const prefilledCocktailId = parsePositiveNumber(searchParams.get('cocktailId'));
  const autoOpenedCocktailId = useRef<number | undefined>(undefined);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [filtersError, setFiltersError] = useState<string | null>(null);
  const [isFiltersLoading, setIsFiltersLoading] = useState(true);
  const [result, setResult] = useState<PaginatedResult<CocktailListItem> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryToken, setRetryToken] = useState(0);
  const [orderingCocktail, setOrderingCocktail] = useState<CocktailListItem | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const {
    counts,
    error: countsError,
    isLoading: isCountsLoading,
    refreshCounts,
  } = useWorkbenchTaskCounts(retryToken);

  useEffect(() => {
    if (searchValue === keyword) {
      return;
    }

    const timer = window.setTimeout(() => {
      const nextParams = buildSearchParams({
        keyword: deferredKeyword,
        categoryId,
        tagId,
        cocktailId: prefilledCocktailId,
      });

      startTransition(() => {
        setSearchParams(nextParams, { replace: true });
      });
    }, 220);

    return () => window.clearTimeout(timer);
  }, [searchValue, deferredKeyword, keyword, categoryId, tagId, prefilledCocktailId, setSearchParams]);

  useEffect(() => {
    setSearchValue(keyword);
  }, [keyword]);

  useEffect(() => {
    let isCancelled = false;
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
      .catch((requestError: Error) => {
        if (!isCancelled) {
          setFiltersError(requestError.message || '筛选项加载失败');
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
    setIsLoading(true);
    setError(null);

    fetchAppCocktails({
      page: 1,
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
          setError(requestError.message || '酒单加载失败');
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
  }, [keyword, categoryId, tagId, retryToken]);

  useEffect(() => {
    if (!prefilledCocktailId || !result || autoOpenedCocktailId.current === prefilledCocktailId) {
      return;
    }

    const matchedCocktail = result.list.find((item) => item.id === prefilledCocktailId);

    if (!matchedCocktail) {
      return;
    }

    autoOpenedCocktailId.current = prefilledCocktailId;
    setOrderingCocktail(matchedCocktail);
  }, [prefilledCocktailId, result]);

  useEffect(() => {
    if (!toastMessage) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setToastMessage(null);
    }, 2200);

    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  function updateFilters(partial: {
    keyword?: string;
    categoryId?: number;
    tagId?: number;
    cocktailId?: number;
  }) {
    const nextParams = buildSearchParams({
      keyword: Object.prototype.hasOwnProperty.call(partial, 'keyword') ? partial.keyword : keyword,
      categoryId: Object.prototype.hasOwnProperty.call(partial, 'categoryId')
        ? partial.categoryId
        : categoryId,
      tagId: Object.prototype.hasOwnProperty.call(partial, 'tagId') ? partial.tagId : tagId,
      cocktailId: Object.prototype.hasOwnProperty.call(partial, 'cocktailId')
        ? partial.cocktailId
        : prefilledCocktailId,
    });

    startTransition(() => {
      setSearchParams(nextParams);
    });
  }

  async function handleConfirmOrder(remark: string) {
    if (!orderingCocktail) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await createProductionTask({
        cocktailId: orderingCocktail.id,
        quantity: 1,
        priority: 3,
        remark: remark.trim() || undefined,
      });

      setToastMessage(`${orderingCocktail.nameZh} 下单成功`);
      refreshCounts();
      setOrderingCocktail(null);
      updateFilters({ cocktailId: undefined });
    } catch (requestError) {
      if (requestError instanceof Error) {
        setSubmitError(requestError.message);
        return;
      }

      setSubmitError('下单失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="workbench-shell workbench-shell-order">
      <WorkbenchTabs />

      <div className="workbench-search-strip">
        <label className="workbench-search-field">
          <input
            aria-label="搜索鸡尾酒"
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="输入中文名、英文名或风味关键词"
            type="search"
            value={searchValue}
          />
        </label>
      </div>

      <div className="menu-compact-layout">
        <aside className="menu-category-panel" aria-label="鸡尾酒分类">
          {filtersError ? (
            <InlineError message={filtersError} onRetry={() => setRetryToken((value) => value + 1)} />
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
                onClick={() => updateFilters({ categoryId: undefined })}
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
                    updateFilters({
                      categoryId: category.id === categoryId ? undefined : category.id,
                    })
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
              <InlineError message={filtersError} onRetry={() => setRetryToken((value) => value + 1)} />
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
                  onClick={() => updateFilters({ tagId: undefined })}
                  type="button"
                >
                  全部风味
                </button>
                {tags.map((tag) => (
                  <button
                    className={`tag-pill${tag.id === tagId ? ' is-active' : ''}`}
                    key={tag.id}
                    onClick={() =>
                      updateFilters({
                        tagId: tag.id === tagId ? undefined : tag.id,
                      })
                    }
                    type="button"
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="menu-list-panel">
            {error ? (
              <div className="menu-list-scroll workbench-order-scroll">
                <InlineError message={error} onRetry={() => setRetryToken((value) => value + 1)} />
              </div>
            ) : isLoading && !result ? (
              <div className="menu-list-scroll workbench-order-scroll">
                <div aria-hidden="true" className="menu-list">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div className="menu-row-skeleton" key={index}>
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
            ) : result && result.list.length === 0 ? (
              <div className="menu-list-scroll workbench-order-scroll">
                <EmptyState
                  title="还没有找到符合条件的鸡尾酒"
                  description="换个分类、风味或关键词试试。"
                  action={
                    <button
                      className="status-link is-secondary"
                      onClick={() => setSearchParams(new URLSearchParams())}
                      type="button"
                    >
                      清空筛选
                    </button>
                  }
                />
              </div>
            ) : (
              <div className="menu-list-scroll workbench-order-scroll">
                <div className="menu-list">
                  {result?.list.map((item) => (
                    <OrderRow item={item} key={item.id} onOrder={(cocktail) => setOrderingCocktail(cocktail)} />
                  ))}
                </div>
              </div>
            )}
          </section>
        </section>
      </div>

      {orderingCocktail ? (
        <OrderRemarkModal
          cocktail={orderingCocktail}
          error={submitError}
          isSubmitting={isSubmitting}
          onCancel={() => {
            setOrderingCocktail(null);
            setSubmitError(null);
          }}
          onConfirm={handleConfirmOrder}
        />
      ) : null}

      <div aria-live="polite" className="workbench-count-dock">
        {countsError ? (
          <div className="workbench-count-error" role="status">
            <span>{countsError}</span>
            <button className="workbench-count-retry" onClick={refreshCounts} type="button">
              重试
            </button>
          </div>
        ) : (
          <div className="workbench-count-grid" role="status">
            <div className="workbench-count-card">
              <span className="workbench-count-label">待制作</span>
              <strong className="workbench-count-value">{isCountsLoading ? '--' : counts.pendingCount}</strong>
            </div>
            <div className="workbench-count-card">
              <span className="workbench-count-label">待配送</span>
              <strong className="workbench-count-value">{isCountsLoading ? '--' : counts.completedCount}</strong>
            </div>
          </div>
        )}
      </div>

      {toastMessage ? <div className="workbench-toast workbench-toast-with-dock">{toastMessage}</div> : null}
    </section>
  );
}

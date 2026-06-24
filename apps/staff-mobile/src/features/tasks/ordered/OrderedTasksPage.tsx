import type { PaginatedResult, ProductionTaskSummary, TaskStatus } from '@cocktail/shared-types';
import { startTransition, useEffect, useRef, useState, type UIEvent } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { EmptyState } from '../../../components/EmptyState';
import { InlineError } from '../../../components/InlineError';
import { fetchProductionTasks, updateProductionTaskStatus } from '../../../services/production-tasks';
import { formatDateTime } from '../../../utils/display';
import { TaskStatusBadge } from '../shared/TaskStatusBadge';
import { TaskStatusModal } from '../shared/TaskStatusModal';
import {
  buildOrderedTaskRequest,
  orderedTaskFilters,
  type OrderedTaskFilter,
} from '../shared/task-status';
import { useWorkbenchTaskCounts } from '../shared/useWorkbenchTaskCounts';
import { WorkbenchTabs } from '../shared/WorkbenchTabs';

const PAGE_SIZE = 20;
const LOAD_MORE_THRESHOLD = 96;

function parseFilter(value: string | null): OrderedTaskFilter {
  if (value === 'pending' || value === 'completed' || value === 'delivered') {
    return value;
  }

  return 'all';
}

function buildSearchParams(filter: OrderedTaskFilter) {
  const params = new URLSearchParams();

  if (filter !== 'all') {
    params.set('status', filter);
  }

  return params;
}

function OrderedTaskRow({
  task,
  onClick,
}: {
  task: ProductionTaskSummary;
  onClick: () => void;
}) {
  const remark = task.remark?.trim();

  return (
    <button className="order-flow-item" onClick={onClick} type="button">
      <div className="order-left">
        <span className="order-title">{task.cocktailNameSnapshot}</span>
        <span className="order-time">下单时间：{formatDateTime(task.createdAt)}</span>
        {remark ? <span className="order-remark">备注：{remark}</span> : null}
      </div>
      <div className="order-right">
        <TaskStatusBadge status={task.status} />
      </div>
    </button>
  );
}

export function OrderedTasksPage() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [result, setResult] = useState<PaginatedResult<ProductionTaskSummary> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const [activeTask, setActiveTask] = useState<ProductionTaskSummary | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const requestVersionRef = useRef(0);
  const listRef = useRef<HTMLDivElement | null>(null);
  const {
    counts,
    error: countsError,
    isLoading: isCountsLoading,
    refreshCounts,
  } = useWorkbenchTaskCounts(retryToken);

  const activeFilter = parseFilter(searchParams.get('status'));

  async function requestPage(filter: OrderedTaskFilter, page: number) {
    return fetchProductionTasks({
      page,
      pageSize: PAGE_SIZE,
      ...buildOrderedTaskRequest(filter),
    });
  }

  async function reloadList(
    filter: OrderedTaskFilter,
    targetPages: number,
    options?: {
      showSkeleton?: boolean;
    },
  ) {
    const requestVersion = ++requestVersionRef.current;
    const shouldShowSkeleton = options?.showSkeleton ?? false;

    if (shouldShowSkeleton) {
      setResult(null);
      setIsLoading(true);
    }

    setError(null);
    setLoadMoreError(null);

    try {
      let currentPage = 1;
      let lastResult: PaginatedResult<ProductionTaskSummary> | null = null;
      const mergedTasks: ProductionTaskSummary[] = [];

      while (currentPage <= targetPages) {
        const nextResult = await requestPage(filter, currentPage);

        if (requestVersionRef.current !== requestVersion) {
          return;
        }

        mergedTasks.push(...nextResult.list);
        lastResult = nextResult;

        if (currentPage >= nextResult.pagination.totalPages) {
          break;
        }

        currentPage += 1;
      }

      if (!lastResult) {
        setResult(null);
        return;
      }

      setResult({
        ...lastResult,
        list: mergedTasks,
        pagination: {
          ...lastResult.pagination,
          page: Math.min(targetPages, lastResult.pagination.totalPages),
        },
      });
    } catch (requestError) {
      if (requestVersionRef.current !== requestVersion) {
        return;
      }

      if (requestError instanceof Error) {
        setError(requestError.message);
      } else {
        setError('已点列表加载失败');
      }
    } finally {
      if (requestVersionRef.current === requestVersion) {
        setIsLoading(false);
      }
    }
  }

  async function loadNextPage() {
    if (!result || isLoading || isLoadingMore) {
      return;
    }

    const nextPage = result.pagination.page + 1;

    if (nextPage > result.pagination.totalPages) {
      return;
    }

    const requestVersion = ++requestVersionRef.current;
    setIsLoadingMore(true);
    setLoadMoreError(null);

    try {
      const nextResult = await requestPage(activeFilter, nextPage);

      if (requestVersionRef.current !== requestVersion) {
        return;
      }

      setResult((currentResult) => {
        if (!currentResult) {
          return nextResult;
        }

        return {
          ...nextResult,
          list: [...currentResult.list, ...nextResult.list],
        };
      });
    } catch (requestError) {
      if (requestVersionRef.current !== requestVersion) {
        return;
      }

      if (requestError instanceof Error) {
        setLoadMoreError(requestError.message);
      } else {
        setLoadMoreError('加载更多失败');
      }
    } finally {
      if (requestVersionRef.current === requestVersion) {
        setIsLoadingMore(false);
      }
    }
  }

  useEffect(() => {
    void reloadList(activeFilter, 1, { showSkeleton: true });
  }, [activeFilter, retryToken]);

  useEffect(() => {
    if (!result || isLoading || isLoadingMore || loadMoreError) {
      return;
    }

    const listElement = listRef.current;

    if (!listElement || listElement.clientHeight <= 0) {
      return;
    }

    const canScroll = listElement.scrollHeight > listElement.clientHeight + 1;

    if (!canScroll && result.pagination.page < result.pagination.totalPages) {
      void loadNextPage();
    }
  }, [result, isLoading, isLoadingMore, loadMoreError]);

  function updateFilter(nextFilter: OrderedTaskFilter) {
    startTransition(() => {
      setSearchParams(buildSearchParams(nextFilter));
    });
  }

  async function handleStatusChange(nextStatus: TaskStatus) {
    if (!activeTask) {
      return;
    }

    setIsSubmitting(true);
    setStatusError(null);

    try {
      await updateProductionTaskStatus(activeTask.id, {
        status: nextStatus,
      });

      const loadedPages = Math.max(1, result?.pagination.page ?? 1);

      setStatusError(null);
      refreshCounts();
      setActiveTask(null);
      await reloadList(activeFilter, loadedPages);
    } catch (requestError) {
      if (requestError instanceof Error) {
        setStatusError(requestError.message);
        return;
      }

      setStatusError('状态更新失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleListScroll(event: UIEvent<HTMLDivElement>) {
    if (!result || isLoading || isLoadingMore || loadMoreError) {
      return;
    }

    const currentTarget = event.currentTarget;
    const isNearBottom =
      currentTarget.scrollTop + currentTarget.clientHeight >=
      currentTarget.scrollHeight - LOAD_MORE_THRESHOLD;

    if (!isNearBottom) {
      return;
    }

    void loadNextPage();
  }

  const hasMorePages = !!result && result.pagination.page < result.pagination.totalPages;

  return (
    <section className="workbench-shell workbench-shell-ordered">
      <WorkbenchTabs />

      <div className="ordered-container">
        <div className="status-filter-bar">
          {orderedTaskFilters.map((filter) => (
            <button
              aria-pressed={filter.value === activeFilter}
              className={`status-btn${filter.value === activeFilter ? ' active' : ''}`}
              key={filter.value}
              onClick={() => updateFilter(filter.value)}
              type="button"
            >
              <span>{filter.label}</span>
              {filter.value === 'pending' || filter.value === 'completed' ? (
                <span className="status-btn-count">
                  {isCountsLoading || countsError
                    ? '--'
                    : filter.value === 'pending'
                      ? counts.pendingCount
                      : counts.completedCount}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <div className="ordered-content">
          <div
            aria-label="已点列表"
            className="order-flow-list"
            onScroll={handleListScroll}
            ref={listRef}
          >
            {error ? (
              <InlineError message={error} onRetry={() => setRetryToken((value) => value + 1)} />
            ) : isLoading && !result ? (
              <div aria-hidden="true" className="ordered-skeleton-list">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div className="ordered-skeleton-item" key={index} />
                ))}
              </div>
            ) : result && result.list.length === 0 ? (
              <EmptyState
                title="这一栏暂时没有记录"
                description="切换筛选看看其他状态，或者先回到点单页创建新的待制作。"
              />
            ) : (
              <>
                {result?.list.map((task) => (
                  <OrderedTaskRow key={task.id} onClick={() => setActiveTask(task)} task={task} />
                ))}

                {isLoadingMore ? <p className="order-flow-feedback">正在加载更多...</p> : null}
                {!isLoadingMore && loadMoreError ? (
                  <div className="order-flow-load-error">
                    <InlineError message={loadMoreError} onRetry={() => void loadNextPage()} />
                  </div>
                ) : null}
                {!isLoadingMore && !loadMoreError && !hasMorePages && result?.list.length ? (
                  <p className="order-flow-feedback">没有更多了</p>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>

      {activeTask ? (
        <TaskStatusModal
          backSearch={`${location.pathname}${location.search}`}
          error={statusError}
          isSubmitting={isSubmitting}
          onClose={() => {
            setActiveTask(null);
            setStatusError(null);
          }}
          onStatusChange={handleStatusChange}
          task={activeTask}
        />
      ) : null}
    </section>
  );
}

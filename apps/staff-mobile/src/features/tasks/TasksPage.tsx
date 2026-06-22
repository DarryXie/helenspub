import type { PaginatedResult, ProductionTaskSummary, TaskStatus } from '@cocktail/shared-types';
import { startTransition, useDeferredValue, useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { EmptyState } from '../../components/EmptyState';
import { InlineError } from '../../components/InlineError';
import { Pagination } from '../../components/Pagination';
import { StatusTabs } from '../../components/StatusTabs';
import { fetchProductionTasks } from '../../services/production-tasks';
import { TaskCard } from './TaskCard';

const PAGE_SIZE = 10;

function parsePositiveNumber(value: string | null) {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function parseStatus(value: string | null): TaskStatus {
  if (value === 'in_progress' || value === 'completed') {
    return value;
  }

  return 'pending';
}

function buildSearchParams(filters: {
  status?: TaskStatus;
  keyword?: string;
  page?: number;
}) {
  const params = new URLSearchParams();

  if (filters.status && filters.status !== 'pending') {
    params.set('status', filters.status);
  }

  if (filters.keyword?.trim()) {
    params.set('keyword', filters.keyword.trim());
  }

  if (filters.page && filters.page > 1) {
    params.set('page', String(filters.page));
  }

  return params;
}

export function TasksPage() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchParams.get('keyword') ?? '');
  const [result, setResult] = useState<PaginatedResult<ProductionTaskSummary> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  const status = parseStatus(searchParams.get('status'));
  const keyword = searchParams.get('keyword') ?? '';
  const deferredKeyword = useDeferredValue(searchValue);
  const page = parsePositiveNumber(searchParams.get('page')) ?? 1;
  const highlightedTaskId =
    typeof location.state === 'object' &&
    location.state &&
    'highlightTaskId' in location.state &&
    typeof location.state.highlightTaskId === 'number'
      ? location.state.highlightTaskId
      : undefined;

  useEffect(() => {
    if (searchValue === keyword) {
      return;
    }

    const timer = window.setTimeout(() => {
      const nextParams = buildSearchParams({
        status,
        keyword: deferredKeyword,
        page: 1,
      });

      startTransition(() => {
        setSearchParams(nextParams, { replace: true });
      });
    }, 220);

    return () => window.clearTimeout(timer);
  }, [searchValue, deferredKeyword, keyword, status, setSearchParams]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearchValue(keyword);
  }, [keyword]);

  useEffect(() => {
    let isCancelled = false;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    setError(null);

    fetchProductionTasks({
      page,
      pageSize: PAGE_SIZE,
      status,
      keyword: keyword || undefined,
    })
      .then((nextResult) => {
        if (!isCancelled) {
          setResult(nextResult);
        }
      })
      .catch((requestError: Error) => {
        if (!isCancelled) {
          setError(requestError.message || '任务列表加载失败。');
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
  }, [page, status, keyword, retryToken]);

  function updateSearch(partial: {
    status?: TaskStatus;
    keyword?: string;
    page?: number;
  }) {
    const nextParams = buildSearchParams({
      status: Object.prototype.hasOwnProperty.call(partial, 'status') ? partial.status : status,
      keyword: Object.prototype.hasOwnProperty.call(partial, 'keyword') ? partial.keyword : keyword,
      page: partial.page !== undefined ? partial.page : page,
    });

    startTransition(() => {
      setSearchParams(nextParams);
    });
  }

  return (
    <section className="page-stack">
      <section className="control-panel">
        <div className="control-panel-top">
          <StatusTabs activeStatus={status} onChange={(nextStatus) => updateSearch({ status: nextStatus, page: 1 })} />
          <Link className="primary-button is-compact" to="/tasks/new">
            新建任务
          </Link>
        </div>

        <label className="search-field">
          <span>搜索任务</span>
          <input
            aria-label="搜索任务"
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="按任务编号或鸡尾酒名称搜索"
            type="search"
            value={searchValue}
          />
        </label>
      </section>

      {error ? (
        <InlineError message={error} onRetry={() => setRetryToken((value) => value + 1)} />
      ) : isLoading && !result ? (
        <div className="card-list">
          {Array.from({ length: 5 }).map((_, index) => (
            <article className="task-card is-skeleton" key={index}>
              <span className="skeleton-line short" />
              <span className="skeleton-line long" />
              <span className="skeleton-line medium" />
            </article>
          ))}
        </div>
      ) : result && result.list.length === 0 ? (
        <EmptyState
          title="这一栏暂时没有任务"
          description="可以先去鸡尾酒页查酒单并创建待制作任务，或者切换状态看看别的流转阶段。"
          action={
            <Link className="ghost-button is-solid" to="/cocktails">
              去鸡尾酒页加单
            </Link>
          }
        />
      ) : (
        <>
          <div className="card-list">
            {result?.list.map((task) => (
              <TaskCard highlight={task.id === highlightedTaskId} key={task.id} task={task} />
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

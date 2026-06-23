import type { PaginatedResult, ProductionTaskSummary, TaskStatus } from '@cocktail/shared-types';
import { startTransition, useEffect, useMemo, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { EmptyState } from '../../../components/EmptyState';
import { InlineError } from '../../../components/InlineError';
import { fetchProductionTasks, updateProductionTaskStatus } from '../../../services/production-tasks';
import { formatDateTime } from '../../../utils/display';
import { TaskStatusBadge } from '../shared/TaskStatusBadge';
import { TaskStatusModal } from '../shared/TaskStatusModal';
import {
  matchesOrderedTaskFilter,
  orderedTaskFilters,
  sortTasksByCreatedAtAsc,
  type OrderedTaskFilter,
} from '../shared/task-status';
import { WorkbenchTabs } from '../shared/WorkbenchTabs';

const PAGE_SIZE = 100;

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
  const [retryToken, setRetryToken] = useState(0);
  const [activeTask, setActiveTask] = useState<ProductionTaskSummary | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeFilter = parseFilter(searchParams.get('status'));
  const orderedTasks = useMemo(() => sortTasksByCreatedAtAsc(result?.list ?? []), [result]);
  const visibleTasks = useMemo(
    () => orderedTasks.filter((task) => matchesOrderedTaskFilter(task.status, activeFilter)),
    [orderedTasks, activeFilter],
  );

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setError(null);

    fetchProductionTasks({
      page: 1,
      pageSize: PAGE_SIZE,
    })
      .then((nextResult) => {
        if (!isCancelled) {
          setResult(nextResult);
        }
      })
      .catch((requestError: Error) => {
        if (!isCancelled) {
          setError(requestError.message || '已点列表加载失败');
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
  }, [retryToken]);

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
      const updatedTask = await updateProductionTaskStatus(activeTask.id, {
        status: nextStatus,
      });

      setResult((currentResult) => {
        if (!currentResult) {
          return currentResult;
        }

        return {
          ...currentResult,
          list: currentResult.list.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
        };
      });

      setStatusError(null);
      setActiveTask(null);
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

  return (
    <section className="workbench-shell">
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
              {filter.label}
            </button>
          ))}
        </div>

        <div className="order-flow-list">
          {error ? (
            <InlineError message={error} onRetry={() => setRetryToken((value) => value + 1)} />
          ) : isLoading && !result ? (
            <div aria-hidden="true" className="ordered-skeleton-list">
              {Array.from({ length: 6 }).map((_, index) => (
                <div className="ordered-skeleton-item" key={index} />
              ))}
            </div>
          ) : visibleTasks.length === 0 ? (
            <EmptyState
              title="这一栏暂时没有记录"
              description="切换筛选看看其他状态，或者先回到点单页创建新的待制作。"
            />
          ) : (
            visibleTasks.map((task) => (
              <OrderedTaskRow key={task.id} onClick={() => setActiveTask(task)} task={task} />
            ))
          )}
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

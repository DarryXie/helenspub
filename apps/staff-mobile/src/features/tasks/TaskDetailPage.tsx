import type { ProductionTaskDetail, TaskStatus } from '@cocktail/shared-types';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { EmptyState } from '../../components/EmptyState';
import { InlineError } from '../../components/InlineError';
import { formatDateTime, priorityLabel, statusLabel } from '../../utils/display';
import { fetchProductionTaskDetail, updateProductionTaskStatus } from '../../services/production-tasks';

function recipeAmount(amount?: number | null, unit?: string | null) {
  if (typeof amount === 'number' && unit) {
    return `${amount}${unit}`;
  }

  if (typeof amount === 'number') {
    return String(amount);
  }

  return unit ?? '适量';
}

function nextActions(status: TaskStatus) {
  if (status === 'pending') {
    return [
      { status: 'in_progress' as const, label: '开始制作' },
      { status: 'completed' as const, label: '直接完成' },
    ];
  }

  if (status === 'in_progress') {
    return [{ status: 'completed' as const, label: '标记完成' }];
  }

  return [];
}

export function TaskDetailPage() {
  const navigate = useNavigate();
  const params = useParams();
  const [detail, setDetail] = useState<ProductionTaskDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  const taskId = Number(params.id);
  const isValidTaskId = Number.isInteger(taskId) && taskId > 0;

  useEffect(() => {
    let isCancelled = false;

    if (!isValidTaskId) {
      return undefined;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    setError(null);

    fetchProductionTaskDetail(taskId)
      .then((result) => {
        if (!isCancelled) {
          setDetail(result);
        }
      })
      .catch((requestError: Error) => {
        if (!isCancelled) {
          setError(requestError.message || '任务详情加载失败。');
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
  }, [taskId, isValidTaskId, retryToken]);

  async function handleStatusChange(nextStatus: TaskStatus) {
    if (!detail) {
      return;
    }

    setIsUpdating(true);
    setError(null);

    try {
      const nextDetail = await updateProductionTaskStatus(detail.id, {
        status: nextStatus,
      });
      setDetail(nextDetail);
    } catch (requestError) {
      if (requestError instanceof Error) {
        setError(requestError.message);
      } else {
        setError('状态更新失败，请稍后重试。');
      }
    } finally {
      setIsUpdating(false);
    }
  }

  if (!isValidTaskId) {
    return (
      <EmptyState
        title="没有找到这条任务"
        description="链接不完整，或者任务编号已经失效。先回到待制作列表继续查看。"
        action={
          <Link className="ghost-button is-solid" to="/tasks">
            返回待制作列表
          </Link>
        }
      />
    );
  }

  if (error && !detail) {
    return <InlineError message={error} onRetry={() => setRetryToken((value) => value + 1)} />;
  }

  if (isLoading || !detail) {
    return (
      <section className="detail-panel">
        <div className="skeleton hero-skeleton" />
        <div className="detail-copy-skeleton">
          <span className="skeleton-line short" />
          <span className="skeleton-line long" />
          <span className="skeleton-line medium" />
        </div>
      </section>
    );
  }

  const actions = nextActions(detail.status);

  return (
    <section className="page-stack">
      <div className="detail-toolbar">
        <button className="back-link" onClick={() => navigate(-1)} type="button">
          返回上一页
        </button>
        {detail.status !== 'completed' ? (
          <Link className="ghost-button is-solid" to={`/tasks/${detail.id}/edit`}>
            编辑任务
          </Link>
        ) : null}
      </div>

      {error ? <InlineError message={error} /> : null}

      <section className="task-hero">
        <div>
          <p className="task-card-no">{detail.taskNo}</p>
          <h2>{detail.cocktailNameSnapshot}</h2>
          <p className="detail-lead">
            数量 {detail.quantity}，{priorityLabel(detail.priority)}，由 {detail.createdBy.displayName}{' '}
            在 {formatDateTime(detail.createdAt)} 录入。
          </p>
        </div>
        <span className={`status-pill status-${detail.status}`}>{statusLabel(detail.status)}</span>
      </section>

      <div className="task-detail-grid">
        <section className="content-card">
          <div className="section-heading">
            <p className="app-eyebrow">Task Info</p>
            <h3>任务信息</h3>
          </div>
          <dl className="fact-grid">
            <dt>当前状态</dt>
            <dd>{statusLabel(detail.status)}</dd>
            <dt>数量</dt>
            <dd>{detail.quantity}</dd>
            <dt>优先级</dt>
            <dd>{priorityLabel(detail.priority)}</dd>
            <dt>录入人</dt>
            <dd>{detail.createdBy.displayName}</dd>
            <dt>完成时间</dt>
            <dd>{detail.completedAt ? formatDateTime(detail.completedAt) : '未完成'}</dd>
          </dl>
          {detail.remark ? (
            <div className="copy-block">
              <h4>备注</h4>
              <p>{detail.remark}</p>
            </div>
          ) : null}
          {actions.length > 0 ? (
            <div className="action-row">
              {actions.map((action) => (
                <button
                  className="primary-button is-compact"
                  disabled={isUpdating}
                  key={action.status}
                  onClick={() => handleStatusChange(action.status)}
                  type="button"
                >
                  {isUpdating ? '处理中...' : action.label}
                </button>
              ))}
            </div>
          ) : (
            <p className="muted-copy">这条任务已完成，前台只保留查看态。</p>
          )}
        </section>

        <section className="content-card">
          <div className="section-heading">
            <p className="app-eyebrow">Recipe Snapshot</p>
            <h3>配方摘要</h3>
          </div>
          <ol className="recipe-list">
            {detail.recipeItems.map((item) => (
              <li className="recipe-item" key={item.id}>
                <div>
                  <strong>{item.ingredientName}</strong>
                  {item.note ? <p>{item.note}</p> : null}
                </div>
                <span>{recipeAmount(item.amount, item.unit)}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="content-card">
          <div className="section-heading">
            <p className="app-eyebrow">Activity</p>
            <h3>流转记录</h3>
          </div>
          <ol className="log-list">
            {detail.logs.map((log) => (
              <li className="log-item" key={log.id}>
                <div className="log-item-head">
                  <strong>{log.operator.displayName}</strong>
                  <span>{formatDateTime(log.createdAt)}</span>
                </div>
                <p>
                  {log.fromStatus ? `${statusLabel(log.fromStatus)} -> ` : ''}
                  {log.toStatus ? statusLabel(log.toStatus) : '记录更新'}
                </p>
                {log.actionNote ? <small>{log.actionNote}</small> : null}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </section>
  );
}

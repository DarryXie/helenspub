import type { ProductionTaskSummary, TaskStatus } from '@cocktail/shared-types';
import { useNavigate } from 'react-router-dom';
import { formatDateTime } from '../../../utils/display';
import { canTransition } from './task-status';

const statusActions: Array<{ status: TaskStatus; label: string; tone: string }> = [
  { status: 'in_progress', label: '制作中', tone: 'blue' },
  { status: 'completed', label: '制作完成', tone: 'green' },
  { status: 'delivered', label: '已送达', tone: 'gray' },
  { status: 'cancelled', label: '取消制作', tone: 'red' },
];

export function TaskStatusModal({
  task,
  backSearch,
  error,
  isSubmitting,
  onClose,
  onStatusChange,
}: {
  task: ProductionTaskSummary;
  backSearch: string;
  error: string | null;
  isSubmitting: boolean;
  onClose: () => void;
  onStatusChange: (nextStatus: TaskStatus) => Promise<void> | void;
}) {
  const navigate = useNavigate();

  return (
    <div className="modal-overlay active" role="presentation">
      <div aria-modal="true" className="modal-box" role="dialog">
        <div className="modal-title">
          {task.cocktailNameSnapshot} ({formatDateTime(task.createdAt)})
        </div>
        {error ? <p className="modal-error">{error}</p> : null}
        <div className="status-vertical-list">
          {statusActions.map((action) => (
            <button
              className={`btn-status-action btn-action-${action.tone}`}
              disabled={!canTransition(task.status, action.status) || isSubmitting}
              key={action.status}
              onClick={() => onStatusChange(action.status)}
              type="button"
            >
              {isSubmitting ? '处理中...' : action.label}
            </button>
          ))}

          <button
            className="btn-status-action btn-action-orange"
            onClick={() =>
              navigate(`/cocktails/${task.cocktailId}`, {
                state: { fromSearch: backSearch },
              })
            }
            type="button"
          >
            配方
          </button>

          <button className="btn-status-action btn-action-close" onClick={onClose} type="button">
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}

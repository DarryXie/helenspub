import type { ProductionTaskSummary } from '@cocktail/shared-types';
import { Link } from 'react-router-dom';
import { formatDateTime, priorityLabel, statusLabel } from '../../utils/display';

export function TaskCard({
  task,
  highlight,
}: {
  task: ProductionTaskSummary;
  highlight?: boolean;
}) {
  return (
    <article className={`task-card${highlight ? ' is-highlighted' : ''}`}>
      <Link className="task-card-link" to={`/tasks/${task.id}`}>
        <div className="task-card-top">
          <div>
            <p className="task-card-no">{task.taskNo}</p>
            <h2>{task.cocktailNameSnapshot}</h2>
          </div>
          <span className={`status-pill status-${task.status}`}>{statusLabel(task.status)}</span>
        </div>

        <div className="task-card-meta">
          <span>数量 {task.quantity}</span>
          <span>{priorityLabel(task.priority)}</span>
          <span>{formatDateTime(task.createdAt)}</span>
        </div>

        {task.remark ? <p className="task-card-remark">{task.remark}</p> : null}

        <div className="task-card-footer">
          <span>录入人 {task.createdBy.displayName}</span>
          <span>{task.assignedTo ? `当前指派 ${task.assignedTo.displayName}` : '未指派'}</span>
        </div>
      </Link>
    </article>
  );
}

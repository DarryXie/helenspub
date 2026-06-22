import type { TaskStatus } from '@cocktail/shared-types';
import { statusLabel } from '../../../utils/display';
import { statusTone } from './task-status';

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className={`status-badge status-badge-${statusTone(status)}`}>
      {statusLabel(status)}
    </span>
  );
}

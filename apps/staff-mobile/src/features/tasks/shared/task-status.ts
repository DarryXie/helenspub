import type { TaskStatus } from '@cocktail/shared-types';
import type { ProductionTaskFilters } from '../../../services/production-tasks';

export type OrderedTaskFilter = 'all' | 'pending' | 'completed' | 'delivered';

export const orderedTaskFilters: Array<{ value: OrderedTaskFilter; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待制作' },
  { value: 'completed', label: '制作完成' },
  { value: 'delivered', label: '已送达' },
];

const allowedTransitions: Record<TaskStatus, TaskStatus[]> = {
  pending: ['in_progress', 'completed', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: ['delivered', 'in_progress'],
  delivered: ['in_progress'],
  cancelled: [],
};

export function canTransition(fromStatus: TaskStatus, toStatus: TaskStatus) {
  if (fromStatus === toStatus) {
    return false;
  }

  return allowedTransitions[fromStatus].includes(toStatus);
}

export function matchesOrderedTaskFilter(status: TaskStatus, filter: OrderedTaskFilter) {
  if (filter === 'all') {
    return true;
  }

  if (filter === 'pending') {
    return status === 'pending' || status === 'in_progress';
  }

  return status === filter;
}

export function buildOrderedTaskRequest(filter: OrderedTaskFilter): ProductionTaskFilters {
  if (filter === 'all') {
    return {
      sortDirection: 'desc',
    };
  }

  if (filter === 'pending') {
    return {
      statuses: ['pending', 'in_progress'],
      sortDirection: 'asc',
    };
  }

  return {
    status: filter,
    sortDirection: 'asc',
  };
}

export function statusTone(status: TaskStatus) {
  if (status === 'pending') {
    return 'wait';
  }

  if (status === 'in_progress') {
    return 'progress';
  }

  if (status === 'completed') {
    return 'done';
  }

  if (status === 'delivered') {
    return 'delivered';
  }

  return 'cancelled';
}

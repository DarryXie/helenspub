import type { TaskStatus } from '@cocktail/shared-types';

const formatter = new Intl.DateTimeFormat('zh-CN', {
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  month: '2-digit',
});

export function statusLabel(status: TaskStatus) {
  if (status === 'pending') {
    return '待制作';
  }

  if (status === 'in_progress') {
    return '制作中';
  }

  if (status === 'completed') {
    return '制作完成';
  }

  if (status === 'delivered') {
    return '已送达';
  }

  return '取消制作';
}

export function priorityLabel(priority: number) {
  if (priority === 1) {
    return '优先处理';
  }

  if (priority === 2) {
    return '尽快安排';
  }

  return '正常节奏';
}

export function formatDateTime(value: string) {
  return formatter.format(new Date(value));
}

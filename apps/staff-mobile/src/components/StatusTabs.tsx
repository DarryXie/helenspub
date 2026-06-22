import type { TaskStatus } from '@cocktail/shared-types';

const STATUS_OPTIONS: Array<{ value: TaskStatus; label: string }> = [
  { value: 'pending', label: '待制作' },
  { value: 'in_progress', label: '制作中' },
  { value: 'completed', label: '已完成' },
];

export function StatusTabs({
  activeStatus,
  onChange,
}: {
  activeStatus: TaskStatus;
  onChange: (nextStatus: TaskStatus) => void;
}) {
  return (
    <div className="status-tabs" role="tablist" aria-label="任务状态">
      {STATUS_OPTIONS.map((item) => (
        <button
          aria-selected={item.value === activeStatus}
          className={`status-tab${item.value === activeStatus ? ' is-active' : ''}`}
          key={item.value}
          onClick={() => onChange(item.value)}
          role="tab"
          type="button"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

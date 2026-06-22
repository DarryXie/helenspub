ALTER TABLE `production_tasks`
  MODIFY `status` ENUM('pending', 'in_progress', 'completed', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending';

ALTER TABLE `production_task_logs`
  MODIFY `from_status` ENUM('pending', 'in_progress', 'completed', 'delivered', 'cancelled') NULL;

ALTER TABLE `production_task_logs`
  MODIFY `to_status` ENUM('pending', 'in_progress', 'completed', 'delivered', 'cancelled') NULL;

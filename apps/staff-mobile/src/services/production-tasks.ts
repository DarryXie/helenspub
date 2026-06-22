import type { PaginatedResult, ProductionTaskDetail, ProductionTaskSummary, TaskStatus } from '@cocktail/shared-types';
import { apiRequest } from './http';

export interface ProductionTaskFilters {
  page?: number;
  pageSize?: number;
  status?: TaskStatus;
  keyword?: string;
}

export interface CreateTaskInput {
  cocktailId: number;
  quantity: number;
  remark?: string;
  priority?: number;
}

export interface UpdateTaskInput {
  quantity: number;
  remark?: string;
  priority?: number;
}

export interface UpdateTaskStatusInput {
  status: TaskStatus;
  actionNote?: string;
}

function buildQueryString(filters: ProductionTaskFilters) {
  const params = new URLSearchParams();
  const entries = [
    ['page', filters.page],
    ['pageSize', filters.pageSize],
    ['status', filters.status],
    ['keyword', filters.keyword?.trim()],
  ] as const;

  for (const [key, value] of entries) {
    if (value === undefined || value === null || value === '') {
      continue;
    }

    params.set(key, String(value));
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}

export function fetchProductionTasks(filters: ProductionTaskFilters) {
  return apiRequest<PaginatedResult<ProductionTaskSummary>>(
    `/app/production-tasks${buildQueryString(filters)}`,
  );
}

export function fetchProductionTaskDetail(id: number) {
  return apiRequest<ProductionTaskDetail>(`/app/production-tasks/${id}`);
}

export function createProductionTask(payload: CreateTaskInput) {
  return apiRequest<ProductionTaskDetail>('/app/production-tasks', {
    body: JSON.stringify(payload),
    method: 'POST',
  });
}

export function updateProductionTask(id: number, payload: UpdateTaskInput) {
  return apiRequest<ProductionTaskDetail>(`/app/production-tasks/${id}`, {
    body: JSON.stringify(payload),
    method: 'PUT',
  });
}

export function updateProductionTaskStatus(id: number, payload: UpdateTaskStatusInput) {
  return apiRequest<ProductionTaskDetail>(`/app/production-tasks/${id}/status`, {
    body: JSON.stringify(payload),
    method: 'PATCH',
  });
}

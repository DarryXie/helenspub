import type { CocktailPublishStatus, RoleCode, TaskStatus } from '@cocktail/shared-types';

export const ROLE_CODES: Record<RoleCode, RoleCode> = {
  admin: 'admin',
  staff: 'staff',
  customer: 'customer',
};

export const TASK_STATUS: Record<TaskStatus, TaskStatus> = {
  pending: 'pending',
  in_progress: 'in_progress',
  completed: 'completed',
  delivered: 'delivered',
  cancelled: 'cancelled',
};

export const COCKTAIL_PUBLISH_STATUS: Record<CocktailPublishStatus, CocktailPublishStatus> = {
  draft: 'draft',
  published: 'published',
  hidden: 'hidden',
};

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;
export const UPLOAD_MAX_SIZE = 5 * 1024 * 1024;

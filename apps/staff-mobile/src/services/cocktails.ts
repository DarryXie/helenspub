import type {
  CategoryItem,
  CocktailDetail,
  CocktailListItem,
  PaginatedResult,
  TagItem,
} from '@cocktail/shared-types';
import { apiRequest } from './http';

export interface CocktailFilters {
  page?: number;
  pageSize?: number;
  keyword?: string;
  categoryId?: number;
  tagId?: number;
}

function buildQueryString(filters: CocktailFilters) {
  const params = new URLSearchParams();
  const entries = [
    ['page', filters.page],
    ['pageSize', filters.pageSize],
    ['keyword', filters.keyword?.trim()],
    ['categoryId', filters.categoryId],
    ['tagId', filters.tagId],
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

export function fetchAppCocktails(filters: CocktailFilters) {
  return apiRequest<PaginatedResult<CocktailListItem>>(`/app/cocktails${buildQueryString(filters)}`);
}

export function fetchAppCocktailDetail(id: number) {
  return apiRequest<CocktailDetail>(`/app/cocktails/${id}`);
}

export function fetchPublicCategories() {
  return apiRequest<CategoryItem[]>('/public/categories', { auth: false });
}

export function fetchPublicTags() {
  return apiRequest<TagItem[]>('/public/tags', { auth: false });
}

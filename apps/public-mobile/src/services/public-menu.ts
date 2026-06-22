import type {
  CategoryItem,
  CocktailDetail,
  CocktailListItem,
  PaginatedResult,
  PublicCocktailFilters,
  TagItem,
} from '../types/public-menu';
import { apiRequest } from './http';

function buildQueryString(filters: PublicCocktailFilters) {
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

export function fetchPublicCocktails(filters: PublicCocktailFilters) {
  return apiRequest<PaginatedResult<CocktailListItem>>(
    `/public/cocktails${buildQueryString(filters)}`,
  );
}

export function fetchPublicCocktailDetail(id: number) {
  return apiRequest<CocktailDetail>(`/public/cocktails/${id}`);
}

export function fetchPublicCategories() {
  return apiRequest<CategoryItem[]>('/public/categories');
}

export function fetchPublicTags() {
  return apiRequest<TagItem[]>('/public/tags');
}

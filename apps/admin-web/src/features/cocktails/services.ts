import { apiRequest, API_ORIGIN } from '../../services/http';
import type { CocktailEditorDetail, CocktailEditorResources, CocktailOption } from './types';

const ADMIN_COCKTAIL_LIST_PAGE_SIZE = 100;

export interface AdminCocktailListItem {
  id: number;
  nameZh: string;
  nameEn?: string | null;
  price?: number | null;
  shortDescription?: string | null;
  coverImageUrl?: string | null;
  baseSpirit?: string | null;
  tasteProfile?: string | null;
  publishStatus: 'draft' | 'published' | 'hidden';
  isVisible: boolean;
}

interface PaginatedCocktailListResponse {
  list: AdminCocktailListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export function fetchCocktailEditorResources(): Promise<CocktailEditorResources> {
  return Promise.all([
    apiRequest<Array<{ id: number; name: string; slug?: string | null }>>('/admin/categories'),
    apiRequest<Array<{ id: number; name: string; slug?: string | null; color?: string | null }>>('/admin/tags'),
    apiRequest<
      Array<{
        id: number;
        name: string;
        category?: string | null;
        abv?: number | null;
      }>
    >('/admin/ingredients'),
  ]).then(([categories, tags, ingredients]) => ({
    categories: categories.map(mapOption),
    tags: tags.map(mapOption),
    ingredients: ingredients.map(mapOption),
  }));
}

export function fetchCocktailDetail(id: number) {
  return apiRequest<CocktailEditorDetail>(`/admin/cocktails/${id}`);
}

export async function fetchAdminCocktailList() {
  const firstPage = await apiRequest<PaginatedCocktailListResponse>(
    `/admin/cocktails?page=1&pageSize=${ADMIN_COCKTAIL_LIST_PAGE_SIZE}`,
  );

  if (firstPage.pagination.totalPages <= 1) {
    return firstPage.list;
  }

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.pagination.totalPages - 1 }, (_, index) =>
      apiRequest<PaginatedCocktailListResponse>(
        `/admin/cocktails?page=${index + 2}&pageSize=${ADMIN_COCKTAIL_LIST_PAGE_SIZE}`,
      ),
    ),
  );

  return [firstPage, ...remainingPages].flatMap((page) => page.list);
}

export function createCocktail(payload: Record<string, unknown>) {
  return apiRequest('/admin/cocktails', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateCocktail(id: number, payload: Record<string, unknown>) {
  return apiRequest(`/admin/cocktails/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteCocktail(id: number) {
  return apiRequest(`/admin/cocktails/${id}`, {
    method: 'DELETE',
  });
}

export function uploadCocktailImage(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  return apiRequest<{ url: string; filename: string; size: number }>('/admin/uploads/images', {
    method: 'POST',
    body: formData,
  });
}

export function toAssetUrl(path?: string | null) {
  if (!path) {
    return '';
  }

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  return `${API_ORIGIN}${path}`;
}

function mapOption<T extends CocktailOption>(item: T) {
  return {
    ...item,
  };
}

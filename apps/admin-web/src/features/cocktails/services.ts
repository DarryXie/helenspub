import { apiRequest, API_ORIGIN } from '../../services/http';
import type { CocktailEditorDetail, CocktailEditorResources, CocktailOption } from './types';

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

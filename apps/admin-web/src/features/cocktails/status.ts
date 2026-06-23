import type { CocktailFormState } from './types';

export type CocktailPublishStatus = CocktailFormState['publishStatus'];

export const COCKTAIL_PUBLISH_STATUS_LABELS: Record<CocktailPublishStatus, string> = {
  draft: '草稿',
  published: '已发布',
  hidden: '隐藏',
};

export function getCocktailPublishStatusLabel(status: CocktailPublishStatus) {
  return COCKTAIL_PUBLISH_STATUS_LABELS[status];
}

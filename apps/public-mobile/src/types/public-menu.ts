export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  list: T[];
  pagination: PaginationMeta;
}

export interface TagItem {
  id: number;
  name: string;
  color?: string | null;
  slug?: string | null;
}

export interface CategoryItem {
  id: number;
  name: string;
  slug?: string | null;
  description?: string | null;
}

export interface RecipeItem {
  id: number;
  ingredientId: number;
  ingredientName: string;
  amount?: number | null;
  unit?: string | null;
  note?: string | null;
  sortOrder: number;
}

export interface CocktailListItem {
  id: number;
  nameZh: string;
  nameEn?: string | null;
  shortDescription?: string | null;
  coverImageUrl?: string | null;
  baseSpirit?: string | null;
  tasteProfile?: string | null;
  price?: number | null;
  tags: TagItem[];
}

export interface CocktailDetail extends CocktailListItem {
  description?: string | null;
  abvNote?: string | null;
  glassType?: string | null;
  garnish?: string | null;
  method?: string | null;
  scene?: string | null;
  categories: CategoryItem[];
  recipeItems: RecipeItem[];
  imageUrls: string[];
}

export interface PublicCocktailFilters {
  page?: number;
  pageSize?: number;
  keyword?: string;
  categoryId?: number;
  tagId?: number;
}

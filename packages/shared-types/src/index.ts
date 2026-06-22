export type RoleCode = 'admin' | 'staff' | 'customer';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'delivered' | 'cancelled';

export type CocktailPublishStatus = 'draft' | 'published' | 'hidden';

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
}

export interface CategoryItem {
  id: number;
  name: string;
  slug?: string | null;
}

export interface UserSummary {
  id: number;
  username: string;
  displayName: string;
  roleCode: RoleCode;
}

export interface AuthUser extends UserSummary {
  accessToken?: string;
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
  price?: number | null;
  shortDescription?: string | null;
  coverImageUrl?: string | null;
  baseSpirit?: string | null;
  tasteProfile?: string | null;
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

export interface ProductionTaskSummary {
  id: number;
  taskNo: string;
  cocktailId: number;
  cocktailNameSnapshot: string;
  quantity: number;
  remark?: string | null;
  status: TaskStatus;
  priority: number;
  createdAt: string;
  completedAt?: string | null;
  createdBy: UserSummary;
  assignedTo?: UserSummary | null;
}

export interface ProductionTaskDetail extends ProductionTaskSummary {
  recipeItems: RecipeItem[];
  logs: ProductionTaskLog[];
}

export interface ProductionTaskLog {
  id: number;
  actionType: string;
  fromStatus?: TaskStatus | null;
  toStatus?: TaskStatus | null;
  actionNote?: string | null;
  createdAt: string;
  operator: UserSummary;
}

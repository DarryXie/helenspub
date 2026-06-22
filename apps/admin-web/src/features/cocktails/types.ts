export interface CocktailOption {
  id: number;
  name: string;
  slug?: string | null;
  color?: string | null;
  category?: string | null;
  abv?: number | null;
}

export interface CocktailRecipeFormItem {
  id: string;
  ingredientId: string;
  amount: string;
  unit: string;
  note: string;
}

export interface CocktailImageFormItem {
  id: string;
  url: string;
}

export interface CocktailFormState {
  nameZh: string;
  nameEn: string;
  slug: string;
  price: string;
  shortDescription: string;
  description: string;
  baseSpirit: string;
  abvNote: string;
  glassType: string;
  tasteProfile: string;
  garnish: string;
  method: string;
  scene: string;
  publishStatus: 'draft' | 'published' | 'hidden';
  isVisible: boolean;
  sortOrder: string;
  categoryIds: number[];
  tagIds: number[];
  recipeItems: CocktailRecipeFormItem[];
  images: CocktailImageFormItem[];
  coverImageId: string;
}

export interface CocktailEditorDetail {
  id: number;
  nameZh: string;
  nameEn?: string | null;
  slug?: string | null;
  price?: number | null;
  shortDescription?: string | null;
  coverImageUrl?: string | null;
  baseSpirit?: string | null;
  tasteProfile?: string | null;
  description?: string | null;
  abvNote?: string | null;
  glassType?: string | null;
  garnish?: string | null;
  method?: string | null;
  scene?: string | null;
  publishStatus: 'draft' | 'published' | 'hidden';
  isVisible: boolean;
  sortOrder?: number | null;
  categories: Array<{ id: number; name: string; slug?: string | null }>;
  tags: Array<{ id: number; name: string; color?: string | null }>;
  recipeItems: Array<{
    id: number;
    ingredientId: number;
    ingredientName: string;
    amount: number | null;
    unit?: string | null;
    note?: string | null;
    sortOrder: number;
  }>;
  imageUrls: string[];
}

export interface CocktailEditorResources {
  categories: CocktailOption[];
  tags: CocktailOption[];
  ingredients: CocktailOption[];
}

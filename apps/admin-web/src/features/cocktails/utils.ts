import type {
  CocktailEditorDetail,
  CocktailFormState,
  CocktailImageFormItem,
  CocktailRecipeFormItem,
} from './types';

function createFormId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createEmptyRecipeItem(): CocktailRecipeFormItem {
  return {
    id: createFormId('recipe'),
    ingredientId: '',
    amount: '',
    unit: 'ml',
    note: '',
  };
}

export function createInitialCocktailForm(): CocktailFormState {
  const firstRecipe = createEmptyRecipeItem();

  return {
    nameZh: '',
    nameEn: '',
    slug: '',
    price: '',
    shortDescription: '',
    description: '',
    baseSpirit: '',
    abvNote: '',
    glassType: '',
    tasteProfile: '',
    garnish: '',
    method: '',
    scene: '',
    publishStatus: 'draft',
    isVisible: true,
    sortOrder: '0',
    categoryIds: [],
    tagIds: [],
    recipeItems: [firstRecipe],
    images: [],
    coverImageId: '',
  };
}

export function mapCocktailDetailToForm(detail: CocktailEditorDetail): CocktailFormState {
  const images = detail.imageUrls.map<CocktailImageFormItem>((url) => ({
    id: createFormId('image'),
    url,
  }));
  const fallbackCoverId = images[0]?.id ?? '';
  const matchedCover = images.find((item) => item.url === detail.coverImageUrl);

  return {
    nameZh: detail.nameZh,
    nameEn: detail.nameEn ?? '',
    slug: detail.slug ?? '',
    price: detail.price === null || detail.price === undefined ? '' : String(detail.price),
    shortDescription: detail.shortDescription ?? '',
    description: detail.description ?? '',
    baseSpirit: detail.baseSpirit ?? '',
    abvNote: detail.abvNote ?? '',
    glassType: detail.glassType ?? '',
    tasteProfile: detail.tasteProfile ?? '',
    garnish: detail.garnish ?? '',
    method: detail.method ?? '',
    scene: detail.scene ?? '',
    publishStatus: detail.publishStatus,
    isVisible: detail.isVisible,
    sortOrder: String(detail.sortOrder ?? 0),
    categoryIds: detail.categories.map((item) => item.id),
    tagIds: detail.tags.map((item) => item.id),
    recipeItems:
      detail.recipeItems.length > 0
        ? detail.recipeItems
            .slice()
            .sort((left, right) => left.sortOrder - right.sortOrder)
            .map((item) => ({
              id: createFormId('recipe'),
              ingredientId: String(item.ingredientId),
              amount: item.amount === null ? '' : String(item.amount),
              unit: item.unit ?? 'ml',
              note: item.note ?? '',
            }))
        : [createEmptyRecipeItem()],
    images,
    coverImageId: matchedCover?.id ?? fallbackCoverId,
  };
}

export function buildCocktailPayload(form: CocktailFormState) {
  const orderedImageUrls = form.images.map((item) => item.url);
  const coverImage = form.images.find((item) => item.id === form.coverImageId);

  return {
    nameZh: form.nameZh.trim(),
    nameEn: toOptionalString(form.nameEn),
    slug: toOptionalString(form.slug),
    price: toOptionalNumber(form.price),
    shortDescription: toOptionalString(form.shortDescription),
    description: toOptionalString(form.description),
    baseSpirit: toOptionalString(form.baseSpirit),
    abvNote: toOptionalString(form.abvNote),
    glassType: toOptionalString(form.glassType),
    tasteProfile: toOptionalString(form.tasteProfile),
    garnish: toOptionalString(form.garnish),
    method: toOptionalString(form.method),
    scene: toOptionalString(form.scene),
    publishStatus: form.publishStatus,
    isVisible: form.isVisible,
    sortOrder: toNumberOrZero(form.sortOrder),
    categoryIds: form.categoryIds,
    tagIds: form.tagIds,
    recipeItems: form.recipeItems
      .filter((item) => item.ingredientId)
      .map((item, index) => ({
        ingredientId: Number(item.ingredientId),
        amount: toOptionalNumber(item.amount),
        unit: toOptionalString(item.unit),
        note: toOptionalString(item.note),
        sortOrder: index,
      })),
    coverImageUrl: coverImage?.url,
    imageUrls: orderedImageUrls,
  };
}

export function buildPublishWarnings(form: CocktailFormState) {
  const warnings: string[] = [];

  if (form.categoryIds.length === 0) {
    warnings.push('至少选择一个分类。');
  }

  if (form.publishStatus === 'published') {
    const validRecipes = form.recipeItems.filter((item) => item.ingredientId);
    if (validRecipes.length === 0) {
      warnings.push('发布前至少需要一条配方。');
    }
  }

  return warnings;
}

export function generateSlug(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toOptionalString(value: string) {
  const normalized = value.trim();
  return normalized ? normalized : undefined;
}

function toOptionalNumber(value: string) {
  const normalized = value.trim();
  return normalized ? Number(normalized) : undefined;
}

function toNumberOrZero(value: string) {
  const normalized = value.trim();
  return normalized ? Number(normalized) : 0;
}

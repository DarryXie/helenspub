import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { RecipeItemDto } from './recipe-item.dto';

export class CreateCocktailDto {
  @IsString()
  nameZh!: string;

  @IsOptional()
  @IsString()
  nameEn?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  baseSpirit?: string;

  @IsOptional()
  @IsString()
  abvNote?: string;

  @IsOptional()
  @IsString()
  glassType?: string;

  @IsOptional()
  @IsString()
  tasteProfile?: string;

  @IsOptional()
  @IsString()
  garnish?: string;

  @IsOptional()
  @IsString()
  method?: string;

  @IsOptional()
  @IsString()
  scene?: string;

  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @IsOptional()
  @IsString()
  @IsIn(['draft', 'published', 'hidden'])
  publishStatus?: 'draft' | 'published' | 'hidden';

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  categoryIds!: number[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  tagIds?: number[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeItemDto)
  recipeItems!: RecipeItemDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];
}

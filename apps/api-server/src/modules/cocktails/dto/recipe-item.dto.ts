import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class RecipeItemDto {
  @IsInt()
  ingredientId!: number;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

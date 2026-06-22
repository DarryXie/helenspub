import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateIngredientDto {
  @IsString()
  name!: string;

  @IsString()
  category!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  abv?: number;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @IsOptional()
  sortOrder?: number;
}

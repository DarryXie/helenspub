import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateTagDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @IsOptional()
  sortOrder?: number;
}

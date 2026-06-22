import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class CocktailQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  tagId?: number;

  @IsOptional()
  @IsString()
  @IsIn(['draft', 'published', 'hidden'])
  publishStatus?: 'draft' | 'published' | 'hidden';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  isVisible?: number;
}

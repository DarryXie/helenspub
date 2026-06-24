import { Transform, Type } from 'class-transformer';
import { IsArray, IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

const TASK_STATUSES = ['pending', 'in_progress', 'completed', 'delivered', 'cancelled'] as const;
const SORT_DIRECTIONS = ['asc', 'desc'] as const;

export class ProductionTaskQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(TASK_STATUSES)
  status?: (typeof TASK_STATUSES)[number];

  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.flatMap((item) =>
        typeof item === 'string'
          ? item
              .split(',')
              .map((part) => part.trim())
              .filter(Boolean)
          : [],
      );
    }

    if (typeof value === 'string') {
      return value
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);
    }

    return undefined;
  })
  @IsArray()
  @IsIn(TASK_STATUSES, { each: true })
  statuses?: Array<(typeof TASK_STATUSES)[number]>;

  @IsOptional()
  @IsString()
  @IsIn(SORT_DIRECTIONS)
  sortDirection?: (typeof SORT_DIRECTIONS)[number];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  createdByUserId?: number;
}

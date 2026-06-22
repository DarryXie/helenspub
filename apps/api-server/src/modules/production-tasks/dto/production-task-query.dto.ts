import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

const TASK_STATUSES = ['pending', 'in_progress', 'completed', 'delivered', 'cancelled'] as const;

export class ProductionTaskQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(TASK_STATUSES)
  status?: (typeof TASK_STATUSES)[number];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  createdByUserId?: number;
}

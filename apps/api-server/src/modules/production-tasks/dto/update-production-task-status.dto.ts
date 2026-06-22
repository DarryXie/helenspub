import { IsIn, IsOptional, IsString } from 'class-validator';

const TASK_STATUSES = ['pending', 'in_progress', 'completed', 'delivered', 'cancelled'] as const;

export class UpdateProductionTaskStatusDto {
  @IsString()
  @IsIn(TASK_STATUSES)
  status!: (typeof TASK_STATUSES)[number];

  @IsOptional()
  @IsString()
  actionNote?: string;
}

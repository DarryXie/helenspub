import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateProductionTaskDto {
  @IsInt()
  cocktailId!: number;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsString()
  remark?: string;

  @IsOptional()
  @IsInt()
  priority?: number;

  @IsOptional()
  @IsInt()
  assignedToUserId?: number;
}

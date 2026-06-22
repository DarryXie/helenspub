import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class UserQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  roleCode?: string;

  @IsOptional()
  @IsString()
  @IsIn(['active', 'disabled'])
  status?: 'active' | 'disabled';
}

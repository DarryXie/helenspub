import { Type } from 'class-transformer';
import { IsEmail, IsIn, IsInt, IsOptional, IsString, MinLength, Min } from 'class-validator';

export class CreateUserDto {
  @IsString()
  username!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  displayName!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  roleId!: number;

  @IsOptional()
  @IsString()
  @IsIn(['active', 'disabled'])
  status?: 'active' | 'disabled';
}

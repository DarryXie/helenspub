import { PartialType } from '@nestjs/mapped-types';
import { CreateProductionTaskDto } from './create-production-task.dto';

export class UpdateProductionTaskDto extends PartialType(CreateProductionTaskDto) {}

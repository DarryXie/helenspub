import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CreateProductionTaskDto } from './dto/create-production-task.dto';
import { ProductionTaskQueryDto } from './dto/production-task-query.dto';
import { UpdateProductionTaskDto } from './dto/update-production-task.dto';
import { UpdateProductionTaskStatusDto } from './dto/update-production-task-status.dto';
import { ProductionTasksService } from './production-tasks.service';

@Controller('app/production-tasks')
@Roles('admin', 'staff')
export class AppProductionTasksController {
  constructor(private readonly productionTasksService: ProductionTasksService) {}

  @Get()
  findAll(@Query() query: ProductionTaskQueryDto) {
    return this.productionTasksService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productionTasksService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateProductionTaskDto, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.productionTasksService.create(dto, currentUser);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductionTaskDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.productionTasksService.update(id, dto, currentUser);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductionTaskStatusDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.productionTasksService.updateStatus(id, dto, currentUser);
  }

  @Get(':id/logs')
  logs(@Param('id', ParseIntPipe) id: number) {
    return this.productionTasksService.getLogs(id);
  }
}

@Controller('admin/production-tasks')
@Roles('admin')
export class AdminProductionTasksController {
  constructor(private readonly productionTasksService: ProductionTasksService) {}

  @Get()
  findAll(@Query() query: ProductionTaskQueryDto) {
    return this.productionTasksService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productionTasksService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductionTaskStatusDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.productionTasksService.updateStatus(id, dto, currentUser);
  }

  @Get(':id/logs')
  logs(@Param('id', ParseIntPipe) id: number) {
    return this.productionTasksService.getLogs(id);
  }
}

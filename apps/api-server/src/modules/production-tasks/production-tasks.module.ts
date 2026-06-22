import { Module } from '@nestjs/common';
import { CocktailsModule } from '../cocktails/cocktails.module';
import {
  AdminProductionTasksController,
  AppProductionTasksController,
} from './production-tasks.controller';
import { ProductionTasksService } from './production-tasks.service';

@Module({
  imports: [CocktailsModule],
  controllers: [AppProductionTasksController, AdminProductionTasksController],
  providers: [ProductionTasksService],
})
export class ProductionTasksModule {}

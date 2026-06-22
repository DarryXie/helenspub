import { Module } from '@nestjs/common';
import { AdminCategoriesController, PublicCategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

@Module({
  controllers: [PublicCategoriesController, AdminCategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}

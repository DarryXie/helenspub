import { Module } from '@nestjs/common';
import {
  AdminCocktailsController,
  AppCocktailsController,
  PublicCocktailsController,
} from './cocktails.controller';
import { CocktailsService } from './cocktails.service';

@Module({
  controllers: [
    PublicCocktailsController,
    AppCocktailsController,
    AdminCocktailsController,
  ],
  providers: [CocktailsService],
  exports: [CocktailsService],
})
export class CocktailsModule {}

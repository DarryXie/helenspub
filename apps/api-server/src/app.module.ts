import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AuthModule } from './modules/auth/auth.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { CocktailsModule } from './modules/cocktails/cocktails.module';
import { ImagesModule } from './modules/images/images.module';
import { IngredientsModule } from './modules/ingredients/ingredients.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductionTasksModule } from './modules/production-tasks/production-tasks.module';
import { RolesModule } from './modules/roles/roles.module';
import { TagsModule } from './modules/tags/tags.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '../../.env.local', '.env'],
    }),
    PrismaModule,
    RolesModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    TagsModule,
    IngredientsModule,
    CocktailsModule,
    ImagesModule,
    ProductionTasksModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}

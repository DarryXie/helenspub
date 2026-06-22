import { Module } from '@nestjs/common';
import { AdminCocktailImagesController, AdminUploadsController } from './images.controller';
import { ImagesService } from './images.service';

@Module({
  controllers: [AdminUploadsController, AdminCocktailImagesController],
  providers: [ImagesService],
  exports: [ImagesService],
})
export class ImagesModule {}

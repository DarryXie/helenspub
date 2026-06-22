import {
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Roles } from '../../common/decorators/roles.decorator';
import { ImagesService } from './images.service';

@Controller('admin/uploads/images')
@Roles('admin')
export class AdminUploadsController {
  constructor(private readonly imagesService: ImagesService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File) {
    return this.imagesService.uploadImage(file);
  }
}

@Controller('admin/cocktail-images')
@Roles('admin')
export class AdminCocktailImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.imagesService.deleteCocktailImage(id);
  }
}

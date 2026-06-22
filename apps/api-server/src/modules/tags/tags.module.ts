import { Module } from '@nestjs/common';
import { AdminTagsController, PublicTagsController } from './tags.controller';
import { TagsService } from './tags.service';

@Module({
  controllers: [PublicTagsController, AdminTagsController],
  providers: [TagsService],
  exports: [TagsService],
})
export class TagsModule {}

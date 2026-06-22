import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  findPublic() {
    return this.prisma.tag.findMany({
      where: { isEnabled: true },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
  }

  findAll() {
    return this.prisma.tag.findMany({
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
  }

  async findOne(id: number) {
    const tag = await this.prisma.tag.findUnique({ where: { id } });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    return tag;
  }

  async create(dto: CreateTagDto) {
    try {
      return await this.prisma.tag.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          color: dto.color,
          isEnabled: dto.isEnabled ?? true,
          sortOrder: dto.sortOrder ?? 0,
        },
      });
    } catch {
      throw new ConflictException('Tag name or slug already exists');
    }
  }

  async update(id: number, dto: UpdateTagDto) {
    await this.findOne(id);

    try {
      return await this.prisma.tag.update({
        where: { id },
        data: {
          name: dto.name,
          slug: dto.slug,
          color: dto.color,
          isEnabled: dto.isEnabled,
          sortOrder: dto.sortOrder,
        },
      });
    } catch {
      throw new ConflictException('Tag name or slug already exists');
    }
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.tag.delete({ where: { id } });
    return { success: true };
  }
}

import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findPublic() {
    return this.prisma.category.findMany({
      where: { isEnabled: true },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
  }

  findAll() {
    return this.prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
  }

  async findOne(id: number) {
    const category = await this.prisma.category.findUnique({ where: { id } });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async create(dto: CreateCategoryDto) {
    try {
      return await this.prisma.category.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          description: dto.description,
          isEnabled: dto.isEnabled ?? true,
          sortOrder: dto.sortOrder ?? 0,
        },
      });
    } catch {
      throw new ConflictException('Category name or slug already exists');
    }
  }

  async update(id: number, dto: UpdateCategoryDto) {
    await this.findOne(id);

    try {
      return await this.prisma.category.update({
        where: { id },
        data: {
          name: dto.name,
          slug: dto.slug,
          description: dto.description,
          isEnabled: dto.isEnabled,
          sortOrder: dto.sortOrder,
        },
      });
    } catch {
      throw new ConflictException('Category name or slug already exists');
    }
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.category.delete({ where: { id } });
    return { success: true };
  }
}

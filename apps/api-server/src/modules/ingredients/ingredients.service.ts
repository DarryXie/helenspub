import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';

@Injectable()
export class IngredientsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.ingredient.findMany({
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
  }

  async findOne(id: number) {
    const ingredient = await this.prisma.ingredient.findUnique({ where: { id } });

    if (!ingredient) {
      throw new NotFoundException('Ingredient not found');
    }

    return ingredient;
  }

  async create(dto: CreateIngredientDto) {
    try {
      return await this.prisma.ingredient.create({
        data: {
          name: dto.name,
          category: dto.category,
          description: dto.description,
          abv: dto.abv,
          isEnabled: dto.isEnabled ?? true,
          sortOrder: dto.sortOrder ?? 0,
        },
      });
    } catch {
      throw new ConflictException('Ingredient name already exists');
    }
  }

  async update(id: number, dto: UpdateIngredientDto) {
    await this.findOne(id);

    try {
      return await this.prisma.ingredient.update({
        where: { id },
        data: {
          name: dto.name,
          category: dto.category,
          description: dto.description,
          abv: dto.abv,
          isEnabled: dto.isEnabled,
          sortOrder: dto.sortOrder,
        },
      });
    } catch {
      throw new ConflictException('Ingredient name already exists');
    }
  }

  async remove(id: number) {
    await this.findOne(id);

    const referencedCount = await this.prisma.cocktailRecipe.count({
      where: { ingredientId: id },
    });

    if (referencedCount > 0) {
      throw new ConflictException('Ingredient is used by cocktail recipes');
    }

    await this.prisma.ingredient.delete({ where: { id } });
    return { success: true };
  }
}

import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { CocktailQueryDto } from './dto/cocktail-query.dto';
import { CreateCocktailDto } from './dto/create-cocktail.dto';
import { UpdateCocktailDto } from './dto/update-cocktail.dto';

const cocktailInclude = {
  categories: { include: { category: true } },
  tags: { include: { tag: true } },
  recipes: { include: { ingredient: true }, orderBy: { sortOrder: 'asc' as const } },
  images: { orderBy: { sortOrder: 'asc' as const } },
};

@Injectable()
export class CocktailsService {
  constructor(private readonly prisma: PrismaService) {}

  async findPublic(query: CocktailQueryDto) {
    return this.findMany(query, true);
  }

  async findApp(query: CocktailQueryDto) {
    return this.findMany(query, false);
  }

  async findAdmin(query: CocktailQueryDto) {
    return this.findMany(query, false);
  }

  async findPublicById(id: number) {
    const cocktail = await this.prisma.cocktail.findFirst({
      where: {
        id,
        publishStatus: 'published',
        isVisible: true,
      },
      include: cocktailInclude,
    });

    if (!cocktail) {
      throw new NotFoundException('Cocktail not found');
    }

    return this.mapCocktailDetail(cocktail);
  }

  async findAnyById(id: number) {
    const cocktail = await this.prisma.cocktail.findUnique({
      where: { id },
      include: cocktailInclude,
    });

    if (!cocktail) {
      throw new NotFoundException('Cocktail not found');
    }

    return this.mapCocktailDetail(cocktail);
  }

  async create(dto: CreateCocktailDto, currentUser: AuthenticatedUser) {
    this.validateCocktailPayload(dto);

    try {
      const cocktail = await this.prisma.$transaction(async (tx) => {
        const created = await tx.cocktail.create({
          data: {
            nameZh: dto.nameZh,
            nameEn: dto.nameEn,
            slug: dto.slug,
            price: dto.price,
            shortDescription: dto.shortDescription,
            description: dto.description,
            baseSpirit: dto.baseSpirit,
            abvNote: dto.abvNote,
            glassType: dto.glassType,
            tasteProfile: dto.tasteProfile,
            garnish: dto.garnish,
            method: dto.method,
            scene: dto.scene,
            coverImageUrl: dto.coverImageUrl,
            publishStatus: dto.publishStatus ?? 'draft',
            isVisible: dto.isVisible ?? true,
            sortOrder: dto.sortOrder ?? 0,
            createdBy: currentUser.userId,
            updatedBy: currentUser.userId,
          },
        });

        await tx.cocktailCategory.createMany({
          data: dto.categoryIds.map((categoryId, index) => ({
            cocktailId: created.id,
            categoryId,
            isPrimary: index === 0,
          })),
        });

        if (dto.tagIds?.length) {
          await tx.cocktailTag.createMany({
            data: dto.tagIds.map((tagId) => ({
              cocktailId: created.id,
              tagId,
            })),
          });
        }

        await tx.cocktailRecipe.createMany({
          data: dto.recipeItems.map((item, index) => ({
            cocktailId: created.id,
            ingredientId: item.ingredientId,
            ingredientNameSnapshot: '',
            amount: item.amount,
            unit: item.unit,
            note: item.note,
            sortOrder: item.sortOrder ?? index,
          })),
        });

        await this.refreshRecipeSnapshots(tx, created.id);

        const images = this.buildImageRecords(created.id, dto.coverImageUrl, dto.imageUrls);
        if (images.length > 0) {
          await tx.cocktailImage.createMany({ data: images });
        }

        return tx.cocktail.findUniqueOrThrow({
          where: { id: created.id },
          include: cocktailInclude,
        });
      });

      return this.mapCocktailDetail(cocktail);
    } catch (error) {
      throw new ConflictException('Cocktail create failed or slug already exists');
    }
  }

  async update(id: number, dto: UpdateCocktailDto, currentUser: AuthenticatedUser) {
    const existing = await this.prisma.cocktail.findUnique({
      where: { id },
      include: cocktailInclude,
    });
    if (!existing) {
      throw new NotFoundException('Cocktail not found');
    }

    const merged = {
      nameZh: dto.nameZh ?? existing.nameZh,
      nameEn: dto.nameEn ?? existing.nameEn ?? undefined,
      shortDescription: dto.shortDescription ?? existing.shortDescription ?? undefined,
      baseSpirit: dto.baseSpirit ?? existing.baseSpirit ?? undefined,
      publishStatus: dto.publishStatus ?? existing.publishStatus,
      ...dto,
      categoryIds: dto.categoryIds ?? existing.categories.map((item) => item.categoryId),
      recipeItems:
        dto.recipeItems ??
        existing.recipes.map((item) => ({
          ingredientId: item.ingredientId,
          amount: item.amount ? Number(item.amount) : undefined,
          unit: item.unit ?? undefined,
          note: item.note ?? undefined,
          sortOrder: item.sortOrder,
        })),
    } as CreateCocktailDto;
    this.validateCocktailPayload(merged);

    const previousImageUrls = existing.images.map((image) => image.imageUrl);

    try {
      const cocktail = await this.prisma.$transaction(async (tx) => {
        await tx.cocktail.update({
          where: { id },
          data: {
            nameZh: dto.nameZh,
            nameEn: dto.nameEn,
            slug: dto.slug,
            price: dto.price,
            shortDescription: dto.shortDescription,
            description: dto.description,
            baseSpirit: dto.baseSpirit,
            abvNote: dto.abvNote,
            glassType: dto.glassType,
            tasteProfile: dto.tasteProfile,
            garnish: dto.garnish,
            method: dto.method,
            scene: dto.scene,
            coverImageUrl: dto.coverImageUrl,
            publishStatus: dto.publishStatus,
            isVisible: dto.isVisible,
            sortOrder: dto.sortOrder,
            updatedBy: currentUser.userId,
          },
        });

        if (dto.categoryIds) {
          await tx.cocktailCategory.deleteMany({ where: { cocktailId: id } });
          await tx.cocktailCategory.createMany({
            data: dto.categoryIds.map((categoryId, index) => ({
              cocktailId: id,
              categoryId,
              isPrimary: index === 0,
            })),
          });
        }

        if (dto.tagIds) {
          await tx.cocktailTag.deleteMany({ where: { cocktailId: id } });
          if (dto.tagIds.length > 0) {
            await tx.cocktailTag.createMany({
              data: dto.tagIds.map((tagId) => ({
                cocktailId: id,
                tagId,
              })),
            });
          }
        }

        if (dto.recipeItems) {
          await tx.cocktailRecipe.deleteMany({ where: { cocktailId: id } });
          await tx.cocktailRecipe.createMany({
            data: dto.recipeItems.map((item, index) => ({
              cocktailId: id,
              ingredientId: item.ingredientId,
              ingredientNameSnapshot: '',
              amount: item.amount,
              unit: item.unit,
              note: item.note,
              sortOrder: item.sortOrder ?? index,
            })),
          });
          await this.refreshRecipeSnapshots(tx, id);
        }

        if (dto.imageUrls || dto.coverImageUrl !== undefined) {
          await tx.cocktailImage.deleteMany({ where: { cocktailId: id } });
          const images = this.buildImageRecords(id, dto.coverImageUrl, dto.imageUrls);
          if (images.length > 0) {
            await tx.cocktailImage.createMany({ data: images });
          }
        }

        return tx.cocktail.findUniqueOrThrow({
          where: { id },
          include: cocktailInclude,
        });
      });

      if (dto.imageUrls || dto.coverImageUrl !== undefined) {
        const nextImageUrls = cocktail.images.map((image) => image.imageUrl);
        const removedUrls = previousImageUrls.filter((url) => !nextImageUrls.includes(url));
        await this.deleteLocalImages(removedUrls);
      }

      return this.mapCocktailDetail(cocktail);
    } catch {
      throw new ConflictException('Cocktail update failed or slug already exists');
    }
  }

  async remove(id: number) {
    const taskCount = await this.prisma.productionTask.count({
      where: { cocktailId: id },
    });

    if (taskCount > 0) {
      throw new ConflictException('Cocktail is used by production tasks');
    }

    const cocktail = await this.prisma.cocktail.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!cocktail) {
      throw new NotFoundException('Cocktail not found');
    }

    await this.prisma.cocktail.delete({ where: { id } });
    await this.deleteLocalImages(cocktail.images.map((image) => image.imageUrl));
    return { success: true };
  }

  private async findMany(query: CocktailQueryDto, onlyPublic: boolean) {
    const where: any = {
      ...(query.keyword
        ? {
            OR: [
              { nameZh: { contains: query.keyword } },
              { nameEn: { contains: query.keyword } },
            ],
          }
        : {}),
      ...(query.categoryId
        ? { categories: { some: { categoryId: query.categoryId } } }
        : {}),
      ...(query.tagId ? { tags: { some: { tagId: query.tagId } } } : {}),
      ...(onlyPublic
        ? {
            publishStatus: 'published',
            isVisible: true,
          }
        : {}),
      ...(!onlyPublic && query.publishStatus ? { publishStatus: query.publishStatus } : {}),
      ...(!onlyPublic && query.isVisible !== undefined ? { isVisible: Boolean(query.isVisible) } : {}),
    };

    const [list, total] = await this.prisma.$transaction([
      this.prisma.cocktail.findMany({
        where,
        include: {
          tags: { include: { tag: true } },
        },
        orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.cocktail.count({ where }),
    ]);

    return {
      list: (list as any[]).map((cocktail) => ({
        id: cocktail.id,
        nameZh: cocktail.nameZh,
        nameEn: cocktail.nameEn,
        price: cocktail.price !== null ? Number(cocktail.price) : null,
        shortDescription: cocktail.shortDescription,
        coverImageUrl: cocktail.coverImageUrl,
        baseSpirit: cocktail.baseSpirit,
        tasteProfile: cocktail.tasteProfile,
        tags: cocktail.tags.map((item) => ({
          id: item.tag.id,
          name: item.tag.name,
          color: item.tag.color,
        })),
        publishStatus: cocktail.publishStatus,
        isVisible: cocktail.isVisible,
      })),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize) || 1,
      },
    };
  }

  private mapCocktailDetail(cocktail: any) {
    return {
      id: cocktail.id,
      nameZh: cocktail.nameZh,
      nameEn: cocktail.nameEn,
      price: cocktail.price !== null ? Number(cocktail.price) : null,
      shortDescription: cocktail.shortDescription,
      coverImageUrl: cocktail.coverImageUrl,
      baseSpirit: cocktail.baseSpirit,
      tasteProfile: cocktail.tasteProfile,
      description: cocktail.description,
      abvNote: cocktail.abvNote,
      glassType: cocktail.glassType,
      garnish: cocktail.garnish,
      method: cocktail.method,
      scene: cocktail.scene,
      publishStatus: cocktail.publishStatus,
      isVisible: cocktail.isVisible,
      sortOrder: cocktail.sortOrder,
      categories: cocktail.categories.map((item) => ({
        id: item.category.id,
        name: item.category.name,
        slug: item.category.slug,
      })),
      tags: cocktail.tags.map((item) => ({
        id: item.tag.id,
        name: item.tag.name,
        color: item.tag.color,
      })),
      recipeItems: cocktail.recipes.map((item) => ({
        id: item.id,
        ingredientId: item.ingredientId,
        ingredientName: item.ingredientNameSnapshot,
        amount: item.amount ? Number(item.amount) : null,
        unit: item.unit,
        note: item.note,
        sortOrder: item.sortOrder,
      })),
      imageUrls: cocktail.images.map((image) => image.imageUrl),
    };
  }

  private validateCocktailPayload(dto: CreateCocktailDto) {
    if (!dto.categoryIds || dto.categoryIds.length === 0) {
      throw new ConflictException('Cocktail must belong to at least one category');
    }

    if (dto.publishStatus === 'published' && (!dto.recipeItems || dto.recipeItems.length === 0)) {
      throw new ConflictException('Published cocktail must contain at least one recipe item');
    }
  }

  private buildImageRecords(cocktailId: number, coverImageUrl?: string, imageUrls?: string[]) {
    const detailUrls = (imageUrls ?? []).filter((item) => item !== coverImageUrl);
    const records: Array<{
      cocktailId: number;
      imageUrl: string;
      imageType: 'cover' | 'detail';
      sortOrder: number;
    }> = [];

    if (coverImageUrl) {
      records.push({
        cocktailId,
        imageUrl: coverImageUrl,
        imageType: 'cover',
        sortOrder: 0,
      });
    }

    detailUrls.forEach((imageUrl, index) => {
      records.push({
        cocktailId,
        imageUrl,
        imageType: 'detail',
        sortOrder: index + 1,
      });
    });

    return records;
  }

  private async refreshRecipeSnapshots(tx: any, cocktailId: number) {
    const recipes = await tx.cocktailRecipe.findMany({
      where: { cocktailId },
      include: { ingredient: true },
    });

    for (const recipe of recipes) {
      await tx.cocktailRecipe.update({
        where: { id: recipe.id },
        data: {
          ingredientNameSnapshot: recipe.ingredient.name,
        },
      });
    }
  }

  private async deleteLocalImages(imageUrls: string[]) {
    const uniqueUrls = [...new Set(imageUrls.filter(Boolean))];

    await Promise.all(
      uniqueUrls.map(async (imageUrl) => {
        const filePath = join(
          process.cwd(),
          '..',
          '..',
          'storage',
          imageUrl.replace('/uploads/', 'uploads/'),
        );

        try {
          await unlink(filePath);
        } catch {
          // Ignore missing files so data cleanup does not block the main operation.
        }
      }),
    );
  }
}

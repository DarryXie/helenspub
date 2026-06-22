import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import { getUploadBaseUrl, getUploadRoot } from '../../common/uploads';

@Injectable()
export class ImagesService {
  constructor(private readonly prisma: PrismaService) {}

  async uploadImage(file: Express.Multer.File) {
    const uploadRoot = join(getUploadRoot(), 'cocktails');
    await mkdir(uploadRoot, { recursive: true });

    const extension = extname(file.originalname) || '.jpg';
    const safeBaseName = basename(file.originalname, extension)
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .toLowerCase();
    const fileName = `${Date.now()}-${safeBaseName}${extension}`;
    const filePath = join(uploadRoot, fileName);
    await writeFile(filePath, file.buffer);

    return {
      url: `${getUploadBaseUrl()}/cocktails/${fileName}`,
      filename: fileName,
      size: file.size,
    };
  }

  async deleteCocktailImage(imageId: number) {
    const image = await this.prisma.cocktailImage.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      throw new NotFoundException('Image record not found');
    }

    await this.prisma.cocktailImage.delete({
      where: { id: imageId },
    });

    const relativePath = image.imageUrl.replace(`${getUploadBaseUrl()}/`, '');
    const filePath = join(getUploadRoot(), relativePath);

    try {
      await unlink(filePath);
    } catch {
      // Ignore missing local file and still remove DB relation.
    }

    return { success: true };
  }
}

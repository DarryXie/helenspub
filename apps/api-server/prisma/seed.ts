import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD ?? 'ChangeMe123!';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  await prisma.role.upsert({
    where: { code: 'admin' },
    update: { name: '管理员', description: '可访问后台管理端和前台业务端', sortOrder: 1 },
    create: {
      code: 'admin',
      name: '管理员',
      description: '可访问后台管理端和前台业务端',
      sortOrder: 1,
    },
  });

  await prisma.role.upsert({
    where: { code: 'staff' },
    update: { name: '服务员', description: '可访问前台业务端并处理待制作任务', sortOrder: 2 },
    create: {
      code: 'staff',
      name: '服务员',
      description: '可访问前台业务端并处理待制作任务',
      sortOrder: 2,
    },
  });

  await prisma.role.upsert({
    where: { code: 'customer' },
    update: { name: '客户', description: '预留给未来客户登录功能', sortOrder: 3 },
    create: {
      code: 'customer',
      name: '客户',
      description: '预留给未来客户登录功能',
      sortOrder: 3,
    },
  });

  const adminRole = await prisma.role.findUniqueOrThrow({ where: { code: 'admin' } });

  await prisma.user.upsert({
    where: { username: process.env.DEFAULT_ADMIN_USERNAME ?? 'admin' },
    update: {
      displayName: '默认管理员',
      passwordHash,
      roleId: adminRole.id,
      status: 'active',
    },
    create: {
      username: process.env.DEFAULT_ADMIN_USERNAME ?? 'admin',
      displayName: '默认管理员',
      passwordHash,
      roleId: adminRole.id,
      status: 'active',
    },
  });

  const categories = [
    ['经典鸡尾酒', 'classic-cocktails', '经典配方与常见酒单', 1],
    ['酸味鸡尾酒', 'sour-cocktails', '以酸甜平衡为特点的鸡尾酒', 2],
    ['无酒精鸡尾酒', 'mocktails', '不含酒精的饮品选择', 3],
    ['餐后鸡尾酒', 'after-dinner-cocktails', '适合餐后饮用的风味酒款', 4],
  ] as const;

  for (const [name, slug, description, sortOrder] of categories) {
    await prisma.category.upsert({
      where: { name },
      update: { slug, description, sortOrder, isEnabled: true },
      create: { name, slug, description, sortOrder, isEnabled: true },
    });
  }

  const tags = [
    ['清爽', 'fresh', '#38BDF8', 1],
    ['浓烈', 'strong', '#F97316', 2],
    ['甜', 'sweet', '#FB7185', 3],
    ['酸', 'sour', '#FACC15', 4],
    ['苦', 'bitter', '#64748B', 5],
  ] as const;

  for (const [name, slug, color, sortOrder] of tags) {
    await prisma.tag.upsert({
      where: { name },
      update: { slug, color, sortOrder, isEnabled: true },
      create: { name, slug, color, sortOrder, isEnabled: true },
    });
  }

  const ingredients = [
    ['Gin', 'base_spirit', '杜松子风味烈酒', 40, 1],
    ['Rum', 'base_spirit', '甘蔗蒸馏酒', 40, 2],
    ['Vodka', 'base_spirit', '中性烈酒', 40, 3],
    ['Tequila', 'base_spirit', '龙舌兰烈酒', 40, 4],
    ['Lemon Juice', 'juice', '新鲜柠檬汁', null, 5],
    ['Simple Syrup', 'syrup', '基础糖浆', null, 6],
    ['Angostura Bitters', 'bitter', '安格式苦精', 44.7, 7],
  ] as const;

  for (const [name, category, description, abv, sortOrder] of ingredients) {
    await prisma.ingredient.upsert({
      where: { name },
      update: { category, description, abv: abv ?? undefined, sortOrder, isEnabled: true },
      create: { name, category, description, abv: abv ?? undefined, sortOrder, isEnabled: true },
    });
  }
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

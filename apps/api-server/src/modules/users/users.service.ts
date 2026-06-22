import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: UserQueryDto) {
    const where = {
      ...(query.keyword
        ? {
            OR: [
              { username: { contains: query.keyword } },
              { displayName: { contains: query.keyword } },
            ],
          }
        : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.roleCode ? { role: { code: query.roleCode } } : {}),
    };

    const [list, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        include: { role: true },
        orderBy: [{ createdAt: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      list: list.map((user) => ({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        phone: user.phone,
        email: user.email,
        status: user.status,
        lastLoginAt: user.lastLoginAt,
        role: {
          id: user.role.id,
          code: user.role.code,
          name: user.role.name,
        },
      })),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize) || 1,
      },
    };
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      phone: user.phone,
      email: user.email,
      status: user.status,
      lastLoginAt: user.lastLoginAt,
      role: {
        id: user.role.id,
        code: user.role.code,
        name: user.role.name,
      },
    };
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });

    if (existing) {
      throw new ConflictException('Username already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        passwordHash,
        displayName: dto.displayName,
        phone: dto.phone,
        email: dto.email,
        roleId: dto.roleId,
        status: dto.status ?? 'active',
      },
      include: { role: true },
    });

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      status: user.status,
      role: user.role,
    };
  }

  async update(id: number, dto: UpdateUserDto) {
    await this.ensureExists(id);

    const passwordHash = dto.password ? await bcrypt.hash(dto.password, 10) : undefined;
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        username: dto.username,
        passwordHash,
        displayName: dto.displayName,
        phone: dto.phone,
        email: dto.email,
        roleId: dto.roleId,
        status: dto.status,
      },
      include: { role: true },
    });

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      status: user.status,
      role: user.role,
    };
  }

  async remove(id: number) {
    await this.ensureExists(id);
    await this.prisma.user.update({
      where: { id },
      data: { status: 'disabled' },
    });

    return { success: true };
  }

  private async ensureExists(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }
  }
}

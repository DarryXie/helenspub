import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { CocktailsService } from '../cocktails/cocktails.service';
import { CreateProductionTaskDto } from './dto/create-production-task.dto';
import { ProductionTaskQueryDto } from './dto/production-task-query.dto';
import { UpdateProductionTaskDto } from './dto/update-production-task.dto';
import { UpdateProductionTaskStatusDto } from './dto/update-production-task-status.dto';

type ProductionTaskStatus = 'pending' | 'in_progress' | 'completed' | 'delivered' | 'cancelled';

const taskInclude = {
  cocktail: {
    include: {
      recipes: { orderBy: { sortOrder: 'asc' as const } },
    },
  },
  createdBy: {
    include: { role: true },
  },
  assignedTo: {
    include: { role: true },
  },
  logs: {
    include: {
      operator: {
        include: { role: true },
      },
    },
    orderBy: { createdAt: 'desc' as const },
  },
};

@Injectable()
export class ProductionTasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cocktailsService: CocktailsService,
  ) {}

  async findAll(query: ProductionTaskQueryDto) {
    const statuses = query.statuses?.length ? query.statuses : undefined;
    const sortDirection = query.sortDirection ?? 'desc';
    const where = {
      ...(query.keyword
        ? {
            OR: [
              { taskNo: { contains: query.keyword } },
              { cocktailNameSnapshot: { contains: query.keyword } },
            ],
          }
        : {}),
      ...(statuses
        ? { status: { in: statuses } }
        : query.status
          ? { status: query.status }
          : {}),
      ...(query.createdByUserId ? { createdByUserId: query.createdByUserId } : {}),
    };

    const [list, total] = await this.prisma.$transaction([
      this.prisma.productionTask.findMany({
        where,
        include: {
          createdBy: { include: { role: true } },
          assignedTo: { include: { role: true } },
        },
        orderBy: [{ createdAt: sortDirection }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.productionTask.count({ where }),
    ]);

    return {
      list: list.map((task) => this.mapTaskSummary(task)),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize) || 1,
      },
    };
  }

  async findOne(id: number) {
    const task = await this.prisma.productionTask.findUnique({
      where: { id },
      include: taskInclude,
    });

    if (!task) {
      throw new NotFoundException('Production task not found');
    }

    return {
      ...this.mapTaskSummary(task),
      recipeItems: task.cocktail.recipes.map((item) => ({
        id: item.id,
        ingredientId: item.ingredientId,
        ingredientName: item.ingredientNameSnapshot,
        amount: item.amount ? Number(item.amount) : null,
        unit: item.unit,
        note: item.note,
        sortOrder: item.sortOrder,
      })),
      logs: task.logs.map((log) => ({
        id: log.id,
        actionType: log.actionType,
        fromStatus: log.fromStatus,
        toStatus: log.toStatus,
        actionNote: log.actionNote,
        createdAt: log.createdAt,
        operator: {
          id: log.operator.id,
          username: log.operator.username,
          displayName: log.operator.displayName,
          roleCode: log.operator.role.code,
        },
      })),
    };
  }

  async getLogs(id: number) {
    await this.findOne(id);
    const logs = await this.prisma.productionTaskLog.findMany({
      where: { taskId: id },
      include: {
        operator: {
          include: { role: true },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    return logs.map((log) => ({
      id: log.id,
      actionType: log.actionType,
      fromStatus: log.fromStatus,
      toStatus: log.toStatus,
      actionNote: log.actionNote,
      createdAt: log.createdAt,
      operator: {
        id: log.operator.id,
        username: log.operator.username,
        displayName: log.operator.displayName,
        roleCode: log.operator.role.code,
      },
    }));
  }

  async create(dto: CreateProductionTaskDto, currentUser: AuthenticatedUser) {
    const cocktail = await this.cocktailsService.findAnyById(dto.cocktailId);
    const taskNo = await this.generateTaskNo();

    const task = await this.prisma.$transaction(async (tx) => {
      const created = await tx.productionTask.create({
        data: {
          taskNo,
          cocktailId: dto.cocktailId,
          cocktailNameSnapshot: cocktail.nameZh,
          quantity: dto.quantity,
          remark: dto.remark,
          status: 'pending',
          priority: dto.priority ?? 3,
          createdByUserId: currentUser.userId,
          assignedToUserId: dto.assignedToUserId,
        },
      });

      await tx.productionTaskLog.create({
        data: {
          taskId: created.id,
          actionType: 'create',
          toStatus: 'pending',
          operatorUserId: currentUser.userId,
          actionNote: dto.remark,
        },
      });

      return created;
    });

    return this.findOne(task.id);
  }

  async update(id: number, dto: UpdateProductionTaskDto, currentUser: AuthenticatedUser) {
    const existing = await this.prisma.productionTask.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Production task not found');
    }

    if (!['pending', 'in_progress'].includes(existing.status)) {
      throw new ConflictException('Only pending or in-progress tasks can be edited');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.productionTask.update({
        where: { id },
        data: {
          quantity: dto.quantity,
          remark: dto.remark,
          priority: dto.priority,
          assignedToUserId: dto.assignedToUserId,
        },
      });

      await tx.productionTaskLog.create({
        data: {
          taskId: id,
          actionType: 'update',
          fromStatus: existing.status,
          toStatus: existing.status,
          operatorUserId: currentUser.userId,
          actionNote: dto.remark ?? 'Task updated',
        },
      });
    });

    return this.findOne(id);
  }

  async updateStatus(
    id: number,
    dto: UpdateProductionTaskStatusDto,
    currentUser: AuthenticatedUser,
  ) {
    const existing = await this.prisma.productionTask.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Production task not found');
    }

    this.assertAllowedTransition(existing.status, dto.status);

    await this.prisma.$transaction(async (tx) => {
      const nextCompletedAt =
        dto.status === 'completed'
          ? new Date()
          : dto.status === 'delivered'
            ? existing.completedAt ?? new Date()
            : null;
      const nextCompletedByUserId =
        dto.status === 'completed'
          ? currentUser.userId
          : dto.status === 'delivered'
            ? existing.completedByUserId ?? currentUser.userId
            : null;

      await tx.productionTask.update({
        where: { id },
        data: {
          status: dto.status,
          startedAt:
            dto.status === 'in_progress' && !existing.startedAt ? new Date() : existing.startedAt,
          completedAt: nextCompletedAt,
          completedByUserId: nextCompletedByUserId,
        },
      });

      await tx.productionTaskLog.create({
        data: {
          taskId: id,
          actionType: 'status_change',
          fromStatus: existing.status,
          toStatus: dto.status,
          operatorUserId: currentUser.userId,
          actionNote: dto.actionNote,
        },
      });
    });

    return this.findOne(id);
  }

  private assertAllowedTransition(
    fromStatus: ProductionTaskStatus,
    toStatus: ProductionTaskStatus,
  ) {
    const allowed: Record<ProductionTaskStatus, ProductionTaskStatus[]> = {
      pending: ['in_progress', 'completed', 'cancelled'],
      in_progress: ['completed', 'cancelled'],
      completed: ['delivered', 'in_progress'],
      delivered: ['in_progress'],
      cancelled: [],
    };

    if (fromStatus === toStatus) {
      return;
    }

    if (!allowed[fromStatus].includes(toStatus)) {
      throw new ConflictException(`Task status transition ${fromStatus} -> ${toStatus} is not allowed`);
    }
  }

  private async generateTaskNo() {
    const now = new Date();
    const dayKey = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const count = await this.prisma.productionTask.count({
      where: {
        createdAt: {
          gte: dayStart,
          lt: dayEnd,
        },
      },
    });

    return `PT${dayKey}${String(count + 1).padStart(4, '0')}`;
  }

  private mapTaskSummary(
    task: any,
  ) {
    return {
      id: task.id,
      taskNo: task.taskNo,
      cocktailId: task.cocktailId,
      cocktailNameSnapshot: task.cocktailNameSnapshot,
      quantity: task.quantity,
      remark: task.remark,
      status: task.status,
      priority: task.priority,
      createdAt: task.createdAt,
      completedAt: task.completedAt,
      createdBy: {
        id: task.createdBy.id,
        username: task.createdBy.username,
        displayName: task.createdBy.displayName,
        roleCode: task.createdBy.role.code,
      },
      assignedTo: task.assignedTo
        ? {
            id: task.assignedTo.id,
            username: task.assignedTo.username,
            displayName: task.assignedTo.displayName,
            roleCode: task.assignedTo.role.code,
          }
        : null,
    };
  }
}

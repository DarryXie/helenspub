import { ConflictException } from '@nestjs/common';
import { ProductionTasksService } from './production-tasks.service';

describe('ProductionTasksService', () => {
  describe('status transitions', () => {
    const service = new ProductionTasksService({} as never, {} as never);

    it('allows the newly supported delivered transitions', () => {
      expect(() => {
        (service as any).assertAllowedTransition('completed', 'delivered');
        (service as any).assertAllowedTransition('delivered', 'in_progress');
      }).not.toThrow();
    });

    it('rejects invalid transitions into delivered and out of cancelled', () => {
      expect(() => (service as any).assertAllowedTransition('pending', 'delivered')).toThrow(
        ConflictException,
      );
      expect(() => (service as any).assertAllowedTransition('cancelled', 'completed')).toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll query mapping', () => {
    function createService() {
      const findMany = jest.fn().mockResolvedValue([]);
      const count = jest.fn().mockResolvedValue(0);
      const prisma = {
        productionTask: {
          findMany,
          count,
        },
        $transaction: jest.fn((operations) => Promise.all(operations)),
      };

      return {
        service: new ProductionTasksService(prisma as never, {} as never),
        findMany,
        count,
      };
    }

    it('uses status IN when statuses are provided and orders ascending when requested', async () => {
      const { service, findMany, count } = createService();

      await service.findAll({
        page: 2,
        pageSize: 10,
        statuses: ['pending', 'in_progress'],
        sortDirection: 'asc',
      } as any);

      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: ['pending', 'in_progress'] },
          }),
          orderBy: [{ createdAt: 'asc' }],
          skip: 10,
          take: 10,
        }),
      );
      expect(count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          status: { in: ['pending', 'in_progress'] },
        }),
      });
    });

    it('falls back to single-status filtering and default descending order', async () => {
      const { service, findMany, count } = createService();

      await service.findAll({
        page: 1,
        pageSize: 10,
        status: 'completed',
      } as any);

      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'completed',
          }),
          orderBy: [{ createdAt: 'desc' }],
        }),
      );
      expect(count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          status: 'completed',
        }),
      });
    });

    it('prioritizes statuses over status when both are present', async () => {
      const { service, findMany } = createService();

      await service.findAll({
        page: 1,
        pageSize: 10,
        status: 'completed',
        statuses: ['pending', 'in_progress'],
        sortDirection: 'asc',
      } as any);

      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: ['pending', 'in_progress'] },
          }),
        }),
      );
    });
  });
});

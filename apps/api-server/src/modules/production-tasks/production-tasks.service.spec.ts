import { ConflictException } from '@nestjs/common';
import { ProductionTasksService } from './production-tasks.service';

describe('ProductionTasksService status transitions', () => {
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

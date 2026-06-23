import { useEffect, useState } from 'react';
import { fetchProductionTasks } from '../../../services/production-tasks';

const COUNT_PAGE_SIZE = 1;

export interface WorkbenchTaskCounts {
  pendingCount: number;
  completedCount: number;
}

const EMPTY_COUNTS: WorkbenchTaskCounts = {
  pendingCount: 0,
  completedCount: 0,
};

export function useWorkbenchTaskCounts(refreshSeed = 0) {
  const [counts, setCounts] = useState<WorkbenchTaskCounts>(EMPTY_COUNTS);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setError(null);

    Promise.all([
      fetchProductionTasks({ page: 1, pageSize: COUNT_PAGE_SIZE, status: 'pending' }),
      fetchProductionTasks({ page: 1, pageSize: COUNT_PAGE_SIZE, status: 'in_progress' }),
      fetchProductionTasks({ page: 1, pageSize: COUNT_PAGE_SIZE, status: 'completed' }),
    ])
      .then(([pendingResult, inProgressResult, completedResult]) => {
        if (isCancelled) {
          return;
        }

        setCounts({
          pendingCount: pendingResult.pagination.total + inProgressResult.pagination.total,
          completedCount: completedResult.pagination.total,
        });
      })
      .catch((requestError: Error) => {
        if (!isCancelled) {
          setError(requestError.message || '任务统计加载失败');
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [refreshSeed, reloadToken]);

  return {
    counts,
    error,
    isLoading,
    refreshCounts: () => setReloadToken((value) => value + 1),
  };
}

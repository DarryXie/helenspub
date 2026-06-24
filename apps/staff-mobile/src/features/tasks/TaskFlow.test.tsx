import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchProductionTasks,
  updateProductionTaskStatus,
} from '../../services/production-tasks';
import { OrderedTasksPage } from './ordered/OrderedTasksPage';

vi.mock('../../services/production-tasks', () => ({
  fetchProductionTasks: vi.fn(),
  fetchProductionTaskDetail: vi.fn(),
  createProductionTask: vi.fn(),
  updateProductionTask: vi.fn(),
  updateProductionTaskStatus: vi.fn(),
}));

const mockedFetchProductionTasks = vi.mocked(fetchProductionTasks);
const mockedUpdateProductionTaskStatus = vi.mocked(updateProductionTaskStatus);

function renderPage(initialEntry = '/tasks/ordered') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/tasks/ordered" element={<OrderedTasksPage />} />
        <Route path="/cocktails/:id" element={<div>配方详情页</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

function scrollListToBottom() {
  const list = screen.getByLabelText('已点列表');

  Object.defineProperty(list, 'clientHeight', {
    configurable: true,
    value: 420,
  });
  Object.defineProperty(list, 'scrollHeight', {
    configurable: true,
    value: 520,
  });
  Object.defineProperty(list, 'scrollTop', {
    configurable: true,
    value: 120,
  });

  fireEvent.scroll(list);
}

describe('OrderedTasksPage', () => {
  let taskTotals: {
    pending: number;
    in_progress: number;
    completed: number;
  };
  let completedSecondPageHasData: boolean;
  let autoLoadSecondPageForAll: boolean;

  beforeEach(() => {
    mockedFetchProductionTasks.mockReset();
    mockedUpdateProductionTaskStatus.mockReset();
    taskTotals = {
      pending: 1,
      in_progress: 1,
      completed: 2,
    };
    completedSecondPageHasData = true;
    autoLoadSecondPageForAll = false;

    mockedFetchProductionTasks.mockImplementation(async (filters) => {
      if (filters.pageSize === 1) {
        if (filters.statuses?.join(',') === 'pending,in_progress') {
          return {
            list: [],
            pagination: {
              page: 1,
              pageSize: 1,
              total: taskTotals.pending + taskTotals.in_progress,
              totalPages: 1,
            },
          };
        }

        return {
          list: [],
          pagination: {
            page: 1,
            pageSize: 1,
            total: filters.status === 'completed' ? taskTotals.completed : 0,
            totalPages: 1,
          },
        };
      }

      if (filters.statuses?.join(',') === 'pending,in_progress') {
        return {
          list: [
            {
              id: 1,
              taskNo: 'PT202606180001',
              cocktailId: 11,
              cocktailNameSnapshot: '莫吉托',
              quantity: 1,
              remark: '   ',
              status: 'pending',
              priority: 3,
              createdAt: '2026-06-18T11:00:00.000Z',
              completedAt: null,
              createdBy: {
                id: 1,
                username: 'staff01',
                displayName: '服务员 A',
                roleCode: 'staff',
              },
              assignedTo: null,
            },
            {
              id: 3,
              taskNo: 'PT202606180003',
              cocktailId: 13,
              cocktailNameSnapshot: '马天尼',
              quantity: 1,
              remark: null,
              status: 'in_progress',
              priority: 3,
              createdAt: '2026-06-18T11:10:00.000Z',
              completedAt: null,
              createdBy: {
                id: 1,
                username: 'staff01',
                displayName: '服务员 A',
                roleCode: 'staff',
              },
              assignedTo: null,
            },
          ],
          pagination: {
            page: filters.page ?? 1,
            pageSize: 20,
            total: 2,
            totalPages: 1,
          },
        };
      }

      if (filters.status === 'completed') {
        if ((filters.page ?? 1) === 2 && completedSecondPageHasData) {
          return {
            list: [
              {
                id: 12,
                taskNo: 'PT202606220012',
                cocktailId: 21,
                cocktailNameSnapshot: '曼哈顿',
                quantity: 1,
                remark: '加大冰块',
                status: 'completed',
                priority: 3,
                createdAt: '2026-06-22T18:11:00.000Z',
                completedAt: '2026-06-22T18:26:00.000Z',
                createdBy: {
                  id: 1,
                  username: 'staff01',
                  displayName: '服务员 A',
                  roleCode: 'staff',
                },
                assignedTo: null,
              },
            ],
            pagination: {
              page: 2,
              pageSize: 20,
              total: 21,
              totalPages: 2,
            },
          };
        }

        return {
          list: [
            {
              id: 2,
              taskNo: 'PT202606180002',
              cocktailId: 12,
              cocktailNameSnapshot: '尼格罗尼',
              quantity: 1,
              remark: '少冰，杯口不用糖',
              status: 'completed',
              priority: 3,
              createdAt: '2026-06-18T11:05:00.000Z',
              completedAt: '2026-06-18T11:30:00.000Z',
              createdBy: {
                id: 1,
                username: 'staff01',
                displayName: '服务员 A',
                roleCode: 'staff',
              },
              assignedTo: null,
            },
          ],
          pagination: {
            page: 1,
            pageSize: 20,
            total: completedSecondPageHasData ? 21 : 1,
            totalPages: completedSecondPageHasData ? 2 : 1,
          },
        };
      }

      if (filters.status === 'delivered') {
        return {
          list: [
            {
              id: 4,
              taskNo: 'PT202606180004',
              cocktailId: 14,
              cocktailNameSnapshot: '古典',
              quantity: 1,
              remark: null,
              status: 'delivered',
              priority: 3,
              createdAt: '2026-06-18T11:20:00.000Z',
              completedAt: '2026-06-18T11:25:00.000Z',
              createdBy: {
                id: 1,
                username: 'staff01',
                displayName: '服务员 A',
                roleCode: 'staff',
              },
              assignedTo: null,
            },
          ],
          pagination: {
            page: filters.page ?? 1,
            pageSize: 20,
            total: 1,
            totalPages: 1,
          },
        };
      }

      if ((filters.page ?? 1) === 2 && autoLoadSecondPageForAll) {
        return {
          list: [
            {
              id: 21,
              taskNo: 'PT202606240021',
              cocktailId: 31,
              cocktailNameSnapshot: 'BBB-2',
              quantity: 1,
              remark: null,
              status: 'pending',
              priority: 3,
              createdAt: '2026-06-24T09:40:00.000Z',
              completedAt: null,
              createdBy: {
                id: 1,
                username: 'staff01',
                displayName: '服务员 A',
                roleCode: 'staff',
              },
              assignedTo: null,
            },
          ],
          pagination: {
            page: 2,
            pageSize: 20,
            total: 21,
            totalPages: 2,
          },
        };
      }

      return {
        list: [
          {
            id: 10,
            taskNo: 'PT202606230010',
            cocktailId: 30,
            cocktailNameSnapshot: '边车',
            quantity: 1,
            remark: null,
            status: 'delivered',
            priority: 3,
            createdAt: '2026-06-23T17:23:00.000Z',
            completedAt: '2026-06-23T17:30:00.000Z',
            createdBy: {
              id: 1,
              username: 'staff01',
              displayName: '服务员 A',
              roleCode: 'staff',
            },
            assignedTo: null,
          },
          {
            id: 9,
            taskNo: 'PT202606220009',
            cocktailId: 29,
            cocktailNameSnapshot: '玛格丽特',
            quantity: 1,
            remark: '少盐边',
            status: 'completed',
            priority: 3,
            createdAt: '2026-06-22T18:11:00.000Z',
            completedAt: '2026-06-22T18:25:00.000Z',
            createdBy: {
              id: 1,
              username: 'staff01',
              displayName: '服务员 A',
              roleCode: 'staff',
            },
            assignedTo: null,
          },
          {
            id: 5,
            taskNo: 'PT202606180005',
            cocktailId: 15,
            cocktailNameSnapshot: '玛格丽特',
            quantity: 1,
            remark: null,
            status: 'cancelled',
            priority: 3,
            createdAt: '2026-06-18T11:30:00.000Z',
            completedAt: null,
            createdBy: {
              id: 1,
              username: 'staff01',
              displayName: '服务员 A',
              roleCode: 'staff',
            },
            assignedTo: null,
          },
          {
            id: 4,
            taskNo: 'PT202606180004',
            cocktailId: 14,
            cocktailNameSnapshot: '古典',
            quantity: 1,
            remark: null,
            status: 'delivered',
            priority: 3,
            createdAt: '2026-06-18T11:20:00.000Z',
            completedAt: '2026-06-18T11:25:00.000Z',
            createdBy: {
              id: 1,
              username: 'staff01',
              displayName: '服务员 A',
              roleCode: 'staff',
            },
            assignedTo: null,
          },
          {
            id: 3,
            taskNo: 'PT202606180003',
            cocktailId: 13,
            cocktailNameSnapshot: '马天尼',
            quantity: 1,
            remark: null,
            status: 'in_progress',
            priority: 3,
            createdAt: '2026-06-18T11:10:00.000Z',
            completedAt: null,
            createdBy: {
              id: 1,
              username: 'staff01',
              displayName: '服务员 A',
              roleCode: 'staff',
            },
            assignedTo: null,
          },
          {
            id: 2,
            taskNo: 'PT202606180002',
            cocktailId: 12,
            cocktailNameSnapshot: '尼格罗尼',
            quantity: 1,
            remark: '少冰，杯口不用糖',
            status: 'completed',
            priority: 3,
            createdAt: '2026-06-18T11:05:00.000Z',
            completedAt: '2026-06-18T11:30:00.000Z',
            createdBy: {
              id: 1,
              username: 'staff01',
              displayName: '服务员 A',
              roleCode: 'staff',
            },
            assignedTo: null,
          },
          {
            id: 1,
            taskNo: 'PT202606180001',
            cocktailId: 11,
            cocktailNameSnapshot: '莫吉托',
            quantity: 1,
            remark: '   ',
            status: 'pending',
            priority: 3,
            createdAt: '2026-06-18T11:00:00.000Z',
            completedAt: null,
            createdBy: {
              id: 1,
              username: 'staff01',
              displayName: '服务员 A',
              roleCode: 'staff',
            },
            assignedTo: null,
          },
        ],
        pagination: {
          page: filters.page ?? 1,
          pageSize: 20,
          total: autoLoadSecondPageForAll ? 21 : 7,
          totalPages: autoLoadSecondPageForAll ? 2 : 1,
        },
      };
    });

    mockedUpdateProductionTaskStatus.mockImplementation(async () => {
      completedSecondPageHasData = false;
      taskTotals.completed -= 1;
      taskTotals.in_progress += 1;

      return {
        id: 12,
        taskNo: 'PT202606220012',
        cocktailId: 21,
        cocktailNameSnapshot: '曼哈顿',
        quantity: 1,
        remark: '加大冰块',
        status: 'in_progress',
        priority: 3,
        createdAt: '2026-06-22T18:11:00.000Z',
        completedAt: null,
        createdBy: {
          id: 1,
          username: 'staff01',
          displayName: '服务员 A',
          roleCode: 'staff',
        },
        assignedTo: null,
        recipeItems: [],
        logs: [],
      };
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('loads all ordered tasks using server-side desc order', async () => {
    renderPage();

    await screen.findByText('边车');
    expect(mockedFetchProductionTasks).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      sortDirection: 'desc',
    });

    const titles = screen
      .getAllByText(/边车|玛格丽特|古典|马天尼|尼格罗尼|莫吉托/)
      .map((node) => node.textContent);

    expect(titles).toEqual(['边车', '玛格丽特', '玛格丽特', '古典', '马天尼', '尼格罗尼', '莫吉托']);
    expect(screen.getByRole('button', { name: /待制作\s*2/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /制作完成\s*2/ })).toBeInTheDocument();
  });

  it('shows remarks only when the task remark has non-whitespace content', async () => {
    renderPage();

    const taskWithRemark = await screen.findByRole('button', { name: /尼格罗尼/ });
    expect(within(taskWithRemark).getByText('备注：少冰，杯口不用糖')).toBeInTheDocument();

    const taskWithoutRemark = screen.getByRole('button', { name: /莫吉托/ });
    expect(within(taskWithoutRemark).queryByText(/备注：/)).not.toBeInTheDocument();
  });

  it('requests pending and in-progress records together under 待制作', async () => {
    renderPage();
    const user = userEvent.setup();

    await screen.findByText('边车');
    await user.click(screen.getByRole('button', { name: /待制作\s*2/ }));

    await waitFor(() => {
      expect(mockedFetchProductionTasks).toHaveBeenCalledWith({
        page: 1,
        pageSize: 20,
        statuses: ['pending', 'in_progress'],
        sortDirection: 'asc',
      });
    });

    expect(screen.getByText('莫吉托')).toBeInTheDocument();
    expect(screen.getByText('马天尼')).toBeInTheDocument();
    expect(screen.queryByText('古典')).not.toBeInTheDocument();
  });

  it('restores filter from the URL and requests the next page when scrolling to the bottom', async () => {
    renderPage('/tasks/ordered?status=completed');

    await screen.findByText('尼格罗尼');
    expect(mockedFetchProductionTasks).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      status: 'completed',
      sortDirection: 'asc',
    });

    scrollListToBottom();

    await waitFor(() => {
      expect(mockedFetchProductionTasks).toHaveBeenCalledWith({
        page: 2,
        pageSize: 20,
        status: 'completed',
        sortDirection: 'asc',
      });
    });

    expect(await screen.findByText('曼哈顿')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '上一页' })).not.toBeInTheDocument();
  });

  it('auto-loads the next page when the first page cannot fill the scroll area', async () => {
    autoLoadSecondPageForAll = true;
    const originalClientHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight');
    const originalScrollHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollHeight');

    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
      configurable: true,
      get() {
        if ((this as HTMLElement).getAttribute('aria-label') === '已点列表') {
          return 420;
        }

        return 0;
      },
    });

    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
      configurable: true,
      get() {
        if ((this as HTMLElement).getAttribute('aria-label') === '已点列表') {
          return 360;
        }

        return 0;
      },
    });

    renderPage();

    await screen.findByText('边车');

    await waitFor(() => {
      expect(mockedFetchProductionTasks).toHaveBeenCalledWith({
        page: 2,
        pageSize: 20,
        sortDirection: 'desc',
      });
    });

    expect(await screen.findByText('BBB-2')).toBeInTheDocument();

    if (originalClientHeight) {
      Object.defineProperty(HTMLElement.prototype, 'clientHeight', originalClientHeight);
    }

    if (originalScrollHeight) {
      Object.defineProperty(HTMLElement.prototype, 'scrollHeight', originalScrollHeight);
    }
  });

  it('closes the modal after status change and refreshes the loaded pages', async () => {
    renderPage('/tasks/ordered?status=completed');
    const user = userEvent.setup();

    await screen.findByText('尼格罗尼');
    scrollListToBottom();
    await screen.findByText('曼哈顿');
    await user.click(screen.getByRole('button', { name: /曼哈顿/ }));
    const dialog = screen.getByRole('dialog');

    await user.click(within(dialog).getByRole('button', { name: '制作中' }));

    await waitFor(() => {
      expect(mockedUpdateProductionTaskStatus).toHaveBeenCalledWith(12, {
        status: 'in_progress',
      });
    });

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(mockedFetchProductionTasks).toHaveBeenCalledWith({
        page: 1,
        pageSize: 20,
        status: 'completed',
        sortDirection: 'asc',
      });
    });

    expect(await screen.findByText('尼格罗尼')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /制作完成\s*1/ })).toBeInTheDocument();
    expect(screen.queryByText('曼哈顿')).not.toBeInTheDocument();
  });

  it('navigates to the recipe page from the status modal', async () => {
    renderPage();
    const user = userEvent.setup();

    await screen.findByText('边车');
    await user.click(screen.getByRole('button', { name: /边车/ }));
    await user.click(screen.getByRole('button', { name: '配方' }));

    expect(await screen.findByText('配方详情页')).toBeInTheDocument();
  });
});

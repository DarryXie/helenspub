import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
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

describe('OrderedTasksPage', () => {
  beforeEach(() => {
    mockedFetchProductionTasks.mockReset();
    mockedUpdateProductionTaskStatus.mockReset();

    mockedFetchProductionTasks.mockResolvedValue({
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
      ],
      pagination: {
        page: 1,
        pageSize: 100,
        total: 5,
        totalPages: 1,
      },
    });

    mockedUpdateProductionTaskStatus.mockResolvedValue({
      id: 1,
      taskNo: 'PT202606180001',
      cocktailId: 11,
      cocktailNameSnapshot: '莫吉托',
      quantity: 1,
      remark: '   ',
      status: 'completed',
      priority: 3,
      createdAt: '2026-06-18T11:00:00.000Z',
      completedAt: '2026-06-18T11:35:00.000Z',
      createdBy: {
        id: 1,
        username: 'staff01',
        displayName: '服务员 A',
        roleCode: 'staff',
      },
      assignedTo: null,
      recipeItems: [],
      logs: [],
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('loads all ordered tasks and shows them in ascending createdAt order', async () => {
    renderPage();

    await screen.findByText('莫吉托');
    expect(mockedFetchProductionTasks).toHaveBeenCalledWith({
      page: 1,
      pageSize: 100,
    });

    const titles = screen
      .getAllByText(/莫吉托|尼格罗尼|马天尼|古典|玛格丽特/)
      .map((node) => node.textContent);

    expect(titles).toEqual(['莫吉托', '尼格罗尼', '马天尼', '古典', '玛格丽特']);
  });

  it('shows remarks only when the task remark has non-whitespace content', async () => {
    renderPage();

    const taskWithRemark = await screen.findByRole('button', { name: /尼格罗尼/ });
    expect(within(taskWithRemark).getByText('备注：少冰，杯口不用糖')).toBeInTheDocument();

    const taskWithoutRemark = screen.getByRole('button', { name: /莫吉托/ });
    expect(within(taskWithoutRemark).queryByText(/备注：/)).not.toBeInTheDocument();

    expect(screen.getAllByText(/备注：/)).toHaveLength(1);
  });

  it('filters pending and in-progress records together under 待制作', async () => {
    renderPage();
    const user = userEvent.setup();

    await screen.findByText('莫吉托');
    await user.click(screen.getByRole('button', { name: '待制作' }));

    expect(screen.getByText('莫吉托')).toBeInTheDocument();
    expect(screen.getByText('马天尼')).toBeInTheDocument();
    expect(screen.queryByText('古典')).not.toBeInTheDocument();
    expect(screen.queryByText('玛格丽特')).not.toBeInTheDocument();
  });

  it('opens the status modal and updates a task status', async () => {
    renderPage();
    const user = userEvent.setup();

    await screen.findByText('莫吉托');
    await user.click(screen.getByRole('button', { name: /莫吉托/ }));
    const dialog = screen.getByRole('dialog');

    expect(within(dialog).getByRole('button', { name: '制作中' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: '制作完成' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: '已送达' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: '取消制作' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: '配方' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: '关闭' })).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: '制作完成' }));

    await waitFor(() => {
      expect(mockedUpdateProductionTaskStatus).toHaveBeenCalledWith(1, {
        status: 'completed',
      });
    });

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('navigates to the recipe page from the status modal', async () => {
    renderPage();
    const user = userEvent.setup();

    await screen.findByText('莫吉托');
    await user.click(screen.getByRole('button', { name: /莫吉托/ }));
    await user.click(screen.getByRole('button', { name: '配方' }));

    expect(await screen.findByText('配方详情页')).toBeInTheDocument();
  });
});

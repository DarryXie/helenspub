import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchAppCocktails,
  fetchPublicCategories,
  fetchPublicTags,
} from '../../services/cocktails';
import { createProductionTask } from '../../services/production-tasks';
import { OrderWorkbenchPage } from './order/OrderWorkbenchPage';

vi.mock('../../services/cocktails', () => ({
  fetchAppCocktails: vi.fn(),
  fetchAppCocktailDetail: vi.fn(),
  fetchPublicCategories: vi.fn(),
  fetchPublicTags: vi.fn(),
}));

vi.mock('../../services/production-tasks', () => ({
  fetchProductionTasks: vi.fn(),
  fetchProductionTaskDetail: vi.fn(),
  createProductionTask: vi.fn(),
  updateProductionTask: vi.fn(),
  updateProductionTaskStatus: vi.fn(),
}));

const mockedFetchAppCocktails = vi.mocked(fetchAppCocktails);
const mockedFetchPublicCategories = vi.mocked(fetchPublicCategories);
const mockedFetchPublicTags = vi.mocked(fetchPublicTags);
const mockedCreateProductionTask = vi.mocked(createProductionTask);

function renderPage(initialEntry = '/tasks/order') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/tasks/order" element={<OrderWorkbenchPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('OrderWorkbenchPage', () => {
  beforeEach(() => {
    mockedFetchPublicCategories.mockReset();
    mockedFetchPublicTags.mockReset();
    mockedFetchAppCocktails.mockReset();
    mockedCreateProductionTask.mockReset();

    mockedFetchPublicCategories.mockResolvedValue([
      { id: 2, name: '经典' },
      { id: 3, name: '清爽特调' },
    ]);
    mockedFetchPublicTags.mockResolvedValue([
      { id: 7, name: '清爽' },
      { id: 8, name: '酸感' },
    ]);
    mockedFetchAppCocktails.mockResolvedValue({
      list: [
        {
          id: 1,
          nameZh: '莫吉托',
          nameEn: 'Mojito',
          price: 68,
          shortDescription: '薄荷与青柠的清爽组合',
          coverImageUrl: null,
          baseSpirit: 'Rum',
          tasteProfile: '清爽',
          tags: [{ id: 7, name: '清爽' }],
        },
      ],
      pagination: {
        page: 1,
        pageSize: 100,
        total: 1,
        totalPages: 1,
      },
    });
    mockedCreateProductionTask.mockResolvedValue({
      id: 21,
      taskNo: 'PT202606180021',
      cocktailId: 1,
      cocktailNameSnapshot: '莫吉托',
      quantity: 1,
      remark: '少冰',
      status: 'pending',
      priority: 3,
      createdAt: '2026-06-18T12:00:00.000Z',
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
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('requests cocktails using keyword, category, and tag from the URL', async () => {
    renderPage('/tasks/order?keyword=mojito&categoryId=2&tagId=7');

    await screen.findByRole('button', { name: '下单' });
    expect(mockedFetchAppCocktails).toHaveBeenCalledWith({
      page: 1,
      pageSize: 100,
      keyword: 'mojito',
      categoryId: 2,
      tagId: 7,
    });
  });

  it('opens the remark modal and creates a production task', async () => {
    renderPage();
    const user = userEvent.setup();

    await screen.findByText('莫吉托');
    await user.click(screen.getByRole('button', { name: '下单' }));
    await user.type(screen.getByPlaceholderText('请输入客人的特殊要求...'), '少冰');
    await user.click(screen.getByRole('button', { name: '确认下单' }));

    await waitFor(() => {
      expect(mockedCreateProductionTask).toHaveBeenCalledWith({
        cocktailId: 1,
        quantity: 1,
        priority: 3,
        remark: '少冰',
      });
    });

    expect(await screen.findByText('莫吉托 下单成功')).toBeInTheDocument();
  });
});

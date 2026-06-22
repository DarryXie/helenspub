import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../App';
import { fetchCurrentUser, loginWithPassword, logoutRequest } from '../../services/auth';
import { fetchAppCocktails, fetchPublicCategories, fetchPublicTags } from '../../services/cocktails';
import type { AuthSession } from './types';

vi.mock('../../services/auth', () => ({
  fetchCurrentUser: vi.fn(),
  loginWithPassword: vi.fn(),
  logoutRequest: vi.fn(),
}));

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

const mockedFetchCurrentUser = vi.mocked(fetchCurrentUser);
const mockedLoginWithPassword = vi.mocked(loginWithPassword);
const mockedLogoutRequest = vi.mocked(logoutRequest);
const mockedFetchAppCocktails = vi.mocked(fetchAppCocktails);
const mockedFetchPublicCategories = vi.mocked(fetchPublicCategories);
const mockedFetchPublicTags = vi.mocked(fetchPublicTags);

const session: AuthSession = {
  accessToken: 'token-1',
  tokenType: 'Bearer',
  expiresIn: '2h',
  user: {
    id: 1,
    username: 'staff01',
    displayName: '服务员 A',
    roleCode: 'staff',
    roleName: '前台服务员',
  },
};

function renderApp(initialEntry: string) {
  return render(
    <MemoryRouter basename="/staff" initialEntries={[initialEntry]}>
      <App />
    </MemoryRouter>,
  );
}

describe('App routing and auth flow', () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockedFetchCurrentUser.mockReset();
    mockedLoginWithPassword.mockReset();
    mockedLogoutRequest.mockReset();
    mockedFetchAppCocktails.mockReset();
    mockedFetchPublicCategories.mockReset();
    mockedFetchPublicTags.mockReset();

    mockedFetchAppCocktails.mockResolvedValue({
      list: [],
      pagination: {
        page: 1,
        pageSize: 100,
        total: 0,
        totalPages: 1,
      },
    });
    mockedFetchPublicCategories.mockResolvedValue([]);
    mockedFetchPublicTags.mockResolvedValue([]);
    mockedLogoutRequest.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('redirects unauthenticated /staff/* access to /staff/login', async () => {
    renderApp('/staff/tasks/ordered');

    await screen.findByRole('heading', { name: '前台业务端登录' });
    expect(screen.getByText('输入你的业务账号，进入今晚的前台工作台。')).toBeInTheDocument();
  });

  it('shows an error message when login fails', async () => {
    mockedLoginWithPassword.mockRejectedValue(new Error('用户名或密码错误'));

    renderApp('/staff/login');
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('账号'), 'staff01');
    await user.type(screen.getByLabelText('密码'), 'bad-password');
    await user.click(screen.getByRole('button', { name: '进入前台工作台' }));

    await screen.findByText('用户名或密码错误');
  });

  it('logs in and navigates to the order workbench inside the /staff basename', async () => {
    mockedLoginWithPassword.mockResolvedValue(session);

    renderApp('/staff/login');
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('账号'), 'staff01');
    await user.type(screen.getByLabelText('密码'), '123456');
    await user.click(screen.getByRole('button', { name: '进入前台工作台' }));

    await screen.findByRole('link', { name: '点单' });
    expect(mockedFetchAppCocktails).toHaveBeenCalledWith({
      page: 1,
      pageSize: 100,
      keyword: undefined,
      categoryId: undefined,
      tagId: undefined,
    });
  });

  it('restores a persisted session and keeps the user on /staff/tasks/order', async () => {
    window.localStorage.setItem('cocktail-staff-session', JSON.stringify(session));
    mockedFetchCurrentUser.mockResolvedValue({
      id: 1,
      username: 'staff01',
      displayName: '服务员 A',
      role: {
        id: 2,
        code: 'staff',
        name: '前台服务员',
      },
      status: 'active',
    });

    renderApp('/staff/tasks/order');

    await screen.findByLabelText('搜索鸡尾酒');
    await waitFor(() => {
      expect(mockedFetchCurrentUser).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByRole('button', { name: '退出登录' })).toBeInTheDocument();
  });
});

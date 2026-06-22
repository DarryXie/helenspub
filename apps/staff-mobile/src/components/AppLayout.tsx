import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';

export function AppLayout() {
  const location = useLocation();
  const { logout, isLoggingOut } = useAuth();
  const isWorkbench = location.pathname.startsWith('/tasks/');
  const isRecipePage = location.pathname.startsWith('/cocktails/');

  return (
    <div className={`app-shell${isWorkbench ? ' app-shell-workbench' : ''}`}>
      {isWorkbench ? (
        <button
          aria-label="退出登录"
          className="workbench-logout"
          disabled={isLoggingOut}
          onClick={logout}
          type="button"
        >
          {isLoggingOut ? '退出中...' : '退出登录'}
        </button>
      ) : isRecipePage ? null : (
        <header className="app-topbar">
          <div className="app-topbar-copy">
            <p className="app-eyebrow">Recipe Reference</p>
            <h1>鸡尾酒配方</h1>
          </div>
          <button className="ghost-button" disabled={isLoggingOut} onClick={logout} type="button">
            {isLoggingOut ? '退出中...' : '退出登录'}
          </button>
        </header>
      )}

      <main className={`app-main${isWorkbench ? ' app-main-workbench' : ''}`}>
        <Outlet />
      </main>
    </div>
  );
}

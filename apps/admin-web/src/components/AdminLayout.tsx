import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { clearAuth } from '../services/auth';

const items = [
  ['仪表盘', '/dashboard'],
  ['鸡尾酒管理', '/cocktails'],
  ['分类管理', '/categories'],
  ['标签管理', '/tags'],
  ['原料管理', '/ingredients'],
  ['用户管理', '/users'],
  ['待制作任务', '/tasks'],
] as const;

export function AdminLayout() {
  const navigate = useNavigate();

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">Cocktail Database</p>
          <h1>后台管理</h1>
        </div>
        <nav className="nav">
          {items.map(([label, to]) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <button
          className="ghost-button"
          onClick={() => {
            clearAuth();
            navigate('/login');
          }}
          type="button"
        >
          退出登录
        </button>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}

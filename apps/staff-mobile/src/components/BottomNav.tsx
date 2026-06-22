import { NavLink } from 'react-router-dom';

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="业务前台导航">
      <NavLink className="bottom-nav-link" to="/tasks">
        <span className="bottom-nav-label">待制作</span>
        <small>队列与状态</small>
      </NavLink>
      <NavLink className="bottom-nav-link" to="/cocktails">
        <span className="bottom-nav-label">鸡尾酒</span>
        <small>查配方与加单</small>
      </NavLink>
    </nav>
  );
}

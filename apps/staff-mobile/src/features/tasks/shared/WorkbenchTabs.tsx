import { NavLink } from 'react-router-dom';

export function WorkbenchTabs() {
  return (
    <nav className="top-tabbar" aria-label="前台工作台切换">
      <NavLink className={({ isActive }) => `tab-item${isActive ? ' active' : ''}`} to="/tasks/order">
        点单
      </NavLink>
      <NavLink
        className={({ isActive }) => `tab-item${isActive ? ' active' : ''}`}
        to="/tasks/ordered"
      >
        已点
      </NavLink>
    </nav>
  );
}

import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from './components/AdminLayout';
import { CocktailEditorPage } from './pages/CocktailEditorPage';
import { CocktailsPage } from './pages/CocktailsPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { ResourceListPage } from './pages/ResourceListPage';
import { TasksPage } from './pages/TasksPage';
import { getAccessToken } from './services/auth';

function ProtectedLayout() {
  const token = getAccessToken();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <AdminLayout />;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="cocktails" element={<CocktailsPage />} />
        <Route path="cocktails/create" element={<CocktailEditorPage mode="create" />} />
        <Route path="cocktails/:id/edit" element={<CocktailEditorPage mode="edit" />} />
        <Route path="categories" element={<ResourceListPage resource="categories" title="分类管理" />} />
        <Route path="tags" element={<ResourceListPage resource="tags" title="标签管理" />} />
        <Route path="ingredients" element={<ResourceListPage resource="ingredients" title="原料管理" />} />
        <Route path="users" element={<ResourceListPage resource="users" title="用户管理" />} />
        <Route path="tasks" element={<TasksPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

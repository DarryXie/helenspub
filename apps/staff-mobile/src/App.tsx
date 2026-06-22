import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { SplashScreen } from './components/SplashScreen';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import { LoginPage } from './features/auth/LoginPage';
import { ProtectedRoute } from './features/auth/ProtectedRoute';
import { CocktailDetailPage } from './features/cocktails/CocktailDetailPage';
import { OrderWorkbenchPage } from './features/tasks/order/OrderWorkbenchPage';
import { OrderedTasksPage } from './features/tasks/ordered/OrderedTasksPage';

function RootRedirect() {
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return <SplashScreen message="正在整理今晚的前台工作台" />;
  }

  return <Navigate replace to={isAuthenticated ? '/tasks' : '/login'} />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/tasks" element={<Navigate replace to="/tasks/order" />} />
          <Route path="/tasks/order" element={<OrderWorkbenchPage />} />
          <Route path="/tasks/ordered" element={<OrderedTasksPage />} />
          <Route path="/tasks/new" element={<Navigate replace to="/tasks/order" />} />
          <Route path="/tasks/:id" element={<Navigate replace to="/tasks/ordered" />} />
          <Route path="/tasks/:id/edit" element={<Navigate replace to="/tasks/ordered" />} />
          <Route path="/cocktails" element={<Navigate replace to="/tasks/order" />} />
          <Route path="/cocktails/:id" element={<CocktailDetailPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

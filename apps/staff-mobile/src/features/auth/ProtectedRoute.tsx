import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { SplashScreen } from '../../components/SplashScreen';
import { useAuth } from './AuthContext';

export function ProtectedRoute() {
  const location = useLocation();
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return <SplashScreen message="正在打开你的值班工作台" />;
  }

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  return <Outlet />;
}

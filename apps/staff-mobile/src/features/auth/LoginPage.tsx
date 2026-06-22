import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { SplashScreen } from '../../components/SplashScreen';
import { useAuth } from './AuthContext';

function resolveNextPath(locationState: unknown) {
  if (
    typeof locationState === 'object' &&
    locationState &&
    'from' in locationState &&
    locationState.from &&
    typeof locationState.from === 'object' &&
    'pathname' in locationState.from &&
    typeof locationState.from.pathname === 'string'
  ) {
    return locationState.from.pathname;
  }

  return '/tasks/order';
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isBootstrapping, isLoggingIn, login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (isBootstrapping) {
    return <SplashScreen message="正在确认你的登录状态" />;
  }

  if (isAuthenticated) {
    return <Navigate replace to="/tasks/order" />;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      await login({ username, password });
      navigate(resolveNextPath(location.state), { replace: true });
    } catch (requestError) {
      if (requestError instanceof Error) {
        setError(requestError.message);
        return;
      }

      setError('登录失败，请稍后再试。');
    }
  }

  return (
    <main className="login-shell login-shell-compact">
      <section className="login-panel login-panel-compact">
        <div className="login-panel-header">
          <p className="app-eyebrow">Sign In</p>
          <h2>前台业务端登录</h2>
          <p>输入你的业务账号，进入今晚的前台工作台。</p>
        </div>

        <form className="editorial-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>账号</span>
            <input
              autoComplete="username"
              name="username"
              onChange={(event) => setUsername(event.target.value)}
              placeholder="例如 staff01"
              required
              type="text"
              value={username}
            />
          </label>

          <label className="field">
            <span>密码</span>
            <input
              autoComplete="current-password"
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="输入登录密码"
              required
              type="password"
              value={password}
            />
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <button className="primary-button" disabled={isLoggingIn} type="submit">
            {isLoggingIn ? '登录中...' : '进入前台工作台'}
          </button>
        </form>
      </section>
    </main>
  );
}

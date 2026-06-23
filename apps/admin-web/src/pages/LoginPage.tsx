import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { setAccessToken } from '../services/auth';
import { apiRequest } from '../services/http';

export function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const data = await apiRequest<{
        accessToken: string;
      }>('/admin/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      setAccessToken(data.accessToken);
      navigate('/dashboard');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '登录失败');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-shell">
      <form className="login-card" onSubmit={handleSubmit}>
        <p className="eyebrow">Cocktail Database</p>
        <h1>管理员登录</h1>
        <label>
          用户名
          <input value={username} onChange={(event) => setUsername(event.target.value)} />
        </label>
        <label>
          密码
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {error ? <p className="error-text">{error}</p> : null}
        <button className="primary-button" disabled={submitting} type="submit">
          {submitting ? '登录中...' : '登录'}
        </button>
      </form>
    </div>
  );
}

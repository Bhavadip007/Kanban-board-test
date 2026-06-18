import { useState, FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/utils/messages';
import '@/styles/auth.css';

export const LoginPage = () => {
  const { user, login } = useAuth();
  const [email, setEmail] = useState('demo@kanban.app');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      const message =
        err instanceof AxiosError && err.response?.status === 401
          ? 'Incorrect email or password.'
          : getErrorMessage(err, 'Sign in failed. Please try again.');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Welcome back</h1>
        <p>Sign in to continue to your boards</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
          </div>

          {error && <div className="alert-banner alert-error">{error}</div>}

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="auth-toggle">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  );
};

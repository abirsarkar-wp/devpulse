import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthShell } from '../components/AuthShell';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Incident response console"><form onSubmit={handleSubmit} className="panel-depth rounded-2xl border border-white/60 bg-paper-raised p-6 sm:p-8">
          <h2 className="font-display text-xl font-semibold text-ink">Welcome back</h2><p className="mt-1 text-sm text-steel">Sign in to access the live incident board.</p>

          {error && (
            <p className="mt-5 rounded-lg bg-signal-critical/10 px-3 py-2 font-mono text-xs text-signal-critical">
              {error}
            </p>
          )}

          <label className="mt-5 block text-xs font-medium text-steel mb-1.5">
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm transition focus:border-ink/30 focus:outline-none focus:ring-4 focus:ring-ink/8"
            required
          />

          <label className="mt-4 block text-xs font-medium text-steel mb-1.5">
            Password
          </label>

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 pr-16 text-sm transition focus:border-ink/30 focus:outline-none focus:ring-4 focus:ring-ink/8"
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-steel hover:text-ink transition"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          <button type="submit" disabled={loading} className="mt-5 w-full rounded-lg bg-ink py-2.5 text-sm font-medium text-white shadow-lg shadow-ink/15 transition hover:-translate-y-0.5 hover:bg-ink/90 disabled:opacity-50">
            {loading ? 'Signing in...' : 'Log in'}
          </button>

          <p className="text-xs text-steel mt-4 text-center">
            <Link
              to="/forgot-password"
              className="text-ink font-medium hover:underline"
            >
              Forgot password?
            </Link>
          </p>
        </form></AuthShell>
  );
}

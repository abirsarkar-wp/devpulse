import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/api';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState(
    searchParams.get('email') || ''
  );
  const [resetToken, setResetToken] = useState(
    searchParams.get('token') || ''
  );
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    setMessage('');
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/reset-password', {
        email,
        resetToken,
        newPassword,
      });

      setMessage(
        response.data.message || 'Password reset successful.'
      );

      setTimeout(() => {
        navigate('/login');
      }, 1200);
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          'Unable to reset password.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="font-display font-semibold text-2xl text-ink tracking-tight">
            DevPulse
          </h1>

          <p className="font-mono text-[10px] text-steel uppercase tracking-widest mt-1">
            Incident Response
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-paper-raised rounded-lg shadow-sm border border-black/5 p-6"
        >
          <h2 className="font-display font-semibold text-base text-ink mb-2">
            Reset password
          </h2>

          <p className="text-xs text-steel mb-5">
            Enter your reset token and choose a new password.
          </p>

          {error && (
            <p className="text-signal-critical text-xs font-mono mb-4 bg-signal-critical/10 px-3 py-2 rounded">
              {error}
            </p>
          )}

          {message && (
            <p className="text-signal-resolved text-xs font-mono mb-4 bg-signal-resolved/10 px-3 py-2 rounded">
              {message}
            </p>
          )}

          <label className="block text-xs font-medium text-steel mb-1">
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full border border-black/10 rounded px-3 py-2 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20"
            required
          />

          <label className="block text-xs font-medium text-steel mb-1">
            Reset token
          </label>

          <input
            type="text"
            value={resetToken}
            onChange={(event) => setResetToken(event.target.value)}
            className="w-full border border-black/10 rounded px-3 py-2 mb-4 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-ink/20"
            required
          />

          <label className="block text-xs font-medium text-steel mb-1">
            New password
          </label>

          <div className="relative mb-5">
            <input
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(event) =>
                setNewPassword(event.target.value)
              }
              className="w-full border border-black/10 rounded px-3 py-2 pr-16 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20"
              required
              minLength={8}
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword((current) => !current)
              }
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-steel hover:text-ink transition"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink text-white rounded py-2 text-sm font-medium hover:bg-ink/90 transition disabled:opacity-50"
          >
            {loading ? 'Resetting...' : 'Reset password'}
          </button>

          <p className="text-xs text-steel mt-4 text-center">
            Remember your password?{' '}
            <Link
              to="/login"
              className="text-ink font-medium hover:underline"
            >
              Log in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

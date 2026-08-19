import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', {
        email,
      });

      const resetToken = response.data.resetToken;

      if (resetToken) {
        navigate(
          `/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(resetToken)}`
        );
        return;
      }

      setError(
        response.data.message ||
          'Unable to create password reset request.'
      );
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          'Unable to process password reset request.'
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
            Forgot password?
          </h2>

          <p className="text-xs text-steel mb-5">
            Enter your account email to request a password reset.
          </p>

          {error && (
            <p className="text-signal-critical text-xs font-mono mb-4 bg-signal-critical/10 px-3 py-2 rounded">
              {error}
            </p>
          )}

          <label className="block text-xs font-medium text-steel mb-1">
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full border border-black/10 rounded px-3 py-2 mb-5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink text-white rounded py-2 text-sm font-medium hover:bg-ink/90 transition disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Continue'}
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
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { AuthShell } from '../components/AuthShell';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function handleSubmit(event: FormEvent) {
    event.preventDefault(); setError(''); setLoading(true);
    try { const response = await api.post('/auth/forgot-password', { email }); const resetToken = response.data.resetToken; if (resetToken) { navigate(`/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(resetToken)}`); return; } setError(response.data.message || 'Unable to create password reset request.'); }
    catch (err: any) { setError(err.response?.data?.error || 'Unable to process password reset request.'); }
    finally { setLoading(false); }
  }
  return <AuthShell title="Account recovery"><form onSubmit={handleSubmit} className="panel-depth rounded-2xl border border-white/60 bg-paper-raised p-6 sm:p-8"><h2 className="font-display text-xl font-semibold text-ink">Forgot password?</h2><p className="mt-1 text-sm leading-relaxed text-steel">Enter your account email to continue securely.</p>{error && <p className="mt-5 rounded-lg bg-signal-critical/10 px-3 py-2 font-mono text-xs text-signal-critical">{error}</p>}<label htmlFor="recovery-email" className="mb-1.5 mt-5 block text-xs font-medium text-steel">Email</label><input id="recovery-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm transition focus:border-ink/30 focus:outline-none focus:ring-4 focus:ring-ink/8" required /><button type="submit" disabled={loading} className="mt-5 w-full rounded-lg bg-ink py-2.5 text-sm font-medium text-white shadow-lg shadow-ink/15 transition hover:-translate-y-0.5 hover:bg-ink/90 disabled:opacity-50">{loading ? 'Processing...' : 'Continue'}</button><p className="mt-4 text-center text-xs text-steel">Remember your password? <Link to="/login" className="font-medium text-ink hover:underline">Log in</Link></p></form></AuthShell>;
}

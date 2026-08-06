import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { Button, ErrorBanner } from '@/components/ui';

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
      toast.success('Password updated! You can now sign in.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const msg = err?.response?.data?.error ?? 'Something went wrong. The link may have expired.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-ink-50 px-4">
        <div className="card p-8 text-center max-w-md w-full">
          <h1 className="text-xl font-bold text-ink-900">Invalid reset link</h1>
          <p className="mt-2 text-sm text-ink-500">This link is missing or malformed. Request a new one.</p>
          <Link to="/forgot-password" className="btn-primary mt-6 inline-flex">Request new link</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-50 px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center gap-2 font-display text-lg font-bold text-ink-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white"><MapPin size={18} /></span>
          LocalLink
        </Link>
        <div className="card p-6 sm:p-8">
          {done ? (
            <div className="text-center">
              <CheckCircle2 size={40} className="mx-auto mb-4 text-green-500" />
              <h1 className="text-xl font-bold text-ink-900">Password updated!</h1>
              <p className="mt-2 text-sm text-ink-500">Redirecting you to sign in…</p>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-ink-900">Set new password</h1>
              <p className="mt-1 text-sm text-ink-500">Choose a password at least 6 characters long.</p>
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {error && <ErrorBanner message={error} />}
                <div>
                  <label className="label" htmlFor="password">New password</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                    <input
                      id="password"
                      type="password"
                      required
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input pl-10"
                      placeholder="At least 6 characters"
                    />
                  </div>
                </div>
                <div>
                  <label className="label" htmlFor="confirm">Confirm new password</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                    <input
                      id="confirm"
                      type="password"
                      required
                      autoComplete="new-password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className="input pl-10"
                      placeholder="Repeat your new password"
                    />
                  </div>
                </div>
                <Button type="submit" loading={loading} className="w-full">
                  Update password <ArrowRight size={16} />
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

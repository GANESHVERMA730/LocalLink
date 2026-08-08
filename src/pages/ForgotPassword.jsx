import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Mail, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { Button, ErrorBanner } from '@/components/ui';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [devResetUrl, setDevResetUrl] = useState(null);
  const [devPreviewUrl, setDevPreviewUrl] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setSent(true);
      if (data.devResetUrl) setDevResetUrl(data.devResetUrl);
      if (data.devPreviewUrl) setDevPreviewUrl(data.devPreviewUrl);
      toast.success('Check your email for a reset link.');
    } catch (err) {
      const msg = err?.response?.data?.error ?? 'Something went wrong. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-50 px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center gap-2 font-display text-lg font-bold text-ink-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white"><MapPin size={18} /></span>
          LocalLink
        </Link>
        <div className="card p-6 sm:p-8">
          {sent ? (
            <div className="text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-primary-600 mx-auto">
                <Mail size={24} />
              </div>
              <h1 className="text-xl font-bold text-ink-900">Check your email</h1>
              <p className="mt-2 text-sm text-ink-500">
                If <strong>{email}</strong> is registered, we&apos;ve sent a password reset link. It expires in 1 hour.
              </p>
              {devResetUrl && (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-left">
                  <p className="mb-1 text-xs font-semibold text-amber-800">Dev: use this link to reset</p>
                  <a href={devResetUrl} className="break-all text-xs text-amber-700 underline">{devResetUrl}</a>
                  {devPreviewUrl && (
                    <p className="mt-2">
                      <a href={devPreviewUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-amber-600 underline">View in Ethereal inbox →</a>
                    </p>
                  )}
                </div>
              )}
              <Link to="/login" className="btn-primary mt-6 inline-flex">Back to sign in</Link>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-ink-900">Forgot password</h1>
              <p className="mt-1 text-sm text-ink-500">Enter your email and we&apos;ll send a reset link.</p>
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {error && <ErrorBanner message={error} />}
                <div>
                  <label className="label" htmlFor="email">Email</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                    <input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input pl-10"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
                <Button type="submit" loading={loading} className="w-full">
                  Send reset link <ArrowRight size={16} />
                </Button>
              </form>
              <p className="mt-4 text-center text-sm text-ink-500">
                Remember it?{' '}
                <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

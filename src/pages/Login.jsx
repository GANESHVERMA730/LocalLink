import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MapPin, Mail, Lock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { Button, ErrorBanner } from '@/components/ui';

export function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const from = location.state?.from ?? '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setError(error);
      return;
    }
    toast.success('Welcome back!');
    navigate(from, { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col bg-ink-50 lg:flex-row">
      <div className="relative hidden flex-1 bg-primary-700 lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-900" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20"><MapPin size={18} /></span>
            LocalLink
          </Link>
          <div>
            <h2 className="font-display text-3xl font-bold leading-tight text-white">Welcome back to your local network</h2>
            <p className="mt-4 max-w-md text-primary-100">Sign in to manage your bookings, chat with providers, or respond to incoming requests — all in one place.</p>
          </div>
          <p className="text-sm text-primary-200">Connecting communities with trusted local professionals.</p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 sm:py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold text-ink-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white"><MapPin size={18} /></span>
              LocalLink
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-ink-900">Sign in</h1>
          <p className="mt-1 text-sm text-ink-500">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-700">Create one</Link>
          </p>
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && <ErrorBanner message={error} />}
            <div>
              <label className="label" htmlFor="email">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input pl-10" placeholder="you@example.com" />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                <input id="password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="input pl-10" placeholder="Enter your password" />
              </div>
              <div className="mt-1.5 text-right">
                <Link to="/forgot-password" className="text-xs font-medium text-primary-600 hover:text-primary-700">Forgot password?</Link>
              </div>
            </div>
            <Button type="submit" loading={loading} className="w-full">
              Sign in <ArrowRight size={16} />
            </Button>
          </form>
          <div className="mt-6 rounded-xl bg-ink-100 p-3 text-xs text-ink-500">
            <p className="font-semibold text-ink-600">Demo accounts (password: Demo@12345)</p>
            <ul className="mt-1 space-y-0.5 break-all">
              <li>customer.demo1@locallink.test</li>
              <li>provider.plumber@locallink.test</li>
              <li>provider.electrician@locallink.test</li>
              <li>provider.tutor@locallink.test</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

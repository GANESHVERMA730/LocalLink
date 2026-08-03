import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Mail, Lock, User, Phone, ArrowRight, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button, ErrorBanner } from '@/components/ui';

export function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('customer');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    const { error } = await signUp({ email, password, name, role, phone: phone || undefined });
    setLoading(false);
    if (error) {
      setError(error);
      return;
    }
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col bg-ink-50 lg:flex-row">
      <div className="order-2 flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:order-1">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold text-ink-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white"><MapPin size={18} /></span>
              LocalLink
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-ink-900">Create your account</h1>
          <p className="mt-1 text-sm text-ink-500">
            Already have one?{' '}
            <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">Sign in</Link>
          </p>

          <div className="mt-6">
            <label className="label">I want to…</label>
            <div className="grid grid-cols-2 gap-3">
              <RoleCard active={role === 'customer'} onClick={() => setRole('customer')} title="Find services" description="Search and book local pros" />
              <RoleCard active={role === 'provider'} onClick={() => setRole('provider')} title="Offer services" description="List services & get bookings" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && <ErrorBanner message={error} />}
            <div>
              <label className="label" htmlFor="name">Full name</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                <input id="name" required value={name} onChange={(e) => setName(e.target.value)} className="input pl-10" placeholder="Jane Smith" />
              </div>
            </div>
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
                <input id="password" type="password" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="input pl-10" placeholder="At least 6 characters" />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="phone">Phone <span className="text-ink-400">(optional)</span></label>
              <div className="relative">
                <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input pl-10" placeholder="+1 555 000 1234" />
              </div>
            </div>
            <Button type="submit" loading={loading} className="w-full">
              Create account <ArrowRight size={16} />
            </Button>
          </form>
        </div>
      </div>

      <div className="order-1 relative hidden flex-1 bg-primary-700 lg:order-2 lg:block">
        <div className="absolute inset-0 bg-gradient-to-bl from-primary-600 to-primary-900" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20"><MapPin size={18} /></span>
            LocalLink
          </Link>
          <div>
            <h2 className="font-display text-3xl font-bold leading-tight text-white">Join your local service network</h2>
            <p className="mt-4 max-w-md text-primary-100">Whether you need a plumber tonight or want to grow your tutoring business, LocalLink gets you connected in minutes.</p>
            <ul className="mt-6 space-y-3">
              {['Free to join, no credit card', 'Real-time chat with every booking', 'Location-aware provider search'].map((f) => (
                <li key={f} className="flex items-center gap-3 text-primary-100">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20"><Check size={12} /></span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-sm text-primary-200">Connecting communities with trusted local professionals.</p>
        </div>
      </div>
    </div>
  );
}

function RoleCard({ active, onClick, title, description }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border-2 p-4 text-left transition-all ${
        active ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-100' : 'border-ink-200 bg-white hover:border-ink-300'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-sm font-semibold ${active ? 'text-primary-700' : 'text-ink-700'}`}>{title}</span>
        {active && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-white"><Check size={12} /></span>}
      </div>
      <p className="mt-1 text-xs text-ink-500">{description}</p>
    </button>
  );
}

import { type ReactNode, type ButtonHTMLAttributes } from 'react';
import { Star, CheckCircle2, XCircle, Clock, X, Loader2 } from 'lucide-react';
import type { BookingStatus } from '@/types/db';

export function Spinner({ className = 'h-5 w-5' }: { className?: string }) {
  return <Loader2 className={`${className} animate-spin text-primary-500`} />;
}

export function FullPageSpinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
      <Spinner className="h-8 w-8" />
      <p className="text-sm text-ink-500">{label}</p>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-white/50 px-6 py-12 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-ink-100 text-ink-400">{icon}</div>
      <h3 className="text-base font-semibold text-ink-800">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Avatar({ src, name, size = 'md', className = '' }: { src?: string; name: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-16 w-16 text-lg' };
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  if (src) {
    return <img src={src} alt={name} className={`${sizes[size]} rounded-full object-cover ring-2 ring-white shadow-sm ${className}`} />;
  }
  return (
    <div className={`${sizes[size]} flex items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-700 ring-2 ring-white ${className}`}>
      {initials}
    </div>
  );
}

export function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-1">
      <Star size={size} className={rating > 0 ? 'fill-accent-400 text-accent-400' : 'text-ink-300'} />
      <span className="text-sm font-medium text-ink-700">{rating > 0 ? rating.toFixed(1) : 'New'}</span>
    </div>
  );
}

export function StatusBadge({ status }: { status: BookingStatus }) {
  const config: Record<BookingStatus, { label: string; className: string; icon: typeof Clock }> = {
    pending: { label: 'Pending', className: 'bg-amber-50 text-amber-700', icon: Clock },
    accepted: { label: 'Accepted', className: 'bg-primary-50 text-primary-700', icon: CheckCircle2 },
    rejected: { label: 'Rejected', className: 'bg-red-50 text-red-700', icon: XCircle },
    completed: { label: 'Completed', className: 'bg-ink-100 text-ink-700', icon: CheckCircle2 },
    cancelled: { label: 'Cancelled', className: 'bg-ink-100 text-ink-500', icon: X },
  };
  const { label, className, icon: Icon } = config[status];
  return (
    <span className={`badge ${className}`}>
      <Icon size={12} />
      {label}
    </span>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent'; loading?: boolean };

export function Button({ variant = 'primary', loading, children, className = '', disabled, ...rest }: ButtonProps) {
  const variants = { primary: 'btn-primary', secondary: 'btn-secondary', ghost: 'btn-ghost', danger: 'btn-danger', accent: 'btn-accent' };
  return (
    <button className={`${variants[variant]} ${className}`} disabled={disabled || loading} {...rest}>
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}

export function VerifiedBadge() {
  return (
    <span className="badge bg-primary-50 text-primary-700">
      <CheckCircle2 size={12} />
      Verified
    </span>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-ink-900 sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>;
}

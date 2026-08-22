import { Star, CheckCircle2, XCircle, Clock, X, Loader2 } from 'lucide-react';
import { useState } from 'react';
import PropTypes from 'prop-types';
import { resolveMediaUrl } from '@/lib/api';

export function Spinner({ className = 'h-5 w-5' }) {
  return <Loader2 className={`${className} animate-spin text-primary-500`} />;
}

export function FullPageSpinner({ label = 'Loading…' }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
      <Spinner className="h-8 w-8" />
      <p className="text-sm text-ink-500">{label}</p>
    </div>
  );
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-white/50 px-6 py-12 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-ink-100 text-ink-400">{icon}</div>
      <h3 className="text-base font-semibold text-ink-800">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-ink-100 ${className}`} />;
}

export function ProviderCardSkeleton() {
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-2/5" />
          <Skeleton className="h-3 w-1/4" />
        </div>
        <Skeleton className="h-4 w-14 shrink-0" />
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
    </div>
  );
}

export function Avatar({ src, name, size = 'md', className = '' }) {
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-16 w-16 text-lg' };
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const imageSrc = resolveMediaUrl(src);
  if (imageSrc) {
    return <img src={imageSrc} alt={name} className={`${sizes[size]} rounded-full object-cover ring-2 ring-white shadow-sm ${className}`} />;
  }
  return (
    <div className={`${sizes[size]} flex items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-700 ring-2 ring-white ${className}`}>
      {initials}
    </div>
  );
}

export function StarRating({ rating, size = 14 }) {
  return (
    <div className="flex items-center gap-1">
      <Star size={size} className={rating > 0 ? 'fill-accent-400 text-accent-400' : 'text-ink-300'} />
      <span className="text-sm font-medium text-ink-700">{rating > 0 ? rating.toFixed(1) : 'New'}</span>
    </div>
  );
}

export function StarRow({ rating, size = 16 }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} className={n <= rating ? 'fill-accent-400 text-accent-400' : 'text-ink-300'} />
      ))}
    </span>
  );
}

export function StarInput({ value, onChange, disabled }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          aria-label={`${n} star${n === 1 ? '' : 's'}`}
          aria-pressed={value === n}
          onMouseEnter={() => setHover(n)}
          onFocus={() => setHover(n)}
          onBlur={() => setHover(0)}
          onClick={() => onChange(n)}
          className="rounded p-0.5 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed"
        >
          <Star size={26} className={n <= shown ? 'fill-accent-400 text-accent-400' : 'text-ink-300'} />
        </button>
      ))}
    </div>
  );
}

export function StatTile({ icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl bg-ink-50 px-3 py-2.5">
      <span className="mt-0.5 shrink-0 text-primary-600">{icon}</span>
      <span className="min-w-0">
        <span className="block break-words text-sm font-semibold text-ink-900">{value}</span>
        <span className="block break-words text-xs text-ink-500">{label}</span>
      </span>
    </div>
  );
}

export function StatusBadge({ status }) {
  const config = {
    pending: { label: 'Pending', className: 'bg-amber-50 text-amber-700', icon: Clock },
    accepted: { label: 'Accepted', className: 'bg-primary-50 text-primary-700', icon: CheckCircle2 },
    rejected: { label: 'Rejected', className: 'bg-red-50 text-red-700', icon: XCircle },
    completed: { label: 'Completed', className: 'bg-ink-100 text-ink-700', icon: CheckCircle2 },
    cancelled: { label: 'Cancelled', className: 'bg-ink-100 text-ink-500', icon: X },
  };
  const fallback = { label: status ?? 'Unknown', className: 'bg-ink-100 text-ink-500', icon: Clock };
  const { label, className, icon: Icon } = config[status] ?? fallback;
  return (
    <span className={`badge ${className}`}>
      <Icon size={12} />
      {label}
    </span>
  );
}

export function Tabs({ items, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist">
      {items.map((t) => {
        const active = value === t.value;
        return (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.value)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              active ? 'bg-primary-600 text-white' : 'border border-ink-200 bg-white text-ink-600 hover:bg-ink-50'
            }`}
          >
            {t.label}
            {t.count !== undefined && <span className="ml-1.5 text-xs opacity-70">{t.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function Button({ variant = 'primary', loading, children, className = '', disabled, ...rest }) {
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

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="break-words text-2xl font-bold text-ink-900 sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0 [&>*]:w-full sm:[&>*]:w-auto">{action}</div>}
    </div>
  );
}

export function ErrorBanner({ message }) {
  return <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>;
}

Spinner.propTypes = {
  className: PropTypes.string,
};

FullPageSpinner.propTypes = {
  label: PropTypes.string,
};

EmptyState.propTypes = {
  icon: PropTypes.node,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  action: PropTypes.node,
};

Skeleton.propTypes = {
  className: PropTypes.string,
};

Avatar.propTypes = {
  src: PropTypes.string,
  name: PropTypes.string.isRequired,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
};

StarRating.propTypes = {
  rating: PropTypes.number.isRequired,
  size: PropTypes.number,
};

StarRow.propTypes = {
  rating: PropTypes.number.isRequired,
  size: PropTypes.number,
};

StarInput.propTypes = {
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

StatTile.propTypes = {
  icon: PropTypes.node,
  label: PropTypes.string.isRequired,
  value: PropTypes.node.isRequired,
};

StatusBadge.propTypes = {
  status: PropTypes.string,
};

Tabs.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      count: PropTypes.number,
    }),
  ).isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'ghost', 'danger', 'accent']),
  loading: PropTypes.bool,
  children: PropTypes.node,
  className: PropTypes.string,
  disabled: PropTypes.bool,
};

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  action: PropTypes.node,
};

ErrorBanner.propTypes = {
  message: PropTypes.string.isRequired,
};

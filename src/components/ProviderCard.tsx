import { Link } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';
import type { SearchResultProvider } from '@/types/db';
import { SERVICE_CATEGORIES } from '@/types/db';
import { Avatar, StarRating, VerifiedBadge } from '@/components/ui';
import { CategoryIcon } from '@/components/Icon';
import { formatDistance, formatPrice } from '@/lib/format';

const SERVICE_META = Object.fromEntries(SERVICE_CATEGORIES.map((c) => [c.value, c]));

export function ProviderCard({ result }: { result: SearchResultProvider }) {
  const categories = Array.from(new Set(result.services.map((s) => s.category)));
  const userId = typeof result.user === 'object' ? result.user._id : result.user;
  const userName = typeof result.user === 'object' ? result.user.name : 'Provider';
  const userImage = typeof result.user === 'object' ? result.user.profileImage : '';

  return (
    <Link to={`/dashboard/providers/${userId}`} className="card-hover group block overflow-hidden p-5">
      <div className="flex items-start gap-4">
        <Avatar src={userImage} name={userName} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-semibold text-ink-900 group-hover:text-primary-700">{userName}</h3>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <StarRating rating={result.rating} />
                {result.isVerified && <VerifiedBadge />}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="flex items-center gap-1 text-sm font-semibold text-primary-700"><MapPin size={14} />{formatDistance(result.distance)}</div>
            </div>
          </div>
          {result.bio && <p className="mt-2 line-clamp-2 text-sm text-ink-500">{result.bio}</p>}
          {result.city && <p className="mt-1.5 flex items-center gap-1 text-xs text-ink-400"><MapPin size={12} />{result.city}</p>}
          {categories.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {categories.slice(0, 4).map((cat) => {
                const meta = SERVICE_META[cat];
                return <span key={cat} className="badge bg-ink-100 text-ink-600">{meta?.icon && <CategoryIcon name={meta.icon} className="h-3 w-3" />}{meta?.label ?? cat}</span>;
              })}
            </div>
          )}
          {result.services.length > 0 && (
            <div className="mt-3 flex items-center justify-between border-t border-ink-100 pt-3">
              <div className="text-sm text-ink-500">From <span className="font-semibold text-ink-800">{formatPrice(Math.min(...result.services.map((s) => Number(s.basePrice))), result.services[0]?.priceUnit ?? '')}</span></div>
              <span className="flex items-center gap-1 text-sm font-medium text-primary-600 transition-transform group-hover:translate-x-0.5">View profile <ArrowRight size={14} /></span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

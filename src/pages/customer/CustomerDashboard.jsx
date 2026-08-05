import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, CheckCircle2, Heart, Inbox, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { fetchBookings, fetchFavorites, updateBookingStatus } from '@/lib/queries';
import { onBookingUpdated } from '@/lib/socket';
import { BookingCard } from '@/components/BookingCard';
import { Avatar, StarRating, EmptyState, PageHeader, StatTile, Skeleton, Tabs } from '@/components/ui';

const TABS = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

function bucket(bookings, tab) {
  const now = Date.now();
  if (tab === 'upcoming') {
    return bookings
      .filter((b) => b.status === 'accepted' && new Date(b.scheduledAt).getTime() >= now)
      .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  }
  if (tab === 'active') return bookings.filter((b) => b.status === 'pending' || b.status === 'accepted');
  if (tab === 'completed') return bookings.filter((b) => b.status === 'completed');
  return bookings.filter((b) => b.status === 'cancelled' || b.status === 'rejected');
}

export function CustomerDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('upcoming');

  const load = useCallback(async () => {
    try {
      const [b, f] = await Promise.all([fetchBookings(), fetchFavorites().catch(() => [])]);
      setBookings(b);
      setFavorites(f);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const unsub = onBookingUpdated(() => load());
    return () => { if (unsub) unsub(); };
  }, [load]);

  const handleAction = async (id, status) => {
    await updateBookingStatus(id, status);
    await load();
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <Skeleton className="h-9 w-56" />
        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}
        </div>
        <div className="mt-6 space-y-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  const counts = {
    upcoming: bucket(bookings, 'upcoming').length,
    active: bucket(bookings, 'active').length,
    completed: bucket(bookings, 'completed').length,
    cancelled: bucket(bookings, 'cancelled').length,
  };
  const visible = bucket(bookings, tab);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <PageHeader
        title={`Welcome, ${user?.name ?? ''}`}
        subtitle="Your bookings and saved providers at a glance"
        action={<Link to="/dashboard/search" className="btn-primary"><Search size={16} />Find services</Link>}
      />

      <div className="mb-6 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatTile icon={<Calendar size={16} />} label="Upcoming" value={counts.upcoming} />
        <StatTile icon={<Clock size={16} />} label="Active bookings" value={counts.active} />
        <StatTile icon={<CheckCircle2 size={16} />} label="Completed" value={counts.completed} />
        <StatTile icon={<Heart size={16} />} label="Saved providers" value={favorites.length} />
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-ink-900">My bookings</h2>
        <div className="mb-4">
          <Tabs items={TABS.map((t) => ({ ...t, count: counts[t.value] }))} value={tab} onChange={setTab} />
        </div>
        {visible.length === 0 ? (
          <EmptyState
            icon={<Inbox size={24} />}
            title={`No ${tab} bookings`}
            description={
              tab === 'upcoming'
                ? 'Once a provider accepts a request, it will show up here.'
                : 'Browse nearby providers and send a booking request to get started.'
            }
            action={<Link to="/dashboard/search" className="btn-primary">Find services</Link>}
          />
        ) : (
          <div className="space-y-3">
            {visible.map((b) => (
              <BookingCard key={b._id} booking={b} viewerRole="customer" onAction={handleAction} />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-ink-900">Saved providers</h2>
          {favorites.length > 0 && (
            <Link to="/dashboard/favorites" className="shrink-0 text-sm font-medium text-primary-600 hover:text-primary-700">
              View all
            </Link>
          )}
        </div>
        {favorites.length === 0 ? (
          <EmptyState
            icon={<Heart size={24} />}
            title="No saved providers yet"
            description="Tap the heart on any provider to save them for later."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {favorites.slice(0, 4).map((p) => (
              <Link
                key={p._id}
                to={`/dashboard/providers/${p.user?._id ?? p.user}`}
                className="card-hover flex items-center gap-3 p-4"
              >
                <Avatar src={p.user?.profileImage} name={p.user?.name ?? 'Provider'} size="md" className="shrink-0" />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-ink-900">{p.user?.name ?? 'Provider'}</h3>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <StarRating rating={p.rating ?? 0} />
                    {p.city && <span className="truncate text-xs text-ink-400">{p.city}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

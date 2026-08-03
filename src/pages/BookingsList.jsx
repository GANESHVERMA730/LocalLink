import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MessageSquare, ArrowRight, Inbox } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { fetchBookings } from '@/lib/queries';
import { onBookingUpdated } from '@/lib/socket';
import { Avatar, StatusBadge, EmptyState, Spinner, PageHeader } from '@/components/ui';
import { formatDateTime, formatPrice } from '@/lib/format';

export function BookingsList() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    try {
      const data = await fetchBookings();
      setBookings(data);
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

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6"><Spinner className="h-8 w-8 mx-auto mt-20" /></div>;

  const filtered = filter === 'all' ? bookings : bookings.filter((b) => b.status === filter);
  const isProvider = user?.role === 'provider';

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <PageHeader title={isProvider ? 'Incoming bookings' : 'My bookings'} subtitle={isProvider ? 'Manage requests from customers' : 'Track your service requests'} />

      <div className="mb-5 flex flex-wrap gap-2">
        {['all', 'pending', 'accepted', 'completed', 'cancelled', 'rejected'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3.5 py-1.5 text-sm font-medium capitalize transition-colors ${filter === f ? 'bg-primary-600 text-white' : 'bg-white text-ink-600 border border-ink-200 hover:bg-ink-50'}`}>
            {f}{f !== 'all' && <span className="ml-1.5 text-xs opacity-70">{bookings.filter((b) => b.status === f).length}</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Inbox size={24} />}
          title={isProvider ? 'No bookings yet' : "You haven't booked anything yet"}
          description={isProvider ? 'When customers send booking requests, they will appear here.' : 'Browse providers and send your first booking request.'}
          action={!isProvider && <Link to="/dashboard/search" className="btn-primary">Find services</Link>}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => {
            const other = isProvider ? b.customer : b.provider;
            return (
              <Link key={b._id} to={`/dashboard/bookings/${b._id}`} className="card-hover group flex items-start gap-3 p-4 sm:items-center sm:gap-4">
                <Avatar src={other?.profileImage} name={other?.name ?? 'User'} size="md" className="shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                    <h3 className="truncate font-semibold text-ink-900">{other?.name ?? 'Unknown'}</h3>
                    <div className="shrink-0"><StatusBadge status={b.status} /></div>
                  </div>
                  <p className="mt-0.5 break-words text-sm text-ink-500">{b.service?.title ?? 'Service'}{b.service && ` · ${formatPrice(Number(b.service.basePrice), b.service.priceUnit)}`}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-400">
                    <span className="flex items-center gap-1"><Calendar size={12} className="shrink-0" />{formatDateTime(b.scheduledAt)}</span>
                    <span className="flex items-center gap-1"><MessageSquare size={12} className="shrink-0" />View chat</span>
                  </div>
                </div>
                <ArrowRight size={16} className="mt-1 hidden shrink-0 text-ink-300 transition-transform group-hover:translate-x-0.5 group-hover:text-primary-500 sm:mt-0 sm:block" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

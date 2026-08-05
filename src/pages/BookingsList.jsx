import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Inbox } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { fetchBookings, updateBookingStatus } from '@/lib/queries';
import { onBookingUpdated } from '@/lib/socket';
import { BookingCard } from '@/components/BookingCard';
import { EmptyState, PageHeader, Skeleton, Tabs } from '@/components/ui';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'rejected', label: 'Rejected' },
];

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

  const isProvider = user?.role === 'provider';

  const handleAction = async (id, status) => {
    await updateBookingStatus(id, status);
    await load();
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <Skeleton className="h-9 w-48" />
        <div className="mt-6 flex gap-2">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-24 rounded-full" />)}
        </div>
        <div className="mt-5 space-y-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  const filtered = filter === 'all' ? bookings : bookings.filter((b) => b.status === filter);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <PageHeader
        title={isProvider ? 'Incoming bookings' : 'My bookings'}
        subtitle={isProvider ? 'Manage requests from customers' : 'Track your service requests'}
      />

      <div className="mb-5">
        <Tabs
          items={FILTERS.map((f) => ({
            ...f,
            count: f.value === 'all' ? undefined : bookings.filter((b) => b.status === f.value).length,
          }))}
          value={filter}
          onChange={setFilter}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Inbox size={24} />}
          title={
            filter === 'all'
              ? isProvider
                ? 'No bookings yet'
                : "You haven't booked anything yet"
              : `No ${filter} bookings`
          }
          description={
            isProvider
              ? 'When customers send booking requests, they will appear here.'
              : 'Browse providers and send your first booking request.'
          }
          action={!isProvider && <Link to="/dashboard/search" className="btn-primary">Find services</Link>}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <BookingCard
              key={b._id}
              booking={b}
              viewerRole={isProvider ? 'provider' : 'customer'}
              onAction={handleAction}
            />
          ))}
        </div>
      )}
    </div>
  );
}

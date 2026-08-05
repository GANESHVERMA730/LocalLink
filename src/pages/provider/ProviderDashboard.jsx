import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Inbox, CheckCircle2, Briefcase, ArrowRight, TrendingUp, Sun, DollarSign } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { fetchBookings, fetchMyServices, fetchMyAvailabilities, updateBookingStatus } from '@/lib/queries';
import { onBookingUpdated } from '@/lib/socket';
import { BookingCard } from '@/components/BookingCard';
import { EmptyState, PageHeader, Skeleton, StatTile } from '@/components/ui';
import { formatPrice } from '@/lib/format';

function isToday(iso) {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
  );
}

function isThisMonth(iso) {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

export function ProviderDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [avails, setAvails] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [b, s, a] = await Promise.all([fetchBookings(), fetchMyServices(), fetchMyAvailabilities()]);
      setBookings(b);
      setServices(s);
      setAvails(a);
    } catch {
      // ignore
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
        <div className="mt-6 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}
        </div>
        <div className="mt-6 space-y-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  const pending = bookings.filter((b) => b.status === 'pending');
  const accepted = bookings.filter((b) => b.status === 'accepted');
  const completed = bookings.filter((b) => b.status === 'completed');
  const today = bookings
    .filter((b) => (b.status === 'accepted' || b.status === 'pending') && isToday(b.scheduledAt))
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));

  // Estimated from listed service prices — payments are not implemented, so no
  // money has actually changed hands.
  const monthlyEarnings = completed
    .filter((b) => isThisMonth(b.scheduledAt))
    .reduce((sum, b) => sum + (Number(b.service?.basePrice) || 0), 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <PageHeader title={`Welcome, ${user?.name ?? ''}`} subtitle="Here's what's happening with your services" />

      <div className="mb-3 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatTile icon={<Inbox size={16} />} label="Pending requests" value={pending.length} />
        <StatTile icon={<Calendar size={16} />} label="Accepted bookings" value={accepted.length} />
        <StatTile icon={<CheckCircle2 size={16} />} label="Completed jobs" value={completed.length} />
        <StatTile icon={<Briefcase size={16} />} label="Active services" value={services.filter((s) => s.isActive).length} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <StatTile icon={<Sun size={16} />} label="Bookings today" value={today.length} />
        <StatTile
          icon={<DollarSign size={16} />}
          label="This month (estimated)"
          value={formatPrice(monthlyEarnings, '')}
        />
      </div>

      {(services.length === 0 || avails.length === 0) && (
        <div className="card mb-6 border-2 border-dashed border-primary-200 bg-primary-50/50 p-5">
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-ink-800"><TrendingUp size={18} className="text-primary-600" />Complete your setup</h2>
          <div className="space-y-2">
            {services.length === 0 && <SetupItem to="/dashboard/provider/services" label="Add your services" description="List what you offer so customers can find you" />}
            {avails.length === 0 && <SetupItem to="/dashboard/provider/availability" label="Set your availability" description="Let customers know when they can book you" />}
          </div>
        </div>
      )}

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-ink-900">Today&apos;s bookings</h2>
        {today.length === 0 ? (
          <EmptyState icon={<Sun size={24} />} title="Nothing scheduled today" description="Your accepted jobs for today will appear here." />
        ) : (
          <div className="space-y-3">
            {today.map((b) => (
              <BookingCard key={b._id} booking={b} viewerRole="provider" onAction={handleAction} />
            ))}
          </div>
        )}
      </section>

      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-ink-900">Pending requests</h2>
          <Link to="/dashboard/bookings" className="shrink-0 text-sm font-medium text-primary-600 hover:text-primary-700">View all</Link>
        </div>
        {pending.length === 0 ? (
          <EmptyState icon={<Inbox size={24} />} title="No pending requests" description="New booking requests from customers will show up here." />
        ) : (
          <div className="space-y-3">
            {pending.slice(0, 3).map((b) => (
              <BookingCard key={b._id} booking={b} viewerRole="provider" onAction={handleAction} />
            ))}
          </div>
        )}
      </section>

      {accepted.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-ink-900">Upcoming jobs</h2>
          <div className="space-y-3">
            {accepted.slice(0, 3).map((b) => (
              <BookingCard key={b._id} booking={b} viewerRole="provider" onAction={handleAction} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SetupItem({ to, label, description }) {
  return (
    <Link to={to} className="flex items-center justify-between gap-3 rounded-xl bg-white p-3 transition-colors hover:bg-ink-50">
      <div className="min-w-0"><p className="text-sm font-semibold text-ink-800">{label}</p><p className="text-xs text-ink-500">{description}</p></div>
      <ArrowRight size={18} className="shrink-0 text-primary-500" />
    </Link>
  );
}

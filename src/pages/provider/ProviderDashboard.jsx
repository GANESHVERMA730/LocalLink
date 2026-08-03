import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Inbox, CheckCircle2, Briefcase, ArrowRight, TrendingUp } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { fetchBookings, fetchMyServices, fetchMyAvailabilities } from '@/lib/queries';
import { onBookingUpdated } from '@/lib/socket';
import { StatusBadge, Avatar, EmptyState, Spinner, PageHeader } from '@/components/ui';
import { formatDateTime } from '@/lib/format';

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

  if (loading) return <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6"><Spinner className="h-8 w-8 mx-auto mt-20" /></div>;

  const pending = bookings.filter((b) => b.status === 'pending');
  const upcoming = bookings.filter((b) => b.status === 'accepted');
  const completed = bookings.filter((b) => b.status === 'completed');

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <PageHeader title={`Welcome, ${user?.name ?? ''}`} subtitle="Here's what's happening with your services" />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard icon={<Inbox size={20} />} label="Pending requests" value={pending.length} color="amber" />
        <StatCard icon={<Calendar size={20} />} label="Upcoming" value={upcoming.length} color="primary" />
        <StatCard icon={<CheckCircle2 size={20} />} label="Completed" value={completed.length} color="ink" />
        <StatCard icon={<Briefcase size={20} />} label="Active services" value={services.filter((s) => s.isActive).length} color="accent" />
      </div>

      {(services.length === 0 || avails.length === 0) && (
        <div className="mb-6 card border-2 border-dashed border-primary-200 bg-primary-50/50 p-5">
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-ink-800"><TrendingUp size={18} className="text-primary-600" />Complete your setup</h2>
          <div className="space-y-2">
            {services.length === 0 && <SetupItem to="/dashboard/provider/services" label="Add your services" description="List what you offer so customers can find you" />}
            {avails.length === 0 && <SetupItem to="/dashboard/provider/availability" label="Set your availability" description="Let customers know when they can book you" />}
          </div>
        </div>
      )}

      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink-900">Pending requests</h2>
          <Link to="/dashboard/provider/bookings" className="text-sm font-medium text-primary-600 hover:text-primary-700">View all</Link>
        </div>
        {pending.length === 0 ? (
          <EmptyState icon={<Inbox size={24} />} title="No pending requests" description="New booking requests from customers will show up here." />
        ) : (
          <div className="space-y-3">
            {pending.slice(0, 3).map((b) => (
              <Link key={b._id} to={`/dashboard/bookings/${b._id}`} className="card-hover group flex items-start gap-3 p-4 sm:items-center sm:gap-4">
                <Avatar src={b.customer?.profileImage} name={b.customer?.name ?? 'Customer'} size="md" className="shrink-0" />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-ink-900">{b.customer?.name ?? 'Customer'}</h3>
                  <p className="truncate text-sm text-ink-500">{b.service?.title}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-400"><Calendar size={12} className="shrink-0" />{formatDateTime(b.scheduledAt)}</p>
                </div>
                <ArrowRight size={16} className="mt-1 hidden shrink-0 text-ink-300 group-hover:text-primary-500 sm:mt-0 sm:block" />
              </Link>
            ))}
          </div>
        )}
      </section>

      {upcoming.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink-900">Upcoming jobs</h2>
          </div>
          <div className="space-y-3">
            {upcoming.slice(0, 3).map((b) => (
              <Link key={b._id} to={`/dashboard/bookings/${b._id}`} className="card-hover group flex items-start gap-3 p-4 sm:items-center sm:gap-4">
                <Avatar src={b.customer?.profileImage} name={b.customer?.name ?? 'Customer'} size="md" className="shrink-0" />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-ink-900">{b.customer?.name ?? 'Customer'}</h3>
                  <p className="truncate text-sm text-ink-500">{b.service?.title}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-400"><Calendar size={12} className="shrink-0" />{formatDateTime(b.scheduledAt)}</p>
                </div>
                <div className="shrink-0"><StatusBadge status={b.status} /></div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  const colors = { amber: 'bg-amber-50 text-amber-600', primary: 'bg-primary-50 text-primary-600', ink: 'bg-ink-100 text-ink-600', accent: 'bg-accent-50 text-accent-600' };
  return (
    <div className="card p-4">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors[color]}`}>{icon}</div>
      <p className="mt-3 text-2xl font-bold text-ink-900">{value}</p>
      <p className="break-words text-sm text-ink-500">{label}</p>
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

import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Check, X, MessageSquare } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { fetchBooking, updateBookingStatus } from '@/lib/queries';
import { onBookingUpdated } from '@/lib/socket';
import { Avatar, StatusBadge, Spinner, EmptyState, Button } from '@/components/ui';
import { ChatWindow } from '@/components/ChatWindow';
import { formatDateTime, formatPrice } from '@/lib/format';

export function BookingDetail() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!bookingId) return;
    try {
      const data = await fetchBooking(bookingId);
      setBooking(data);
    } catch {
      setError('Could not load this booking.');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    load();
    const unsub = onBookingUpdated((updated) => {
      const b = updated;
      if (b._id === bookingId) setBooking(b);
    });
    return () => { if (unsub) unsub(); };
  }, [bookingId, load]);

  const handleStatusChange = async (newStatus) => {
    if (!bookingId) return;
    setActing(newStatus);
    setError(null);
    try {
      const updated = await updateBookingStatus(bookingId, newStatus);
      setBooking(updated);
    } catch {
      setError('Could not update the booking status. Please try again.');
    } finally {
      setActing(null);
    }
  };

  if (loading) return <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6"><Spinner className="h-8 w-8 mx-auto mt-20" /></div>;
  if (error || !booking) return <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6"><EmptyState icon={<Calendar size={24} />} title="Booking not found" description={error ?? undefined} action={<Button variant="secondary" onClick={() => navigate('/dashboard/bookings')}>Back to bookings</Button>} /></div>;

  const isProvider = user?.role === 'provider';
  const isCustomer = user?._id === booking.customer._id || user?._id === booking.customer;
  const other = isProvider ? booking.customer : booking.provider;

  const canAccept = isProvider && booking.status === 'pending';
  const canReject = isProvider && booking.status === 'pending';
  const canComplete = isProvider && booking.status === 'accepted';
  const canCancel = (isProvider || isCustomer) && (booking.status === 'pending' || booking.status === 'accepted');

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <Link to="/dashboard/bookings" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-800"><ArrowLeft size={16} />Back to bookings</Link>

      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-2">
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-bold text-ink-900">Booking details</h1>
              <StatusBadge status={booking.status} />
            </div>
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-ink-50 p-3">
              <Avatar src={other?.profileImage} name={other?.name ?? 'User'} size="md" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink-900">{other?.name ?? 'Unknown'}</p>
                <p className="text-xs text-ink-400">{isProvider ? 'Customer' : 'Provider'}{other?.phone && ` · ${other.phone}`}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2.5 text-sm">
              <Row label="Service" value={booking.service?.title ?? '—'} />
              {booking.service && <Row label="Price" value={formatPrice(Number(booking.service.basePrice), booking.service.priceUnit)} />}
              <Row label="Scheduled" value={<span className="flex items-center gap-1.5"><Calendar size={14} className="text-ink-400" />{formatDateTime(booking.scheduledAt)}</span>} />
              <Row label="Duration" value={<span className="flex items-center gap-1.5"><Clock size={14} className="text-ink-400" />{booking.durationMinutes} min</span>} />
            </div>
            {booking.customerNotes && <div className="mt-4"><p className="text-xs font-medium text-ink-500">Customer notes</p><p className="mt-1 rounded-lg bg-ink-50 p-3 text-sm text-ink-700">{booking.customerNotes}</p></div>}
          </div>

          {(canAccept || canReject || canComplete || canCancel) && (
            <div className="card p-5">
              <h2 className="mb-3 text-sm font-semibold text-ink-700">Actions</h2>
              <div className="flex flex-wrap gap-2">
                {canAccept && <Button onClick={() => handleStatusChange('accepted')} loading={acting === 'accepted'}><Check size={16} />Accept</Button>}
                {canReject && <Button variant="danger" onClick={() => handleStatusChange('rejected')} loading={acting === 'rejected'}><X size={16} />Reject</Button>}
                {canComplete && <Button variant="secondary" onClick={() => handleStatusChange('completed')} loading={acting === 'completed'}><Check size={16} />Mark completed</Button>}
                {canCancel && <Button variant="ghost" onClick={() => handleStatusChange('cancelled')} loading={acting === 'cancelled'}><X size={16} />Cancel booking</Button>}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-3">
          <div className="card flex h-[600px] flex-col overflow-hidden">
            <div className="flex items-center gap-3 border-b border-ink-100 px-4 py-3">
              <MessageSquare size={18} className="text-primary-600" />
              <div className="flex-1"><p className="text-sm font-semibold text-ink-900">Chat with {other?.name ?? 'provider'}</p><p className="text-xs text-ink-400">Messages are private to this booking</p></div>
            </div>
            <ChatWindow bookingId={booking._id} otherName={other?.name ?? 'User'} otherAvatar={other?.profileImage} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return <div className="flex items-center justify-between"><span className="text-ink-500">{label}</span><span className="font-medium text-ink-800">{value}</span></div>;
}
